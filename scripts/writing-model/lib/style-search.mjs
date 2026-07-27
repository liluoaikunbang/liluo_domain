import { filterEligible } from './style-eligibility.mjs'
import { scoreCandidate } from './style-scoring.mjs'
import { selectDiverse } from './style-diversity.mjs'
import { assembleStylePack } from './style-pack.mjs'
import { explainSearchResult } from './style-explain.mjs'
import { collectStyleCandidates } from './style-registry.mjs'
import { validateStyleQuery, validateScoringWeights, loadStyleRagPolicy } from './style-query.mjs'
import { loadWritingSheet, renderWritingSheetText } from './writing-sheet.mjs'
import { loadStyleTaxonomy } from './style-query.mjs'

export async function runStyleSearch(query, options = {}) {
  const policy = options.policy ?? (await loadStyleRagPolicy())
  const taxonomy = options.taxonomy ?? (await loadStyleTaxonomy())
  const weightCheck = validateScoringWeights(policy)
  if (!weightCheck.ok) throw new Error(weightCheck.errors.join('; '))

  const queryCheck = await validateStyleQuery(query, taxonomy)
  if (!queryCheck.ok) throw new Error(queryCheck.errors.join('; '))

  const ctx = await collectStyleCandidates()
  let workingQuery = { ...query }

  if (workingQuery.mode === 'explicit' || workingQuery.mode === 'hybrid-explicit') {
    // explicit IDs always considered first; hybrid still scores metadata pool
  }

  const eligibility = filterEligible(ctx.candidates, workingQuery, policy, { mode: workingQuery.mode })
  const scored = eligibility.map((row) => {
    if (workingQuery.mode === 'explicit') {
      return {
        ...row,
        score: row.eligible ? 1 : 0,
        scoreDetail: { explanation: ['explicit-reference'] },
      }
    }
    const detail = scoreCandidate(row.candidate, workingQuery, policy)
    return { ...row, score: detail.score, scoreDetail: detail }
  })

  // hybrid: force-include eligible explicit refs even if below threshold by boosting
  if (workingQuery.mode === 'hybrid-explicit') {
    const explicit = new Set(workingQuery.explicitReferenceIds ?? [])
    for (const row of scored) {
      if (explicit.has(row.candidate.assetId) && row.eligible) {
        row.score = Math.max(row.score, policy.selection.minimumScore)
        row.scoreDetail.explanation.push('explicit-boost')
      }
    }
  }

  const { selected, rejected } = selectDiverse(scored, workingQuery, policy)
  const explanations = explainSearchResult({ query: workingQuery, selected, rejected, policy })

  return {
    query: workingQuery,
    selected,
    rejected,
    explanations,
    policyId: policy.policyId,
    candidateCount: ctx.candidates.length,
    eligibleCount: scored.filter((s) => s.eligible).length,
  }
}

export async function runStylePack(query, options = {}) {
  const search = await runStyleSearch(query, options)
  const policy = options.policy ?? (await loadStyleRagPolicy())
  const sheet = await loadWritingSheet()
  const sheetText = renderWritingSheetText(sheet)
  const pack = await assembleStylePack({
    query,
    selected: search.selected,
    policy,
    writingSheetText: sheetText,
  })
  return { search, pack }
}
