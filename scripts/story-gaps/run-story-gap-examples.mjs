import { classifyGaps, getRetrievalBudget, originalityRisk, transitionCandidate } from './story-gap-contract.mjs'

const base = { intentionalBlank: false, coverage: { opening: true, transition: true, ending: true } }
const proposed = { candidateId: 'gap-candidate-example', status: 'proposed' }
const accepted = transitionCandidate(proposed, 'accepted')
const expanded = transitionCandidate(accepted, 'expanded')

console.log(JSON.stringify({
  node: { gaps: classifyGaps({ ...base, coverage: { ...base.coverage, transition: false } }), candidateRange: [3, 5] },
  series: { gaps: classifyGaps({ ...base, functionFingerprints: ['押送|途中逃脱', '押送|途中逃脱'] }), candidateRange: [5, 8] },
  world: { reportFirst: true, candidateRange: [8, 12], retrieval: getRetrievalBudget('deep', '世界级内容分析') },
  noExternalKnowledge: getRetrievalBudget('off'),
  lightExternalKnowledge: getRetrievalBudget('light'),
  approval: { proposed: proposed.status, accepted: accepted.status, expanded: expanded.status },
  originality: { directCopy: originalityRisk({ copiedCharacterRun: 160, sourceCount: 1 }), recomposed: originalityRisk({ copiedCharacterRun: 0, sourceCount: 3, causalOrderChanged: true }) }
}, null, 2))
