import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { validateDefinition, structuralIssues } from '../project-workflows/lib/validate-definition.mjs'
import { createEmptyRun, computeReadyNodeIds, refreshNodeReadiness } from '../project-workflows/lib/scheduler.mjs'
import { tryCompleteNode, evaluateCompletionGate } from '../project-workflows/lib/evidence-gate.mjs'
import { generateMermaid, generateProcessMarkdown } from '../project-workflows/lib/generate-docs.mjs'
import { loadDefinitionById, generateArtifactsForDefinition, generateAll, validateAll, writeJson } from '../project-workflows/lib/registry.mjs'
import { ROOT } from '../project-workflows/lib/paths.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

function baseDefinition(overrides = {}) {
  return {
    schemaVersion: 1,
    id: 'wf-test-sample',
    version: '1.0.0',
    title: '测试工作流',
    purpose: '单元测试用',
    domain: 'general',
    status: 'active',
    maturity: 'pilot',
    ownerSkill: 'liluo-executable-workflow',
    inputs: [{ id: 'in', description: '输入' }],
    outputs: [{ id: 'out', description: '输出' }],
    invariants: [{ id: 'no-skip', statement: '不得跳步', fatal: true, waiverAllowed: false }],
    entryNodeId: 'a',
    completionGate: {
      requiredNodeIds: ['a', 'b'],
      requiredArtifacts: [],
      forbidOpenBlockers: true,
    },
    nodes: [
      {
        id: 'a',
        title: '准备',
        type: 'prepare',
        stage: 'prepare',
        why: '入口',
        actor: 'main-agent',
        risk: 'low',
        actions: ['准备'],
        resources: [
          {
            requirement: 'required',
            kind: 'skill',
            ref: 'skill-liluo-executable-workflow',
            selfExecutionAllowed: true,
            evidence: ['invocation', 'success-or-explicit-failure', 'result-summary', 'main-read', 'adoption-decision', 'downstream-use'],
            onFailure: 'block',
          },
        ],
        expectedOutputs: [],
        completion: { requireResourceEvidence: true },
        failure: { strategy: 'block' },
      },
      {
        id: 'b',
        title: '独立审查',
        type: 'review',
        stage: 'review',
        why: '必须委派',
        actor: 'subagent',
        risk: 'high',
        actions: ['审查'],
        resources: [
          {
            requirement: 'required',
            kind: 'agent',
            ref: 'agent-liluo-content-auditor',
            selfExecutionAllowed: false,
            evidence: ['invocation', 'success-or-explicit-failure', 'result-summary', 'main-read', 'adoption-decision', 'downstream-use'],
            onFailure: 'block',
            fatal: true,
            waiverAllowed: false,
          },
        ],
        expectedOutputs: [],
        completion: { requireResourceEvidence: true },
        failure: { strategy: 'block' },
      },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b', when: 'success' },
    ],
    ...overrides,
  }
}

function record(run, nodeId, patch) {
  run.invocations.push({
    invocationId: `inv-${run.invocations.length + 1}`,
    nodeId,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    status: 'succeeded',
    resultSummary: 'ok',
    mainRead: true,
    adoption: 'accepted',
    downstreamUse: 'applied',
    artifactPaths: [],
    selfExecuted: false,
    ...patch,
  })
  if (patch.adoption) run.nodes[nodeId].adoption = patch.adoption
}

test('schema: 合法定义通过结构检查', async () => {
  const definition = baseDefinition()
  assert.deepEqual(structuralIssues(definition), [])
  const result = await validateDefinition(definition, { checkResources: true, root: ROOT })
  assert.equal(result.ok, true, result.issues.join('; '))
})

test('schema: 缺少入口节点失败', () => {
  const definition = baseDefinition({ entryNodeId: 'missing' })
  assert.ok(structuralIssues(definition).some((item) => item.includes('入口节点不存在')))
})

test('schema: 重复节点 ID 失败', () => {
  const definition = baseDefinition()
  definition.nodes.push({ ...definition.nodes[0], id: 'a', title: '重复' })
  assert.ok(structuralIssues(definition).some((item) => item.includes('重复节点 ID')))
})

test('schema: 边引用不存在节点失败', () => {
  const definition = baseDefinition()
  definition.edges.push({ id: 'bad', from: 'a', to: 'ghost', when: 'success' })
  assert.ok(structuralIssues(definition).some((item) => item.includes('ghost')))
})

test('调度: 前置完成后才解锁后继', async () => {
  const definition = baseDefinition()
  const run = createEmptyRun(definition, { runId: 'run-test-unlock', mode: 'dry-run' })
  assert.deepEqual(computeReadyNodeIds(definition, run), ['a'])
  run.nodes.a.status = 'completed'
  refreshNodeReadiness(definition, run)
  assert.deepEqual(computeReadyNodeIds(definition, run), ['b'])
})

