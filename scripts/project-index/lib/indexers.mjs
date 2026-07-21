import fs from 'node:fs'
import path from 'node:path'
import { contentHash, fileHash, parseFrontmatter, repoPath, walkFiles } from './core.mjs'

const array = (value) => Array.isArray(value) ? value.filter(Boolean) : []
const summary = (value, max = 240) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined
const compact = (record) => Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null && (!Array.isArray(value) || value.length)))

export function indexStory(repoRoot, config) {
  const base = path.join(repoRoot, 'src/game/data/story_outline')
  const sourceFiles = walkFiles(path.join(base, 'sources'), { extensions: ['.json'] })
  const markdownFiles = walkFiles(base, { extensions: ['.md'] })
  const markdownByKey = new Map()
  for (const file of markdownFiles) { const text = fs.readFileSync(file, 'utf8'); const parsed = parseFrontmatter(text); if (parsed.attributes.key) markdownByKey.set(parsed.attributes.key, { file, text, attributes: parsed.attributes }) }
  const nodes = []; const roots = []; const worlds = []
  for (const sourceFile of sourceFiles) {
    const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8')); const worldSlug = path.basename(sourceFile, '.json'); worlds.push(worldSlug); roots.push(...array(source.rootKeys))
    for (const node of array(source.nodes)) {
      const markdown = markdownByKey.get(node.key); const attrs = markdown?.attributes ?? {}; const mdSummary = summary(attrs.summary, config.summaryMaxChars); const jsonSummary = summary(node.summary, config.summaryMaxChars)
      nodes.push(compact({
        key: node.key, id: node.key, type: 'story-node', title: node.title, world: node.world, series: worldSlug, parentKey: node.parentKey,
        side: node.branchLayout === 'side' || attrs.side === true, maturity: attrs.status || node.status,
        characters: array(attrs.characters).length ? array(attrs.characters) : array(node.characters), organizations: array(attrs.organizations), locations: array(attrs.locations).length ? array(attrs.locations) : array(node.locations), items: array(attrs.items),
        gameplayRefs: array(attrs.gameplayRefs).length ? array(attrs.gameplayRefs) : array(node.gameplayRefs), mapRefs: [...new Set([node.mapId, ...array(attrs.mapRefs)].filter(Boolean))], eventRefs: array(attrs.eventRefs), assetRefs: array(attrs.assetRefs), missingItems: array(attrs.missingItems),
        summary: mdSummary ?? jsonSummary ?? node.title, summarySource: mdSummary ? 'frontmatter.summary' : jsonSummary ? 'source-json.summary' : 'title-only',
        sourceJsonPath: repoPath(repoRoot, sourceFile), markdownPath: markdown ? repoPath(repoRoot, markdown.file) : undefined,
        sourceHashes: compact({ json: fileHash(sourceFile), markdown: markdown ? contentHash(markdown.text) : undefined }), indexVersion: 1,
      }))
    }
  }
  const byKey = new Map(nodes.map((node) => [node.key, node])); for (const node of nodes) node.childKeys = nodes.filter((item) => item.parentKey === node.key).map((item) => item.key).sort()
  const issues = { duplicateKeys: [], invalidParents: [], orphans: [], cycles: [], missingMarkdown: [] }
  const seen = new Set(); for (const node of nodes) { if (seen.has(node.key)) issues.duplicateKeys.push(node.key); seen.add(node.key); if (node.parentKey && !byKey.has(node.parentKey)) issues.invalidParents.push({ key: node.key, parentKey: node.parentKey }); if (!node.markdownPath) issues.missingMarkdown.push(node.key) }
  for (const node of nodes) { const chain = new Set([node.key]); let cursor = node; while (cursor.parentKey && byKey.has(cursor.parentKey)) { if (chain.has(cursor.parentKey)) { issues.cycles.push(node.key); break } chain.add(cursor.parentKey); cursor = byKey.get(cursor.parentKey) } }
  return { records: nodes.sort((a, b) => a.key.localeCompare(b.key)), worlds: worlds.sort(), roots: [...new Set(roots)].sort(), issues, sources: [...sourceFiles, ...markdownFiles] }
}

export function indexGameplay(repoRoot) {
  const file = path.join(repoRoot, 'src/game/data/gameplay_outline/catalog.json'); const source = JSON.parse(fs.readFileSync(file, 'utf8')); const categories = new Map(source.categories.map((item) => [item.id, item]))
  const records = source.entries.map((entry) => compact({ id: entry.id, type: 'gameplay', title: entry.title, categoryId: entry.categoryId, category: categories.get(entry.categoryId)?.title, summary: entry.summary, summarySource: 'source-json.summary', presentationModes: array(entry.presentationModes), variants: array(entry.variants).map((item) => ({ id: item.id, title: item.title })), sourcePath: repoPath(repoRoot, file), sourceHash: fileHash(file), indexVersion: 1 }))
  return { records, categories: source.categories, sources: [file] }
}

