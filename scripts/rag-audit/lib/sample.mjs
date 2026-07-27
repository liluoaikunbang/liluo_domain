import { createHash } from 'node:crypto'
import path from 'node:path'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import {
  loadAuditRegistry,
  loadHitStats,
  loadJson,
  loadPolicy,
  saveJson,
  ARTICLE_REGISTRY_PATH,
  AUDIT_BATCHES,
  repoPath,
  toPosix,
} from './registry.mjs'
import {
  AUDIT_CHANNELS,
  AUDIT_CHANNEL_LABELS,
  assertAuditChannel,
} from './channels.mjs'
import {
  CONCEPT_REGISTRY_MODULE,
  PLOT_CATALOG_PATH,
  RAG_CARDS_DIR,
  ROOT,
} from './paths.mjs'

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function seedFrom(text) {
  const hex = createHash('sha256').update(String(text)).digest('hex').slice(0, 8)
  return Number.parseInt(hex, 16)
}

async function walkJsonFiles(relDir) {
  const absolute = repoPath(relDir)
  const files = []
  async function walk(dir) {
    let entries = []
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(absolutePath)
      else if (entry.name.endsWith('.json')) files.push(absolutePath)
    }
  }
  await walk(absolute)
  return files
}

async function loadStyleCandidates() {
  const registry = await loadJson(ARTICLE_REGISTRY_PATH, { articles: [] })
  return (registry.articles ?? []).map((a) => ({
    channel: 'style-rag',
    assetId: a.articleId,
    path: a.path,
    title: a.title?.value ?? 'unknown',
    author: a.author?.displayName ?? 'unknown',
    themeDomain: a.themeDomainOverride ?? a.themeDomain,
    confidence: {
      title: a.title?.confidence ?? 'unknown',
      author: a.author?.confidence ?? 'unknown',
    },
    reviewStatus: a.review?.status ?? 'unreviewed',
    lowConfidence:
      a.title?.confidence === 'low' ||
      a.title?.confidence === 'unknown' ||
      a.author?.confidence === 'low' ||
      a.author?.confidence === 'unknown' ||
      a.author?.displayName === 'unknown',
    currentResult: {
      themeDomain: a.themeDomainOverride ?? a.themeDomain,
      review: a.review,
      productionUse: a.productionUse,
      title: a.title,
      author: a.author,
    },
  }))
}

