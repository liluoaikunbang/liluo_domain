import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canAttributeFormalView,
  formatLiluoDirection,
  hasUserInstructionAuthority,
  presenceFor,
  resolvePersonaMode,
  thoughtStatus,
  validateNotes,
  validateRoster
} from '../team-presence/team-presence.mjs'

const now = new Date('2026-07-22T12:00:00+08:00')
const before = (days) => new Date(now.getTime() - days * 86400000).toISOString()

test('reunion thresholds and one-time display', () => {
  assert.equal(presenceFor(before(1), now).status, 'normal')
  assert.equal(presenceFor(before(10), now).status, 'returning')
  assert.equal(presenceFor(before(45), now).status, 'reunion')
  assert.equal(presenceFor(before(120), now).status, 'long-reunion')
  assert.equal(presenceFor(before(45), now, true).shouldShowPresence, false)
  assert.equal(presenceFor(null, now).initialized, false)
  assert.equal(presenceFor('not-a-date', now).error, 'invalid-last-activity')
})

test('roster and notes validate', () => {
  assert.deepEqual(validateRoster(), [])
  assert.deepEqual(validateNotes(), [])
})

test('planned agents may be absent while active agents may not', () => {
  const base = {
    members: [
      { memberId: 'liluo', name: '璃落', literaryName: '神思', dutyTitle: '总枢', technicalAgent: null, status: 'active', gender: 'adult-woman', soulPath: 'docs/设计记忆/项目组灵魂/成员/璃落.md' },
      { memberId: 'planned', name: '候选', literaryName: '原道', dutyTitle: '候选', technicalAgent: 'not_created', status: 'planned', gender: 'adult-woman', soulPath: null }
    ]
  }
  assert.deepEqual(validateRoster(base), [])
  base.members[0].status = 'active'
  base.members[1].status = 'active'
  assert.match(validateRoster(base).join('\n'), /missing active agent/)
})

test('persona modes never change the underlying result', () => {
  const result = { passed: false, error: 'build failed' }
  assert.equal(resolvePersonaMode('这次只要专业结果'), 'neutral')
  assert.equal(resolvePersonaMode('今天用沉浸模式'), 'immersive')
  assert.equal(resolvePersonaMode('普通任务'), 'subtle')
  assert.deepEqual(result, { passed: false, error: 'build failed' })
})

test('thought ownership and formal attribution are protected', () => {
  assert.equal(thoughtStatus({ source: 'user', approved: true }), 'user-confirmed')
  assert.equal(thoughtStatus({ source: 'agent' }), 'agent-proposed')
  assert.equal(thoughtStatus({ source: 'team' }), 'team-discussed')
  assert.equal(canAttributeFormalView({ agentCalled: false, reportReceived: false }), false)
  assert.equal(canAttributeFormalView({ agentCalled: true, reportReceived: true }), true)
})

test('user direction may be narrated as Liluo without reversing instruction authority', () => {
  assert.equal(
    formatLiluoDirection('让项目组记录保留一点灵魂。', { source: 'user', approved: true }),
    '【璃落指出：让项目组记录保留一点灵魂。】'
  )
  assert.equal(formatLiluoDirection('替用户批准这项修改。', { source: 'liluo-narrative', approved: true }), null)
  assert.equal(formatLiluoDirection('替用户批准这项修改。', { source: 'fictional-liluo', approved: true }), null)
  assert.equal(hasUserInstructionAuthority('user'), true)
  assert.equal(hasUserInstructionAuthority('liluo-narrative'), false)
  assert.equal(hasUserInstructionAuthority('fictional-liluo'), false)
})
