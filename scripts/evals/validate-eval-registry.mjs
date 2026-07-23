import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'

import { discoverProjectCapabilities } from './lib/discover-project-capabilities.mjs'
import { loadEvalCases, matchesCaseGlob } from './lib/load-eval-cases.mjs'

const rootDefault = path.resolve(import.meta.dirname, '..', '..')
const exists = async (file) => access(file, constants.F_OK).then(() => true, () => false)
const parseJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

function gitChangedPaths(root) {
  const commands = [
    ['diff', '--name-only', '--relative'],
    ['ls-files', '--others', '--exclude-standard'],
  ]
  const paths = new Set()
  for (const args of commands) {
    const result = spawnSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, encoding: 'utf8', shell: false })
    if (result.status !== 0) continue
    for (const line of result.stdout.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) paths.add(line.replaceAll('\\', '/'))
  }
  return [...paths]
}

export async function validateEvalSystem(root = rootDefault, options = {}) {
  const errors = []
  const warnings = []
  const registry = options.registry ?? await parseJson(path.join(root, 'evals', 'registry.json'))
  const cases = options.cases ?? await loadEvalCases(root)
  const registrySchema = await parseJson(path.join(root, 'evals', 'schemas', 'eval-registry.schema.json'))
  const caseSchema = await parseJson(path.join(root, 'evals', 'schemas', 'eval-case.schema.json'))
  const outputSchema = await parseJson(path.join(root, 'evals', 'schemas', 'codex-eval-output.schema.json'))
  const reportSchema = await parseJson(path.join(root, 'evals', 'schemas', 'eval-report.schema.json'))
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validateRegistry = ajv.compile(registrySchema)
  const validateCase = ajv.compile(caseSchema)
  ajv.compile(outputSchema)
  ajv.compile(reportSchema)

  if (!validateRegistry(registry)) errors.push({ check: 'registry-schema', details: validateRegistry.errors })
  const ids = new Set()
  for (const evalCase of cases) {
    const { file, ...caseData } = evalCase
    if (!validateCase(caseData)) errors.push({ check: 'case-schema', file, details: validateCase.errors })
    if (ids.has(evalCase.id)) errors.push({ check: 'case-id-unique', id: evalCase.id })
    ids.add(evalCase.id)
  }

  const capabilities = await discoverProjectCapabilities(root)
  const allSkillNames = new Map()
  for (const skill of capabilities.allSkills) {
    if (!skill.name) errors.push({ check: 'skill-frontmatter-name', path: skill.path })
    if (allSkillNames.has(skill.name)) errors.push({ check: 'skill-name-unique', name: skill.name, paths: [allSkillNames.get(skill.name), skill.path] })
    allSkillNames.set(skill.name, skill.path)
    if (skill.name !== skill.directoryName) errors.push({ check: 'skill-directory-name', name: skill.name, path: skill.path })
  }
  for (const skill of capabilities.skills) {
    if (!await exists(path.join(root, skill.openaiYamlPath))) errors.push({ check: 'project-skill-openai-yaml', name: skill.name })
    if (!await exists(path.join(root, 'docs', '技能说明', `${skill.name}.md`))) errors.push({ check: 'project-skill-doc', name: skill.name })
  }

  const agentDisplayNames = new Map()
  for (const agent of capabilities.agents) {
    if (!agent.displayName) errors.push({ check: 'agent-name', name: agent.name })
    if (agentDisplayNames.has(agent.displayName)) errors.push({ check: 'agent-name-unique', name: agent.displayName })
    agentDisplayNames.set(agent.displayName, agent.path)
    if (!await exists(path.join(root, agent.docPath))) errors.push({ check: 'agent-doc', name: agent.name })
  }

  const targetKeys = new Set()
  const discovered = new Map([
    ...capabilities.skills.map((item) => [`skill:${item.name}`, item.path]),
    ...capabilities.agents.map((item) => [`agent:${item.name}`, item.path]),
  ])
  for (const target of registry.targets ?? []) {
    const key = `${target.type}:${target.name}`
    if (targetKeys.has(key)) errors.push({ check: 'target-unique', target: key })
    targetKeys.add(key)
    if (!await exists(path.join(root, target.path))) errors.push({ check: 'target-path', target: key, path: target.path })
    if (!discovered.has(key)) errors.push({ check: 'target-discovered', target: key })
    if (discovered.has(key) && discovered.get(key) !== target.path) errors.push({ check: 'target-path-match', target: key, expected: discovered.get(key), actual: target.path })
    const targetCases = cases.filter((evalCase) => evalCase.targetType === target.type && evalCase.target === target.name && target.caseGlobs.some((glob) => matchesCaseGlob(evalCase.file, glob)))
    if (target.status === 'active' && !targetCases.some((evalCase) => evalCase.status === 'active')) errors.push({ check: 'active-target-coverage', target: key })
    if (target.tier === 'core') {
      if (!targetCases.some((evalCase) => evalCase.status === 'active' && evalCase.polarity === 'positive')) errors.push({ check: 'core-positive-coverage', target: key })
      if (!targetCases.some((evalCase) => evalCase.status === 'active' && evalCase.polarity === 'negative')) errors.push({ check: 'core-negative-coverage', target: key })
    }
  }
  for (const key of discovered.keys()) if (!targetKeys.has(key)) errors.push({ check: 'unregistered-capability', target: key })
  for (const evalCase of cases) if (!targetKeys.has(`${evalCase.targetType}:${evalCase.target}`)) errors.push({ check: 'case-target', id: evalCase.id })

  const agentsSource = await readFile(path.join(root, 'AGENTS.md'), 'utf8')
  for (const match of agentsSource.matchAll(/`((?:liluo-[a-z0-9-]+)|random-story-outline-interview)`/g)) {
    const name = match[1]
    if (!capabilities.skills.some((skill) => skill.name === name)) errors.push({ check: 'agents-skill-reference', name })
  }

  const baseline = await parseJson(path.join(root, 'evals', 'baselines', 'smoke-baseline.json'))
  for (const entry of baseline.entries ?? []) {
    const evalCase = cases.find((item) => item.id === entry.caseId)
    if (!evalCase) errors.push({ check: 'baseline-case', caseId: entry.caseId })
    else if (!targetKeys.has(`${evalCase.targetType}:${evalCase.target}`)) errors.push({ check: 'baseline-target', caseId: entry.caseId })
  }

  if (options.scope === 'changed') {
    const changed = options.changedPaths ?? gitChangedPaths(root)
    for (const target of registry.targets ?? []) {
      if (!changed.includes(target.path)) continue
      const covered = cases.some((evalCase) => evalCase.targetType === target.type && evalCase.target === target.name && evalCase.status === 'active')
      if (!covered) errors.push({ check: 'changed-target-coverage', target: `${target.type}:${target.name}` })
    }
    if (!changed.length) warnings.push({ check: 'changed-scope', message: 'Git 未报告变更路径。' })
  }

  return { pass: errors.length === 0, errors, warnings, counts: { targets: registry.targets?.length ?? 0, cases: cases.length } }
}

function isMain() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMain()) {
  const result = await validateEvalSystem()
  console.log(JSON.stringify(result, null, 2))
  if (!result.pass) process.exitCode = 1
}
