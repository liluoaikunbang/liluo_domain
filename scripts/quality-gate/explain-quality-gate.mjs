#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const result = spawnSync(process.execPath, ['scripts/quality-gate/run-quality-gate.mjs', '--mode', 'changed', '--explain'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: true,
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
