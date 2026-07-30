import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  isIndexedSourcePath,
  pathsIncludeIndexedSource,
} from '../project-index/lib/index-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('indexed source detector matches story docs and game sources', () => {
  assert.equal(isIndexedSourcePath('docs/系统说明/example.md'), true)
  assert.equal(isIndexedSourcePath('src/game/data/story_outline/sources/1-modern.json'), true)
  assert.equal(isIndexedSourcePath('src/game/views/components/base/Foo.vue'), true)
  assert.equal(isIndexedSourcePath('package.json'), false)
  assert.equal(isIndexedSourcePath('project-index/status.json'), false)
})

test('pathsIncludeIndexedSource is true when any staged path is indexed', () => {
  assert.equal(pathsIncludeIndexedSource(['package.json', 'docs/用户命令目录.md']), true)
  assert.equal(pathsIncludeIndexedSource(['package.json', 'README.md']), false)
})

test('pre-commit hook and refresh helper exist for index auto-stage', () => {
  assert.equal(fs.existsSync(path.join(root, '.githooks/pre-commit')), true)
  assert.equal(fs.existsSync(path.join(root, 'scripts/project-index/pre-commit-refresh-index.mjs')), true)
  const hook = fs.readFileSync(path.join(root, '.githooks/pre-commit'), 'utf8')
  assert.match(hook, /pre-commit-refresh-index\.mjs/)
})
