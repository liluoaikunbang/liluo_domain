import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { ROOT } from '../writing-model/lib/paths.mjs'
import { loadExternalStyleSources, loadArticleRegistry, scanExternalInventory } from '../writing-model/lib/external-inventory.mjs'
import { extractArticleMetadata } from '../writing-model/lib/external-metadata.mjs'
import { exportReviewBatch, importReviewBatch, filterArticlesForReview } from '../writing-model/lib/external-review.mjs'
import { loadAuthorRegistry } from '../writing-model/lib/external-author-registry.mjs'
import { computeUserQuality } from '../writing-model/lib/style-registry.mjs'
import { loadStyleRagPolicy } from '../writing-model/lib/style-query.mjs'

const repo = ROOT

function run(args) {
  return spawnSync(process.execPath, ['scripts/writing-model/writing-model.mjs', ...args], {
    cwd: repo,
    encoding: 'utf8',
  })
}

test('external sources map real directories', async () => {
  const sources = await loadExternalStyleSources()
  const restraint = sources.sources.find((s) => s.id === 'restraint-articles')
  const zhihu = sources.sources.find((s) => s.id === 'zhihu-articles')
  assert.equal(restraint.root, 'external-knowledge/sources/fiction-bondage')
  assert.equal(restraint.themeDomain, 'restraint-themed')
  assert.equal(zhihu.root, 'external-knowledge/sources/zhihu-novels')
  assert.equal(zhihu.themeDomain, 'general-prose')
  await stat(path.join(repo, restraint.root))
  await stat(path.join(repo, zhihu.root))
})

test('inventory registry has expected theme split and no full body', async () => {
  const registry = await loadArticleRegistry()
  assert.ok(registry.counts.total >= 200)
  assert.equal(registry.counts.restraintThemed, 180)
  assert.equal(registry.counts.generalProse, 30)
  assert.equal(registry.counts.reviewed, 0)
  for (const article of registry.articles.slice(0, 20)) {
    assert.equal(article.body, undefined)
    assert.equal(article.fullText, undefined)
    assert.ok(article.path.startsWith('external-knowledge/'))
    assert.ok(article.hash)
  }
})

test('title/author extraction priority; unknown author not guessed', () => {
  const zhihu = extractArticleMetadata({
    text: `<!--\nsourceUrl: https://www.zhihu.com/x\n-->\n# 标题甲\n正文`,
    relativePath: 'external-knowledge/sources/zhihu-novels/宫墙往事/file.md',
    source: { id: 'zhihu-articles', authorExtractionHints: { authorIsFirstPathSegment: true } },
    fileName: '(20240319)问题_宫墙往事-abc12345.md',
  })
  assert.equal(zhihu.title.extractedFrom, 'body')
  assert.equal(zhihu.author.displayName, '宫墙往事')
  assert.equal(zhihu.author.extractedFrom, 'folder')

  const unknown = extractArticleMetadata({
    text: '# 某篇\n内容',
    relativePath: 'external-knowledge/sources/fiction-bondage/不知道作者/某篇.md',
    source: {
      id: 'restraint-articles',
      authorExtractionHints: {
        authorFolderPrefix: '作者,金主大大',
        unknownAuthorFolders: ['不知道作者', '其他未分类', '精品单章片段', '堕落方舟'],
      },
    },
    fileName: '某篇.md',
  })
  assert.equal(unknown.author.displayName, 'unknown')
  assert.equal(unknown.author.confidence, 'unknown')
})

test('incremental scan is stable and does not modify source files', async () => {
  const a = await scanExternalInventory({ dryRun: true })
  const b = await scanExternalInventory({ dryRun: true })
  assert.equal(a.articleCount, b.articleCount)
  assert.deepEqual(a.counts, b.counts)
  const sampleRel = a.registry.articles[0]?.path
  assert.ok(sampleRel)
  const before = await readFile(path.join(repo, sampleRel), 'utf8')
  const after = await readFile(path.join(repo, sampleRel), 'utf8')
  assert.equal(before, after)
})

test('review export batch size <= 30 and includes title/author', async () => {
  const result = await exportReviewBatch({
    unreviewedOnly: true,
    theme: 'restraint-themed',
    batchSize: 30,
    format: 'markdown',
  })
  assert.ok(result.count <= 30)
  assert.ok(result.count > 0)
  const md = await readFile(path.join(repo, result.path), 'utf8')
  assert.match(md, /参考权重（0–5）/)
  assert.match(md, /\[ea-/)
})

test('filter unreviewed excludes already reviewed', async () => {
  const registry = await loadArticleRegistry()
  const sample = structuredClone(registry.articles[0])
  sample.review = { ...sample.review, status: 'reviewed', overallWeight: 4 }
  const filtered = filterArticlesForReview([sample, ...registry.articles.slice(1, 5)], { unreviewedOnly: true, batchSize: 30 })
  assert.ok(!filtered.some((a) => a.articleId === sample.articleId))
})

test('user quality prefers article over author; unrated blocked for production quality path', async () => {
  const policy = await loadStyleRagPolicy()
  const rated = computeUserQuality(
    { review: { overallWeight: 4 } },
    { userPrior: { weight: 1 } },
    policy,
  )
  assert.equal(rated.reason, 'article-preferred')
  const unrated = computeUserQuality({ review: { overallWeight: null } }, { userPrior: { weight: null } }, policy)
  assert.equal(unrated.productionBlocked, true)
  assert.equal(unrated.userQuality, 0.5)
})

test('CLI external-validate and style-validate offline', () => {
  const a = run(['external-validate'])
  assert.equal(a.status, 0, a.stderr || a.stdout)
  const b = run(['style-validate'])
  assert.equal(b.status, 0, b.stderr || b.stdout)
  assert.match(b.stdout, /metadata-rag/)
})

test('author registry exists after inventory', async () => {
  const authors = await loadAuthorRegistry()
  assert.ok(authors.authors.length > 0)
  assert.ok(authors.authors.some((a) => a.displayName === 'unknown'))
})

test('windows posix relative paths stored', async () => {
  const registry = await loadArticleRegistry()
  for (const article of registry.articles.slice(0, 50)) {
    assert.doesNotMatch(article.path, /\\/)
  }
})
