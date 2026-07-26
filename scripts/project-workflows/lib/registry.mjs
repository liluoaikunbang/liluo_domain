import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  DEFINITIONS_DIR,
  GENERATED_DIR,
  REGISTRY_PATH,
  RUNS_DIR,
  EXAMPLE_RUNS_DIR,
  ROOT,
  toPosix,
} from './paths.mjs'
import { validateDefinition, validateRunRecord } from './validate-definition.mjs'
import { generateMermaid, generateProcessMarkdown, generateRunReport, navigationProjection } from './generate-docs.mjs'
import { buildViewerData } from './build-viewer-data.mjs'

export async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function definitionFileName(definition) {
  return `${definition.id}.v${definition.version}.json`
}

export async function listDefinitionFiles(root = ROOT) {
  const dir = path.join(root, 'project-workflows', 'definitions')
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dir, entry.name))
    .sort()
}

export async function loadDefinitionById(workflowId, options = {}) {
  const version = options.version
  const files = await listDefinitionFiles(options.root)
  const matches = []
  for (const file of files) {
    const definition = await readJson(file)
    if (definition.id !== workflowId) continue
    matches.push({ file, definition })
  }
  if (!matches.length) throw new Error(`未找到工作流定义：${workflowId}`)
  if (version) {
    const hit = matches.find((item) => item.definition.version === version)
    if (!hit) throw new Error(`未找到工作流版本：${workflowId}@${version}`)
    return hit
  }
  const registry = await readJson(path.join(options.root ?? ROOT, 'project-workflows', 'registry.json')).catch(() => null)
  const activeVersion = registry?.workflows?.find((item) => item.id === workflowId)?.activeVersion
  if (activeVersion) {
    const hit = matches.find((item) => item.definition.version === activeVersion)
    if (hit) return hit
  }
  matches.sort((left, right) => right.definition.version.localeCompare(left.definition.version, 'en', { numeric: true }))
  return matches[0]
}

export async function loadAllDefinitions(root = ROOT) {
  const files = await listDefinitionFiles(root)
  const definitions = []
  for (const file of files) {
    definitions.push({ file, definition: await readJson(file) })
  }
  return definitions
}

export async function rebuildRegistry(root = ROOT) {
  const loaded = await loadAllDefinitions(root)
  const issues = []
  const workflows = []
  for (const { file, definition } of loaded) {
    const result = await validateDefinition(definition, { root })
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => `${toPosix(path.relative(root, file))}: ${issue}`))
      continue
    }
    workflows.push({
      id: definition.id,
      title: definition.title,
      domain: definition.domain,
      status: definition.status,
      maturity: definition.maturity,
      activeVersion: definition.version,
      ownerSkill: definition.ownerSkill,
      definitionPath: toPosix(path.relative(root, file)),
      generatedDir: `project-workflows/generated/${definition.id}`,
      navigationId: `workflow-${definition.id.replace(/^wf-/, '')}`,
    })
  }
  const registry = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    workflows: workflows.sort((left, right) => left.id.localeCompare(right.id)),
  }
  await writeJson(path.join(root, 'project-workflows', 'registry.json'), registry)
  return { registry, issues, ok: issues.length === 0 }
}

export async function generateArtifactsForDefinition(definition, root = ROOT) {
  const dir = path.join(root, 'project-workflows', 'generated', definition.id)
  await mkdir(dir, { recursive: true })
  const processMd = generateProcessMarkdown(definition)
  const simple = generateMermaid(definition, { view: 'simple' })
  const detail = generateMermaid(definition, { view: 'detail' })
  await writeFile(path.join(dir, 'PROCESS.md'), processMd, 'utf8')
  await writeFile(path.join(dir, 'flow-simple.mmd'), simple, 'utf8')
  await writeFile(path.join(dir, 'flow-detail.mmd'), detail, 'utf8')
  await writeJson(path.join(dir, 'navigation-projection.json'), navigationProjection(definition))
  return {
    processPath: toPosix(path.relative(root, path.join(dir, 'PROCESS.md'))),
    simplePath: toPosix(path.relative(root, path.join(dir, 'flow-simple.mmd'))),
    detailPath: toPosix(path.relative(root, path.join(dir, 'flow-detail.mmd'))),
  }
}

