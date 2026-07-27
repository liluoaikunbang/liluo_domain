import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  STYLE_REVIEW_EXPORT_DIR,
  EXTERNAL_ARTICLE_REGISTRY_PATH,
  repoPath,
} from './paths.mjs'
import { loadArticleRegistry, saveArticleRegistry, getEffectiveThemeDomain } from './external-inventory.mjs'
import {
  loadAuthorRegistry,
  saveAuthorRegistry,
  rebuildAuthorRegistry,
  makeAuthorId,
  applyAuthorPrior,
} from './external-author-registry.mjs'
import { normalizeComparableAuthor } from './external-metadata.mjs'

const SCORE_FIELDS = [
  'overallWeight',
  'writingQuality',
  'liluoSuitability',
  'restraintWritingQuality',
  'dialogueQuality',
  'actionSpatialQuality',
  'atmosphereQuality',
]

function assertScore(value, field) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 5) {
    throw new Error(`${field} 必须是 0–5 整数，收到：${value}`)
  }
  return n
}

export function filterArticlesForReview(articles, options = {}) {
  let list = [...articles]
  if (options.unreviewedOnly !== false) {
    list = list.filter((a) => a.review?.status === 'unreviewed')
  }
  if (options.theme) {
    const theme = String(options.theme)
    list = list.filter((a) => getEffectiveThemeDomain(a) === theme)
  }
  if (options.author) {
    const key = normalizeComparableAuthor(options.author)
    list = list.filter((a) => normalizeComparableAuthor(a.author?.displayName) === key)
  }
  if (options.sourceId) {
    list = list.filter((a) => a.sourceId === options.sourceId)
  }
  list.sort((a, b) => a.path.localeCompare(b.path, 'en'))
  const batchSize = Math.min(Number(options.batchSize ?? 30) || 30, 30)
  return list.slice(0, batchSize)
}

