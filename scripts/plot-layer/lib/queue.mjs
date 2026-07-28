import { RECOMMENDATION_PRIORITY } from './paths.mjs'

export function sortProposals(proposals) {
  return [...proposals].sort((a, b) => {
    const pa = RECOMMENDATION_PRIORITY[a.recommendation] ?? 99
    const pb = RECOMMENDATION_PRIORITY[b.recommendation] ?? 99
    if (pa !== pb) return pa - pb
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    return String(a.sourcePlotId).localeCompare(String(b.sourcePlotId))
  })
}

export function summarizeQueue(proposals) {
  const counts = {
    'move-to-rag': 0,
    'merge-into-existing-rag': 0,
    'split-plot-and-rag': 0,
    'promote-to-story': 0,
    uncertain: 0,
    'merge-into-existing-plot': 0,
    archive: 0,
    'keep-as-plot': 0
  }
  for (const item of proposals) {
    if (counts[item.recommendation] === undefined) counts[item.recommendation] = 0
    counts[item.recommendation] += 1
  }
  return {
    total: proposals.length,
    obviousMoveToRag:
      counts['move-to-rag'] + counts['merge-into-existing-rag'],
    splitCandidates: counts['split-plot-and-rag'],
    promoteToStoryCandidates: counts['promote-to-story'],
    keepAsPlot: counts['keep-as-plot'],
    uncertain: counts.uncertain,
    other:
      counts.archive + counts['merge-into-existing-plot'],
    byRecommendation: counts
  }
}

export function nextPendingProposal(queueDoc) {
  // Only undecided proposals block the front of the user confirmation queue.
  // decision-recorded / confirmed (dry-run) wait for explicit apply; deferred/migrated are done.
  const pending = (queueDoc.items ?? []).filter((item) =>
    ['proposed', undefined, null].includes(item.reviewStatus)
  )
  return pending[0] ?? null
}

export function applyReviewStatus(queueDoc, plotId, status, extra = {}) {
  const items = queueDoc.items ?? []
  const index = items.findIndex((item) => item.sourcePlotId === plotId)
  if (index < 0) throw new Error(`queue missing plot ${plotId}`)
  items[index] = {
    ...items[index],
    ...extra,
    reviewStatus: status,
    updatedAt: new Date().toISOString()
  }
  return { ...queueDoc, items, updatedAt: new Date().toISOString() }
}
