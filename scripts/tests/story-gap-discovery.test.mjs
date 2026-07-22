import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  classifyGaps,
  getRetrievalBudget,
  originalityRisk,
  shouldSuppressCandidate,
  shouldTriggerStoryGapDiscovery,
  transitionCandidate,
  validateCandidateCard,
  validateCandidateSet,
} from '../story-gaps/story-gap-contract.mjs'

const nodeCases = JSON.parse(fs.readFileSync(new URL('./fixtures/story-gaps/node-cases.json', import.meta.url), 'utf8'))

test('routes gap discovery requests and excludes unrelated or already-authored work', () => {
  assert.equal(shouldTriggerStoryGapDiscovery('分析这个世界还缺少什么故事'), true)
  assert.equal(shouldTriggerStoryGapDiscovery('给这个节点补充三张候选灵感卡'), true)
  assert.equal(shouldTriggerStoryGapDiscovery('从外部库找尚未使用的场景模式'), true)
  assert.equal(shouldTriggerStoryGapDiscovery('检查这条故事线是不是太重复'), true)
  assert.equal(shouldTriggerStoryGapDiscovery('修复这个节点前后衔接的故事缺口'), true)
  assert.equal(shouldTriggerStoryGapDiscovery('修复地图加载代码'), false)
  assert.equal(shouldTriggerStoryGapDiscovery('查询节点 4.1 的既有设定'), false)
  assert.equal(shouldTriggerStoryGapDiscovery('情节已经完整，请直接写入大纲'), false)
})

test('identifies evidence-shaped gaps without forcing complete or intentional blanks', () => {
  for (const fixture of nodeCases) assert.deepEqual(classifyGaps(fixture), fixture.expected, fixture.id)
})

test('enforces retrieval budgets for off, light and justified deep modes', () => {
  assert.deepEqual(getRetrievalBudget('light'), { externalCards: 5, sourceSummaries: 5, sourcePassages: 3, candidateLimit: 5 })
  assert.equal(getRetrievalBudget('off').externalCards, 0)
  assert.throws(() => getRetrievalBudget('deep'), /reason/)
  assert.equal(getRetrievalBudget('deep', '世界级分析').candidateLimit, 12)
})

test('validates candidate cards, evidence paths, score directions and field contracts', () => {
  const candidate = {
    candidateId: 'gap-candidate-modern-001', status: 'proposed',
    scope: { mode: 'node', targetKey: '1-modern:test', targetTitle: '测试节点' },
    title: '移动环境观察', gapTypes: ['structure:transition'],
    gapEvidence: [{ path: 'AGENTS.md', ref: '项目核心约束' }], coreIdea: '用移动探索承接相邻节点。', storyFunction: ['transition'],
    projectAdaptation: { world: 'modern', characters: ['璃落'], locations: [], gameplay: ['observation'], maps: [], events: [], cgOpportunities: [], stateChanges: [] },
    differenceFromExisting: ['不采用重复的途中逃脱'],
    sourceAbstraction: { usedExternalKnowledge: false, externalPatterns: [], sourceRefs: [], directSourceDependence: 'low' },
    scores: { projectFit: 5, gapCoverage: 4, novelty: 4, productionFeasibility: 4, continuityRisk: 1, sourceDependenceRisk: 1 },
    estimatedScope: 'small', approvalOptions: ['accept', 'accept-with-changes', 'hold', 'reject', 'merge']
  }
  assert.deepEqual(validateCandidateCard(candidate), [])
  candidate.scores.continuityRisk = 6
  assert.match(validateCandidateCard(candidate).join('\n'), /score/)
})

test('rejects duplicate candidate IDs and incomplete differentiation contracts', () => {
  const card = JSON.parse(fs.readFileSync(new URL('./fixtures/story-gaps/valid-candidate.json', import.meta.url), 'utf8'))
  assert.match(validateCandidateSet([card, card]).join('\n'), /duplicate candidateId/)
  card.differenceFromExisting = []
  card.approvalOptions = []
  assert.match(validateCandidateCard(card).join('\n'), /differenceFromExisting/)
  assert.match(validateCandidateCard(card).join('\n'), /approvalOptions/)
})

test('gates candidate approval and tracks written story keys', () => {
  const proposed = { candidateId: 'gap-candidate-1', status: 'proposed' }
  assert.throws(() => transitionCandidate(proposed, 'expanded'), /accepted/)
  const accepted = transitionCandidate(proposed, 'accepted')
  const expanded = transitionCandidate(accepted, 'expanded')
  assert.throws(() => transitionCandidate(expanded, 'written'), /storyKey/)
  assert.equal(transitionCandidate(expanded, 'written', { storyKey: '1-modern:demo' }).storyKey, '1-modern:demo')
  assert.equal(transitionCandidate(proposed, 'held').status, 'held')
  assert.equal(transitionCandidate(proposed, 'rejected').status, 'rejected')
})

test('suppresses identical rejected concepts without banning the whole topic', () => {
  const history = [{ decision: 'rejected', targetKey: 'demo', conceptFingerprint: ['押送', '移动牢笼', '途中逃脱'] }]
  assert.equal(shouldSuppressCandidate({ targetKey: 'demo', conceptFingerprint: ['途中逃脱', '押送', '移动牢笼'] }, history), true)
  assert.equal(shouldSuppressCandidate({ targetKey: 'demo', conceptFingerprint: ['公开审判', '关系反转'] }, history), false)
})

test('flags copied and rename-only external dependence while allowing abstract recomposition', () => {
  assert.equal(originalityRisk({ copiedCharacterRun: 160, renamedOnly: false, sourceCount: 1, causalOrderChanged: false }), 'high')
  assert.equal(originalityRisk({ copiedCharacterRun: 0, renamedOnly: true, sourceCount: 1, causalOrderChanged: false }), 'high')
  assert.equal(originalityRisk({ copiedCharacterRun: 0, renamedOnly: false, sourceCount: 3, causalOrderChanged: true }), 'low')
  assert.equal(originalityRisk({ copiedCharacterRun: 0, renamedOnly: false, sourceCount: 0, causalOrderChanged: false, genericTermsOnly: true }), 'low')
})
