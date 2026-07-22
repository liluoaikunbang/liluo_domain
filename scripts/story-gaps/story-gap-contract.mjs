import fs from 'node:fs'
import path from 'node:path'

const scoreKeys = ['projectFit', 'gapCoverage', 'novelty', 'productionFeasibility', 'continuityRisk', 'sourceDependenceRisk']
const statuses = new Set(['proposed', 'accepted', 'accepted-with-changes', 'held', 'rejected', 'merged', 'expanded', 'written'])

export function shouldTriggerStoryGapDiscovery(request) {
  if (/已经完整|完整故事|直接写入|修复.*(代码|地图|存档|加载)|查询.*既有设定/.test(request)) return false
  return /(缺少什么|缺口|补充.*候选|候选灵感|尚未使用|外部库.*模式|故事.*重复|大纲.*空缺|新支线)/.test(request)
}

export function classifyGaps(input) {
  if (input.intentionalBlank) return []
  const gaps = []
  if (input.coverage?.opening === false) gaps.push('structure:opening')
  if (input.coverage?.transition === false) gaps.push('structure:transition')
  if (input.coverage?.ending === false) gaps.push('structure:ending')
  if ((input.definedGameplay ?? []).some((item) => !(input.usedGameplay ?? []).includes(item))) gaps.push('gameplay:unused')
  const fingerprints = input.functionFingerprints ?? []
  if (new Set(fingerprints).size < fingerprints.length) gaps.push('redundancy:repeated-function')
  return gaps
}

export function getRetrievalBudget(mode = 'light', reason = '') {
  if (mode === 'off') return { externalCards: 0, sourceSummaries: 0, sourcePassages: 0, candidateLimit: 5 }
  if (mode === 'light') return { externalCards: 5, sourceSummaries: 5, sourcePassages: 3, candidateLimit: 5 }
  if (mode === 'deep') {
    if (!reason.trim()) throw new Error('deep retrieval requires a reason')
    return { externalCards: 12, sourceSummaries: 10, sourcePassages: 6, candidateLimit: 12 }
  }
  throw new Error(`unknown retrieval mode: ${mode}`)
}

export function validateCandidateCard(candidate, root = process.cwd()) {
  const errors = []
  if (!/^gap-candidate-[a-z0-9-]+$/.test(candidate.candidateId ?? '')) errors.push('invalid candidateId')
  if (!statuses.has(candidate.status)) errors.push('invalid status')
  if (!['node', 'series', 'world'].includes(candidate.scope?.mode)) errors.push('invalid scope mode')
  if (!candidate.title || !candidate.coreIdea || !(candidate.gapTypes?.length)) errors.push('missing required candidate content')
  if (!(candidate.differenceFromExisting?.length)) errors.push('missing differenceFromExisting')
  if (!(candidate.approvalOptions?.length)) errors.push('missing approvalOptions')
  for (const evidence of candidate.gapEvidence ?? []) {
    if (!evidence.path || path.isAbsolute(evidence.path) || !fs.existsSync(path.join(root, evidence.path))) errors.push(`invalid evidence path: ${evidence.path ?? ''}`)
  }
  for (const key of scoreKeys) {
    const value = candidate.scores?.[key]
    if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`invalid score ${key}`)
  }
  if (!['low', 'medium', 'high'].includes(candidate.sourceAbstraction?.directSourceDependence)) errors.push('invalid directSourceDependence')
  if (!['small', 'medium', 'large'].includes(candidate.estimatedScope)) errors.push('invalid estimatedScope')
  return errors
}

export function validateCandidateSet(candidates, root = process.cwd()) {
  const errors = candidates.flatMap((candidate) => validateCandidateCard(candidate, root).map((error) => `${candidate.candidateId ?? 'unknown'}: ${error}`))
  const ids = candidates.map((candidate) => candidate.candidateId).filter(Boolean)
  for (const id of new Set(ids.filter((value, index) => ids.indexOf(value) !== index))) errors.push(`duplicate candidateId: ${id}`)
  return errors
}

export function transitionCandidate(candidate, nextStatus, options = {}) {
  if (!statuses.has(nextStatus)) throw new Error(`unknown candidate status: ${nextStatus}`)
  const accepted = new Set(['accepted', 'accepted-with-changes', 'expanded'])
  if (nextStatus === 'expanded' && !accepted.has(candidate.status)) throw new Error('candidate must be accepted before expansion')
  if (nextStatus === 'written' && (candidate.status !== 'expanded' || !options.storyKey)) throw new Error('written candidate requires expanded status and storyKey')
  return { ...candidate, status: nextStatus, ...(nextStatus === 'written' ? { storyKey: options.storyKey } : {}) }
}

export function shouldSuppressCandidate(candidate, history = []) {
  const fingerprint = [...(candidate.conceptFingerprint ?? [])].sort().join('|')
  return history.some((item) => item.decision === 'rejected' && item.targetKey === candidate.targetKey && [...(item.conceptFingerprint ?? [])].sort().join('|') === fingerprint)
}

export function originalityRisk(input) {
  if ((input.copiedCharacterRun ?? 0) >= 120 || input.renamedOnly) return 'high'
  if (input.genericTermsOnly) return 'low'
  if ((input.sourceCount ?? 0) >= 2 && input.causalOrderChanged) return 'low'
  return 'medium'
}