function truncateText(value, max = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function resolveRagAssetKinds(options = {}, policy = {}) {
  const rawKinds = [].concat(options.assetKind ?? options.assetKinds ?? []).flat().filter(Boolean)
  const normalized = rawKinds
    .flatMap((token) => String(token).split(','))
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
  if (normalized.includes('all')) return { includeCards: true, includeSources: true }
  if (normalized.length) {
    return {
      includeCards: normalized.includes('card'),
      includeSources: normalized.includes('source'),
    }
  }
  if (options.includeSources === true) {
    return { includeCards: true, includeSources: true }
  }
  const defaults = policy?.ragSample?.defaultAssetKinds ?? ['card']
  return {
    includeCards: defaults.includes('card'),
    includeSources: defaults.includes('source'),
  }
}

async function loadRagCardCandidates() {
  const files = await walkJsonFiles(RAG_CARDS_DIR)
  const items = []
  for (const absolute of files) {
    const card = JSON.parse(await readFile(absolute, 'utf8'))
    if (!card?.cardId) continue
    const rel = toPosix(absolute)
    items.push({
      channel: 'rag',
      assetId: card.cardId,
      path: rel,
      title: card.title ?? card.cardId,
      author: 'card',
      themeDomain: 'unknown',
      confidence: {
        title: card.title ? 'high' : 'unknown',
        author: 'n/a',
      },
      reviewStatus: card.reviewStatus ?? 'candidate',
      lowConfidence:
        !card.definition ||
        !Array.isArray(card.sourceRefs) ||
        card.sourceRefs.length === 0 ||
        card.reviewStatus === 'candidate',
      currentResult: {
        assetKind: 'card',
        cardType: card.cardType,
        definition: card.definition ?? '',
        distinctions: card.distinctions ?? [],
        concepts: card.concepts ?? [],
        prerequisites: card.prerequisites ?? [],
        progression: card.progression ?? [],
        tags: card.tags ?? [],
        reviewStatus: card.reviewStatus,
        sourceRefCount: Array.isArray(card.sourceRefs) ? card.sourceRefs.length : 0,
        knowledgeScope: card.knowledgeScope,
        canonical: Boolean(card.canonical),
      },
    })
  }
  return items
}

async function loadRagSourceCandidates() {
  const catalog = await loadJson('external-knowledge/catalog/sources.json', [])
  const items = []
  for (const source of catalog) {
    const rel = source.relativePath ?? source.path ?? ''
    const themeDomain = rel.includes('fiction-bondage')
      ? 'restraint-themed'
      : rel.includes('zhihu-novels')
        ? 'general-prose'
        : 'unknown'
    items.push({
      channel: 'rag',
      assetId: source.sourceId ?? `src-${toPosix(rel)}`,
      path: toPosix(rel),
      title: source.title ?? path.basename(rel),
      author: source.author ?? 'unknown',
      themeDomain,
      confidence: {
        title: source.title ? 'medium' : 'unknown',
        author: source.author ? 'medium' : 'unknown',
      },
      reviewStatus: source.reviewStatus ?? 'unreviewed',
      lowConfidence: !source.author || source.author === 'unknown' || !source.title,
      currentResult: {
        assetKind: 'source',
        sourceId: source.sourceId,
        tags: source.tags ?? [],
        title: source.title ?? null,
        author: source.author ?? null,
        knowledgeScope: 'external-fiction-reference',
        canonical: false,
      },
    })
  }
  return items
}

async function loadRagCandidates(options = {}, policy = {}) {
  const { includeCards, includeSources } = resolveRagAssetKinds(options, policy)
  const loaders = []
  if (includeCards) loaders.push(loadRagCardCandidates())
  if (includeSources) loaders.push(loadRagSourceCandidates())
  if (!loaders.length) return loadRagCardCandidates()
  const parts = await Promise.all(loaders)
  return parts.flat()
}

async function loadConceptCandidates() {
  const moduleUrl = pathToFileURL(path.join(ROOT, CONCEPT_REGISTRY_MODULE)).href
  const { SEEDED_CONCEPTS } = await import(moduleUrl)
  return (SEEDED_CONCEPTS ?? []).map((concept) => {
    const missingRag = concept.visibility?.ragRetrievable === true
    return {
      channel: 'concept',
      assetId: concept.conceptId,
      path: CONCEPT_REGISTRY_MODULE,
      title: concept.canonicalName,
      author: 'seed',
      themeDomain: 'restraint-themed',
      confidence: {
        title: 'high',
        author: 'n/a',
      },
      reviewStatus: 'seeded',
      lowConfidence:
        missingRag ||
        !concept.summary ||
        (concept.aliases ?? []).length === 0 ||
        concept.visibility?.primaryTag === false,
      currentResult: {
        assetKind: 'concept',
        conceptId: concept.conceptId,
        canonicalName: concept.canonicalName,
        aliases: concept.aliases ?? [],
        parentConcepts: concept.parentConcepts ?? [],
        visibility: concept.visibility,
        summary: concept.summary ?? '',
      },
    }
  })
}

async function loadPlotCandidates() {
  const catalog = await loadJson(PLOT_CATALOG_PATH, { entries: [] })
  return (catalog.entries ?? []).map((entry) => {
    const tags = entry.tags ?? []
    const bondageTags = entry.bondageTags ?? []
    return {
      channel: 'plot',
      assetId: entry.id,
      path: PLOT_CATALOG_PATH,
      title: entry.title ?? entry.id,
      author: 'plot-catalog',
      themeDomain: bondageTags.length ? 'restraint-themed' : 'general-prose',
      confidence: {
        title: entry.title ? 'high' : 'unknown',
        author: 'n/a',
      },
      reviewStatus: entry.usedBy?.length ? 'linked' : 'unlinked',
      lowConfidence:
        !entry.summary ||
        String(entry.summary).trim().length < 8 ||
        (!tags.length && !bondageTags.length) ||
        !(entry.usedBy?.length),
      currentResult: {
        assetKind: 'plot',
        id: entry.id,
        title: entry.title,
        summary: entry.summary ?? '',
        groupId: entry.groupId ?? '',
        tags,
        bondageTags,
        characters: entry.characters ?? [],
        usedBy: entry.usedBy ?? [],
      },
    }
  })
}

async function loadCandidatesForChannel(channel, options = {}, policy = {}) {
  if (channel === 'style-rag') return loadStyleCandidates()
  if (channel === 'concept') return loadConceptCandidates()
  if (channel === 'plot') return loadPlotCandidates()
  return loadRagCandidates(options, policy)
}

function alreadyAuditedIds(registry, channel) {
  return new Set(
    (registry.records ?? [])
      .filter((r) => (channel === 'all' ? true : r.channel === channel) && r.fixStatus !== 'wont-fix')
      .map((r) => `${r.channel}:${r.sourceAssetId}`),
  )
}

function scorePool(pool, mode, options, hitStats) {
  const scored = pool.map((item) => {
    let priority = 0
    if (mode === 'low-confidence' || mode === 'unknown-fields') {
      if (item.lowConfidence) priority += 100
      if (item.author === 'unknown') priority += 40
      if (item.channel === 'concept' && item.currentResult?.visibility?.ragRetrievable) priority += 20
      if (item.channel === 'plot' && !(item.currentResult?.usedBy?.length)) priority += 25
      if (item.channel === 'rag' && item.currentResult?.assetKind === 'card') priority += 15
    }
    if (mode === 'hit-frequency') {
      priority += (hitStats.hits?.[item.assetId] ?? 0) * 10
    }
    if (mode === 'unreviewed' && (item.reviewStatus === 'unreviewed' || item.reviewStatus === 'candidate')) {
      priority += 50
    }
    if (mode === 'theme-domain' && options.theme && item.themeDomain === options.theme) priority += 30
    if (mode === 'graph-gap') {
      if (item.channel === 'concept' && item.currentResult?.visibility?.ragRetrievable) priority += 80
      if (item.channel === 'plot' && !(item.currentResult?.usedBy?.length)) priority += 70
      if (item.channel === 'rag' && item.currentResult?.assetKind === 'card' && !item.currentResult?.definition) {
        priority += 60
      }
    }
    if (mode === 'random') priority += 1
    priority += seedFrom(item.assetId) % 7
    return { item, priority }
  })

  scored.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return a.item.assetId.localeCompare(b.item.assetId, 'en')
  })
  return scored
}

