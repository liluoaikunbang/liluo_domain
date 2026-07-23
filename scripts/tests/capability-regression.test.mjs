import test from 'node:test'
import assert from 'node:assert/strict'

import { scoreEvalCase } from '../evals/lib/score-eval-case.mjs'
import { validateEvalSystem } from '../evals/validate-eval-registry.mjs'

const baseCase = {
  id: 'fixture-case',
  expected: {
    requiredSkills: ['required-skill'],
    allowedSkills: [],
    forbiddenSkills: ['forbidden-skill'],
    requiredAgents: [],
    forbiddenAgents: [],
    requiredReadPaths: [],
    allowedReadPaths: [],
    requiredWritePaths: [],
    allowedWritePaths: ['docs/'],
    forbiddenActions: ['自动推送'],
    requiredValidationProfiles: ['workflow'],
    forbiddenValidationProfiles: ['all'],
    approvalExpectation: 'not-required',
  },
}

const passingOutput = {
  caseId: 'fixture-case',
  selectedSkills: ['required-skill'],
  selectedAgents: [],
  filesToRead: ['AGENTS.md'],
  writeScopes: ['docs/技能说明/'],
  plannedActions: ['更新说明'],
  forbiddenActionsRecognized: ['自动推送'],
  validationProfiles: ['workflow'],
  needsApproval: false,
  approvalReason: '',
  confidence: 'high',
}

test('structured routing decisions pass without comparing prose', () => {
  assert.equal(scoreEvalCase(baseCase, passingOutput).pass, true)
})

test('a forbidden Skill hit fails the scorer', () => {
  const result = scoreEvalCase(baseCase, {
    ...passingOutput,
    selectedSkills: ['required-skill', 'forbidden-skill'],
  })
  assert.equal(result.pass, false)
  assert.deepEqual(result.failures.find((failure) => failure.field === 'selectedSkills'), {
    field: 'selectedSkills',
    kind: 'forbidden-hit',
    values: ['forbidden-skill'],
  })
})

test('write scope expansion and oversized validation fail independently', () => {
  const result = scoreEvalCase(baseCase, {
    ...passingOutput,
    writeScopes: ['src/game/'],
    validationProfiles: ['workflow', 'all'],
  })
  assert.equal(result.pass, false)
  assert.ok(result.failures.some((failure) => failure.kind === 'outside-allowed-scope'))
  assert.ok(result.failures.some((failure) => failure.field === 'validationProfiles'))
})

test('a fault-injected broken Skill reference fails static validation', async () => {
  const root = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  const registry = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../../evals/registry.json', import.meta.url), 'utf8'))
  registry.targets[0] = { ...registry.targets[0], path: '.agents/skills/liluo-project/does-not-exist/SKILL.md' }
  const result = await validateEvalSystem(root, { registry })
  assert.equal(result.pass, false)
  assert.ok(result.errors.some((error) => error.check === 'target-path'))
})
