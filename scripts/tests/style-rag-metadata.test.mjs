import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { ROOT } from '../writing-model/lib/paths.mjs'
import { loadStyleRagPolicy, loadStyleTaxonomy, validateScoringWeights, validateStyleQuery, assertNoCanonLeakage } from '../writing-model/lib/style-query.mjs'
import { computeUserQuality } from '../writing-model/lib/style-registry.mjs'
import { themeDomainScore, scoreCandidate, modelEffectivenessScore } from '../writing-model/lib/style-scoring.mjs'
import { isEligibleForProduction } from '../writing-model/lib/style-eligibility.mjs'
import { selectDiverse } from '../writing-model/lib/style-diversity.mjs'
import { assembleStylePack } from '../writing-model/lib/style-pack.mjs'
import { runStyleSearch } from '../writing-model/lib/style-search.mjs'

const repo = ROOT

test('style policy and taxonomy load; scoring weights sum to 1', async () => {
  const policy = await loadStyleRagPolicy()
  const taxonomy = await loadStyleTaxonomy()
  assert.equal(policy.implementationStage, 'metadata-rag')
  assert.ok(policy.enabledModes.includes('explicit'))
  assert.ok(policy.enabledModes.includes('metadata'))
  assert.ok(policy.deferredModes.includes('embedding'))
  assert.ok(policy.deferredModes.includes('learned-reranker'))
  assert.ok(policy.deferredModes.includes('model-training'))
  assert.equal(policy.production.allowCanonFactsInStyleQuery, false)
  assert.equal(policy.production.allowUnreviewedExternalArticle, false)
  const weights = validateScoringWeights(policy)
  assert.equal(weights.ok, true, weights.errors.join('; '))
  assert.ok(taxonomy.sceneFunctions.includes('restricted-action-escape'))
  assert.ok(taxonomy.themeDomains.includes('restraint-themed'))
  assert.ok(taxonomy.themeDomains.includes('general-prose'))
})

test('Style Query rejects canon fields', async () => {
  const leak = assertNoCanonLeakage({
    schemaVersion: 1,
    queryId: 'sq-x',
    mode: 'metadata',
    primarySceneFunction: 'daily-interaction',
    themeDomain: 'general-prose',
    characterNames: ['璃落'],
  })
  assert.equal(leak.ok, false)
  const okQuery = {
    schemaVersion: 1,
    queryId: 'sq-ok',
    mode: 'metadata',
    primarySceneFunction: 'daily-interaction',
    themeDomain: 'general-prose',
  }
  const check = await validateStyleQuery(okQuery)
  assert.equal(check.ok, true, check.errors.join('; '))
})

test('themeDomain affects adaptation not base quality', async () => {
  const policy = await loadStyleRagPolicy()
  assert.equal(themeDomainScore('restraint-themed', 'restraint-themed', policy), 1)
  assert.equal(themeDomainScore('restraint-themed', 'general-prose', policy), 0.4)
  assert.equal(themeDomainScore('general-prose', 'restraint-themed', policy), 0.3)
  assert.equal(themeDomainScore('general-prose', 'general-prose', policy), 1)
  // quality formula independent of theme
  const article = { review: { overallWeight: 5 } }
  const author = { userPrior: { weight: 1 } }
  const q = computeUserQuality(article, author, policy)
  assert.ok(Math.abs(q.userQuality - (0.7 * 1 + 0.3 * 0.2)) < 1e-9)
})

test('article score 0 excludes; author 0 does not exclude high article', async () => {
  const policy = await loadStyleRagPolicy()
  const excluded = computeUserQuality({ review: { overallWeight: 0 } }, { userPrior: { weight: 5 } }, policy)
  assert.equal(excluded.excluded, true)
  const kept = computeUserQuality({ review: { overallWeight: 5 } }, { userPrior: { weight: 0 } }, policy)
  assert.equal(kept.excluded, false)
  assert.ok(kept.userQuality > 0.6)
})