export function renderReviewMarkdown(articles, meta = {}) {
  const lines = [
    `# 外部文章评审批次 ${meta.batchId ?? ''}`.trim(),
    '',
    `导出时间：${meta.exportedAt ?? new Date().toISOString()}`,
    `本批数量：${articles.length}（默认不超过 30）`,
    '',
    '填写说明：参考权重 0–5 必填即可完成快速评审；其余分项可选。填写后运行 `npm run writing:external:review:import -- --input <本文件或对应 json>`。',
    '',
  ]
  for (const article of articles) {
    const domainLabel =
      getEffectiveThemeDomain(article) === 'restraint-themed'
        ? '紧缚'
        : getEffectiveThemeDomain(article) === 'general-prose'
          ? '非紧缚'
          : getEffectiveThemeDomain(article)
    lines.push(
      `- [${article.articleId}] 《${article.title?.value ?? 'unknown'}》｜作者：${article.author?.displayName ?? 'unknown'}｜分类：${domainLabel}`,
    )
    lines.push(`  - 路径：${article.path}`)
    lines.push(
      `  - 元数据置信度：标题 ${article.title?.confidence ?? 'unknown'} / 作者 ${article.author?.confidence ?? 'unknown'}`,
    )
    lines.push('  - 参考权重（0–5）：')
    lines.push('  - 适合璃落（0–5，可选）：')
    if (getEffectiveThemeDomain(article) === 'restraint-themed' || getEffectiveThemeDomain(article) === 'mixed') {
      lines.push('  - 紧缚描写（0–5，可选）：')
    }
    if (!article.author?.displayName || article.author.displayName === 'unknown') {
      lines.push('  - 作者补充：')
    }
    lines.push('  - 备注：')
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

export function renderReviewCsv(articles) {
  const header = [
    'articleId',
    'title',
    'author',
    'themeDomain',
    'path',
    'titleConfidence',
    'authorConfidence',
    'overallWeight',
    'liluoSuitability',
    'restraintWritingQuality',
    'notes',
  ]
  const rows = [header.join(',')]
  for (const article of articles) {
    const cols = [
      article.articleId,
      csvEscape(article.title?.value ?? ''),
      csvEscape(article.author?.displayName ?? ''),
      getEffectiveThemeDomain(article),
      csvEscape(article.path),
      article.title?.confidence ?? '',
      article.author?.confidence ?? '',
      '',
      '',
      '',
      '',
    ]
    rows.push(cols.join(','))
  }
  return `${rows.join('\n')}\n`
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export async function exportReviewBatch(options = {}) {
  const registry = await loadArticleRegistry()
  const articles = filterArticlesForReview(registry.articles, options)
  const batchId = `erb-${Date.now().toString(36)}`
  const exportedAt = new Date().toISOString()
  const format = options.format ?? 'markdown'
  const payload = {
    schemaVersion: 1,
    batchId,
    exportedAt,
    filters: {
      unreviewedOnly: options.unreviewedOnly !== false,
      theme: options.theme ?? null,
      author: options.author ?? null,
      sourceId: options.sourceId ?? null,
      batchSize: Math.min(Number(options.batchSize ?? 30) || 30, 30),
    },
    articles: articles.map((a) => ({
      articleId: a.articleId,
      title: a.title?.value ?? 'unknown',
      author: a.author?.displayName ?? 'unknown',
      themeDomain: getEffectiveThemeDomain(a),
      path: a.path,
      overallWeight: null,
      writingQuality: null,
      liluoSuitability: null,
      restraintWritingQuality: null,
      dialogueQuality: null,
      actionSpatialQuality: null,
      atmosphereQuality: null,
      authorSupplement: null,
      notes: '',
      deferred: false,
    })),
  }

  await mkdir(repoPath(STYLE_REVIEW_EXPORT_DIR), { recursive: true })
  const jsonPath = path.join(STYLE_REVIEW_EXPORT_DIR, `${batchId}.json`)
  await writeFile(repoPath(jsonPath), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  let outPath = jsonPath
  if (format === 'markdown' || format === 'md') {
    outPath = path.join(STYLE_REVIEW_EXPORT_DIR, `${batchId}.md`)
    await writeFile(repoPath(outPath), renderReviewMarkdown(articles, { batchId, exportedAt }), 'utf8')
  } else if (format === 'csv') {
    outPath = path.join(STYLE_REVIEW_EXPORT_DIR, `${batchId}.csv`)
    await writeFile(repoPath(outPath), renderReviewCsv(articles), 'utf8')
  }

  return {
    batchId,
    count: articles.length,
    path: outPath,
    jsonPath,
    remainingUnreviewed: registry.articles.filter((a) => a.review?.status === 'unreviewed').length - articles.length,
  }
}

function parseMarkdownReviews(text) {
  const blocks = text.split(/\n(?=- \[ea-)/)
  const updates = []
  for (const block of blocks) {
    const idMatch = block.match(/^-? \[?(ea-[a-f0-9]+)\]?/i)
    if (!idMatch) continue
    const articleId = idMatch[1]
    const get = (label) => {
      const m = block.match(new RegExp(`${label}[：:]\\s*([^\\n]*)`))
      if (!m) return null
      const raw = m[1].trim()
      return raw === '' ? null : raw
    }
    updates.push({
      articleId,
      overallWeight: get('参考权重（0–5）') ?? get('参考权重'),
      liluoSuitability: get('适合璃落（0–5，可选）') ?? get('适合璃落'),
      restraintWritingQuality: get('紧缚描写（0–5，可选）') ?? get('紧缚描写'),
      authorSupplement: get('作者补充'),
      notes: get('备注') ?? '',
      deferred: /暂缓|deferred/i.test(get('备注') ?? ''),
    })
  }
  return updates
}

export async function importReviewBatch(inputPath, options = {}) {
  const abs = path.isAbsolute(inputPath) ? inputPath : repoPath(inputPath)
  const text = await readFile(abs, 'utf8')
  let updates = []
  if (abs.endsWith('.json')) {
    const data = JSON.parse(text)
    updates = data.articles ?? data.updates ?? []
  } else if (abs.endsWith('.md') || abs.endsWith('.markdown')) {
    updates = parseMarkdownReviews(text)
  } else if (abs.endsWith('.csv')) {
    updates = parseCsvReviews(text)
  } else {
    throw new Error(`不支持的评权导入格式：${inputPath}`)
  }

  const registry = await loadArticleRegistry()
  const byId = new Map(registry.articles.map((a) => [a.articleId, a]))
  let updated = 0
  const errors = []

  for (const item of updates) {
    const article = byId.get(item.articleId)
    if (!article) {
      errors.push(`未知 Article ID：${item.articleId}`)
      continue
    }
    let touched = false
    for (const field of SCORE_FIELDS) {
      if (item[field] === undefined || item[field] === null || item[field] === '') continue
      try {
        article.review[field] = assertScore(item[field], field)
        touched = true
      } catch (error) {
        errors.push(`${item.articleId}: ${error.message}`)
      }
    }
    if (item.notes !== undefined && item.notes !== null && String(item.notes).trim() !== '') {
      article.review.notes = String(item.notes)
      touched = true
    }
    if (item.deferred === true) {
      article.review.status = 'deferred'
      touched = true
    } else if (typeof article.review.overallWeight === 'number') {
      article.review.status = article.review.overallWeight === 0 ? 'rejected' : 'reviewed'
      article.review.reviewedAt = new Date().toISOString()
      if (article.review.overallWeight === 0) {
        article.productionUse.styleRecommendation = 'excluded'
      }
      touched = true
    }
    if (item.authorSupplement && String(item.authorSupplement).trim()) {
      const name = String(item.authorSupplement).trim()
      article.author.displayName = name
      article.author.confidence = 'high'
      article.author.extractedFrom = 'source-metadata'
      article.author.authorId = makeAuthorId(name)
      touched = true
    }
    if (item.themeDomainOverride) {
      article.themeDomainOverride = item.themeDomainOverride
      touched = true
    }
    if (touched) {
      article.updatedAt = new Date().toISOString()
      updated += 1
    }
  }

  if (errors.length && options.strict !== false) {
    throw new Error(`评权导入失败：\n${errors.join('\n')}`)
  }

  const authorRegistry = rebuildAuthorRegistry(registry, await loadAuthorRegistry())
  if (!options.dryRun) {
    await saveArticleRegistry(registry)
    await saveAuthorRegistry(authorRegistry)
  }

  return {
    dryRun: Boolean(options.dryRun),
    updated,
    errors,
    counts: registry.counts,
    authorCounts: authorRegistry.counts,
  }
}

function parseCsvReviews(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = splitCsvLine(lines[0])
  const idx = Object.fromEntries(header.map((h, i) => [h, i]))
  const updates = []
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const cols = splitCsvLine(line)
    updates.push({
      articleId: cols[idx.articleId],
      overallWeight: cols[idx.overallWeight],
      liluoSuitability: cols[idx.liluoSuitability],
      restraintWritingQuality: cols[idx.restraintWritingQuality],
      notes: cols[idx.notes] ?? '',
    })
  }
  return updates
}

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

export async function validateExternalRegistries() {
  const articles = await loadArticleRegistry()
  const authors = await loadAuthorRegistry()
  const errors = []
  const ids = new Set()
  for (const article of articles.articles) {
    if (ids.has(article.articleId)) errors.push(`重复 articleId：${article.articleId}`)
    ids.add(article.articleId)
    if (!article.path?.startsWith('external-knowledge/')) {
      errors.push(`${article.articleId} path 不在 external-knowledge 下`)
    }
    if (article.review?.overallWeight != null) {
      try {
        assertScore(article.review.overallWeight, 'overallWeight')
      } catch (error) {
        errors.push(`${article.articleId}: ${error.message}`)
      }
    }
    if (
      article.productionUse?.styleRecommendation === 'recommended' &&
      article.review?.status !== 'reviewed'
    ) {
      errors.push(`${article.articleId} 未评审却 recommended`)
    }
  }
  for (const author of authors.authors) {
    if (author.userPrior?.weight != null) {
      try {
        assertScore(author.userPrior.weight, 'authorPrior')
      } catch (error) {
        errors.push(`${author.authorId}: ${error.message}`)
      }
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    articleCounts: articles.counts,
    authorCounts: authors.counts,
  }
}

export { applyAuthorPrior, SCORE_FIELDS, assertScore }
