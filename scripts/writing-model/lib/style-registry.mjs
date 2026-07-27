import { loadAssetRegistry } from './assets.mjs'
import { loadArticleRegistry, getEffectiveThemeDomain } from './external-inventory.mjs'
import { loadAuthorRegistry } from './external-author-registry.mjs'
import { loadStyleRagPolicy } from './style-query.mjs'

export async function loadStyleSearchContext() {
  const [policy, assetRegistry, articleRegistry, authorRegistry] = await Promise.all([
    loadStyleRagPolicy(),
    loadAssetRegistry(),
    loadArticleRegistry(),
    loadAuthorRegistry(),
  ])
  const authorsById = new Map(authorRegistry.authors.map((a) => [a.authorId, a]))
  const articlesById = new Map(articleRegistry.articles.map((a) => [a.articleId, a]))
  return { policy, assetRegistry, articleRegistry, authorRegistry, authorsById, articlesById }
}

export function computeUserQuality(article, author, policy) {
  const eq = policy.externalQuality
  const articleRated = typeof article?.review?.overallWeight === 'number'
  const authorRated = typeof author?.userPrior?.weight === 'number'
  if (articleRated && article.review.overallWeight === 0) return { userQuality: 0, excluded: true, reason: 'article-overallWeight-0' }
  const articleUser = articleRated ? article.review.overallWeight / 5 : null
  const authorUser = authorRated ? author.userPrior.weight / 5 : null
  if (articleRated) {
    return {
      userQuality: eq.articleScoreWeight * articleUser + eq.authorPriorWeight * (authorUser ?? eq.unratedAuthorPrior),
      excluded: false,
      reason: 'article-preferred',
    }
  }
  if (authorRated) {
    return { userQuality: authorUser, excluded: false, reason: 'author-prior-only', productionBlocked: true }
  }
  return {
    userQuality: eq.unratedArticleScore,
    excluded: false,
    reason: 'unrated-neutral',
    productionBlocked: true,
  }
}

export function sourcePriorForAssetType(assetType, policy) {
  return policy.sourcePrior[assetType] ?? 0.4
}

export function mapArticleToStyleCandidate(article, author, policy) {
  const quality = computeUserQuality(article, author, policy)
  return {
    assetId: article.productionUse?.mappedAssetId ?? `wa-ext-${article.articleId}`,
    assetType: 'external-article',
    sourceRecordId: article.articleId,
    status: article.review?.status === 'reviewed' ? 'approved' : 'awaiting-user-input',
    title: article.title?.value ?? 'unknown',
    path: article.path,
    authorId: article.author?.authorId ?? null,
    authorName: article.author?.displayName ?? 'unknown',
    workId: article.path,
    themeDomain: getEffectiveThemeDomain(article),
    classification: {
      sceneFunction: article.style?.sceneFunctions ?? [],
      worldTypes: article.style?.worldTypes ?? [],
      pov: article.style?.pov ?? '',
      dialogueDensity: article.style?.dialogueDensity ?? '',
      actionDensity: article.style?.actionDensity ?? '',
      tensionLevel: article.style?.tensionLevel ?? '',
      narrativeDistance: article.style?.narrativeDistance ?? '',
      psychologicalDensity: article.style?.psychologicalDensity ?? '',
      informationRelease: article.style?.informationRelease ?? '',
      sentenceRhythm: article.style?.sentenceRhythm ?? '',
      restraintFunctions: article.restraintFunction ?? [],
      sensoryPriority: article.style?.sensoryPriority ?? [],
    },
    authority: {
      styleRecommendation: article.productionUse?.styleRecommendation ?? 'unreviewed',
      contentLeakageRisk: article.productionUse?.contentLeakageRisk ?? 'unknown',
      representation: article.productionUse?.representation ?? 'source-only',
    },
    provenance: {
      approvedByUser: article.review?.status === 'reviewed',
    },
    userQuality: quality.userQuality,
    userQualityMeta: quality,
    modelEffectiveness: {},
    review: article.review,
  }
}

export function mapWritingAssetToCandidate(asset) {
  return {
    assetId: asset.assetId,
    assetType: asset.assetType,
    sourceRecordId: asset.sourceRecordId ?? null,
    status: asset.status,
    title: asset.title,
    path: asset.path,
    authorId: asset.ownership?.source ?? null,
    authorName: asset.ownership?.source ?? null,
    workId: asset.path,
    themeDomain: asset.classification?.themeDomain ?? 'general-prose',
    classification: {
      sceneFunction: asset.classification?.sceneFunction ?? [],
      worldTypes: asset.classification?.worldTypes ?? [],
      pov: asset.classification?.pov ?? '',
      dialogueDensity: asset.classification?.dialogueDensity ?? '',
      actionDensity: asset.classification?.actionDensity ?? '',
      tensionLevel: asset.classification?.tensionLevel ?? '',
      narrativeDistance: asset.classification?.narrativeDistance ?? '',
      psychologicalDensity: asset.classification?.psychologicalDensity ?? '',
      informationRelease: asset.classification?.informationRelease ?? '',
      sentenceRhythm: asset.classification?.sentenceRhythm ?? '',
      restraintFunctions: asset.classification?.restraintFunctions ?? [],
      sensoryPriority: asset.classification?.sensoryPriority ?? [],
    },
    authority: {
      styleRecommendation: asset.authority?.styleRecommendation ?? 'unreviewed',
      contentLeakageRisk: asset.authority?.contentLeakageRisk ?? 'unknown',
      representation: asset.authority?.representation ?? 'raw-excerpt',
    },
    provenance: asset.provenance ?? {},
    userQuality: typeof asset.userQuality === 'number' ? asset.userQuality : 0.7,
    userQualityMeta: { reason: 'writing-asset' },
    modelEffectiveness: asset.modelEffectiveness ?? {},
    issueCategories: asset.changeCategories ?? [],
  }
}

export async function collectStyleCandidates(context = null) {
  const ctx = context ?? (await loadStyleSearchContext())
  const candidates = []
  for (const asset of ctx.assetRegistry.assets) {
    candidates.push(mapWritingAssetToCandidate(asset))
  }
  for (const article of ctx.articleRegistry.articles) {
    const author = ctx.authorsById.get(article.author?.authorId)
    candidates.push(mapArticleToStyleCandidate(article, author, ctx.policy))
  }
  return { ...ctx, candidates }
}
