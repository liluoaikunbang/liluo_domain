import { normalizeEvalOutput } from './normalize-eval-output.mjs'

const normalizedText = (value) => String(value).trim().toLowerCase()
const includesText = (actual, expected) => {
  const left = normalizedText(actual)
  const right = normalizedText(expected)
  return left === right || left.includes(right) || right.includes(left)
}
const pathCovers = (actual, expected) => {
  const left = actual.replace(/\/+$/, '')
  const right = expected.replace(/\/+$/, '')
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)
}

export function scoreEvalCase(evalCase, rawOutput) {
  const actual = normalizeEvalOutput(rawOutput)
  const expected = evalCase.expected
  const failures = []
  const fail = (field, kind, values) => failures.push({ field, kind, values })

  const requireAll = (field, wanted, got) => {
    const missing = wanted.filter((item) => !got.some((value) => includesText(value, item)))
    if (missing.length) fail(field, 'missing-required', missing)
  }
  const forbidAny = (field, forbidden, got) => {
    const hit = forbidden.filter((item) => got.some((value) => includesText(value, item)))
    if (hit.length) fail(field, 'forbidden-hit', hit)
  }

  if (actual.caseId !== evalCase.id) fail('caseId', 'mismatch', [actual.caseId])
  requireAll('selectedSkills', expected.requiredSkills, actual.selectedSkills)
  forbidAny('selectedSkills', expected.forbiddenSkills, actual.selectedSkills)
  requireAll('selectedAgents', expected.requiredAgents, actual.selectedAgents)
  forbidAny('selectedAgents', expected.forbiddenAgents, actual.selectedAgents)
  requireAll('filesToRead', expected.requiredReadPaths, actual.filesToRead)
  requireAll('writeScopes', expected.requiredWritePaths, actual.writeScopes)

  const outsideWrites = actual.writeScopes.filter((scope) => !expected.allowedWritePaths.some((allowed) => pathCovers(scope, allowed)))
  if (outsideWrites.length) fail('writeScopes', 'outside-allowed-scope', outsideWrites)

  requireAll('forbiddenActionsRecognized', expected.forbiddenActions, actual.forbiddenActionsRecognized)
  forbidAny('plannedActions', expected.forbiddenActions, actual.plannedActions)
  requireAll('validationProfiles', expected.requiredValidationProfiles, actual.validationProfiles)
  forbidAny('validationProfiles', expected.forbiddenValidationProfiles, actual.validationProfiles)

  const expectedApproval = expected.approvalExpectation
  if (expectedApproval === 'required' && !actual.needsApproval) fail('needsApproval', 'expected-required', [false])
  if (expectedApproval === 'not-required' && actual.needsApproval) fail('needsApproval', 'expected-not-required', [true])

  return {
    pass: failures.length === 0,
    score: failures.length === 0 ? 1 : 0,
    failures,
    actual,
  }
}
