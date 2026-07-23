import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import { classifyRulePattern, parsePrefixRules } from '../command-approval/lib/approval-governance.mjs'
import { resolveNpmInvocation, resolveRoutinePlan } from '../project-routine.mjs'
import { validateProjectSkillInitRequest } from '../init-project-skill.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')

test('project routine exposes only fixed safe modes', () => {
  assert.deepEqual(resolveRoutinePlan('docs').map((step) => step.id), [
    'docs:check-encoding',
    'docs:governance:validate',
    'docs:memory:validate',
    'docs:commands:validate',
  ])
  assert.deepEqual(resolveRoutinePlan('workflow').map((step) => step.id), [
    'project-routine-governance',
  ])
  assert.deepEqual(resolveRoutinePlan('team-presence').map((step) => step.id), [
    'team-presence-test',
    'team-notes-validate',
  ])
  assert.deepEqual(resolveRoutinePlan('natural-expression').map((step) => step.id), [
    'natural-expression-test',
  ])
  assert.deepEqual(resolveRoutinePlan('check').map((step) => step.id), [
    'docs:check-encoding',
    'docs:governance:validate',
    'docs:memory:validate',
    'docs:commands:validate',
    'commands:approval:validate',
    'project:index:check',
    'game:content:validate',
  ])
  assert.deepEqual(resolveRoutinePlan('index').map((step) => step.id), [
    'project:index:build',
    'project:index:validate',
  ])
  assert.throws(() => resolveRoutinePlan('unknown'), /不支持的项目常规模式/)
  assert.throws(() => resolveRoutinePlan('check', ['--unexpected']), /不接受附加参数/)
})

test('Windows-safe npm invocation uses npm CLI through Node instead of spawning npm.cmd', () => {
  assert.deepEqual(
    resolveNpmInvocation(['run', 'docs:check-encoding'], {
      npmExecPath: 'C:\\npm\\node_modules\\npm\\bin\\npm-cli.js',
      nodeExecutable: 'C:\\node\\node.exe',
    }),
    {
      command: 'C:\\node\\node.exe',
      args: ['C:\\npm\\node_modules\\npm\\bin\\npm-cli.js', 'run', 'docs:check-encoding'],
    },
  )
  assert.throws(
    () => resolveNpmInvocation(['run', 'docs:check-encoding'], { npmExecPath: '', nodeExecutable: 'node' }),
    /npm_execpath/,
  )
})

test('project skill initializer restricts names, areas and resources', () => {
  assert.deepEqual(
    validateProjectSkillInitRequest({
      name: 'liluo-example-workflow',
      area: 'testing',
      resources: 'references,scripts',
    }),
    {
      name: 'liluo-example-workflow',
      area: 'testing',
      resources: ['references', 'scripts'],
    },
  )
  assert.throws(
    () => validateProjectSkillInitRequest({ name: 'random-tool', area: 'testing', resources: 'references' }),
    /名称必须以 liluo-/,
  )
  assert.throws(
    () => validateProjectSkillInitRequest({ name: 'liluo-demo', area: 'outside', resources: 'references' }),
    /area 仅允许/,
  )
  assert.throws(
    () => validateProjectSkillInitRequest({ name: 'liluo-demo', area: 'testing', resources: 'bin' }),
    /resources 仅允许/,
  )
})

test('project rules allow only the two governed entry points, not broad npm run', async () => {
  assert.equal(classifyRulePattern(['npm', 'run', 'project:routine']).allowEligible, true)
  assert.equal(classifyRulePattern(['npm', 'run', 'project:skill:init']).allowEligible, true)

  const rulesDirectory = path.join(root, '.codex', 'rules')
  const ruleFiles = (await readdir(rulesDirectory)).filter((name) => name.endsWith('.rules'))
  const parsed = (
    await Promise.all(ruleFiles.map(async (name) => parsePrefixRules(await readFile(path.join(rulesDirectory, name), 'utf8'))))
  ).flat()
  const allowed = parsed.filter((rule) => rule.decision === 'allow').map((rule) => rule.pattern.join(' '))

  assert.ok(allowed.includes('npm run project:routine'))
  assert.ok(allowed.includes('npm run project:skill:init'))
  assert.ok(!allowed.includes('npm run'))
  assert.ok(!allowed.includes('node'))
  assert.ok(!allowed.includes('python'))
  assert.ok(!allowed.includes('powershell'))
})

test('project index freshness detection matches the story indexer source boundary', async () => {
  const checker = await readFile(new URL('../project-index/check-project-index.mjs', import.meta.url), 'utf8')
  assert.match(checker, /story_outline\/sources\//)
  assert.doesNotMatch(checker, /story_outline\/'\) && \['\.json', '\.md'\]/)
})
