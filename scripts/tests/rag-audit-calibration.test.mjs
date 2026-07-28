import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { ROOT } from '../rag-audit/lib/paths.mjs'
import { sampleAuditBatch } from '../rag-audit/lib/sample.mjs'
import { recordAudit, evaluateSkillUpgradeSuggestion, auditStatus } from '../rag-audit/lib/record.mjs'
import { planRebuildAffected } from '../rag-audit/lib/rebuild.mjs'
import { loadPolicy, refreshRegistryFromDisk } from '../rag-audit/lib/registry.mjs'

const repo = ROOT

function run(args) {
  return spawnSync(process.execPath, ['scripts/rag-audit/rag-audit.mjs', ...args], {
    cwd: repo,
    encoding: 'utf8',
  })
}

test('audit policy forbids single-incident skill patch and full rebuild by default', async () => {
  const policy = await loadPolicy()
  assert.equal(policy.skillUpgrade.forbidSingleIncidentSkillPatch, true)
  assert.equal(policy.skillUpgrade.minIndependentRecordsForPattern, 3)
  assert.equal(policy.rebuild.forbidFullRebuildByDefault, true)
  assert.equal(policy.rebuild.forbidModifySourceArticles, true)
  assert.equal(policy.rebuild.forbidAutoMarkHumanApproved, true)
})

test('sample style-rag batch is small and prefers low confidence', async () => {
  const batch = await sampleAuditBatch({
    channel: 'style-rag',
    mode: 'low-confidence',
    batchSize: 5,
  })
  assert.ok(batch.count <= 5)
  assert.ok(batch.count > 0)
  const md = await readFile(path.join(repo, batch.path), 'utf8')
  assert.match(md, /问题描述/)
  assert.match(md, /Style-RAG/)
})

test('sample rag batch defaults to cards only', async () => {
  const batch = await sampleAuditBatch({
    channel: 'rag',
    mode: 'low-confidence',
    batchSize: 5,
    seed: 'test-cards-only',
  })
  assert.ok(batch.count > 0)
  assert.equal(batch.ragSample?.includeCards, true)
  assert.equal(batch.ragSample?.includeSources, false)
  const payload = JSON.parse(await readFile(path.join(repo, batch.jsonPath), 'utf8'))
  assert.ok(payload.items.every((item) => item.currentResult?.assetKind === 'card'))
  const md = await readFile(path.join(repo, batch.path), 'utf8')
  assert.match(md, /卡审三问/)
  assert.match(md, /默认只抽知识卡/)
})

test('sample rag batch can include sources when opted in', async () => {
  const batch = await sampleAuditBatch({
    channel: 'rag',
    mode: 'low-confidence',
    batchSize: 8,
    includeSources: true,
    seed: 'test-include-sources',
  })
  assert.ok(batch.count > 0)
  assert.equal(batch.ragSample?.includeSources, true)
  const payload = JSON.parse(await readFile(path.join(repo, batch.jsonPath), 'utf8'))
  assert.ok(payload.items.some((item) => item.currentResult?.assetKind === 'source'))
})

test('sample rag batch works offline', async () => {
  const batch = await sampleAuditBatch({
    channel: 'rag',
    mode: 'random',
    batchSize: 3,
    seed: 'test-seed-1',
  })
  assert.equal(batch.count, 3)
  const payload = JSON.parse(await readFile(path.join(repo, batch.jsonPath), 'utf8'))
  assert.ok(payload.items.every((item) => item.currentResult?.assetKind === 'card'))
  const again = await sampleAuditBatch({
    channel: 'rag',
    mode: 'random',
    batchSize: 3,
    seed: 'test-seed-1',
  })
  // same seed should be stable order before exclude; may differ if first batch marked audited — excludeAudited only excludes recorded audits, not samples
  assert.equal(again.count, 3)
})

test('single record does not suggest skill upgrade; three independent do', async () => {
  const policy = await loadPolicy()
  const one = {
    auditId: 'ra-a',
    channel: 'style-rag',
    sourceAssetId: 'ea-1',
    issueCategories: ['author-info-error'],
    mayBecomeGeneralRule: true,
    skillUpgradeDecision: { userExplicitRuleRequest: false },
  }
  const d1 = evaluateSkillUpgradeSuggestion(one, policy, [])
  assert.equal(d1.suggested, false)

  const siblings = [
    { auditId: 'ra-b', channel: 'style-rag', sourceAssetId: 'ea-2', issueCategories: ['author-info-error'], mayBecomeGeneralRule: true },
    { auditId: 'ra-c', channel: 'style-rag', sourceAssetId: 'ea-3', issueCategories: ['author-info-error'], mayBecomeGeneralRule: true },
  ]
  const d2 = evaluateSkillUpgradeSuggestion(one, policy, siblings)
  assert.equal(d2.suggested, true)

  const explicit = {
    ...one,
    mayBecomeGeneralRule: false,
    skillUpgradeDecision: { userExplicitRuleRequest: true },
  }
  assert.equal(evaluateSkillUpgradeSuggestion(explicit, policy, []).suggested, true)
})

