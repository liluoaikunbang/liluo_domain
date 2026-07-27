import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import {
  EXTERNAL_ARTICLE_REGISTRY_PATH,
  EXTERNAL_AUTHOR_REGISTRY_PATH,
  EXTERNAL_DUPLICATE_GROUPS_PATH,
  EXTERNAL_STYLE_SOURCES_PATH,
  ROOT,
  repoPath,
  toPosixRelative,
} from './paths.mjs'
import { extractArticleMetadata } from './external-metadata.mjs'
import { detectDuplicates } from './external-dedup.mjs'
import { rebuildAuthorRegistry, saveAuthorRegistry, loadAuthorRegistry } from './external-author-registry.mjs'

export async function loadExternalStyleSources() {
  return JSON.parse(await readFile(repoPath(EXTERNAL_STYLE_SOURCES_PATH), 'utf8'))
}

export async function loadArticleRegistry() {
  try {
    return JSON.parse(await readFile(repoPath(EXTERNAL_ARTICLE_REGISTRY_PATH), 'utf8'))
  } catch {
    return emptyArticleRegistry()
  }
}

export function emptyArticleRegistry() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    counts: {
      total: 0,
      restraintThemed: 0,
      generalProse: 0,
      mixed: 0,
      unknown: 0,
      reviewed: 0,
      unreviewed: 0,
      deferred: 0,
      unknownTitle: 0,
      unknownAuthor: 0,
      duplicateGroups: 0,
    },
    articles: [],
  }
}

