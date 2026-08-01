import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyChanges } from '../classify-changes.mjs'
import { buildGatePlan } from '../build-gate-plan.mjs'
import { resolveCommandInvocation } from '../lib/command-runner.mjs'

const commandsFor = (files, mode = 'changed') => buildGatePlan({
  classification: classifyChanges(files),
  mode,
}).commands

test('plain documentation does not trigger a build', () => {
  const commands = commandsFor(['docs/系统说明/example.md'])
  assert.ok(commands.includes('npm run docs:check-encoding'))
  assert.ok(!commands.includes('npm run build:web'))
})

test('Skill changes trigger static eval but never live eval', () => {
  const commands = commandsFor(['.agents/skills/example/SKILL.md'])
  assert.ok(commands.includes('npm run evals:check'))
  assert.ok(!commands.some((command) => command.includes('evals:smoke')))
})

test('liluo-project Skill changes require user-command catalog sync validation', () => {
  const commands = commandsFor(['.agents/skills/liluo-project/liluo-plot-placement-interview/SKILL.md'])
  assert.ok(commands.includes('npm run docs:commands:validate'))
  assert.ok(commands.includes('npm run evals:check'))
})

test('user command catalog edits alone still require commands validate', () => {
  const commands = commandsFor(['docs/用户命令目录.md'])
  assert.ok(commands.includes('npm run docs:commands:validate'))
})

test('command approval governance changes run their own checks without a Web build', () => {
  const commands = commandsFor(['scripts/command-approval/lib/approval-governance.mjs'])
  assert.ok(commands.includes('npm run commands:approval:test'))
  assert.ok(commands.includes('npm run commands:approval:validate'))
  assert.ok(!commands.includes('npm run build:web'))
})

test('executable workflow changes run the workflow routine without a Web build', () => {
  const commands = commandsFor(['project-workflows/definitions/wf-story-mainline-restructure.v1.0.0.json'])
  assert.ok(commands.includes('npm run project:routine -- workflow'))
  assert.ok(!commands.includes('npm run project:workflow:validate'))
  assert.ok(!commands.includes('npm run build:web'))
})

test('workflow routine covers workflow validation when multiple sources request both', () => {
  const commands = commandsFor([
    'project-workflows/definitions/wf-story-mainline-restructure.v1.0.0.json',
    '.agents/skills/liluo-project/liluo-executable-workflow/SKILL.md',
  ])
  assert.ok(commands.includes('npm run project:routine -- workflow'))
  assert.ok(!commands.includes('npm run project:workflow:validate'))
})

test('Skill or Agent changes only light-check workflow refs without full regenerate routine', () => {
  const skillCommands = commandsFor(['.agents/skills/liluo-project/liluo-executable-workflow/SKILL.md'])
  assert.ok(skillCommands.includes('npm run project:workflow:validate'))
  assert.ok(!skillCommands.includes('npm run project:routine -- workflow'))
  const agentCommands = commandsFor(['.codex/agents/liluo_content_auditor.toml'])
  assert.ok(agentCommands.includes('npm run project:workflow:validate'))
  assert.ok(!agentCommands.includes('npm run project:routine -- workflow'))
})

test('project routine governance tests do not require Codex execpolicy validation', () => {
  const commands = commandsFor(['scripts/tests/project-routine-governance.test.mjs'])
  assert.ok(!commands.includes('npm run commands:approval:validate'))
})

test('save changes trigger contracts and tests', () => {
  const commands = commandsFor(['src/game/systems/saveMigration.ts'])
  assert.ok(commands.includes('npm run data:contracts:check'))
  assert.ok(commands.includes('npm run project:routine -- test'))
})

test('asset changes trigger the asset audit and index maintenance', () => {
  const commands = commandsFor(['src/assets/game/example.png'])
  assert.ok(commands.some((command) => command.includes('audit-game-assets.mjs')))
  assert.ok(commands.includes('npm run project:index:changed'))
  assert.ok(commands.includes('npm run project:index:validate'))
})

test('changed mode refreshes index before routine check', () => {
  const commands = commandsFor(['src/game/data/story_outline/sources/1-modern.json'], 'changed')
  const changedAt = commands.indexOf('npm run project:index:changed')
  const checkAt = commands.indexOf('npm run project:routine -- check')
  assert.ok(changedAt >= 0)
  assert.ok(checkAt >= 0)
  assert.ok(changedAt < checkAt)
})

test('prepush validates index without rewriting it', () => {
  const commands = commandsFor(['src/game/data/story_outline/sources/1-modern.json'], 'prepush')
  assert.ok(!commands.includes('npm run project:index:changed'))
  assert.ok(commands.includes('npm run project:routine -- check'))
  assert.ok(commands.includes('npm run project:index:validate'))
})

test('multi-domain plans de-duplicate commands', () => {
  const commands = commandsFor(['src/game/data/maps/world/map/events.json', 'src/game/scenes/WorldScene.ts'])
  assert.equal(new Set(commands).size, commands.length)
})

test('hook mode omits builds even for build configuration', () => {
  assert.ok(!commandsFor(['vite.config.js'], 'hook').includes('npm run build:web'))
})

test('CI is deterministic and omits live eval', () => {
  const commands = commandsFor([], 'ci')
  assert.ok(commands.includes('npm run build:web'))
  assert.ok(!commands.some((command) => command.includes('evals:smoke')))
})

test('direct Windows Hook execution routes npm through cmd.exe when npm_execpath is absent', () => {
  const invocation = resolveCommandInvocation('npm run project:routine -- check', {
    npmExecPath: '',
    platform: 'win32',
    comSpec: 'C:/Windows/System32/cmd.exe',
  })
  assert.equal(invocation.executable, 'C:/Windows/System32/cmd.exe')
  assert.deepEqual(invocation.args, ['/d', '/s', '/c', 'npm', 'run', 'project:routine', '--', 'check'])
})