test('门禁: 必需 Agent 未调用时不能完成', async () => {
  const definition = baseDefinition()
  const run = createEmptyRun(definition, { runId: 'run-test-block', mode: 'dry-run' })
  run.nodes.a.status = 'completed'
  run.nodes.b.status = 'running'
  refreshNodeReadiness(definition, run)
  const result = await tryCompleteNode(definition, run, 'b', { checkArtifactFiles: false })
  assert.equal(result.ok, false)
  assert.equal(run.nodes.b.status, 'blocked')
  assert.match(result.reason, /缺少必需资源调用证据/)
})

test('门禁: 调用成功但无采用决定时不能完成', async () => {
  const definition = baseDefinition()
  const run = createEmptyRun(definition, { runId: 'run-test-adoption', mode: 'dry-run' })
  run.nodes.a.status = 'completed'
  run.nodes.b.status = 'running'
  record(run, 'b', {
    kind: 'agent',
    ref: 'agent-liluo-content-auditor',
    adoption: 'pending',
    mainRead: true,
    resultSummary: 'findings',
  })
  const result = await tryCompleteNode(definition, run, 'b', { checkArtifactFiles: false })
  assert.equal(result.ok, false)
  assert.match(result.reason, /缺少采用决定/)
})

test('门禁: 主 Agent 不能代替 selfExecutionAllowed=false', async () => {
  const definition = baseDefinition()
  const run = createEmptyRun(definition, { runId: 'run-test-self', mode: 'dry-run' })
  run.nodes.a.status = 'completed'
  run.nodes.b.status = 'running'
  record(run, 'b', {
    kind: 'agent',
    ref: 'agent-liluo-content-auditor',
    selfExecuted: true,
    adoption: 'accepted',
  })
  const result = await tryCompleteNode(definition, run, 'b', { checkArtifactFiles: false })
  assert.equal(result.ok, false)
  assert.match(result.reason, /不得替代执行/)
})

test('门禁: fatal 资源不能被豁免', async () => {
  const definition = baseDefinition()
  const run = createEmptyRun(definition, { runId: 'run-test-waiver', mode: 'dry-run' })
  run.nodes.a.status = 'completed'
  run.nodes.b.status = 'running'
  run.waivers.push({
    waiverId: 'w1',
    nodeId: 'b',
    ref: 'agent-liluo-content-auditor',
    approvedBy: 'user',
    reason: '赶时间',
    risk: '高',
    remediation: '无',
    allowsContinue: true,
  })
  const result = await tryCompleteNode(definition, run, 'b', { checkArtifactFiles: false })
  assert.equal(result.ok, false)
  assert.match(result.reason, /不得豁免/)
})