export async function saveArticleRegistry(registry) {
  registry.updatedAt = new Date().toISOString()
  registry.counts = computeArticleCounts(registry.articles)
  await mkdir(path.dirname(repoPath(EXTERNAL_ARTICLE_REGISTRY_PATH)), { recursive: true })
  await writeFile(repoPath(EXTERNAL_ARTICLE_REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
}

export function computeArticleCounts(articles) {
  const counts = {
    total: articles.length,
    restraintThemed: 0,
    generalProse: 0,
    mixed: 0,
    unknown: 0,
    reviewed: 0,
    unreviewed: 0,
    deferred: 0,
    unknownTitle: 0,
    unknownAuthor: 0,
    duplicateGroups: 0,
  }
  const groups = new Set()
  for (const article of articles) {
    const domain = article.themeDomainOverride ?? article.themeDomain
    if (domain === 'restraint-themed') counts.restraintThemed += 1
    else if (domain === 'general-prose') counts.generalProse += 1
    else if (domain === 'mixed') counts.mixed += 1
    else counts.unknown += 1
    if (article.review?.status === 'reviewed') counts.reviewed += 1
    else if (article.review?.status === 'deferred') counts.deferred += 1
    else counts.unreviewed += 1
    if (!article.title?.value || article.title.value === 'unknown') counts.unknownTitle += 1
    if (!article.author?.displayName || article.author.displayName === 'unknown') counts.unknownAuthor += 1
    if (article.duplicateGroupId) groups.add(article.duplicateGroupId)
  }
  counts.duplicateGroups = groups.size
  return counts
}

async function hashFileStreaming(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function walkMarkdownFiles(rootAbs) {
  const results = []
  async function walk(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue
        await walk(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(full)
      }
    }
  }
  await walk(rootAbs)
  return results.sort((a, b) => toPosixRelative(a).localeCompare(toPosixRelative(b), 'en'))
}

function makeArticleId(relativePath) {
  const digest = createHash('sha256').update(relativePath.split(path.sep).join('/')).digest('hex').slice(0, 12)
  return `ea-${digest}`
}

function effectiveThemeDomain(article) {
  return article.themeDomainOverride ?? article.themeDomain
}

export async function scanExternalInventory(options = {}) {
  const dryRun = options.dryRun === true
  const sourcesConfig = await loadExternalStyleSources()
  const previous = await loadArticleRegistry()
  const previousByPath = new Map(previous.articles.map((item) => [item.path, item]))
  const articles = []
  const missingRoots = []

  for (const source of sourcesConfig.sources) {
    const rootAbs = repoPath(source.root)
    try {
      await access(rootAbs)
    } catch {
      missingRoots.push(source.root)
      continue
    }
    const files = await walkMarkdownFiles(rootAbs)
    for (const fileAbs of files) {
      const rel = toPosixRelative(fileAbs)
      const st = await stat(fileAbs)
      const existing = previousByPath.get(rel)
      let hash
      let contentPreview = null
      let reused = false
      if (existing && existing.mtimeMs === st.mtimeMs && existing.byteSize === st.size && existing.hash) {
        hash = existing.hash
        reused = true
      } else {
        hash = await hashFileStreaming(fileAbs)
      }

      let meta
      if (reused && existing.title && existing.author) {
        meta = {
          title: existing.title,
          author: existing.author,
          sourceUrl: existing.sourceUrl ?? null,
          contentHash: existing.contentHash ?? null,
        }
      } else {
        const text = await readFile(fileAbs, 'utf8')
        meta = extractArticleMetadata({
          text,
          relativePath: rel,
          source,
          fileName: path.basename(fileAbs),
        })
        contentPreview = text.slice(0, 4000)
      }

      const articleId = existing?.articleId ?? makeArticleId(rel)
      const article = {
        schemaVersion: 1,
        articleId,
        sourceId: source.id,
        path: rel,
        title: meta.title,
        author: {
          authorId: existing?.author?.authorId ?? null,
          displayName: meta.author.displayName,
          confidence: meta.author.confidence,
          extractedFrom: meta.author.extractedFrom,
        },
        themeDomain: source.themeDomain,
        themeDomainOverride: existing?.themeDomainOverride ?? null,
        restraintFunction: existing?.restraintFunction ?? [],
        sourceUrl: meta.sourceUrl ?? existing?.sourceUrl ?? null,
        rights: existing?.rights ?? {
          status: 'unknown',
          productionUse: source.defaultRepresentation,
        },
        review: existing?.review ?? {
          status: 'unreviewed',
          overallWeight: null,
          writingQuality: null,
          liluoSuitability: null,
          restraintWritingQuality: null,
          dialogueQuality: null,
          actionSpatialQuality: null,
          atmosphereQuality: null,
          notes: '',
          reviewedAt: null,
        },
        style: existing?.style ?? {},
        productionUse: existing?.productionUse ?? {
          styleRecommendation: 'unreviewed',
          representation: source.defaultRepresentation,
          contentLeakageRisk: 'unknown',
          mappedAssetId: null,
        },
        duplicateGroupId: null,
        isCanonicalDuplicate: true,
        hash,
        contentHash: meta.contentHash ?? existing?.contentHash ?? null,
        mtimeMs: st.mtimeMs,
        byteSize: st.size,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: reused ? existing.updatedAt : new Date().toISOString(),
        _contentPreview: contentPreview,
      }
      articles.push(article)
    }
  }

  const { articles: deduped, groups } = detectDuplicates(articles)
  for (const article of deduped) {
    delete article._contentPreview
  }

  const registry = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    counts: computeArticleCounts(deduped),
    articles: deduped.sort((a, b) => a.path.localeCompare(b.path, 'en')),
  }

  const authorRegistry = rebuildAuthorRegistry(registry, await loadAuthorRegistry().catch(() => null))

  if (!dryRun) {
    await saveArticleRegistry(registry)
    await saveAuthorRegistry(authorRegistry)
    await mkdir(path.dirname(repoPath(EXTERNAL_DUPLICATE_GROUPS_PATH)), { recursive: true })
    await writeFile(
      repoPath(EXTERNAL_DUPLICATE_GROUPS_PATH),
      `${JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), groups }, null, 2)}\n`,
      'utf8',
    )
  }

  return {
    dryRun,
    missingRoots,
    counts: registry.counts,
    articleCount: registry.articles.length,
    authorCount: authorRegistry.authors.length,
    duplicateGroups: groups.length,
    registry,
    authorRegistry,
  }
}

export function getEffectiveThemeDomain(article) {
  return effectiveThemeDomain(article)
}

export { ROOT }
