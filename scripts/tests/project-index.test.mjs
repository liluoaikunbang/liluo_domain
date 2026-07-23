import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  contentHash,
  parseFrontmatter,
  stableJson,
  shardRecords,
  compareSourceSnapshot,
} from '../project-index/lib/core.mjs'
import { queryRecords } from '../project-index/lib/query.mjs'

test('contentHash is deterministic and changes with UTF-8 content', () => {
  assert.equal(contentHash('璃落'), contentHash('璃落'))
  assert.notEqual(contentHash('璃落'), contentHash('璃音'))
  assert.match(contentHash('璃落'), /^[a-f0-9]{64}$/)
})

test('parseFrontmatter reads scalar, boolean and list fields', () => {
  const parsed = parseFrontmatter('---\nkey: node-1\nside: true\ncharacters:\n  - 璃落\n  - 璃音\n---\n\n# 标题')
  assert.equal(parsed.attributes.key, 'node-1')
  assert.equal(parsed.attributes.side, true)
  assert.deepEqual(parsed.attributes.characters, ['璃落', '璃音'])
  assert.equal(parsed.body.trim(), '# 标题')
})

test('stableJson sorts object keys recursively', () => {
  assert.equal(stableJson({ z: 1, a: { y: 2, b: 3 } }), '{\n  "a": {\n    "b": 3,\n    "y": 2\n  },\n  "z": 1\n}\n')
})

test('shardRecords is stable, complete and produces no empty shard', () => {
  const records = [{ id: 'c' }, { id: 'a' }, { id: 'b' }]
  const shards = shardRecords(records, { maxRecords: 2, prefix: 'part' })
  assert.deepEqual(shards.map((item) => item.file), ['part-001.json', 'part-002.json'])
  assert.deepEqual(shards.flatMap((item) => item.records).map((item) => item.id), ['a', 'b', 'c'])
  assert.ok(shards.every((item) => item.records.length > 0))
})

test('compareSourceSnapshot detects added, modified, deleted and renamed paths', () => {
  const before = { 'a.md': '1', 'old.md': 'same', 'gone.md': 'gone' }
  const after = { 'a.md': '2', 'new.md': 'same', 'added.md': 'new' }
  assert.deepEqual(compareSourceSnapshot(before, after), {
    added: ['added.md'],
    modified: ['a.md'],
    deleted: ['gone.md'],
    renamed: [{ from: 'old.md', to: 'new.md' }],
  })
})

test('queryRecords supports key, world, parent, fields and limit', () => {
  const records = [
    { key: 'root', title: '根', world: '现代', sourcePath: 'root.md' },
    { key: 'child', title: '隐祀村', world: '现代', parentKey: 'root', sourcePath: 'child.md' },
  ]
  const result = queryRecords(records, { query: '隐祀', world: '现代', parent: 'root', fields: ['key', 'title'], limit: 1 })
  assert.deepEqual(result, [{ key: 'child', title: '隐祀村' }])
})

test('queryRecords finds a reverse-reference record by its target entity', () => {
  const records = [{ id: 'gameplay:gameplay-118', entityId: 'gameplay-118', type: 'reverse-reference', references: { storyKeys: ['node-1'] } }]
  assert.equal(queryRecords(records, { reverseReference: 'gameplay-118' }).length, 1)
})

test('atomic build helper leaves the existing directory untouched after a failed replacement callback', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'liluo-index-test-'))
  const target = path.join(root, 'project-index')
  fs.mkdirSync(target)
  fs.writeFileSync(path.join(target, 'marker.txt'), 'old')
  const { atomicReplaceDirectory } = await import('../project-index/lib/writer.mjs')
  await assert.rejects(() => atomicReplaceDirectory(target, async (temp) => {
    fs.writeFileSync(path.join(temp, 'marker.txt'), 'new')
    throw new Error('fixture failure')
  }))
  assert.equal(fs.readFileSync(path.join(target, 'marker.txt'), 'utf8'), 'old')
  fs.rmSync(root, { recursive: true, force: true })
})

test('atomic build helper recovers from a stale swap file left by an interrupted Windows rename', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'liluo-index-swap-test-'))
  const target = path.join(root, 'project-index')
  fs.mkdirSync(target)
  fs.writeFileSync(path.join(target, 'marker.txt'), 'old')
  fs.writeFileSync(path.join(target, 'marker.txt.new'), 'stale')
  const { atomicReplaceDirectory } = await import('../project-index/lib/writer.mjs')

  await atomicReplaceDirectory(target, async (temp) => {
    fs.writeFileSync(path.join(temp, 'marker.txt'), 'new')
  })

  assert.equal(fs.readFileSync(path.join(target, 'marker.txt'), 'utf8'), 'new')
  assert.equal(fs.existsSync(path.join(target, 'marker.txt.new')), false)
  fs.rmSync(root, { recursive: true, force: true })
})