test('生成: Markdown 嵌入静态 Mermaid 作为任务介绍', async () => {
  const { definition } = await loadDefinitionById('wf-story-mainline-restructure', { root: ROOT })
  const markdown = generateProcessMarkdown(definition)
  assert.match(markdown, /独立内容与连续性审查/)
  assert.match(markdown, /1\.0\.0/)
  assert.match(markdown, /## 流程概览（可视化介绍）/)
  assert.match(markdown, /```mermaid/)
  assert.match(markdown, /preserve-text/)
  assert.match(markdown, /independent-review/)
  assert.match(markdown, /final-report/)
  assert.match(markdown, /仅当用户明确要求/)
  const mermaid = generateMermaid(definition, { view: 'simple' })
  assert.match(mermaid, /preserve-text/)
})

test('仓库定义校验默认不重生成；生成物过期可被检测', async () => {
  const check = await validateAll(ROOT, { regenerate: false })
  assert.equal(check.ok, true, check.issues.join('\n'))
  assert.equal(check.regenerated, false)
  const processMd = await readFile(path.join(ROOT, 'project-workflows/generated/wf-story-mainline-restructure/PROCESS.md'), 'utf8')
  assert.match(processMd, /故事主线重构/)
  const viewerData = await readFile(path.join(ROOT, 'project-workflows/viewer/data.js'), 'utf8')
  assert.match(viewerData, /wf-story-mainline-restructure/)
})

test('重大修改后显式 generate 会重写介绍文档', async () => {
  const result = await generateAll(ROOT)
  assert.equal(result.ok, true, result.issues.join('\n'))
  assert.equal(result.regenerated, true)
  const processMd = await readFile(path.join(ROOT, 'project-workflows/generated/wf-story-mainline-restructure/PROCESS.md'), 'utf8')
  assert.match(processMd, /流程概览（可视化介绍）/)
  assert.match(processMd, /```mermaid/)
})

test('端到端 dry-run: 缺 Agent 阻塞，回填后可继续并出报告', async () => {
  const { definition } = await loadDefinitionById('wf-story-mainline-restructure', { root: ROOT })
  const run = createEmptyRun(definition, {
    runId: 'run-story-mainline-restructure-example',
    mode: 'dry-run',
    inputSummary: '演练：三世界主线重构基建，不执行正式迁移',
    flags: { dryRun: true },
  })

  async function complete(nodeId, invocations) {
    run.nodes[nodeId].status = 'running'
    run.nodes[nodeId].attempts += 1
    run.nodes[nodeId].startedAt = new Date().toISOString()
    for (const item of invocations) record(run, nodeId, item)
    const result = await tryCompleteNode(definition, run, nodeId, { checkArtifactFiles: false })
    assert.equal(result.ok, true, `${nodeId}: ${result.reason}`)
  }

  await complete('prepare-scope', [{
    kind: 'skill',
    ref: 'skill-liluo-executable-workflow',
    resultSummary: '确认 dry-run 与目标三世界',
    downstreamUse: '写入 inputSummary/flags',
  }])

  await complete('locate-sources', [
    {
      kind: 'skill',
      ref: 'skill-liluo-story-outline-graph-maintenance',
      resultSummary: '定位正式源',
      downstreamUse: '进入保全校验',
    },
    {
      kind: 'doc',
      ref: 'src/game/data/story_outline/mainline-restructure-preservation.json',
      resultSummary: '保全清单存在',
      artifactPaths: ['src/game/data/story_outline/mainline-restructure-preservation.json'],
      downstreamUse: '作为保全输入',
    },
  ])

  await complete('preserve-text', [{
    kind: 'script',
    ref: 'scripts/tests/three-world-mainline-restructure-preservation.test.mjs',
    resultSummary: '保全测试通过（演练记录）',
    downstreamUse: '允许进入独立审查',
  }])

  run.nodes['independent-review'].status = 'running'
  run.nodes['independent-review'].attempts += 1
  let blocked = await tryCompleteNode(definition, run, 'independent-review', { checkArtifactFiles: false })
  assert.equal(blocked.ok, false)
  assert.equal(run.nodes['independent-review'].status, 'blocked')

  record(run, 'independent-review', {
    kind: 'agent',
    ref: 'agent-liluo-content-auditor',
    resultSummary: '结构风险可接受（演练）',
    adoption: 'accepted',
    downstreamUse: '继续迁移演练节点',
  })
  record(run, 'independent-review', {
    kind: 'agent',
    ref: 'agent-liluo-continuity-reviewer',
    resultSummary: '连续性无阻塞（演练）',
    adoption: 'accepted',
    downstreamUse: '继续迁移演练节点',
  })
  run.nodes['independent-review'].status = 'running'
  blocked = await tryCompleteNode(definition, run, 'independent-review', { checkArtifactFiles: false })
  assert.equal(blocked.ok, true, blocked.reason)

  await complete('migrate-structure', [{
    kind: 'skill',
    ref: 'skill-liluo-executable-workflow',
    resultSummary: 'dry-run：跳过正式源写入',
    downstreamUse: '进入校验节点',
  }])

  await complete('validate-structure', [{
    kind: 'script',
    ref: 'scripts/tests/three-world-mainline-restructure-preservation.test.mjs',
    resultSummary: '演练校验通过',
    downstreamUse: '进入导航同步',
  }])

  await complete('sync-navigation', [
    {
      kind: 'skill',
      ref: 'skill-liluo-project-capability-navigation',
      resultSummary: '导航投影已规划',
      downstreamUse: '运行 navigation check（演练记录）',
    },
    {
      kind: 'command',
      ref: 'command-project-navigation-check',
      resultSummary: 'navigation check ok（演练）',
      downstreamUse: '进入报告',
    },
  ])

  await complete('final-report', [{
    kind: 'command',
    ref: 'command-project-workflow-report',
    resultSummary: '报告已生成',
    artifactPaths: ['project-workflows/runs/reports/run-story-mainline-restructure-example.md'],
    downstreamUse: '供 finish 门禁使用',
  }])

  run.reportPath = 'project-workflows/runs/reports/run-story-mainline-restructure-example.md'
  const gate = evaluateCompletionGate(definition, run)
  assert.equal(gate.ok, true, JSON.stringify(gate.checks, null, 2))

  const temp = await mkdtemp(path.join(os.tmpdir(), 'liluo-wf-'))
  try {
    await mkdir(path.join(temp, 'project-workflows', 'runs', 'examples'), { recursive: true })
    await writeJson(path.join(ROOT, 'project-workflows/runs/examples/run-story-mainline-restructure-example.json'), run)
    const report = generateProcessMarkdown(definition)
    assert.match(report, /不可变约束/)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

void HERE
void generateArtifactsForDefinition
void mkdir
void writeFile
