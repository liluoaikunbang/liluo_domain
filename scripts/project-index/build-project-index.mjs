import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { atomicReplaceDirectory, writeText } from './lib/writer.mjs'
import { compareSourceSnapshot, fileHash, repoPath, shardRecords, stableJson } from './lib/core.mjs'
import { indexAssets, indexCode, indexDocs, indexGame, indexGameplay, indexStory } from './lib/indexers.mjs'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, 'project-index.config.json'), 'utf8'))
const target = path.join(repoRoot, config.outputDirectory)
const args = new Set(process.argv.slice(2)); const changedMode = args.has('--changed')
if (args.has('--help')) { console.log('Usage: node scripts/project-index/build-project-index.mjs --all|--changed'); process.exit(0) }

const domains = {
  story: indexStory(repoRoot, config), gameplay: indexGameplay(repoRoot, config), game: indexGame(repoRoot, config), code: indexCode(repoRoot, config), assets: indexAssets(repoRoot, config), docs: indexDocs(repoRoot, config),
}
const allSources = [...new Set(Object.values(domains).flatMap((domain) => domain.sources ?? []).map((file) => repoPath(repoRoot, file)))].sort()
const sourceSnapshot = Object.fromEntries(allSources.map((relative) => [relative, fileHash(path.join(repoRoot, relative))]))
let previous = null; try { previous = JSON.parse(fs.readFileSync(path.join(target, 'status.json'), 'utf8')) } catch {}
const changes = compareSourceSnapshot(previous?.sourceSnapshot, sourceSnapshot)
if (previous?.generatorVersion === config.generatorVersion && !changes.added.length && !changes.modified.length && !changes.deleted.length && !changes.renamed.length) { console.log(`Project index is current (${Object.keys(sourceSnapshot).length} sources); no files rewritten.`); process.exit(0) }

const affected = new Set(Object.keys(domains))
if (changedMode && previous) {
  affected.clear(); const changedPaths = [...changes.added, ...changes.modified, ...changes.deleted, ...changes.renamed.flatMap((item) => [item.from, item.to])]
  for (const sourcePath of changedPaths) {
    if (sourcePath.includes('/story_outline/')) { affected.add('story'); affected.add('graph') }
    else if (sourcePath.includes('/gameplay_outline/')) { affected.add('gameplay'); affected.add('graph') }
    else if (sourcePath.includes('/maps/') || sourcePath.includes('/interactive_fictions/') || sourcePath.endsWith('/registry.ts')) { affected.add('game'); affected.add('graph') }
    else if (sourcePath.startsWith('src/assets/game/')) affected.add('assets')
    else if (sourcePath.startsWith('docs/')) affected.add('docs')
    else if (sourcePath.startsWith('src/game/')) affected.add('code')
  }
}