function selectFromScored(scored, mode, options, batchSize) {
  let selected = scored.map((s) => s.item)
  if (mode === 'random') {
    const rng = mulberry32(seedFrom(options.seed ?? `audit:${Date.now().toString().slice(0, -5)}`))
    for (let i = selected.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1))
      ;[selected[i], selected[j]] = [selected[j], selected[i]]
    }
  }
  return selected.slice(0, batchSize)
}

function filterPool(pool, options, audited) {
  let next = pool
  if (options.excludeAudited !== false) {
    next = next.filter((item) => !audited.has(`${item.channel}:${item.assetId}`))
  }
  if (options.theme) {
    next = next.filter((item) => item.themeDomain === options.theme)
  }
  if (options.author) {
    const key = String(options.author).toLowerCase()
    next = next.filter((item) => String(item.author).toLowerCase().includes(key))
  }
  if (options.sourceFolder || options.source) {
    const folder = String(options.sourceFolder ?? options.source)
    next = next.filter((item) => item.path.includes(folder))
  }
  if (options.unreviewedOnly) {
    next = next.filter(
      (item) => item.reviewStatus === 'unreviewed' || item.reviewStatus === 'candidate' || item.reviewStatus === 'unlinked',
    )
  }
  return next
}

export async function sampleAuditBatch(options = {}) {
  const channel = assertAuditChannel(options.channel, { allowAll: true })
  const policy = await loadPolicy()
  const batchSize = Math.min(
    Number(options.batchSize ?? policy.defaultBatchSize ?? 8) || 8,
    policy.maxBatchSize ?? 20,
  )
  const mode = options.mode ?? 'low-confidence'
  const registry = await loadAuditRegistry()
  const hitStats = await loadHitStats()
  const audited = alreadyAuditedIds(registry, channel)

  let selected = []
  let remainingPool = 0
  const channelsInBatch = channel === 'all' ? [...AUDIT_CHANNELS] : [channel]

  if (channel === 'all') {
    const perChannel = Math.max(1, Math.floor(batchSize / channelsInBatch.length))
    let leftover = batchSize - perChannel * channelsInBatch.length
    for (const ch of channelsInBatch) {
      const take = perChannel + (leftover > 0 ? 1 : 0)
      if (leftover > 0) leftover -= 1
      let pool = filterPool(await loadCandidatesForChannel(ch, options, policy), options, audited)
      const scored = scorePool(pool, mode, options, hitStats)
      remainingPool += Math.max(0, scored.length - take)
      selected.push(...selectFromScored(scored, mode, { ...options, seed: `${options.seed ?? ''}:${ch}` }, take))
    }
    selected = selected.slice(0, batchSize)
  } else {
    let pool = filterPool(await loadCandidatesForChannel(channel, options, policy), options, audited)
    const scored = scorePool(pool, mode, options, hitStats)
    selected = selectFromScored(scored, mode, options, batchSize)
    remainingPool = Math.max(0, scored.length - selected.length)
  }

  const sameTypePeers = await buildSameTypePeerIndex(selected)
  const ragKinds = resolveRagAssetKinds(options, policy)
  const batchId = `rab-${Date.now().toString(36)}`
  const exportedAt = new Date().toISOString()
  const payload = {
    schemaVersion: 1,
    batchId,
    channel,
    channels: channelsInBatch,
    mode,
    exportedAt,
    count: selected.length,
    remainingPool,
    ragSample: {
      includeCards: ragKinds.includeCards,
      includeSources: ragKinds.includeSources,
    },
    items: selected.map((item, index) => {
      const currentResult = { ...(item.currentResult ?? {}) }
      if (currentResult.assetKind === 'card') {
        const peers = sameTypePeers.get(item.assetId) ?? []
        currentResult.sameTypePeers = peers
      }
      return {
        index: index + 1,
        channel: item.channel,
        assetId: item.assetId,
        title: item.title,
        author: item.author,
        themeDomain: item.themeDomain,
        path: item.path,
        lowConfidence: item.lowConfidence,
        hitCount: hitStats.hits?.[item.assetId] ?? 0,
        currentResult,
      }
    }),
  }

  await saveJson(`${AUDIT_BATCHES}/${batchId}.json`, payload)
  const md = renderBatchMarkdown(payload)
  const mdPath = `${AUDIT_BATCHES}/${batchId}.md`
  await mkdir(repoPath(AUDIT_BATCHES), { recursive: true })
  await writeFile(repoPath(mdPath), md, 'utf8')

  return {
    batchId,
    channel,
    channels: channelsInBatch,
    mode,
    count: selected.length,
    remainingPool: payload.remainingPool,
    path: mdPath,
    jsonPath: `${AUDIT_BATCHES}/${batchId}.json`,
    ragSample: payload.ragSample,
    note: ragKinds.includeSources
      ? '仅人工抽查；本批含源条目（--include-sources / --asset-kind）。现有索引可继续使用。'
      : '仅人工抽查；普通 RAG 默认只抽知识卡。源条目请加 --include-sources。现有索引可继续使用。',
  }
}

