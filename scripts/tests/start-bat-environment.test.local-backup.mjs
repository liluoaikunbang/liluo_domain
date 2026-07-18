import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const startScript = readFileSync(new URL('../../start.bat', import.meta.url), 'utf8')

test('start.bat enters the project directory before starting npm', () => {
  assert.match(startScript, /cd \/d "%~dp0"/i)
})

test('start.bat can locate a standard Node.js install when npm is missing from PATH', () => {
  assert.match(startScript, /where npm\.cmd/i)
  assert.match(startScript, /%ProgramFiles%\\nodejs\\npm\.cmd/i)
})

test('start.bat reports a clear error when Node.js cannot be found', () => {
  assert.match(startScript, /未找到 Node\.js/i)
  assert.match(startScript, /exit \/b 1/i)
})