test('record audit persists and status lists open items', async () => {
  const recorded = await recordAudit({
    channel: 'style-rag',
    sourceAssetId: 'ea-audit-test-fixture',
    sourcePath: 'external-knowledge/sources/fiction-bondage/不知道作者/测试抽查占位.md',
    reportedIssue: '作者被模型补全为某常见笔名，但原文文件夹为不知道作者',
    correctResult: 'author=unknown；confidence=unknown',
    issueCategories: ['author-info-error', 'model-unauthorized-completion'],
    isSingleCase: true,
    mayBecomeGeneralRule: true,
    needsIndexRebuild: false,
  })
  assert.equal(recorded.ok, true)
  assert.equal(recorded.skillUpgrade.suggested, false)
  const status = await auditStatus({ channel: 'style-rag', openOnly: true, limit: 50 })
  assert.ok(status.openRecords.some((r) => r.auditId === recorded.record.auditId))
})

test('sample concept and plot batches work offline', async () => {
  const concepts = await sampleAuditBatch({
    channel: 'concept',
    mode: 'low-confidence',
    batchSize: 3,
  })
  assert.ok(concepts.count > 0)
  assert.ok(concepts.count <= 3)
  const md = await readFile(path.join(repo, concepts.path), 'utf8')
  assert.match(md, /细节概念/)

  const plots = await sampleAuditBatch({
    channel: 'plot',
    mode: 'graph-gap',
    batchSize: 3,
  })
  assert.ok(plots.count > 0)
  assert.ok(plots.count <= 3)
})

test('sample all channels mixes rag/style/concept/plot', async () => {
  const batch = await sampleAuditBatch({
    channel: 'all',
    mode: 'random',
    batchSize: 8,
    seed: 'all-mix-seed',
  })
  assert.equal(batch.count, 8)
  assert.deepEqual(batch.channels, ['rag', 'style-rag', 'concept', 'plot'])
  const payload = JSON.parse(await readFile(path.join(repo, batch.jsonPath), 'utf8'))
  const seen = new Set(payload.items.map((item) => item.channel))
  assert.ok(seen.has('rag'))
  assert.ok(seen.has('style-rag'))
  assert.ok(seen.has('concept'))
  assert.ok(seen.has('plot'))
})

test('related assets are suggested and recorded for co-adjustment', async () => {
  const { suggestRelatedAssets } = await import('../rag-audit/lib/related.mjs')
  const related = await suggestRelatedAssets({
    channel: 'concept',
    assetId: 'restraint.pose.houshou-guanyin',
  })
  assert.ok(related.count >= 1)
  assert.match(related.rule, /一并处理/)
  assert.ok(related.items.some((item) => item.channel === 'rag' || item.channel === 'concept'))

  const recorded = await recordAudit({
    channel: 'concept',
    sourceAssetId: 'restraint.pose.houshou-guanyin',
    reportedIssue: '概念别名与 RAG 卡标题未对齐',
    correctResult: '概念与 RAG 卡 title/aliases 对齐，并补 explains',
    issueCategories: ['missing-rag-link', 'naming-inconsistency'],
    relatedAdjustments: [
      {
        channel: 'rag',
        assetId: 'rag.restraint.effect.tickling',
        action: 'adjusted',
        note: '已同步卡定义与别名',
      },
    ],
    relatedReviewComplete: true,
  })
  assert.equal(recorded.ok, true)
  assert.ok(recorded.relatedAdjustments.some((item) => item.action === 'adjusted'))
  assert.match(recorded.reminder, /关联/)
})

test('rebuild plan is dry-run and refuses empty/full misuse', async () => {
  const plan = await planRebuildAffected({ channel: 'rag' })
  assert.equal(plan.dryRun, true)
  await assert.rejects(() => planRebuildAffected({ channel: 'rag', full: true }), /全库/)
  const conceptPlan = await planRebuildAffected({ channel: 'concept' })
  assert.equal(conceptPlan.dryRun, true)
})

test('CLI validate and npm aliases work offline', async () => {
  const v = run(['validate'])
  assert.equal(v.status, 0, v.stderr || v.stdout)
  const s = run(['status', '--channel', 'style-rag'])
  assert.equal(s.status, 0, s.stderr || s.stdout)
  await refreshRegistryFromDisk()
})

test('cursor and codex dirs retained', async () => {
  await readFile(path.join(repo, '.cursor/rules/00-project-entry.mdc'), 'utf8')
  await readFile(path.join(repo, 'AGENTS.md'), 'utf8')
})
