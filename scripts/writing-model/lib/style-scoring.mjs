function jaccard(a = [], b = []) {
  const setA = new Set(a.filter(Boolean))
  const setB = new Set(b.filter(Boolean))
  if (!setA.size && !setB.size) return null
  if (!setA.size || !setB.size) return 0
  let inter = 0
  for (const item of setA) if (setB.has(item)) inter += 1
  const union = new Set([...setA, ...setB]).size
  return inter / union
}

function singleMatch(queryValue, assetValue, compatMap = {}) {
  if (!queryValue || !assetValue) return null
  if (queryValue === assetValue) return 1
  if (compatMap[`${queryValue}|${assetValue}`] || compatMap[`${assetValue}|${queryValue}`]) return 0.5
  return 0
}

function orderedMatch(queryValue, assetValue, levels) {
  if (!queryValue || !assetValue) return null
  if (!(queryValue in levels) || !(assetValue in levels)) return null
  const diff = Math.abs(levels[queryValue] - levels[assetValue])
  if (diff === 0) return 1
  if (diff === 1) return 0.66
  if (diff === 2) return 0.33
  return 0
}

export function themeDomainScore(queryDomain, assetDomain, policy) {
  const table = policy.themeDomainMatch?.[queryDomain]
  if (!table) return 0
  return table[assetDomain] ?? 0
}

export function modelEffectivenessScore(candidate, targetModel, policy) {
  if (!targetModel) return policy.selection.unknownModelEffectivenessScore
  const stats = candidate.modelEffectiveness?.[targetModel]
  if (!stats || (stats.ratedUses ?? 0) < policy.externalQuality.minimumRatedUsesForModelEffect) {
    return policy.selection.unknownModelEffectivenessScore
  }
  const human = (stats.meanHumanScore ?? 2.5) / 5
  const edit = 1 - Math.min(1, Math.max(0, stats.meanEditRatio ?? 0.5))
  return 0.7 * human + 0.3 * edit
}

export function scoreCandidate(candidate, query, policy) {
  const weights = policy.scoring
  const missing = policy.selection.missingFieldScore
  const levels = policy.orderedLevels
  const parts = {}

  const sceneJ = jaccard(query.sceneFunctions?.length ? query.sceneFunctions : [query.primarySceneFunction], candidate.classification.sceneFunction)
  parts.sceneFunction = sceneJ == null ? missing : sceneJ

  parts.pov = singleMatch(query.pov, candidate.classification.pov)
  if (parts.pov == null) parts.pov = missing

  parts.narrativeDistance = singleMatch(query.narrativeDistance, candidate.classification.narrativeDistance)
  if (parts.narrativeDistance == null) parts.narrativeDistance = missing

  for (const key of ['tensionLevel', 'actionDensity', 'dialogueDensity', 'psychologicalDensity']) {
    const scored = orderedMatch(query[key], candidate.classification[key], levels)
    parts[key] = scored == null ? missing : scored
  }

  parts.informationRelease = singleMatch(query.informationRelease, candidate.classification.informationRelease)
  if (parts.informationRelease == null) parts.informationRelease = missing

  parts.sentenceRhythm = singleMatch(query.sentenceRhythm, candidate.classification.sentenceRhythm)
  if (parts.sentenceRhythm == null) parts.sentenceRhythm = missing

  const worldJ = jaccard(query.worldType ? [query.worldType] : [], candidate.classification.worldTypes)
  parts.worldType = worldJ == null ? missing : worldJ

  parts.themeDomain = themeDomainScore(query.themeDomain, candidate.themeDomain, policy)

  // themeDomain is adaptation, not quality; quality is separate
  parts.userQuality = typeof candidate.userQuality === 'number' ? candidate.userQuality : policy.externalQuality.unratedArticleScore
  parts.modelEffectiveness = modelEffectivenessScore(candidate, query.targetModel, policy)

  const sourcePrior = policy.sourcePrior[candidate.assetType] ?? 0.4
  parts.assetQuality = sourcePrior

  let score = 0
  const explanation = []
  for (const [key, weight] of Object.entries(weights)) {
    const value = parts[key] ?? missing
    score += weight * value
    explanation.push(`${key}=${value.toFixed(3)}*${weight}`)
  }

  // restraint function soft boost via sceneFunction bucket already; additional jaccard as note only
  const restraintJ = jaccard(query.restraintFunctions ?? [], candidate.classification.restraintFunctions ?? [])
  if (restraintJ != null) explanation.push(`restraintFunctionsJaccard=${restraintJ.toFixed(3)}`)

  return {
    score,
    parts,
    sourcePrior,
    explanation,
  }
}
