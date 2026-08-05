import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildImageGenerationExecutionPlan,
  createImageRuleCard,
  resolveImageRuleApplications,
  runImagePromptGovernancePreflight,
  validateImageRuleCard,
} from '../../src/content/site/imageGenerationGovernance.js'

test('createImageRuleCard accepts a complete long-term authority rule card', () => {
  const card = createImageRuleCard({
    id: 'test-image-rule',
    date: '2026-08-02',
    ruleKind: 'identity',
    scopeLevel: 'global-character',
    persistence: 'long-term',
    enforcement: 'authority+prompt+qa',
    appliesTo: {
      characters: ['liluo'],
      worlds: ['all'],
      collections: ['project-image-generation'],
      aspects: ['age-anchor'],
    },
    writebackTargets: {
      character: ['liluoProfile.summary'],
      prompts: ['buildLiluoIdentityPromptFragment()'],
      qa: ['identity-checklist'],
    },
    rawSummary: '用户要求璃落明确保持成年边界。',
    abstractedTraits: ['璃落固定为刚成年的成年女性，不幼态。'],
    promptEffects: ['璃落相关 prompt 必须显式写入成年与非幼态边界。'],
    negativeExamples: ['只在口头里说“成熟一点”而不写成长期规则'],
    promotionGate: '必须能稳定描述成年边界并给出错例。',
  })

  assert.deepEqual(resolveImageRuleApplications(card.enforcement), {
    authority: true,
    prompt: true,
    qa: true,
  })
  assert.equal(card.promptLayer, 'subject')
})

test('validateImageRuleCard rejects one-off rules that try to write back to authority', () => {
  const report = validateImageRuleCard({
    id: 'bad-rule',
    date: '2026-08-02',
    ruleKind: 'composition',
    scopeLevel: 'single-entry',
    persistence: 'one-off',
    enforcement: 'authority+prompt',
    appliesTo: { characters: ['liluo'], worlds: ['all'], collections: ['single-entry'], aspects: ['composition'] },
    writebackTargets: { character: ['characterShowcaseCompositionRules[]'] },
    rawSummary: '这张图想要稍微往左一点。',
    abstractedTraits: ['本张图左侧留白更多。'],
    promptEffects: ['本张图左侧留白更多。'],
    negativeExamples: ['把这张图的局部留白直接升级成全局构图规则'],
    promotionGate: '只有重复出现才考虑升级。',
  })

  assert.equal(report.ok, false)
  assert.match(report.errors.join(' '), /cannot write back to long-term authority/)
})

test('runImagePromptGovernancePreflight warns on exploratory Liluo drafts and blocks canonical gaps', () => {
  const draft = runImagePromptGovernancePreflight({
    prompt: 'cinematic portrait of Liluo in rain',
    strictness: 'standard',
  })
  assert.equal(draft.status, 'needs-review')
  assert.equal(draft.detectedSubject, 'liluo')
  assert.ok(draft.missingAnchors.core.length > 0)

  const canonical = runImagePromptGovernancePreflight({
    prompt: '璃落在雨里',
    subjectHints: ['璃落'],
    strictness: 'canonical-liluo',
  })
  assert.equal(canonical.status, 'blocked')
  assert.ok(canonical.errors.some((item) => item.includes('core identity anchors')))
})

test('buildImageGenerationExecutionPlan narrows prompt layers and routes known EPERM generators directly', () => {
  const identityRule = createImageRuleCard({
    id: 'identity-rule',
    date: '2026-08-02',
    ruleKind: 'identity',
    scopeLevel: 'global-character',
    persistence: 'long-term',
    enforcement: 'authority+prompt+qa',
    appliesTo: { characters: ['liluo'], worlds: ['all'], collections: ['project-image-generation'], aspects: ['identity'] },
    writebackTargets: { character: ['liluoProfile.summary'], prompts: ['buildLiluoIdentityPromptFragment()'], qa: ['identity-checklist'] },
    rawSummary: '璃落的身份锚点必须稳定进入长期规则。',
    abstractedTraits: ['保持璃落的年龄、发色、瞳色与非幼态边界。'],
    promptEffects: ['单次 prompt 必须显式写出核心身份锚点。'],
    negativeExamples: ['把身份锚点只停留在口头提醒里，不进入长期治理。'],
    promotionGate: '这类规则必须能稳定复用到不同模型与不同资产链路。',
  })

  const qaRule = createImageRuleCard({
    id: 'qa-rule',
    date: '2026-08-02',
    ruleKind: 'qa',
    scopeLevel: 'batch',
    persistence: 'batch-term',
    enforcement: 'qa-only',
    appliesTo: { characters: ['liluo'], worlds: ['all'], collections: ['website-batch'], aspects: ['qa'] },
    writebackTargets: { qa: ['visual-qa-checklist'] },
    rawSummary: '先把裁切问题留在 QA 复核，不直接污染所有提示词。',
    abstractedTraits: ['检查是否把局部裁切做成卖弄身体的镜头。'],
    promptEffects: [],
    negativeExamples: ['把单次裁切缺陷直接升级成所有 prompt 的固定描述。'],
    promotionGate: '只有重复出现且能抽象成稳定镜头约束时才考虑提升层级。',
  })

  const plan = buildImageGenerationExecutionPlan({
    ruleCards: [identityRule, qaRule],
    includeDirectConsumers: true,
    generatedCommands: ['npm run site:visual:audit', 'npm run site:visual:manifest'],
    knownEpermCommands: ['npm run site:visual:audit'],
  })

  assert.deepEqual(plan.activePromptLayers, ['subject'])
  assert.equal(plan.omitUnmatchedLongTermRules, true)
  assert.deepEqual(plan.writebackOrder, ['authority', 'consumer', 'generated'])
  assert.equal(plan.lanes.authority.mode, 'patch-source-first')
  assert.equal(plan.lanes.consumer.mode, 'patch-direct-consumers-after-authority')
  assert.equal(plan.lanes.generated.mode, 'run-once-at-end')
  assert.deepEqual(plan.lanes.generated.commands, [
    { command: 'npm run site:visual:audit', route: 'require-escalated-first' },
    { command: 'npm run site:visual:manifest', route: 'normal' },
  ])
  assert.match(plan.tokenGuardrails.join(' '), /命中的 authority \/ prompt \/ QA 规则/)
})