async function buildSameTypePeerIndex(selected, peerLimit = 6) {
  const cardItems = selected.filter((item) => item.currentResult?.assetKind === 'card')
  const index = new Map()
  if (!cardItems.length) return index
  const allCards = await loadRagCardCandidates()
  for (const item of cardItems) {
    const cardType = item.currentResult?.cardType
    const peers = allCards
      .filter((card) => card.assetId !== item.assetId && card.currentResult?.cardType === cardType)
      .slice(0, peerLimit)
      .map((card) => ({
        assetId: card.assetId,
        title: card.title,
        hasDefinition: Boolean(card.currentResult?.definition),
      }))
    index.set(item.assetId, peers)
  }
  return index
}

function renderBatchMarkdown(payload) {
  const channelLabel =
    payload.channel === 'all'
      ? '综合（RAG / Style-RAG / 细节概念 / 情节）'
      : AUDIT_CHANNEL_LABELS[payload.channel] || payload.channel
  const lines = [
    `# ${channelLabel} 抽查批次 ${payload.batchId}`,
    '',
    `导出时间：${payload.exportedAt}`,
    `模式：${payload.mode}`,
    `通道：${payload.channel}`,
    `本批：${payload.count}（剩余候选约 ${payload.remainingPool}）`,
    '',
    '填写后用对应 `*:audit:record --channel <通道>` 写入；单次错误不会自动升级 Skill。',
    '硬规则：改主条目时必须检查关联项；有需要补充或调整的，与主条目一并处理。可用 `*:audit:related --asset <id>` 列出邻居。',
    '普通 RAG 默认只抽知识卡；需要源条目时加 `--include-sources` 或 `--asset-kind source|all`。',
    '卡审重点：描述是否够用 / 是否有独立存在价值 / 与邻居是否该分层或合并（不必读原文）。',
    '',
  ]
  for (const item of payload.items) {
    const itemChannel = AUDIT_CHANNEL_LABELS[item.channel] || item.channel
    const result = item.currentResult ?? {}
    lines.push(`- [${item.channel}:${item.assetId}] 《${item.title}》｜通道：${itemChannel}｜作者：${item.author}｜域：${item.themeDomain}`)
    lines.push(`  - 路径：${item.path}`)
    lines.push(`  - 低置信度：${item.lowConfidence ? '是' : '否'}｜命中提示：${item.hitCount}`)
    if (result.assetKind === 'card') {
      lines.push(`  - 卡类型：${result.cardType ?? 'unknown'}｜状态：${result.reviewStatus ?? item.reviewStatus ?? 'unknown'}｜来源挂接：${result.sourceRefCount ?? 0}`)
      lines.push(`  - definition：${truncateText(result.definition) || '（缺失）'}`)
      const distinctions = (result.distinctions ?? []).map((d) => truncateText(d, 100)).filter(Boolean)
      lines.push(`  - distinctions：${distinctions.length ? distinctions.join(' / ') : '（无）'}`)
      const concepts = (result.concepts ?? []).map((c) => truncateText(c, 80)).filter(Boolean)
      lines.push(`  - concepts：${concepts.length ? concepts.join(' ｜ ') : '（无）'}`)
      if (!truncateText(result.definition)) {
        const progression = (result.progression ?? []).map((p) => truncateText(p, 80)).filter(Boolean)
        if (progression.length) {
          lines.push(`  - progression（无 definition 时参考）：${progression.join(' → ')}`)
        }
      }
      const peers = result.sameTypePeers ?? []
      if (peers.length) {
        lines.push(
          `  - 同类型邻居：${peers
            .map((p) => `${p.title}${p.hasDefinition ? '' : '（无定义）'}`)
            .join('；')}`,
        )
      } else {
        lines.push('  - 同类型邻居：（无）')
      }
      lines.push('  - 卡审三问：描述是否够用？是否有独立存在价值？与邻居是否该分层/合并？')
    }
    lines.push('  - 问题描述：')
    lines.push('  - 正确结果：')
    lines.push('  - 问题类别（见 categories）：')
    lines.push('  - 是否个例（是/否）：')
    lines.push('  - 是否可能成通用规则（是/否）：')
    lines.push('  - 是否需重建索引/投影（是/否）：')
    lines.push('  - 关联项（必查：概念/RAG/情节/Style 邻居；有需要则一并改）：')
    lines.push('  - 关联处理结果（无需改 / 已同步调整 / 暂缓）：')
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}
