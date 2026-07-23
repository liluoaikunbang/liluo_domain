import assert from 'node:assert/strict'
import fs from 'node:fs'
import { Readable } from 'node:stream'
import test from 'node:test'

import {
  evaluatePromptSecrets,
  evaluateToolRequest,
} from '../../../.codex/hooks/lib/project-path-policy.mjs'
import {
  decideStopResult,
  gateReportPassed,
  stopExecutionPassed,
} from '../../../.codex/hooks/stop-quality-gate.mjs'
import { readHookInput } from '../../../.codex/hooks/lib/read-hook-input.mjs'

const root = 'D:/meng/liluo_domain'

test('secret scan blocks high-confidence credentials without echoing them', () => {
  const secret = `sk-proj-${'A'.repeat(48)}`
  const result = evaluatePromptSecrets(`OPENAI_API_KEY=${secret}`)
  assert.equal(result.allowed, false)
  assert.doesNotMatch(result.reason, new RegExp(secret))
})

test('secret scan permits placeholders and test values', () => {
  for (const prompt of ['OPENAI_API_KEY=YOUR_API_KEY', 'token=<token>', 'API_KEY=test-fake-value']) {
    assert.equal(evaluatePromptSecrets(prompt).allowed, true)
  }
})

test('safe shell commands and generated operations are allowed', () => {
  const commands = [
    'npm run build:web',
    'Remove-Item -Recurse -Force scripts/tests/tmp-quality-gate',
    'Remove-Item -LiteralPath D:\\meng\\liluo_domain\\scripts\\tests\\tmp-quality-gate -Recurse -Force',
    'git restore path/to/one-generated-test-file',
    'npm run project:index:changed',
  ]
  for (const command of commands) {
    assert.equal(evaluateToolRequest({ tool_name: 'Bash', tool_input: { command } }, root).allowed, true, command)
  }
})

test('dangerous shell commands are blocked', () => {
  const commands = [
    'git reset --hard',
    'git clean -fdx',
    'git clean -fd',
    'git push --force origin main',
    'git push -f origin main',
    'Remove-Item -LiteralPath D:\\meng\\liluo_domain -Recurse -Force',
    'rmdir /s docs',
    'Get-Content ~/.codex/auth.json',
    'Write-Output $env:OPENAI_API_KEY',
    'Set-Content .git\\config unsafe',
  ]
  for (const command of commands) {
    assert.equal(evaluateToolRequest({ tool_name: 'Bash', tool_input: { command } }, root).allowed, false, command)
  }
})

test('direct edits protect generated and local-sensitive paths while allowing examples', () => {
  const blocked = [
    'project-index/manifest.json',
    '.env',
    '.git/config',
    'reports/quality-gate/latest.json',
    'D:/meng/liluo_domain/.git/config',
    'D:/meng/liluo_domain/project-index/status.json',
  ]
  for (const file_path of blocked) {
    assert.equal(evaluateToolRequest({ tool_name: 'apply_patch', tool_input: { file_path } }, root).allowed, false, file_path)
  }
  assert.equal(evaluateToolRequest({ tool_name: 'Write', tool_input: { file_path: '.env.example' } }, root).allowed, true)
  const patch = '*** Begin Patch\n*** Update File: project-index/manifest.json\n@@\n-old\n+new\n*** End Patch\n'
  assert.equal(evaluateToolRequest({ tool_name: 'apply_patch', tool_input: { patch } }, root).allowed, false)
})

test('Stop failure continues once and does not recurse while active', () => {
  const gateResult = { ok: false, summary: 'two checks failed' }
  assert.equal(decideStopResult({ gateResult, stopHookActive: false }).decision, 'block')
  assert.equal(decideStopResult({ gateResult, stopHookActive: true }).decision, undefined)
})

test('Stop allows WARNING reports and blocks only reports with errors', () => {
  assert.equal(gateReportPassed({ status: 'warning', errors: [], warnings: ['unclassified file'] }), true)
  assert.equal(gateReportPassed({ status: 'passed', errors: [] }), true)
  assert.equal(gateReportPassed({ status: 'failed', errors: [{ message: 'failed' }] }), false)
  assert.equal(stopExecutionPassed({ status: 1 }, { status: 'passed', errors: [] }), false)
  assert.equal(stopExecutionPassed({ status: 0 }, { status: 'warning', errors: [] }), true)
})

test('hook input reader handles legal and malformed stdin without throwing', async () => {
  const legal = await readHookInput(Readable.from(['{"tool_name":"Bash","tool_input":{"command":"npm test"}}']))
  assert.equal(legal.ok, true)
  const malformed = await readHookInput(Readable.from(['{not-json']))
  assert.equal(malformed.ok, false)
  const empty = await readHookInput(Readable.from([]))
  assert.equal(empty.ok, false)
})

test('hooks.json is valid and defines each required lifecycle event', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../../../.codex/hooks.json', import.meta.url), 'utf8'))
  assert.ok(config.hooks.UserPromptSubmit)
  assert.deepEqual(config.hooks.PreToolUse.map((entry) => entry.matcher), ['Bash', 'apply_patch', 'Edit', 'Write'])
  assert.ok(config.hooks.Stop)
})
