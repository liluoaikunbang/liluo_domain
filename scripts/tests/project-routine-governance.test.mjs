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
    'project-workflow-validate',
    'project-workflow-test',
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
    'project:index:check',
    'data:contracts:check',
    'evals:check',
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

test('project rules allow only governed entry points, not broad npm run', async () => {
  const governedCommands = [
    'project:routine',
    'project:skill:init',
    'project:gate:changed',
    'project:gate:prepush',
    'project:gate:ci',
    'project:gate:explain',
    'project:hooks:test',
  ]
  for (const command of governedCommands) {
    assert.equal(classifyRulePattern(['npm', 'run', command]).allowEligible, true, command)
  }

  const rulesDirectory = path.join(root, '.codex', 'rules')
  const ruleFiles = (await readdir(rulesDirectory)).filter((name) => name.endsWith('.rules'))
  const parsed = (
    await Promise.all(ruleFiles.map(async (name) => parsePrefixRules(await readFile(path.join(rulesDirectory, name), 'utf8'))))
  ).flat()
  const allowed = parsed.filter((rule) => rule.decision === 'allow').map((rule) => rule.pattern.join(' '))

  for (const command of governedCommands) {
    assert.ok(allowed.includes(`npm run ${command}`), command)
  }
  assert.ok(!allowed.includes('npm run project:hooks:install'))
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

test('narrow Skill installation and local-rule changes stay within a light governance scope', async () => {
  const [governanceSkill, governanceSystem] = await Promise.all([
    readFile(path.join(root, '.agents', 'skills', 'liluo-project', 'liluo-project-governance-memory', 'SKILL.md'), 'utf8'),
    readFile(path.join(root, 'docs', '系统说明', '项目规范治理与设计记忆系统.md'), 'utf8'),
  ])

  assert.match(governanceSkill, /do not promote it into a system-wide change by default/u)
  assert.match(governanceSystem, /不得仅因“写入规范”而自动追加功能更新、用户命令、CDR\/ADR、治理注册表、全量文档读取或索引刷新/u)
})

test('explicit GitHub upload uses one target push without a remote preflight', async () => {
  const [agents, approvalSystem, approvalSkill, reviewSkill, userCommands] = await Promise.all([
    readFile(path.join(root, 'AGENTS.md'), 'utf8'),
    readFile(path.join(root, 'docs', '系统说明', 'Codex命令授权治理系统.md'), 'utf8'),
    readFile(path.join(root, '.agents', 'skills', 'liluo-project', 'liluo-command-approval-governance', 'SKILL.md'), 'utf8'),
    readFile(path.join(root, '.agents', 'skills', 'code-review-and-quality', 'SKILL.md'), 'utf8'),
    readFile(path.join(root, 'docs', '用户命令目录.md'), 'utf8'),
  ])

  assert.match(agents, /不得默认先用 `git ls-remote`、fetch/)
  assert.match(approvalSystem, /默认不在推送前运行 `git ls-remote`、fetch/)
  assert.match(approvalSkill, /must not add `git ls-remote`, fetch/)
  assert.match(reviewSkill, /Do not run `git ls-remote`, fetch/)
  assert.match(userCommands, /不先运行 `git ls-remote` 或 fetch/)
  assert.match(approvalSystem, /不扩大为永久 Git 或网络 allow/)
})

test('project config leaves permission policy to the managed workspace context', async () => {
  const [config, agents, approvalSystem] = await Promise.all([
    readFile(path.join(root, '.codex', 'config.toml'), 'utf8'),
    readFile(path.join(root, 'AGENTS.md'), 'utf8'),
    readFile(path.join(root, 'docs', '系统说明', 'Codex命令授权治理系统.md'), 'utf8'),
  ])

  assert.match(config, /^\[agents\]\s*$/m)
  assert.doesNotMatch(config, /default_permissions/)
  assert.doesNotMatch(config, /^\[permissions\./m)
  assert.match(agents, /项目 Skill、Agent、规则和配置均直接使用 `apply_patch`，不得再按文件或目录逐项询问/)
  assert.match(approvalSystem, /“Skill\/Agent\/规则\/配置文件”不是单独的审批类别/)
  assert.match(approvalSystem, /显式允许常用项目源目录/)
  assert.match(approvalSystem, /生成物、依赖、本机规则快照和 Git 元数据不因此获得直接编辑权限/)
})