const story = domains.story; const gameplay = domains.gameplay; const game = domains.game
const storyRelations = story.records.map((node) => ({ from: node.key, relationType: 'parent', to: node.parentKey })).filter((item) => item.to)
const gameplayReverse = new Map(); const mapReverse = new Map()
for (const node of story.records) { for (const ref of node.gameplayRefs ?? []) { if (!gameplayReverse.has(ref)) gameplayReverse.set(ref, []); gameplayReverse.get(ref).push(node.key) } for (const ref of node.mapRefs ?? []) { if (!mapReverse.has(ref)) mapReverse.set(ref, []); mapReverse.get(ref).push(node.key) } }
const reverseReferences = [
  ...[...gameplayReverse].map(([id, storyKeys]) => ({ id: `gameplay:${id}`, entityId: id, type: 'reverse-reference', entityType: 'gameplay', references: { storyKeys: storyKeys.sort() } })),
  ...[...mapReverse].map(([id, storyKeys]) => ({ id: `map:${id}`, entityId: id, type: 'reverse-reference', entityType: 'map', references: { storyKeys: storyKeys.sort() } })),
].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`))

function sourceCommit() { try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return null } }
function writeJson(root, relative, value) { writeText(root, relative, stableJson(value)) }
function writeShards(root, directory, records, prefix = 'part') { const shards = shardRecords(records, { maxRecords: config.maxRecordsPerShard, prefix }); for (const shard of shards) writeJson(root, `${directory}/${shard.file}`, shard.records); return shards.map((item) => ({ file: `${directory}/${item.file}`, count: item.records.length })) }

await atomicReplaceDirectory(target, async (temp) => {
  const outputs = {}; const counts = {}
  const storyShards = writeShards(temp, 'story/nodes', story.records, 'nodes'); outputs.story = storyShards.map((item) => item.file)
  writeJson(temp, 'story/catalog.json', { worlds: story.worlds, rootKeys: story.roots, shards: storyShards, entryCount: story.records.length }); writeJson(temp, 'story/trees/all.json', story.records.map(({ key, title, world, parentKey, childKeys, side }) => ({ key, title, world, parentKey, childKeys, side })).sort((a, b) => a.key.localeCompare(b.key))); writeJson(temp, 'story/missing-items.json', story.records.filter((item) => item.missingItems?.length).map(({ key, title, missingItems, markdownPath }) => ({ key, title, missingItems, markdownPath }))); writeJson(temp, 'story/validation-issues.json', story.issues); counts.story = story.records.length
  writeText(temp, 'story/SUMMARY.md', '# 故事索引\n\n权威来源为 `src/game/data/story_outline/sources/*.json` 与对应 Markdown。节点按固定数量分片；修改前必须核验原文。\n')
  const gameplayOutputs = []; for (const category of gameplay.categories) { const records = gameplay.records.filter((item) => item.categoryId === category.id); const file = `gameplay/categories/${category.id}.json`; writeJson(temp, file, records); gameplayOutputs.push(file) } writeJson(temp, 'gameplay/catalog.json', { categories: gameplay.categories.map((item) => ({ ...item, file: `gameplay/categories/${item.id}.json`, entryCount: gameplay.records.filter((record) => record.categoryId === item.id).length })), entryCount: gameplay.records.length }); counts.gameplay = gameplay.records.length; outputs.gameplay = ['gameplay/catalog.json', ...gameplayOutputs]; writeText(temp, 'gameplay/SUMMARY.md', '# 玩法索引\n\n权威来源为 `src/game/data/gameplay_outline/catalog.json`。条目按玩法大类分片，保留摘要、分类与轻量变体目录。\n')
  for (const [name, records] of Object.entries({ maps: game.maps, events: game.events, dialogues: game.dialogues, 'interactive-fictions': game.interactiveFictions, registries: game.registries })) { if (records.length) writeJson(temp, `game/${name}.json`, records) }
  counts.game = game.maps.length + game.events.length + game.dialogues.length + game.interactiveFictions.length + game.registries.length; outputs.game = ['game/maps.json', 'game/events.json', 'game/dialogues.json', 'game/interactive-fictions.json', 'game/registries.json'].filter((file) => fs.existsSync(path.join(temp, file))); writeText(temp, 'game/SUMMARY.md', '# 游戏内容索引\n\n索引地图、事件、对话、互动小说与注册入口。JSON 内容只做保守结构提取，运行行为仍以源码和注册表为准。\n')
  outputs.code = writeShards(temp, 'code', domains.code.records, 'modules').map((item) => item.file); counts.code = domains.code.records.length; writeText(temp, 'code/SUMMARY.md', '# 代码索引\n\n覆盖 `src/game` 的 Vue、Scene、system、store 与普通模块。imports 仅用于定位，真实行为必须阅读源码。\n')
  outputs.assets = writeShards(temp, 'assets/runtime', domains.assets.records.filter((item) => item.status === 'runtime'), 'assets').map((item) => item.file); const candidates = domains.assets.records.filter((item) => item.status === 'candidate'); if (candidates.length) outputs.assets.push(...writeShards(temp, 'assets/candidates', candidates, 'assets').map((item) => item.file)); const byType = {}; for (const item of domains.assets.records) byType[item.assetType] = (byType[item.assetType] ?? 0) + 1; writeJson(temp, 'assets/summary.json', { entryCount: domains.assets.records.length, totalBytes: domains.assets.records.reduce((sum, item) => sum + item.size, 0), byType }); counts.assets = domains.assets.records.length; writeText(temp, 'assets/SUMMARY.md', '# 素材索引\n\n覆盖 `src/assets/game` 的真实文件路径、大小和内容哈希，不保存图片内容，也不做图像语义推断。\n')
  outputs.docs = writeShards(temp, 'docs', domains.docs.records, 'documents').map((item) => item.file); counts.docs = domains.docs.records.length; writeText(temp, 'docs/SUMMARY.md', '# 文档索引\n\n覆盖 `docs` 下 Markdown，按系统、Skill、Agent、更新记录等类型导航。\n')
  writeJson(temp, 'graph/story-relations.json', storyRelations); writeJson(temp, 'graph/reverse-references/all.json', reverseReferences); counts.graph = storyRelations.length + reverseReferences.length; outputs.graph = ['graph/story-relations.json', 'graph/reverse-references/all.json']; writeText(temp, 'graph/SUMMARY.md', '# 关系索引\n\n保存故事父子关系及玩法、地图到故事节点的反向引用。未确认关系不会从正文猜测。\n')
  const validationStatus = Object.values(story.issues).some((items) => items.length) ? 'partial' : 'current'
  const manifest = { schemaVersion: config.schemaVersion, generatorVersion: config.generatorVersion, domains: Object.fromEntries(Object.keys(domains).map((name) => [name, { enabled: true, entryCount: counts[name], outputs: outputs[name], status: name === 'story' ? validationStatus : 'current' }])), lore: { enabled: false, status: 'not-enabled', reason: '缺少独立且稳定的权威实体资料库；第一版不从故事正文推断完整实体。' }, graph: { enabled: true, entryCount: counts.graph, outputs: outputs.graph, status: validationStatus }, exclusions: config.excludedDirectories, sharding: { maxRecords: config.maxRecordsPerShard }, knownLimitations: ['增量更新为领域级；当前生成器仍扫描源哈希以识别删除与重命名。', '代码索引使用轻量 import 提取，不构建完整 AST。', '事件和对话只索引可确定的结构化 ID。'], validationStatus }
  writeJson(temp, 'manifest.json', manifest)
  const status = { schemaVersion: config.schemaVersion, generatorVersion: config.generatorVersion, generatedAt: new Date().toISOString(), sourceCommit: sourceCommit(), status: validationStatus, mode: changedMode ? 'changed' : 'all', affectedDomains: [...affected].sort(), changes, domains: Object.fromEntries(Object.entries(counts).map(([name, entryCount]) => [name, { status: name === 'story' ? validationStatus : 'current', entryCount }])), sourceSnapshot }
  writeJson(temp, 'status.json', status)
  writeText(temp, 'INDEX.md', `# 璃落项目知识索引\n\n本目录是导航、缓存与关系检索层，不是正式权威来源。索引版本 ${config.schemaVersion}，当前状态：${validationStatus}。\n\n| 领域 | 记录数 | 入口 |\n|---|---:|---|\n${Object.entries(counts).map(([name, count]) => `| ${name} | ${count} | \`${name}/SUMMARY.md\` |`).join('\n')}\n\n## 最小读取建议\n\n- 故事节点与父子关系：story；玩法：gameplay；地图/事件/对话：game；代码入口：code；素材路径：assets；系统文档：docs；反向引用：graph。\n- 重要事实和任何正式修改前，必须打开记录指向的原始文件核验。\n- 查询：\`npm run project:index:query -- --domain story --query "关键词"\`。\n- 新鲜度：\`npm run project:index:check\`；更新：\`npm run project:index:changed\`；验证：\`npm run project:index:validate\`。\n`)
})
console.log(`Built project index (${changedMode ? 'changed' : 'all'}): ${Object.values(domains).reduce((sum, item) => sum + (item.records?.length ?? item.maps?.length ?? 0), 0)} primary records, ${Object.keys(sourceSnapshot).length} sources.`)
