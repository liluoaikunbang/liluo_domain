import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  AUDIT_BATCHES,
  AUDIT_CATEGORIES_PATH,
  AUDIT_POLICY_PATH,
  AUDIT_RECORDS_RAG,
  AUDIT_RECORDS_STYLE,
  AUDIT_RECORDS_CONCEPT,
  AUDIT_RECORDS_PLOT,
  AUDIT_REGISTRY_PATH,
  HIT_STATS_PATH,
  ARTICLE_REGISTRY_PATH,
  repoPath,
  toPosix,
} from './paths.mjs'
import { AUDIT_CHANNELS } from './channels.mjs'

const RECORD_DIRS = {
  rag: AUDIT_RECORDS_RAG,
  'style-rag': AUDIT_RECORDS_STYLE,
  concept: AUDIT_RECORDS_CONCEPT,
  plot: AUDIT_RECORDS_PLOT,
}

export async function loadJson(rel, fallback = null) {
  try {
    return JSON.parse(await readFile(repoPath(rel), 'utf8'))
  } catch {
    return fallback
  }
}

export async function saveJson(rel, data) {
  await mkdir(path.dirname(repoPath(rel)), { recursive: true })
  await writeFile(repoPath(rel), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

export async function loadPolicy() {
  return loadJson(AUDIT_POLICY_PATH)
}

export async function loadCategories() {
  return loadJson(AUDIT_CATEGORIES_PATH)
}

export async function loadAuditRegistry() {
  return (
    (await loadJson(AUDIT_REGISTRY_PATH)) ?? {
      schemaVersion: 1,
      updatedAt: null,
      counts: emptyCounts(),
      records: [],
      patternGroups: [],
    }
  )
}

export function emptyCounts() {
  return {
    total: 0,
    open: 0,
    rag: 0,
    styleRag: 0,
    concept: 0,
    plot: 0,
    needsRebuild: 0,
    skillUpgradeSuggested: 0,
  }
}

export function computeCounts(records) {
  const counts = emptyCounts()
  counts.total = records.length
  for (const item of records) {
    if (['open', 'recorded', 'awaiting-skill-decision', 'rebuild-pending'].includes(item.fixStatus)) {
      counts.open += 1
    }
    if (item.channel === 'rag') counts.rag += 1
    if (item.channel === 'style-rag') counts.styleRag += 1
    if (item.channel === 'concept') counts.concept += 1
    if (item.channel === 'plot') counts.plot += 1
    if (item.needsIndexRebuild) counts.needsRebuild += 1
    if (item.skillUpgradeDecision?.suggested) counts.skillUpgradeSuggested += 1
  }
  return counts
}

export function makeAuditId(seed = '') {
  const digest = createHash('sha256')
    .update(`${Date.now()}:${seed}:${Math.random()}`)
    .digest('hex')
    .slice(0, 10)
  return `ra-${digest}`
}

export function validateCategories(channel, categories, catalog) {
  const allowed = new Set([
    ...(catalog.categories?.[channel] ?? []),
    ...(catalog.categories?.shared ?? []),
  ])
  const bad = categories.filter((c) => !allowed.has(c))
  return { ok: bad.length === 0, bad, allowed: [...allowed] }
}

export async function listRecordFiles(channel) {
  const dir = RECORD_DIRS[channel]
  if (!dir) return []
  try {
    const names = await readdir(repoPath(dir))
    return names.filter((n) => n.endsWith('.json')).map((n) => `${dir}/${n}`)
  } catch {
    return []
  }
}

export async function loadAllAuditRecords() {
  const files = []
  for (const channel of AUDIT_CHANNELS) {
    files.push(...(await listRecordFiles(channel)))
  }
  const records = []
  for (const file of files) {
    const data = await loadJson(file)
    if (data?.auditId) records.push({ ...data, _path: file })
  }
  return records.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
}

export async function saveAuditRecord(record) {
  const dir = RECORD_DIRS[record.channel]
  if (!dir) throw new Error(`未知 channel，无法落盘：${record.channel}`)
  const file = `${dir}/${record.auditId}.json`
  const { _path, ...clean } = record
  clean.updatedAt = new Date().toISOString()
  await saveJson(file, clean)
  return { path: file, record: clean }
}

export async function refreshRegistryFromDisk() {
  const records = await loadAllAuditRecords()
  const policy = await loadPolicy()
  const patternGroups = buildPatternGroups(records, policy)
  const slim = records.map((r) => ({
    auditId: r.auditId,
    channel: r.channel,
    sourceAssetId: r.sourceAssetId,
    issueCategories: r.issueCategories,
    fixStatus: r.fixStatus,
    needsIndexRebuild: r.needsIndexRebuild,
    mayBecomeGeneralRule: r.mayBecomeGeneralRule,
    skillUpgradeSuggested: Boolean(r.skillUpgradeDecision?.suggested),
    path: r._path ?? null,
  }))
  const registry = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    counts: computeCounts(records),
    records: slim,
    patternGroups,
  }
  await saveJson(AUDIT_REGISTRY_PATH, registry)
  return registry
}

export function buildPatternGroups(records, policy) {
  const minN = policy?.skillUpgrade?.minIndependentRecordsForPattern ?? 3
  const buckets = new Map()
  for (const record of records) {
    if (!record.mayBecomeGeneralRule && !record.skillUpgradeDecision?.userExplicitRuleRequest) continue
    for (const category of record.issueCategories ?? []) {
      const key = `${record.channel}|${category}`
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(record)
    }
  }
  const groups = []
  for (const [key, items] of buckets.entries()) {
    const [channel, category] = key.split('|')
    const uniqueSources = new Set(items.map((i) => i.sourceAssetId))
    const independentCount = uniqueSources.size
    const suggested =
      independentCount >= minN ||
      items.some((i) => i.skillUpgradeDecision?.userExplicitRuleRequest) ||
      items.some((i) =>
        (policy?.skillUpgrade?.criticalCategories ?? []).some((c) => (i.issueCategories ?? []).includes(c)),
      )
    groups.push({
      patternGroupId: `pg-${createHash('sha256').update(key).digest('hex').slice(0, 8)}`,
      category,
      channel,
      auditIds: items.map((i) => i.auditId),
      independentCount,
      skillUpgradeSuggested: suggested,
      abstractRuleDraft: suggested
        ? `抽象规则候选：针对 ${category}（${channel}），勿写单篇补丁；需错误例/正确例/可验证规则。`
        : '',
    })
  }
  return groups.sort((a, b) => b.independentCount - a.independentCount)
}

export async function loadHitStats() {
  return (
    (await loadJson(HIT_STATS_PATH)) ?? {
      schemaVersion: 1,
      updatedAt: null,
      hits: {},
    }
  )
}

export async function recordHit(assetId) {
  const stats = await loadHitStats()
  stats.hits[assetId] = (stats.hits[assetId] ?? 0) + 1
  stats.updatedAt = new Date().toISOString()
  await saveJson(HIT_STATS_PATH, stats)
  return stats.hits[assetId]
}

export { AUDIT_BATCHES, ARTICLE_REGISTRY_PATH, toPosix, repoPath }
