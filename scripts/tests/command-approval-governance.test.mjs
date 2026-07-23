import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  classifyAuthorizationText,
  classifyRulePattern,
  compareRuleSnapshots,
  createRuleSnapshot,
  parsePrefixRules,
  retireApprovalDecision,
  renderPrefixRule,
  upsertApprovalDecision,
} from '../command-approval/lib/approval-governance.mjs'

test('classifies explicit project, global, session and one-time authorization', () => {
  assert.equal(classifyAuthorizationText('这个项目以后允许这个命令').scope, 'project')
  assert.equal(classifyAuthorizationText('所有项目以后都允许').scope, 'global')
  assert.equal(classifyAuthorizationText('当前会话允许').scope, 'session')
  assert.equal(classifyAuthorizationText('只允许一次').scope, 'once')
})

test('does not persist vague future authorization or temporary approval', () => {
  const vague = classifyAuthorizationText('以后允许这个命令')
  assert.equal(vague.scope, 'ambiguous')
  assert.equal(vague.persist, false)
  assert.equal(vague.requiresConfirmation, true)
  assert.equal(classifyAuthorizationText('这次可以执行').persist, false)
})

test('classifies prompt and forbidden user decisions', () => {
  assert.equal(classifyAuthorizationText('这个项目以后运行这个测试仍然每次询问').decision, 'prompt')
  assert.equal(classifyAuthorizationText('这个项目以后禁止 git push --force').decision, 'forbidden')
})

test('recognizes project-specific, overbroad and dangerous patterns', () => {
  assert.equal(classifyRulePattern(['npm', 'run', 'docs:check-encoding']).classification, 'project-specific')
  assert.equal(classifyRulePattern(['npm', 'run']).classification, 'overbroad')
  assert.equal(classifyRulePattern(['powershell']).classification, 'overbroad')
  assert.equal(classifyRulePattern(['git', 'push']).classification, 'dangerous')
  assert.equal(classifyRulePattern(['npm', 'install']).classification, 'dangerous')
  assert.equal(classifyRulePattern(['npm', 'run', 'release:offline']).classification, 'dangerous')
  assert.equal(classifyRulePattern(['git', 'status']).classification, 'safe-global')
})

test('project-specific npm script is never inferred as global', () => {
  const result = classifyRulePattern(['npm', 'run', 'project:index:status'])
  assert.equal(result.classification, 'project-specific')
  assert.equal(result.recommendedScope, 'project')
})