function recordsFromJsonFiles(repoRoot, files, type, idFields) {
  const records = []
  for (const file of files) {
    let value; try { value = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { continue }
    const candidates = Array.isArray(value) ? value : Array.isArray(value.events) ? value.events : Array.isArray(value.dialogues) ? value.dialogues : Object.values(value).filter((item) => item && typeof item === 'object')
    for (const item of candidates) {
      const id = idFields.map((field) => item[field]).find(Boolean); if (!id) continue
      records.push(compact({ id, type, title: item.title || item.name || item.label || id, mapId: item.mapId || repoPath(repoRoot, file).split('/maps/')[1]?.split('/')[1], sourcePath: repoPath(repoRoot, file), sourceHash: fileHash(file), summary: summary(item.summary || item.description) || String(id), summarySource: item.summary ? 'source-json.summary' : item.description ? 'structured-fields' : 'title-only', indexVersion: 1 }))
    }
  }
  return records
}

export function indexGame(repoRoot) {
  const mapsRoot = path.join(repoRoot, 'src/game/data/maps'); const files = walkFiles(mapsRoot, { extensions: ['.json', '.ts', '.js'] })
  const mapDirs = [...new Set(files.map((file) => path.dirname(file)).filter((dir) => fs.existsSync(path.join(dir, 'map.json')) || fs.existsSync(path.join(dir, 'events.json')) || fs.existsSync(path.join(dir, 'meta.ts'))))]
  const maps = mapDirs.map((dir) => { const sourceFiles = walkFiles(dir); const relative = repoPath(repoRoot, dir); const world = relative.split('/maps/')[1]?.split('/')[0]; const mapId = path.basename(dir); return { id: `${world}/${mapId}`, mapId, type: 'map', title: mapId, world, sourcePath: relative, sourcePaths: sourceFiles.map((file) => repoPath(repoRoot, file)), sourceHash: contentHash(sourceFiles.map(fileHash).join('')), summary: `地图目录 ${relative}`, summarySource: 'structured-fields', indexVersion: 1 } }).sort((a, b) => a.id.localeCompare(b.id))
  const events = recordsFromJsonFiles(repoRoot, files.filter((file) => path.basename(file) === 'events.json'), 'event', ['eventId', 'id', 'key'])
  const dialogues = recordsFromJsonFiles(repoRoot, files.filter((file) => path.basename(file) === 'dialogues.json'), 'dialogue', ['dialogueId', 'id', 'key'])
  const fictionFiles = walkFiles(path.join(repoRoot, 'src/game/data/interactive_fictions'), { extensions: ['.json', '.ts'] })
  const interactiveFictions = [...new Set(fictionFiles.map((file) => repoPath(repoRoot, path.dirname(file))))].map((sourcePath) => ({ id: path.basename(sourcePath), type: 'interactive-fiction', title: path.basename(sourcePath), sourcePath, summary: `互动小说目录 ${sourcePath}`, summarySource: 'structured-fields', indexVersion: 1 }))
  const registryFiles = [path.join(repoRoot, 'src/game/data/registry.ts'), path.join(repoRoot, 'src/game/data/interactive_fictions/registry.ts')].filter(fs.existsSync)
  const registries = registryFiles.map((file) => ({ id: repoPath(repoRoot, file), type: 'registry', title: path.basename(file), sourcePath: repoPath(repoRoot, file), sourceHash: fileHash(file), summary: '游戏内容注册入口', summarySource: 'structured-fields', indexVersion: 1 }))
  return { maps, events, dialogues, interactiveFictions, registries, sources: [...files, ...fictionFiles, ...registryFiles] }
}

export function indexCode(repoRoot) {
  const root = path.join(repoRoot, 'src/game'); const files = walkFiles(root, { extensions: ['.js', '.ts', '.vue'] })
  const records = files.map((file) => { const sourcePath = repoPath(repoRoot, file); const text = fs.readFileSync(file, 'utf8'); const imports = [...text.matchAll(/(?:from\s+|import\s*\()['"]([^'"]+)['"]/g)].map((match) => match[1]).slice(0, 30); let subtype = 'module'; if (sourcePath.includes('/scenes/')) subtype = 'phaser-scene'; else if (sourcePath.includes('/systems/')) subtype = 'phaser-system'; else if (sourcePath.includes('/stores/')) subtype = 'pinia-store'; else if (file.endsWith('.vue')) subtype = 'vue'; return { id: sourcePath, type: 'code-module', subtype, title: path.basename(file), sourcePath, sourceHash: contentHash(text), summary: `${subtype}：${sourcePath}`, summarySource: 'structured-fields', references: imports.length ? { imports } : {}, indexVersion: 1 } })
  return { records, sources: files }
}

export function indexAssets(repoRoot) {
  const root = path.join(repoRoot, 'src/assets/game'); const files = walkFiles(root)
  const records = files.map((file) => { const sourcePath = repoPath(repoRoot, file); return { id: sourcePath, type: 'asset', assetType: path.extname(file).slice(1).toLowerCase() || 'unknown', title: path.basename(file), sourcePath, sourceHash: fileHash(file), size: fs.statSync(file).size, status: sourcePath.includes('/candidates/') ? 'candidate' : 'runtime', summary: path.basename(file), summarySource: 'title-only', indexVersion: 1 } })
  return { records, sources: files }
}

export function indexDocs(repoRoot) {
  const files = walkFiles(path.join(repoRoot, 'docs'), { extensions: ['.md'] })
  const records = files.map((file) => { const sourcePath = repoPath(repoRoot, file); const text = fs.readFileSync(file, 'utf8'); const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(file, '.md'); let subtype = 'other'; if (sourcePath.includes('系统说明/')) subtype = 'system'; else if (sourcePath.includes('技能说明/')) subtype = 'skill'; else if (sourcePath.includes('智能体说明/')) subtype = 'agent'; else if (sourcePath.includes('功能更新/')) subtype = 'update'; return { id: sourcePath, type: 'document', subtype, title: heading, sourcePath, sourceHash: contentHash(text), summary: heading, summarySource: 'title-only', indexVersion: 1 } })
  return { records, sources: files }
}
