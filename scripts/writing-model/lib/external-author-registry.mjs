import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { EXTERNAL_AUTHOR_REGISTRY_PATH, repoPath } from './paths.mjs'
import { normalizeComparableAuthor } from './external-metadata.mjs'

export function emptyAuthorRegistry() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    counts: { total: 0, reviewed: 0, unreviewed: 0 },
    authors: [],
  }
}

export async function loadAuthorRegistry() {
  try {
    return JSON.parse(await readFile(repoPath(EXTERNAL_AUTHOR_REGISTRY_PATH), 'utf8'))
  } catch {
    return emptyAuthorRegistry()
  }
}

export async function saveAuthorRegistry(registry) {
  registry.updatedAt = new Date().toISOString()
  registry.counts = {
    total: registry.authors.length,
    reviewed: registry.authors.filter((a) => a.userPrior?.status === 'reviewed').length,
    unreviewed: registry.authors.filter((a) => a.userPrior?.status !== 'reviewed').length,
  }
  await mkdir(path.dirname(repoPath(EXTERNAL_AUTHOR_REGISTRY_PATH)), { recursive: true })
  await writeFile(repoPath(EXTERNAL_AUTHOR_REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
}

export function makeAuthorId(displayName) {
  const key = normalizeComparableAuthor(displayName) || 'unknown'
  return `author-${createHash('sha256').update(key).digest('hex').slice(0, 10)}`
}

export function rebuildAuthorRegistry(articleRegistry, previous = null) {
  const prevById = new Map((previous?.authors ?? []).map((a) => [a.authorId, a]))
  const prevByName = new Map(
    (previous?.authors ?? []).map((a) => [normalizeComparableAuthor(a.displayName), a]),
  )
  const buckets = new Map()

  for (const article of articleRegistry.articles) {
    const name = article.author?.displayName || 'unknown'
    const key = normalizeComparableAuthor(name) || 'unknown'
    if (!buckets.has(key)) {
      const existing = prevByName.get(key)
      const authorId = existing?.authorId ?? article.author?.authorId ?? makeAuthorId(name)
      buckets.set(key, {
        schemaVersion: 1,
        authorId,
        displayName: name === 'unknown' ? 'unknown' : name,
        aliases: existing?.aliases ?? [],
        articleIds: [],
        userPrior: existing?.userPrior ?? {
          status: 'unreviewed',
          weight: null,
          notes: '',
          reviewedAt: null,
        },
        derivedStatistics: {
          ratedArticles: 0,
          meanArticleWeight: null,
          themeDomainCounts: {},
        },
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    const author = buckets.get(key)
    author.articleIds.push(article.articleId)
    article.author.authorId = author.authorId
    const domain = article.themeDomainOverride ?? article.themeDomain
    author.derivedStatistics.themeDomainCounts[domain] =
      (author.derivedStatistics.themeDomainCounts[domain] ?? 0) + 1
  }

  for (const author of buckets.values()) {
    const rated = articleRegistry.articles.filter(
      (a) =>
        a.author?.authorId === author.authorId &&
        typeof a.review?.overallWeight === 'number',
    )
    author.derivedStatistics.ratedArticles = rated.length
    author.derivedStatistics.meanArticleWeight = rated.length
      ? rated.reduce((sum, a) => sum + a.review.overallWeight, 0) / rated.length
      : null
    const prev = prevById.get(author.authorId)
    if (prev?.userPrior?.status === 'reviewed') author.userPrior = { ...prev.userPrior }
  }

  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    counts: {
      total: buckets.size,
      reviewed: [...buckets.values()].filter((a) => a.userPrior?.status === 'reviewed').length,
      unreviewed: [...buckets.values()].filter((a) => a.userPrior?.status !== 'reviewed').length,
    },
    authors: [...buckets.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh')),
  }
}

export function applyAuthorPrior(authorRegistry, authorId, weight, notes = '') {
  const author = authorRegistry.authors.find((a) => a.authorId === authorId)
  if (!author) throw new Error(`未知作者 ${authorId}`)
  if (weight !== null && weight !== undefined) {
    if (!Number.isInteger(weight) || weight < 0 || weight > 5) {
      throw new Error(`作者权重必须是 0–5 整数：${weight}`)
    }
    author.userPrior.weight = weight
    author.userPrior.status = 'reviewed'
    author.userPrior.reviewedAt = new Date().toISOString()
  }
  if (notes) author.userPrior.notes = notes
  author.updatedAt = new Date().toISOString()
  return author
}

export function listAuthors(authorRegistry, options = {}) {
  let authors = [...authorRegistry.authors]
  if (options.unreviewedOnly) {
    authors = authors.filter((a) => a.userPrior?.status !== 'reviewed')
  }
  if (options.excludeUnknown) {
    authors = authors.filter((a) => a.displayName !== 'unknown')
  }
  return authors.sort((a, b) => (b.articleIds?.length ?? 0) - (a.articleIds?.length ?? 0))
}
