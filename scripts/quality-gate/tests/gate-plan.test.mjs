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