/** 检查生成物是否与定义漂移；不写文件。 */
export async function checkGeneratedDrift(definition, root = ROOT) {
  const issues = []
  const dir = path.join(root, 'project-workflows', 'generated', definition.id)
  const expectedSimple = generateMermaid(definition, { view: 'simple' })
  const expectedDetail = generateMermaid(definition, { view: 'detail' })
  const expectedProcess = generateProcessMarkdown(definition)
  const checks = [
    ['flow-simple.mmd', expectedSimple],
    ['flow-detail.mmd', expectedDetail],
    ['PROCESS.md', expectedProcess],
  ]
  for (const [name, expected] of checks) {
    const file = path.join(dir, name)
    let actual
    try {
      actual = await readFile(file, 'utf8')
    } catch {
      issues.push(`${definition.id}: 缺少生成物 ${toPosix(path.relative(root, file))}；重大修改后请运行 project:workflow:generate`)
      continue
    }
    if (actual !== expected) {
      issues.push(`${definition.id}: ${name} 已过期（定义有重大变更后未重生成）；请运行 npm run project:workflow:generate -- --workflow ${definition.id}`)
    }
  }
  return issues
}

/**
 * @param {{ regenerate?: boolean }} [options]
 * regenerate=false（默认）：只校验定义与引用，并检测生成物是否过期，不写文件。
 * regenerate=true：重大修改后显式重写 PROCESS/静态图/viewer 数据。
 */
export async function validateAll(root = ROOT, options = {}) {
  const regenerate = Boolean(options.regenerate)
  const { registry, issues, ok } = await rebuildRegistry(root)
  const allIssues = [...issues]
  for (const entry of registry.workflows) {
    const { definition } = await loadDefinitionById(entry.id, { root, version: entry.activeVersion })
    if (regenerate) {
      await generateArtifactsForDefinition(definition, root)
    } else {
      allIssues.push(...await checkGeneratedDrift(definition, root))
    }
  }
  if (regenerate && allIssues.length === 0) await buildViewerData(root)
  return { ok: allIssues.length === 0, issues: allIssues, registry, regenerated: regenerate }
}

export async function generateAll(root = ROOT) {
  return validateAll(root, { regenerate: true })
}

export async function resolveRunPath(runId, root = ROOT) {
  const candidates = [
    path.join(root, 'project-workflows', 'runs', `${runId}.json`),
    path.join(root, 'project-workflows', 'runs', 'examples', `${runId}.json`),
  ]
  for (const candidate of candidates) {
    try {
      await readFile(candidate, 'utf8')
      return candidate
    } catch {
      // continue
    }
  }
  return candidates[0]
}

export async function loadRun(runId, root = ROOT) {
  const file = await resolveRunPath(runId, root)
  const run = await readJson(file)
  const validation = await validateRunRecord(run)
  if (!validation.ok) {
    throw new Error(`运行记录无效：${validation.issues.join('; ')}`)
  }
  return { file, run }
}

export async function saveRun(run, root = ROOT, options = {}) {
  const dir = options.example ? EXAMPLE_RUNS_DIR : RUNS_DIR
  const file = path.join(root === ROOT ? dir : path.join(root, 'project-workflows', options.example ? 'runs/examples' : 'runs'), `${run.runId}.json`)
  run.updatedAt = new Date().toISOString()
  await writeJson(file, run)
  return file
}

export async function writeRunReport(definition, run, root = ROOT) {
  const reportRel = `project-workflows/runs/reports/${run.runId}.md`
  const absolute = path.join(root, reportRel)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, generateRunReport(definition, run), 'utf8')
  run.reportPath = reportRel
  return reportRel
}

export { GENERATED_DIR, REGISTRY_PATH, DEFINITIONS_DIR }
