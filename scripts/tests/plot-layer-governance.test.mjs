import test from 'node:test'
import assert from 'node:assert/strict'
import { proposePlotLayer } from '../plot-layer/lib/propose.mjs'
import { sortProposals, summarizeQueue, nextPendingProposal } from '../plot-layer/lib/queue.mjs'
import { planMigration } from '../plot-layer/lib/workflow.mjs'

function entry(partial) {
  return {
    id: 'plot-999',
    number: '999',
    groupId: 'plot-group-001',
    title: '测试',
    summary: '占位',
    worldBiases: [],
    characters: ['璃落'],
    isUsed: false,
    usageStatus: 'unused',
    usedBy: [],
    usedByLabels: [],
    notes: '',
    development: {
      premise: '测试前提足够长',
      escalation: '测试升级足够长',
      turn: '测试转折足够长',
      consequence: '测试后果足够长'
    },
    plotKind: 'ordinary',
    ragRefs: [],
    ...partial
  }
}

test('noun-like legacy occupation prefers split-plot-and-rag', () => {
  const proposal = proposePlotLayer(
    entry({
      id: 'plot-058',
      title: '火车乘务员',
      summary: '由旧 specialGameplay「职业-火车乘务员」迁移；具体场景、过程与结果以关联故事正文为准。',
      plotKind: 'mixed',
      usageStatus: 'used',
      isUsed: true,
      usedBy: ['world-1-glimmering-glance-snow-train'],
      characters: []
    }),
    { storyNodes: [], ragCards: [], groups: [] }
  )
  assert.equal(proposal.recommendation, 'split-plot-and-rag')
  assert.equal(proposal.recommendedLayer, 'plot-and-rag')
  assert.ok(proposal.confidence >= 0.85)
  assert.ok(proposal.proposedRagTarget?.title.includes('火车乘务员'))
})

test('one-time event prefers keep-as-plot', () => {
  const proposal = proposePlotLayer(
    entry({
      id: 'plot-024',
      title: '欣雨-折返救人',
      summary:
        '璃落在海外娱乐场所遭绑架后已经独自脱身，却在转运人群中认出曾经结识的欣雨。她放弃安全离开的机会折返救人，行动失败并负伤被重新抓获，最终与欣雨一同押上运奴船。',
      plotKind: 'restraint',
      characters: ['璃落', '欣雨']
    }),
    { storyNodes: [], ragCards: [], groups: [] }
  )
  assert.equal(proposal.recommendation, 'keep-as-plot')
  assert.equal(proposal.eventTest.hasChangeOrOutcome, true)
})

test('queue sorts obvious RAG before split/uncertain/keep', () => {
  const sorted = sortProposals([
    { sourcePlotId: 'a', recommendation: 'keep-as-plot', confidence: 0.9 },
    { sourcePlotId: 'b', recommendation: 'uncertain', confidence: 0.5 },
    { sourcePlotId: 'c', recommendation: 'move-to-rag', confidence: 0.9 },
    { sourcePlotId: 'd', recommendation: 'split-plot-and-rag', confidence: 0.7 }
  ])
  assert.deepEqual(
    sorted.map((item) => item.sourcePlotId),
    ['c', 'd', 'b', 'a']
  )
})

test('low-confidence uncertain is never treated as auto-migratable plan target', () => {
  const proposal = proposePlotLayer(
    entry({
      title: '奇怪碎片',
      summary: '待定。',
      characters: [],
      development: {
        premise: '尚不明确的前提文本',
        escalation: '尚不明确的升级文本',
        turn: '尚不明确的转折文本',
        consequence: '尚不明确的后果文本'
      }
    }),
    { storyNodes: [], ragCards: [], groups: [] }
  )
  assert.equal(proposal.recommendation, 'uncertain')
  const plan = planMigration(proposal, 'move-to-rag')
  assert.equal(plan.note.includes('untouched'), true)
})

test('plot groups are not formal plot entries in summary helpers', () => {
  const summary = summarizeQueue([
    { recommendation: 'move-to-rag' },
    { recommendation: 'keep-as-plot' },
    { recommendation: 'uncertain' }
  ])
  assert.equal(summary.total, 3)
  assert.equal(summary.obviousMoveToRag, 1)
  assert.equal(summary.keepAsPlot, 1)
  assert.equal(summary.uncertain, 1)
})

test('next pending ignores deferred and migrated', () => {
  const next = nextPendingProposal({
    items: [
      { sourcePlotId: 'plot-001', reviewStatus: 'migrated' },
      { sourcePlotId: 'plot-002', reviewStatus: 'deferred' },
      { sourcePlotId: 'plot-003', reviewStatus: 'proposed' }
    ]
  })
  assert.equal(next.sourcePlotId, 'plot-003')
})
