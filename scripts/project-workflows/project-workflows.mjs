import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash, randomBytes } from 'node:crypto'
import { ROOT, toPosix } from './lib/paths.mjs'
import {
  generateAll,
  generateArtifactsForDefinition,
  loadAllDefinitions,
  loadDefinitionById,
  loadRun,
  rebuildRegistry,
  saveRun,
  validateAll,
  writeRunReport,
} from './lib/registry.mjs'
import { createEmptyRun, canStartNode, refreshNodeReadiness } from './lib/scheduler.mjs'
import { evaluateCompletionGate, tryCompleteNode, assertInvariantWaivers } from './lib/evidence-gate.mjs'
import { buildNodeTaskBrief, renderTaskBriefMarkdown } from './lib/task-brief.mjs'
import { generateMermaid, navigationProjection } from './lib/generate-docs.mjs'
import { validateDefinition } from './lib/validate-definition.mjs'
import { buildViewerData } from './lib/build-viewer-data.mjs'

function argsMap(argv) {
  const result = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) {
      result._.push(item)
      continue
    }
    const [rawKey, inline] = item.slice(2).split('=', 2)
    if (inline !== undefined) result[rawKey] = inline
    else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
      result[rawKey] = argv[index + 1]
      index += 1
    } else {
      result[rawKey] = true
    }
  }
  return result
}

function makeRunId(workflowId) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const suffix = randomBytes(3).toString('hex')
  return `run-${workflowId.replace(/^wf-/, '')}-${stamp}-${suffix}`
}

function makeInvocationId(nodeId, ref) {
  const digest = createHash('sha1').update(`${nodeId}\0${ref}\0${Date.now()}\0${randomBytes(4).toString('hex')}`).digest('hex').slice(0, 10)
  return `inv-${digest}`
}

async function cmdValidate() {
  // 默认只校验，不重写 PROCESS/图；过期则失败并提示 generate。
  const result = await validateAll(ROOT, { regenerate: false })
  if (!result.ok) {
    console.error('工作流校验失败：')
    for (const issue of result.issues) console.error(`- ${issue}`)
    process.exitCode = 1
    return
  }
  console.log(`工作流校验通过：${result.registry.workflows.length} 条定义（未重生成文档/图）。`)
}

async function cmdList() {
  const { registry } = await rebuildRegistry(ROOT)
  for (const item of registry.workflows) {
    console.log(`${item.id}@${item.activeVersion}\t${item.status}/${item.maturity}\t${item.title}`)
  }
}

async function cmdGenerate(options) {
  // 仅重大修改后显式调用：重写 PROCESS、静态图，并刷新 viewer 数据。
  if (options.all) {
    const result = await generateAll(ROOT)
    if (!result.ok) {
      console.error('工作流生成失败：')
      for (const issue of result.issues) console.error(`- ${issue}`)
      process.exitCode = 1
      return
    }
    console.log(JSON.stringify({
      regenerated: true,
      workflowCount: result.registry.workflows.length,
      viewerPath: 'project-workflows/viewer/data.js',
    }, null, 2))
    return
  }
  const workflowId = options.workflow || options._[0]
  if (!workflowId) throw new Error('需要 --workflow <id> 或 --all（重大修改后重生成）')
  const { definition } = await loadDefinitionById(workflowId, { version: options.version })
  const validation = await validateDefinition(definition)
  if (!validation.ok) throw new Error(validation.issues.join('; '))
  const paths = await generateArtifactsForDefinition(definition)
  const viewer = await buildViewerData(ROOT)
  await rebuildRegistry(ROOT)
  console.log(JSON.stringify({ ...paths, viewerPath: viewer.dataPath, tip: '已按重大修改重生成介绍文档与静态图。' }, null, 2))
}

async function cmdCreateRun(options) {
  const workflowId = options.workflow || options._[0]
  if (!workflowId) throw new Error('需要 --workflow <id>')
  const { definition } = await loadDefinitionById(workflowId, { version: options.version })
  const validation = await validateDefinition(definition)
  if (!validation.ok) throw new Error(validation.issues.join('; '))
  const mode = options.mode === 'live' ? 'live' : 'dry-run'
  const flags = {}
  if (options.flag) {
    const pairs = Array.isArray(options.flag) ? options.flag : [options.flag]
    // also support repeated --flag dryRun=true via single string
    for (const pair of String(options.flag).split(',')) {
      const [key, value = 'true'] = pair.split('=')
      flags[key] = value === 'true' ? true : value === 'false' ? false : value
    }
    void pairs
  }
  if (mode === 'dry-run') flags.dryRun = true
  const run = createEmptyRun(definition, {
    runId: options.run || makeRunId(definition.id),
    mode,
    inputSummary: options.input || options['input-summary'] || '',
    flags,
  })
  const file = await saveRun(run, ROOT, { example: Boolean(options.example) })
  console.log(JSON.stringify({ runId: run.runId, path: toPosix(path.relative(ROOT, file)), activeNodeIds: run.activeNodeIds }, null, 2))
}

