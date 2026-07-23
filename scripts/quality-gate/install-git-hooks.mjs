#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..', '..')
const result = spawnSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
  shell: false,
})
if (result.error) throw result.error
if (result.status !== 0) {
  console.error((result.stderr || 'Unable to configure core.hooksPath').trim())
  process.exitCode = result.status ?? 1
} else {
  console.log('Configured local core.hooksPath=.githooks')
}