test('unreviewed external cannot enter production; high leakage excluded', async () => {
  const policy = await loadStyleRagPolicy()
  const query = { excludedAssetIds: [], targetModel: 'zhi-create-dsr1-14b' }
  const unreviewed = {
    assetType: 'external-article',
    status: 'awaiting-user-input',
    authority: { styleRecommendation: 'unreviewed', representation: 'abstract-style-card', contentLeakageRisk: 'low' },
    review: { status: 'unreviewed' },
  }
  assert.equal(isEligibleForProduction(unreviewed, query, policy).ok, false)
  const highLeak = {
    assetType: 'golden-approved',
    status: 'approved',
    authority: { styleRecommendation: 'recommended', contentLeakageRisk: 'high' },
    provenance: { approvedByUser: true },
  }
  assert.equal(isEligibleForProduction(highLeak, query, policy).ok, false)
})

test('model effectiveness uses neutral prior under 3 ratings', async () => {
  const policy = await loadStyleRagPolicy()
  const score = modelEffectivenessScore({ modelEffectiveness: {} }, 'zhi-create-dsr1-14b', policy)
  assert.equal(score, 0.5)
})

test('diversity limits same author and max 2 externals', async () => {
  const policy = await loadStyleRagPolicy()
  const mk = (id, authorId, type = 'external-article') => ({
    eligible: true,
    score: 0.9,
    candidate: {
      assetId: id,
      assetType: type,
      authorId,
      authorName: authorId,
      workId: id,
      path: id,
      themeDomain: 'general-prose',
    },
  })
  const { selected } = selectDiverse(
    [mk('a1', 'auth1'), mk('a2', 'auth1'), mk('a3', 'auth2'), mk('a4', 'auth3'), mk('g1', 'g', 'golden-approved')],
    { mode: 'metadata' },
    policy,
  )
  assert.ok(selected.every((s, i, arr) => arr.findIndex((x) => x.candidate.authorId === s.candidate.authorId) === i))
  assert.ok(selected.filter((s) => s.candidate.assetType === 'external-article').length <= 2)
})

test('empty assets returns awaiting-assets; does not forge examples', async () => {
  const policy = await loadStyleRagPolicy()
  const pack = await assembleStylePack({
    query: {
      queryId: 'sq-empty',
      mode: 'metadata',
      hardRules: [],
      modelKnownFailureModes: [],
      requestContractId: null,
    },
    selected: [],
    policy,
  })
  assert.equal(pack.status, 'awaiting-assets')
  assert.match(pack.renderedMarkdown, /awaiting-assets/)
  assert.match(pack.renderedMarkdown, /未伪造范例/)
  assert.doesNotMatch(pack.renderedMarkdown, /示例正文段落|黄金正文摘录/)
})

test('style search is deterministic and offline', async () => {
  const query = {
    schemaVersion: 1,
    queryId: 'sq-det-001',
    mode: 'metadata',
    primarySceneFunction: 'restricted-action-escape',
    sceneFunctions: ['restricted-action-escape', 'tension-action'],
    worldType: 'urban',
    themeDomain: 'restraint-themed',
    restraintFunctions: ['restricted-movement'],
    pov: 'third-person-limited',
    narrativeDistance: 'close',
    tensionLevel: 'high',
    actionDensity: 'high',
    dialogueDensity: 'low',
    psychologicalDensity: 'medium',
    informationRelease: 'progressive',
    sentenceRhythm: 'short-medium-alternating',
    explicitReferenceIds: [],
    excludedAssetIds: [],
  }
  const a = await runStyleSearch(query)
  const b = await runStyleSearch(query)
  assert.deepEqual(
    a.selected.map((s) => s.candidate.assetId),
    b.selected.map((s) => s.candidate.assetId),
  )
  // with zero production-ready assets, expect awaiting empty selection
  assert.equal(a.selected.length, 0)
})

test('no embedding or vector dependencies in package.json', async () => {
  const pkg = JSON.parse(await readFile(path.join(repo, 'package.json'), 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const banned of ['chromadb', 'faiss', '@xenova/transformers', 'vectordb', 'hnswlib-node']) {
    assert.equal(deps[banned], undefined)
  }
  assert.ok(await readFile(path.join(repo, '.cursor'), 'utf8').catch(() => 'dir'))
  assert.ok(await readFile(path.join(repo, '.codex'), 'utf8').catch(() => 'dir'))
})
