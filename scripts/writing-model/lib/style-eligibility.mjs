export function isEligibleForProduction(candidate, query, policy) {
  const reasons = []
  if (query.excludedAssetIds?.includes(candidate.assetId)) {
    return { ok: false, reasons: ['excluded-by-query'] }
  }
  if (candidate.status === 'superseded' || candidate.status === 'rejected') {
    return { ok: false, reasons: [`status-${candidate.status}`] }
  }
  if (policy.production.approvedAssetsOnly) {
    if (candidate.assetType === 'external-article') {
      if (candidate.authority?.styleRecommendation !== 'recommended') {
        return { ok: false, reasons: ['external-not-recommended'] }
      }
      if (candidate.review?.status !== 'reviewed') {
        return { ok: false, reasons: ['external-unreviewed'] }
      }
      if (typeof candidate.review?.overallWeight !== 'number') {
        return { ok: false, reasons: ['external-unrated'] }
      }
      const minWeight = policy.production.minimumArticleOverallWeightForProduction ?? 3
      if (candidate.review.overallWeight < minWeight) {
        return { ok: false, reasons: ['external-below-weight-threshold'] }
      }
      if (candidate.review.overallWeight === 0) {
        return { ok: false, reasons: ['article-overallWeight-0'] }
      }
      if (candidate.authority?.representation === 'source-only') {
        return { ok: false, reasons: ['representation-source-only'] }
      }
    } else {
      if (candidate.status !== 'approved' && candidate.status !== 'candidate') {
        return { ok: false, reasons: [`status-${candidate.status}`] }
      }
      if (candidate.authority?.styleRecommendation !== 'recommended') {
        return { ok: false, reasons: ['not-recommended'] }
      }
      if (candidate.provenance?.approvedByUser !== true && candidate.status === 'approved') {
        // approved without user approval is forged — blocked by assets validate; still block here
        if (candidate.provenance && candidate.provenance.approvedByUser === false) {
          return { ok: false, reasons: ['missing-user-approval'] }
        }
      }
    }
  }
  if (candidate.authority?.contentLeakageRisk === 'high') {
    return { ok: false, reasons: ['high-leakage-risk'] }
  }
  if (candidate.modelEffectiveness?.[query.targetModel]?.label === 'harmful') {
    return { ok: false, reasons: ['model-marked-harmful'] }
  }
  if (candidate.userQualityMeta?.excluded) {
    return { ok: false, reasons: [candidate.userQualityMeta.reason] }
  }
  return { ok: true, reasons }
}

export function filterEligible(candidates, query, policy, options = {}) {
  const mode = options.mode ?? query.mode
  if (mode === 'explicit') {
    const ids = new Set(query.explicitReferenceIds ?? [])
    return candidates
      .filter((c) => ids.has(c.assetId))
      .map((c) => {
        const elig = isEligibleForProduction(c, query, policy)
        return { candidate: c, eligible: elig.ok, reasons: elig.reasons }
      })
  }
  return candidates.map((c) => {
    const elig = isEligibleForProduction(c, query, policy)
    return { candidate: c, eligible: elig.ok, reasons: elig.reasons }
  })
}