async function cmdStatus(options) {
  const runId = options.run || options._[0]
  if (!runId) throw new Error('需要 --run <runId>')
  const { run } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  refreshNodeReadiness(definition, run)
  console.log(JSON.stringify({
    runId: run.runId,
    status: run.status,
    activeNodeIds: run.activeNodeIds,
    nodes: Object.fromEntries(Object.entries(run.nodes).map(([id, state]) => [id, state.status])),
    completionGate: run.completionGate,
  }, null, 2))
}

async function cmdBrief(options) {
  const runId = options.run
  const nodeId = options.node
  if (!runId || !nodeId) throw new Error('需要 --run 与 --node')
  const { run, file } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  const brief = buildNodeTaskBrief(definition, run, nodeId, { force: Boolean(options.force) })
  const markdown = renderTaskBriefMarkdown(brief)
  if (options.json) {
    console.log(JSON.stringify(brief, null, 2))
  } else {
    console.log(markdown)
  }
  if (options.write) {
    const out = path.join(ROOT, 'project-workflows', 'runs', 'briefs', `${runId}-${nodeId}.md`)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, markdown, 'utf8')
    console.error(`已写入 ${toPosix(path.relative(ROOT, out))}`)
  }
  void file
}

async function cmdStartNode(options) {
  const runId = options.run
  const nodeId = options.node
  if (!runId || !nodeId) throw new Error('需要 --run 与 --node')
  const { run } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  if (!canStartNode(definition, run, nodeId) && !options.force) {
    throw new Error(`节点尚未就绪：${nodeId}；当前可执行：${run.activeNodeIds.join(', ') || '无'}`)
  }
  const state = run.nodes[nodeId]
  state.status = 'running'
  state.startedAt = state.startedAt ?? new Date().toISOString()
  state.attempts = (state.attempts ?? 0) + 1
  refreshNodeReadiness(definition, run)
  await saveRun(run, ROOT, { example: runId.includes('example') || Boolean(options.example) })
  const brief = buildNodeTaskBrief(definition, run, nodeId, { force: true })
  console.log(renderTaskBriefMarkdown(brief))
}

async function cmdRecordInvocation(options) {
  const runId = options.run
  const nodeId = options.node
  const kind = options.kind
  const ref = options.ref
  if (!runId || !nodeId || !kind || !ref) throw new Error('需要 --run --node --kind --ref')
  const { run } = await loadRun(runId)
  const invocation = {
    invocationId: options.id || makeInvocationId(nodeId, ref),
    nodeId,
    kind,
    ref,
    startedAt: options['started-at'] || new Date().toISOString(),
    endedAt: options['ended-at'] || new Date().toISOString(),
    status: options.status || 'succeeded',
    inputSummary: options['input-summary'] || '',
    outputSummary: options['output-summary'] || '',
    resultSummary: options['result-summary'] || options['output-summary'] || '',
    artifactPaths: options.artifact ? String(options.artifact).split(',').filter(Boolean) : [],
    mainRead: Boolean(options['main-read']),
    adoption: options.adoption || 'pending',
    adoptionReason: options['adoption-reason'] || '',
    downstreamUse: options['downstream-use'] || '',
    selfExecuted: Boolean(options['self-executed']),
  }
  run.invocations.push(invocation)
  const state = run.nodes[nodeId]
  if (invocation.artifactPaths.length) {
    state.artifactPaths = [...new Set([...(state.artifactPaths ?? []), ...invocation.artifactPaths])]
  }
  if (invocation.adoption && invocation.adoption !== 'pending') {
    state.adoption = invocation.adoption
    state.adoptionReason = invocation.adoptionReason || state.adoptionReason
  }
  await saveRun(run, ROOT, { example: Boolean(options.example) || runId.includes('example') })
  console.log(JSON.stringify(invocation, null, 2))
}

async function cmdCompleteNode(options) {
  const runId = options.run
  const nodeId = options.node
  if (!runId || !nodeId) throw new Error('需要 --run 与 --node')
  const { run } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  if (run.nodes[nodeId]?.status === 'ready') {
    run.nodes[nodeId].status = 'running'
    run.nodes[nodeId].startedAt = run.nodes[nodeId].startedAt ?? new Date().toISOString()
    run.nodes[nodeId].attempts = (run.nodes[nodeId].attempts ?? 0) + 1
  }
  const result = await tryCompleteNode(definition, run, nodeId, {
    checkArtifactFiles: options['skip-artifact-files'] ? false : run.mode !== 'dry-run',
  })
  await saveRun(run, ROOT, { example: Boolean(options.example) || runId.includes('example') })
  if (!result.ok) {
    console.error(`节点未能完成：${result.reason}`)
    console.error(JSON.stringify(result.checks, null, 2))
    process.exitCode = 2
    return
  }
  console.log(JSON.stringify({ nodeId, status: run.nodes[nodeId].status, activeNodeIds: run.activeNodeIds }, null, 2))
}

