#!/usr/bin/env node
/**
 * pre-commit helper: when staged files include indexed sources, refresh
 * project-index and stage the result into the same commit.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathsIncludeIndexedSource } from './lib/index-sources.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
    ...options,
  })
  if (result.error) throw result.error
  return result
}

function listStagedPaths() {
  const result = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  if (result.status !== 0) {
    process.stderr.write(result.stderr || 'git diff --cached failed\n')
    process.exit(result.status ?? 1)
  }
  return String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim().replaceAll('\\', '/'))
    .filter(Boolean)
}

const staged = listStagedPaths()
if (!pathsIncludeIndexedSource(staged)) {
  process.exit(0)
}

process.stdout.write('[pre-commit] indexed sources staged; refreshing project-index...\n')
const npmExecPath = process.env.npm_execpath
const refresh = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, 'run', 'project:index:changed'], {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
      shell: false,
      stdio: 'inherit',
    })
  : spawnSync('npm', ['run', 'project:index:changed'], {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
      shell: true,
      stdio: 'inherit',
    })
if (refresh.error) throw refresh.error
if (refresh.status !== 0) {
  process.stderr.write('[pre-commit] project:index:changed failed; aborting commit.\n')
  process.exit(refresh.status ?? 1)
}

const add = runGit(['add', '-A', '--', 'project-index'])
if (add.status !== 0) {
  process.stderr.write(add.stderr || '[pre-commit] git add project-index failed\n')
  process.exit(add.status ?? 1)
}
process.stdout.write('[pre-commit] project-index staged for this commit.\n')
