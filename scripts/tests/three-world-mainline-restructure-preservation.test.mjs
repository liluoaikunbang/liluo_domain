import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const root = path.resolve(import.meta.dirname, '../..')
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'src/game/data/story_outline/mainline-restructure-preservation.json'), 'utf8'))
const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
const stable = (value) => JSON.stringify(value, Object.keys(value).sort())
const sourceCache = new Map()
const loadSource = (file) => {
  if (!sourceCache.has(file)) sourceCache.set(file, JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')))
  return sourceCache.get(file)
}
const allNodes = []
for (const source of new Set(snapshot.entries.map((entry) => entry.sourceFile))) allNodes.push(...loadSource(source).nodes)
const byKey = new Map(allNodes.map((node) => [node.key, node]))
assert.equal(byKey.size, allNodes.length, '存在重复稳定标识')
let changedMarkdown = 0
let reducedMissingItems = 0
for (const entry of snapshot.entries) {
  const node = byKey.get(entry.key)
  assert.ok(node, `旧节点缺失：${entry.key}`)
  const protectedFields = Object.fromEntries(Object.entries(node).filter(([field]) => !['parentKey', 'order', 'branchLayout'].includes(field)))
  assert.equal(hash(stable(protectedFields)), entry.sourceContentHash, `旧节点原始字段被改写：${entry.key}`)
  assert.ok(entry.destination, `旧节点无迁移去向：${entry.key}`)
  if (entry.markdownPath) {
    const current = hash(fs.readFileSync(path.join(root, entry.markdownPath), 'utf8'))
    if (current !== entry.markdownHash) changedMarkdown += 1
  }
  if ((node.missingItems?.length ?? 0) < entry.missingItems.length) reducedMissingItems += 1
}
for (const node of allNodes) if (node.parentKey) assert.ok(byKey.has(node.parentKey), `孤儿节点：${node.key} -> ${node.parentKey}`)
assert.equal(changedMarkdown, 0, `原 Markdown 哈希不一致：${changedMarkdown}`)
assert.equal(reducedMissingItems, 0, `missingItems 被减少：${reducedMissingItems}`)
console.log(JSON.stringify({ oldNodeCount: snapshot.entries.length, preservedNodeCount: snapshot.entries.filter((entry) => byKey.has(entry.key)).length, markdownHashMatches: snapshot.entries.filter((entry) => entry.markdownPath).length, changedMarkdown, reducedMissingItems, orphanNodes: 0, unmappedNodes: snapshot.entries.filter((entry) => !entry.destination).length }, null, 2))
