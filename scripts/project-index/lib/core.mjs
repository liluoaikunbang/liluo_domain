import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const toPosix = (value) => value.replaceAll('\\', '/')
export const contentHash = (value) => crypto.createHash('sha256').update(value).digest('hex')
export const fileHash = (file) => contentHash(fs.readFileSync(file))

function scalar(value) {
  const text = value.trim()
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null' || text === '') return text === 'null' ? null : ''
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  return text.replace(/^['"]|['"]$/g, '')
}

export function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n')
  if (!normalized.startsWith('---\n')) return { attributes: {}, body: normalized }
  const end = normalized.indexOf('\n---\n', 4)
  if (end < 0) return { attributes: {}, body: normalized }
  const attributes = {}
  let activeList = null
  for (const line of normalized.slice(4, end).split('\n')) {
    const item = line.match(/^\s+-\s*(.*)$/)
    if (item && activeList) { attributes[activeList].push(scalar(item[1])); continue }
    const pair = line.match(/^([^:#][^:]*):\s*(.*)$/)
    if (!pair) continue
    const key = pair[1].trim()
    if (pair[2].trim() === '') { attributes[key] = []; activeList = key }
    else { attributes[key] = scalar(pair[2]); activeList = null }
  }
  return { attributes, body: normalized.slice(end + 5) }
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]))
}
export const stableJson = (value) => `${JSON.stringify(sortObject(value), null, 2)}\n`

export function shardRecords(records, { maxRecords = 250, prefix = 'part', sortKey = 'id' } = {}) {
  const sorted = [...records].sort((a, b) => String(a[sortKey] ?? a.key ?? '').localeCompare(String(b[sortKey] ?? b.key ?? ''), 'zh-CN'))
  const shards = []
  for (let index = 0; index < sorted.length; index += maxRecords) shards.push({ file: `${prefix}-${String(shards.length + 1).padStart(3, '0')}.json`, records: sorted.slice(index, index + maxRecords) })
  return shards
}

export function compareSourceSnapshot(before = {}, after = {}) {
  const added = Object.keys(after).filter((key) => !(key in before))
  const deleted = Object.keys(before).filter((key) => !(key in after))
  const renamed = []
  for (const from of [...deleted]) { const to = added.find((candidate) => after[candidate] === before[from]); if (to) renamed.push({ from, to }) }
  const renamedFrom = new Set(renamed.map((item) => item.from)); const renamedTo = new Set(renamed.map((item) => item.to))
  return { added: added.filter((item) => !renamedTo.has(item)).sort(), modified: Object.keys(after).filter((key) => key in before && after[key] !== before[key]).sort(), deleted: deleted.filter((item) => !renamedFrom.has(item)).sort(), renamed: renamed.sort((a, b) => a.from.localeCompare(b.from)) }
}

export function walkFiles(root, options = {}) {
  const extensions = options.extensions ? new Set(options.extensions) : null; const excluded = new Set(options.exclude ?? []); const result = []
  const visit = (dir) => { if (!fs.existsSync(dir)) return; for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const full = path.join(dir, entry.name); if (entry.isSymbolicLink()) continue; if (entry.isDirectory()) { if (!excluded.has(entry.name)) visit(full) } else if (!extensions || extensions.has(path.extname(entry.name).toLowerCase())) result.push(full) } }
  visit(root); return result
}
export const repoPath = (repoRoot, file) => toPosix(path.relative(repoRoot, file))
