/**
 * Suggest related audit assets that should be co-reviewed when one item changes.
 * Does not merge stores; only surfaces cross-channel neighbors.
 */
import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadJson, ARTICLE_REGISTRY_PATH, toPosix, repoPath } from './registry.mjs'
import {
  CONCEPT_REGISTRY_MODULE,
  PLOT_CATALOG_PATH,
  RAG_CARDS_DIR,
  ROOT,
} from './paths.mjs'
import { assertAuditChannel } from './channels.mjs'

function uniqueByKey(items, keyFn) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

async function walkCardFiles() {
  const absoluteRoot = repoPath(RAG_CARDS_DIR)
  const files = []
  async function walk(dir) {
    let entries = []
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(absolute)
      else if (entry.name.endsWith('.json')) files.push(absolute)
    }
  }
  await walk(absoluteRoot)
  return files
}

async function loadAllCards() {
  const files = await walkCardFiles()
  const cards = []
  for (const absolute of files) {
    try {
      const card = JSON.parse(await readFile(absolute, 'utf8'))
      if (card?.cardId) cards.push({ ...card, _path: toPosix(absolute) })
    } catch {
      // skip
    }
  }
  return cards
}

async function loadConcepts() {
  const moduleUrl = pathToFileURL(path.join(ROOT, CONCEPT_REGISTRY_MODULE)).href
  const { SEEDED_CONCEPTS } = await import(moduleUrl)
  return SEEDED_CONCEPTS ?? []
}

function labelMatch(left, right) {
  const a = String(left ?? '')
    .trim()
    .toLocaleLowerCase('zh-CN')
  const b = String(right ?? '')
    .trim()
    .toLocaleLowerCase('zh-CN')
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)))
}

function pushRelated(list, partial) {
  list.push({
    channel: partial.channel,
    assetId: partial.assetId,
    title: partial.title ?? partial.assetId,
    path: partial.path ?? '',
    relation: partial.relation ?? 'related',
    action: partial.action ?? 'needed',
    note: partial.note ?? '修正主条目时请一并检查；有需要则同步调整',
  })
}