async function cmdFailNode(options) {
  const runId = options.run
  const nodeId = options.node
  if (!runId || !nodeId) throw new Error('需要 --run 与 --node')
  const { run } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  const state = run.nodes[nodeId]
  state.status = 'failed'
  state.error = options.reason || '节点失败'
  state.endedAt = new Date().toISOString()
  run.errors.push({ at: state.endedAt, nodeId, message: state.error })
  refreshNodeReadiness(definition, run)
  await saveRun(run, ROOT, { example: Boolean(options.example) || runId.includes('example') })
  console.log(JSON.stringify({ nodeId, status: 'failed', activeNodeIds: run.activeNodeIds }, null, 2))
}

async function cmdApprove(options) {
  const runId = options.run
  const nodeId = options.node
  const decision = options.decision
  if (!runId || !nodeId || !decision) throw new Error('需要 --run --node --decision')
  const { run } = await loadRun(runId)
  run.approvals.push({
    approvalId: options.id || `apr-${randomBytes(4).toString('hex')}`,
    nodeId,
    decision,
    decidedBy: options.by || 'user',
    decidedAt: new Date().toISOString(),
    notes: options.notes || '',
  })
  if (run.nodes[nodeId]) run.nodes[nodeId].adoption = decision === 'approve' ? 'accepted' : decision === 'rework' ? 'rework' : 'rejected'
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  refreshNodeReadiness(definition, run)
  await saveRun(run, ROOT, { example: Boolean(options.example) || runId.includes('example') })
  console.log(JSON.stringify(run.approvals[run.approvals.length - 1], null, 2))
}

async function cmdReport(options) {
  const runId = options.run || options._[0]
  if (!runId) throw new Error('需要 --run')
  const { run } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  const reportPath = await writeRunReport(definition, run)
  await saveRun(run, ROOT, { example: Boolean(options.example) || runId.includes('example') })
  console.log(JSON.stringify({ reportPath, status: run.status }, null, 2))
}

async function cmdFinish(options) {
  const runId = options.run || options._[0]
  if (!runId) throw new Error('需要 --run')
  const { run } = await loadRun(runId)
  const { definition } = await loadDefinitionById(run.workflowId, { version: run.workflowVersion })
  const invariantIssues = assertInvariantWaivers(definition, run)
  if (invariantIssues.length) {
    console.error(invariantIssues.join('\n'))
    process.exitCode = 2
    return
  }
  if (!run.reportPath) await writeRunReport(definition, run)
  const result = evaluateCompletionGate(definition, run)
  await writeRunReport(definition, run)
  await saveRun(run, ROOT, { example: Boolean(options.example) || runId.includes('example') })
  console.log(JSON.stringify({ passed: result.ok, status: run.status, reportPath: run.reportPath, checks: result.checks }, null, 2))
  if (!result.ok) process.exitCode = 2
}

async function cmdProjection() {
  const loaded = await loadAllDefinitions(ROOT)
  const projections = []
  for (const { definition } of loaded) {
    if (definition.status !== 'active') continue
    projections.push(navigationProjection(definition))
  }
  console.log(JSON.stringify({ schemaVersion: 1, workflows: projections }, null, 2))
}

async function cmdMermaid(options) {
  const workflowId = options.workflow || options._[0]
  if (!workflowId) throw new Error('需要 --workflow')
  const { definition } = await loadDefinitionById(workflowId, { version: options.version })
  let run
  if (options.run) ({ run } = await loadRun(options.run))
  process.stdout.write(generateMermaid(definition, { view: options.view || (run ? 'run' : 'simple'), run }))
}

async function cmdViewerBuild() {
  const result = await buildViewerData(ROOT)
  console.log(JSON.stringify({
    ...result,
    open: 'project-workflows/viewer/index.html',
    tip: '用浏览器打开上述 HTML（可直接双击）。Skill/Agent/定义变更后请重新 validate 或 viewer:build。',
  }, null, 2))
}

async function main() {
  const options = argsMap(process.argv.slice(2))
  const command = options._.shift()
  switch (command) {
    case 'validate':
      return cmdValidate()
    case 'list':
      return cmdList()
    case 'generate':
      return cmdGenerate(options)
    case 'create-run':
      return cmdCreateRun(options)
    case 'status':
      return cmdStatus(options)
    case 'brief':
      return cmdBrief(options)
    case 'start-node':
      return cmdStartNode(options)
    case 'record-invocation':
      return cmdRecordInvocation(options)
    case 'complete-node':
      return cmdCompleteNode(options)
    case 'fail-node':
      return cmdFailNode(options)
    case 'approve':
      return cmdApprove(options)
    case 'report':
      return cmdReport(options)
    case 'finish':
      return cmdFinish(options)
    case 'projection':
      return cmdProjection()
    case 'mermaid':
      return cmdMermaid(options)
    case 'viewer-build':
      return cmdViewerBuild()
    default:
      console.log(`用法: node scripts/project-workflows/project-workflows.mjs <command>

命令:
  validate | list | generate | create-run | status | brief | start-node
  record-invocation | complete-node | fail-node | approve | report | finish
  projection | mermaid | viewer-build`)
      if (command) process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message || error)
    process.exitCode = 1
  })
}

export {
  validateAll,
  createEmptyRun,
  tryCompleteNode,
  buildNodeTaskBrief,
  navigationProjection,
}