test('renders exact rules with match and not-match evidence without widening', () => {
  const output = renderPrefixRule({
    decisionId: 'codex-approval-test',
    pattern: ['npm', 'run', 'docs:check-encoding'],
    decision: 'allow',
    justification: '只读文档编码检查。',
    match: ['npm', 'run', 'docs:check-encoding'],
    notMatch: ['npm', 'run', 'docs:check-encoding', '--fix'],
  })
  assert.match(output, /pattern = \["npm", "run", "docs:check-encoding"\]/)
  assert.match(output, /# match:/)
  assert.match(output, /# not_match:/)
  assert.doesNotMatch(output, /pattern = \["npm", "run"\]/)
})

test('snapshot comparison reports only newly added sanitized rules', () => {
  const before = createRuleSnapshot([{ pattern: ['npm', 'run', 'docs:check-encoding'], decision: 'allow' }], '2026-07-21')
  const after = createRuleSnapshot([
    { pattern: ['npm', 'run', 'docs:check-encoding'], decision: 'allow' },
    { pattern: ['npm'], decision: 'allow' },
  ], '2026-07-22')
  const diff = compareRuleSnapshots(before, after)
  assert.equal(diff.added.length, 1)
  assert.equal(diff.added[0].classification, 'overbroad')
  assert.equal(diff.removed.length, 0)
})

test('snapshot redacts private paths and secret-like tokens', () => {
  const snapshot = createRuleSnapshot([
    { pattern: ['tool', 'C:\\Users\\alice\\private.txt'], decision: 'prompt' },
    { pattern: ['tool', 'api_token=secret-value'], decision: 'prompt' },
  ], '2026-07-22')
  const serialized = JSON.stringify(snapshot)
  assert.doesNotMatch(serialized, /alice|secret-value/)
  assert.match(serialized, /private-path|redacted/)
})

test('parses literal TUI rules and expands safe Starlark alternatives without executing them', () => {
  const rules = parsePrefixRules(`
    prefix_rule(pattern = ["npm", "run", ["docs:check-encoding", "project:index:check"]], decision = "allow")
    prefix_rule(pattern = ["git", "push"], decision = "prompt")
  `)
  assert.deepEqual(rules, [
    { pattern: ['npm', 'run', 'docs:check-encoding'], decision: 'allow' },
    { pattern: ['npm', 'run', 'project:index:check'], decision: 'allow' },
    { pattern: ['git', 'push'], decision: 'prompt' },
  ])
})

test('classifies all required TUI always-allow fixture categories without editing the source', async () => {
  const fixtureUrl = new URL('./fixtures/command-approval-user.rules', import.meta.url)
  const before = await readFile(fixtureUrl, 'utf8')
  const snapshot = createRuleSnapshot(parsePrefixRules(before), '2026-07-22')
  assert.deepEqual(new Set(snapshot.rules.map((rule) => rule.classification)), new Set([
    'project-specific', 'overbroad', 'safe-global', 'dangerous',
  ]))
  assert.equal(await readFile(fixtureUrl, 'utf8'), before)
})

test('upsert avoids duplicates and supersedes changed decisions', () => {
  const registry = { schemaVersion: 1, decisions: [] }
  const first = upsertApprovalDecision(registry, {
    scope: 'project', source: 'user-explicit', commandClass: 'project-validation',
    ruleFile: '.codex/rules/routine-development.rules',
    rulePattern: ['npm', 'run', 'docs:check-encoding'], decision: 'allow',
    reason: '用户明确要求项目长期允许', createdAt: '2026-07-22', lastReviewedAt: '2026-07-22',
  })
  const duplicate = upsertApprovalDecision(first.registry, {
    ...first.decision, decisionId: undefined,
  })
  assert.equal(duplicate.registry.decisions.length, 1)

  const changed = upsertApprovalDecision(duplicate.registry, {
    ...first.decision, decisionId: undefined, decision: 'prompt', reason: '用户撤销长期允许',
  })
  assert.equal(changed.registry.decisions.length, 2)
  assert.equal(changed.registry.decisions[0].status, 'superseded')
  assert.equal(changed.registry.decisions[1].supersedes, changed.registry.decisions[0].decisionId)

  const reverted = upsertApprovalDecision(changed.registry, {
    ...first.decision, decisionId: undefined, decision: 'allow', reason: '用户重新允许',
  })
  assert.equal(new Set(reverted.registry.decisions.map((item) => item.decisionId)).size, 3)
})

test('retires an active managed decision without deleting its history', () => {
  const registry = {
    schemaVersion: 1,
    decisions: [{
      decisionId: 'codex-approval-old', scope: 'project', source: 'user-explicit',
      commandClass: 'project-routine', ruleFile: '.codex/rules/project-decisions.rules',
      rulePattern: ['npm', 'run', 'docs:check-encoding'], decision: 'allow',
      reason: 'old', status: 'active', createdAt: '2026-07-21', lastReviewedAt: '2026-07-21',
    }],
  }
  const result = retireApprovalDecision(registry, {
    scope: 'project', rulePattern: ['npm', 'run', 'docs:check-encoding'],
    reason: '用户撤销长期决定', date: '2026-07-22',
  })
  assert.equal(result.registry.decisions.length, 1)
  assert.equal(result.decision.status, 'retired')
  assert.equal(result.decision.retiredAt, '2026-07-22')
})