export async function suggestRelatedAssets({ channel, assetId, limit = 12 } = {}) {
  assertAuditChannel(channel)
  if (!assetId) throw new Error('需要 assetId')

  const related = []
  const [cards, concepts, plotCatalog, articles] = await Promise.all([
    loadAllCards(),
    loadConcepts(),
    loadJson(PLOT_CATALOG_PATH, { entries: [] }),
    loadJson(ARTICLE_REGISTRY_PATH, { articles: [] }),
  ])
  const plots = plotCatalog.entries ?? []

  if (channel === 'concept') {
    const concept = concepts.find((c) => c.conceptId === assetId)
    if (!concept) return { channel, assetId, items: [] }
    const names = [concept.canonicalName, ...(concept.aliases ?? [])]
    for (const parentId of concept.parentConcepts ?? []) {
      const parent = concepts.find((c) => c.conceptId === parentId)
      if (parent) {
        pushRelated(related, {
          channel: 'concept',
          assetId: parent.conceptId,
          title: parent.canonicalName,
          path: CONCEPT_REGISTRY_MODULE,
          relation: 'parent',
        })
      }
    }
    for (const child of concepts) {
      if ((child.parentConcepts ?? []).includes(concept.conceptId)) {
        pushRelated(related, {
          channel: 'concept',
          assetId: child.conceptId,
          title: child.canonicalName,
          path: CONCEPT_REGISTRY_MODULE,
          relation: 'child',
        })
      }
    }
    for (const card of cards) {
      const cardLabels = [card.title, ...(card.aliases ?? []), ...(card.concepts ?? [])]
      if (names.some((name) => cardLabels.some((label) => labelMatch(name, label)))) {
        pushRelated(related, {
          channel: 'rag',
          assetId: card.cardId,
          title: card.title,
          path: card._path,
          relation: 'explains',
        })
      }
    }
    for (const plot of plots) {
      const tags = [...(plot.tags ?? []), ...(plot.bondageTags ?? [])]
      if (names.some((name) => tags.some((tag) => labelMatch(name, tag)))) {
        pushRelated(related, {
          channel: 'plot',
          assetId: plot.id,
          title: plot.title,
          path: PLOT_CATALOG_PATH,
          relation: 'tagged_with',
        })
      }
    }
  }

  if (channel === 'rag') {
    const card = cards.find((c) => c.cardId === assetId)
    if (card) {
      const labels = [card.title, ...(card.aliases ?? []), ...(card.concepts ?? [])]
      for (const concept of concepts) {
        const names = [concept.canonicalName, ...(concept.aliases ?? [])]
        if (names.some((name) => labels.some((label) => labelMatch(name, label)))) {
          pushRelated(related, {
            channel: 'concept',
            assetId: concept.conceptId,
            title: concept.canonicalName,
            path: CONCEPT_REGISTRY_MODULE,
            relation: 'explains',
          })
        }
      }
      for (const plot of plots) {
        const tags = [...(plot.tags ?? []), ...(plot.bondageTags ?? [])]
        if (labels.some((label) => tags.some((tag) => labelMatch(label, tag)))) {
          pushRelated(related, {
            channel: 'plot',
            assetId: plot.id,
            title: plot.title,
            path: PLOT_CATALOG_PATH,
            relation: 'tagged_with',
          })
        }
      }
      for (const ref of card.sourceRefs ?? []) {
        if (ref.sourceId || ref.sourcePath) {
          pushRelated(related, {
            channel: 'rag',
            assetId: ref.sourceId || ref.sourcePath,
            title: ref.sourcePath || ref.sourceId,
            path: ref.sourcePath || '',
            relation: 'sourced_from',
            note: '核对证据段是否仍支撑定义；一般不改正文',
          })
        }
      }
    }
  }

  if (channel === 'plot') {
    const plot = plots.find((p) => p.id === assetId)
    if (plot) {
      const tags = [...(plot.tags ?? []), ...(plot.bondageTags ?? [])]
      for (const concept of concepts) {
        const names = [concept.canonicalName, ...(concept.aliases ?? [])]
        if (names.some((name) => tags.some((tag) => labelMatch(name, tag)))) {
          pushRelated(related, {
            channel: 'concept',
            assetId: concept.conceptId,
            title: concept.canonicalName,
            path: CONCEPT_REGISTRY_MODULE,
            relation: 'tagged_with',
          })
        }
      }
      for (const card of cards) {
        const labels = [card.title, ...(card.aliases ?? []), ...(card.concepts ?? []), ...(card.tags ?? [])]
        if (tags.some((tag) => labels.some((label) => labelMatch(tag, label)))) {
          pushRelated(related, {
            channel: 'rag',
            assetId: card.cardId,
            title: card.title,
            path: card._path,
            relation: 'tagged_with',
          })
        }
      }
      for (const used of plot.usedBy ?? []) {
        pushRelated(related, {
          channel: 'plot',
          assetId: String(used.key || used.id || used),
          title: String(used.title || used.key || used),
          path: 'story-outline',
          relation: 'used_by',
          note: '情节被故事节点引用时，确认标签/摘要改动不会误导安置',
        })
      }
    }
  }

  if (channel === 'style-rag') {
    const article = (articles.articles ?? []).find((a) => a.articleId === assetId)
    if (article) {
      const domain = article.themeDomainOverride || article.themeDomain
      if (domain) {
        pushRelated(related, {
          channel: 'style-rag',
          assetId: `themeDomains:${domain}`,
          title: domain,
          path: ARTICLE_REGISTRY_PATH,
          relation: 'themeDomain',
          note: '同域文章权重/分类是否也需复查（抽样即可，不必全改）',
        })
      }
      if (article.author?.authorId) {
        pushRelated(related, {
          channel: 'style-rag',
          assetId: article.author.authorId,
          title: article.author.displayName || article.author.authorId,
          path: 'docs/写作资产/外部风格研究/author-registry.json',
          relation: 'author',
          note: '作者先验是否与本篇评分一致',
        })
      }
    }
  }

  const items = uniqueByKey(related, (item) => `${item.channel}:${item.assetId}`).slice(0, limit)
  return {
    channel,
    assetId,
    count: items.length,
    items,
    rule: '改一处时必须检查关联项；有需要补充或调整的，与主条目一并处理，禁止只改单点留下矛盾。',
  }
}

export function mergeRelatedAdjustments(suggested, provided = []) {
  const byKey = new Map()
  for (const item of suggested?.items ?? []) {
    byKey.set(`${item.channel}:${item.assetId}`, { ...item })
  }
  for (const item of provided) {
    if (!item?.channel || !item?.assetId) continue
    const key = `${item.channel}:${item.assetId}`
    byKey.set(key, {
      ...(byKey.get(key) ?? {}),
      ...item,
      action: item.action ?? byKey.get(key)?.action ?? 'needed',
    })
  }
  return [...byKey.values()]
}
