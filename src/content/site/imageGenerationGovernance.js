export const imageRuleKinds = {
  identity: '角色或主体身份',
  worldStyle: '世界风格',
  composition: '构图与镜头',
  batchProfile: '批次或资产画像',
  safety: '公开安全边界',
  qa: '成图复核',
  promptStructure: '提示词组织',
}

export const imageRuleScopes = {
  'global-character': '全局角色',
  world: '世界层',
  'asset-type': '资产类型',
  batch: '批次层',
  'single-entry': '单条目',
}

export const imageRulePersistenceLevels = {
  'long-term': '长期规则',
  'batch-term': '批次规则',
  'one-off': '一次性规则',
  pending: '待确认候选',
}

export const imageRuleEnforcementModes = {
  'authority-only': '只进权威字段',
  'prompt-only': '只进提示词组装',
  'qa-only': '只做成图后复核',
  'authority+prompt': '权威字段 + 提示词组装',
  'prompt+qa': '提示词组装 + 成图复核',
  'authority+prompt+qa': '权威字段 + 提示词组装 + 成图复核',
}

export const imageGenerationWritebackLanes = {
  authority: '权威源',
  consumer: '直接消费者',
  generated: '生成型写回',
}

export const imagePromptAssemblyLayers = [
  {
    id: 'task',
    title: '任务层',
    description: '先说明这张图要解决什么用途、页面任务或资产职责，而不是一上来堆细节。',
  },
  {
    id: 'subject',
    title: '主体层',
    description: '再说明主体是谁、当前动作是什么，以及哪些身份锚点不能丢。',
  },
  {
    id: 'world',
    title: '世界层',
    description: '把世界气质、空间关系、材质和生活痕迹接进来，让画面不脱离宇宙语境。',
  },
  {
    id: 'composition',
    title: '构图层',
    description: '明确景别、机位、朝向、裁切和留白，决定模型把重点放在哪里。',
  },
  {
    id: 'light-and-material',
    title: '光线材质层',
    description: '只补足会显著影响结果的光线、色温、反射、材质与表面状态。',
  },
  {
    id: 'safety',
    title: '安全边界层',
    description: '压入公开安全、非幼态、不冒充实机、不写死额外 canon 等高价值边界。',
  },
  {
    id: 'qa',
    title: '复核层',
    description: '把更适合看成图后判断的规则留在 QA，不把所有东西都塞回提示词。',
  },
]

export const imageRulePlacementQuestions = [
  '这条反馈纠正的是事实身份、画面强调点、批次画像，还是成图后的质量问题？',
  '它影响的是全局角色、某个世界、某类资产、某个批次，还是只影响这一张图？',
  '它是长期有效、只在当前批次成立、只对这一次成立，还是还不能稳定表述？',
  '它最应该落在权威字段、提示词组装、成图 QA，还是先停留在待确认账本里？',
]

export const imageRuleNarrowingPolicy = [
  '能放单图就先别升成批次规则。',
  '能放批次规则就先别升成全局规则。',
  '能做 QA 的问题先别污染所有提示词。',
  '还不能写成绝对描述的反馈，只能停留在待确认账本。',
]

const enforcementApplications = {
  'authority-only': { authority: true, prompt: false, qa: false },
  'prompt-only': { authority: false, prompt: true, qa: false },
  'qa-only': { authority: false, prompt: false, qa: true },
  'authority+prompt': { authority: true, prompt: true, qa: false },
  'prompt+qa': { authority: false, prompt: true, qa: true },
  'authority+prompt+qa': { authority: true, prompt: true, qa: true },
}

export const liluoIdentityAnchorRules = {
  core: [
    {
      id: 'adult-age',
      label: '年龄与成年边界',
      patterns: [/18\s*岁/u, /刚成年的成年女性/u, /young adult woman/iu, /adult woman/iu, /18-year-old adult/iu, /eighteen[- ]year[- ]old adult/iu],
    },
    {
      id: 'hair-color',
      label: '浅红棕发色锚点',
      patterns: [/浅红棕/u, /红棕.*发/u, /偏绯红/u, /reddish[- ]brown hair/iu, /red[- ]brown hair/iu, /crimson auburn hair/iu, /auburn hair/iu],
    },
    {
      id: 'eye-color',
      label: '红色瞳色锚点',
      patterns: [/红色瞳孔/u, /红瞳/u, /red eyes/iu, /crimson eyes/iu],
    },
    {
      id: 'non-infantile',
      label: '非幼态边界',
      patterns: [/不幼态/u, /非幼态/u, /not childlike/iu, /not juvenile/iu, /not infantilized/iu, /adult-coded/iu],
    },
  ],
  extended: [
    {
      id: 'stature',
      label: '娇小身高锚点',
      patterns: [/150\s*cm/iu, /娇小/u, /petite/iu, /small stature/iu],
    },
    {
      id: 'figure',
      label: '自然曲线与轻微丰润感',
      patterns: [/自然曲线/u, /轻微丰润/u, /natural curves/iu, /slightly soft silhouette/iu, /soft adult silhouette/iu],
    },
    {
      id: 'face-shape',
      label: '柔和鹅蛋脸',
      patterns: [/鹅蛋脸/u, /oval face/iu, /rounded oval face/iu, /not sharp[- ]chinned/iu, /not pointy[- ]chinned/iu],
    },
    {
      id: 'adult-feature-proportion',
      label: '年轻成年感五官比例',
      patterns: [
        /五官比例.*年轻成年感/u,
        /成年感五官比例/u,
        /不过大的眼睛/u,
        /不使用过大的眼睛/u,
        /不使用过短中庭/u,
        /adult facial proportions/iu,
        /youthful adult facial proportions/iu,
        /not oversized eyes/iu,
        /not baby[- ]faced/iu,
      ],
    },
  ],
}

function hasAnyPattern(patterns, text) {
  return patterns.some((pattern) => pattern.test(text))
}

function collectMissingAnchorLabels(rules, text) {
  return rules.filter((rule) => !hasAnyPattern(rule.patterns, text)).map((rule) => rule.label)
}

function uniqueOrdered(values) {
  return [...new Set(values.filter(Boolean))]
}

export function detectLiluoReference(text = '', subjectHints = []) {
  const combined = `${text} ${subjectHints.join(' ')}`
  return /(?:璃落|Liluo)/iu.test(combined)
}

export function resolveImageRuleApplications(enforcement) {
  return enforcementApplications[enforcement] || { authority: false, prompt: false, qa: false }
}

export function inferImagePromptLayer(ruleKind) {
  switch (ruleKind) {
    case 'identity':
      return 'subject'
    case 'worldStyle':
    case 'batchProfile':
      return 'world'
    case 'composition':
    case 'promptStructure':
      return 'composition'
    case 'safety':
      return 'safety'
    case 'qa':
      return 'qa'
    default:
      return 'task'
  }
}

export function validateImageRuleCard(card) {
  const errors = []
  const warnings = []

  if (!card.id) errors.push('missing id')
  if (!card.date) errors.push('missing date')
  if (!imageRuleKinds[card.ruleKind]) errors.push(`unknown ruleKind: ${card.ruleKind}`)
  if (!imageRuleScopes[card.scopeLevel]) errors.push(`unknown scopeLevel: ${card.scopeLevel}`)
  if (!imageRulePersistenceLevels[card.persistence]) errors.push(`unknown persistence: ${card.persistence}`)
  if (!imageRuleEnforcementModes[card.enforcement]) errors.push(`unknown enforcement: ${card.enforcement}`)
  if (!Array.isArray(card.abstractedTraits) || !card.abstractedTraits.length) errors.push('abstractedTraits must be a non-empty array')
  if (!Array.isArray(card.negativeExamples) || !card.negativeExamples.length) errors.push('negativeExamples must be a non-empty array')
  if (!card.promotionGate) errors.push('missing promotionGate')

  const applications = resolveImageRuleApplications(card.enforcement)
  const writebackTargets = card.writebackTargets || {}
  const writebackCount = ['character', 'worlds', 'prompts', 'qa'].reduce((total, key) => {
    const value = writebackTargets[key]
    return total + (Array.isArray(value) ? value.length : 0)
  }, 0)

  if (applications.prompt && (!Array.isArray(card.promptEffects) || !card.promptEffects.length)) {
    errors.push('prompt-enabled rule cards must provide promptEffects')
  }

  if (applications.authority && writebackCount === 0) {
    errors.push('authority-enabled rule cards must provide writebackTargets')
  }

  if (card.persistence === 'pending' && applications.authority) {
    errors.push('pending rule cards cannot write back to authority')
  }

  if ((card.persistence === 'one-off' || card.scopeLevel === 'single-entry') && applications.authority) {
    errors.push('single-entry or one-off rules cannot write back to long-term authority')
  }

  if ((card.scopeLevel === 'global-character' || card.scopeLevel === 'world') && card.persistence === 'long-term' && !applications.authority) {
    warnings.push('long-term global rules usually need authority writeback')
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    applications,
    promptLayer: inferImagePromptLayer(card.ruleKind),
  }
}

export function createImageRuleCard(input) {
  const report = validateImageRuleCard(input)
  if (!report.ok) {
    throw new Error(`Invalid image rule card ${input.id || '(missing-id)'}: ${report.errors.join('; ')}`)
  }
  return {
    ...input,
    applications: report.applications,
    promptLayer: report.promptLayer,
  }
}

export function buildImageGenerationExecutionPlan({
  ruleCards = [],
  includeDirectConsumers = false,
  generatedCommands = [],
  knownEpermCommands = [],
} = {}) {
  const normalizedCards = ruleCards.filter(Boolean)
  const applications = normalizedCards.reduce((state, card) => {
    const current = resolveImageRuleApplications(card.enforcement)
    return {
      authority: state.authority || current.authority,
      prompt: state.prompt || current.prompt,
      qa: state.qa || current.qa,
    }
  }, { authority: false, prompt: false, qa: false })

  const activePromptLayers = uniqueOrdered(
    normalizedCards
      .filter((card) => resolveImageRuleApplications(card.enforcement).prompt)
      .map((card) => card.promptLayer || inferImagePromptLayer(card.ruleKind)),
  )

  return {
    activePromptLayers,
    omitUnmatchedLongTermRules: true,
    writebackOrder: ['authority', 'consumer', 'generated'],
    lanes: {
      authority: {
        enabled: applications.authority,
        mode: 'patch-source-first',
      },
      consumer: {
        enabled: includeDirectConsumers,
        mode: includeDirectConsumers ? 'patch-direct-consumers-after-authority' : 'skip',
      },
      generated: {
        enabled: generatedCommands.length > 0,
        mode: generatedCommands.length ? 'run-once-at-end' : 'skip',
        commands: generatedCommands.map((command) => ({
          command,
          route: knownEpermCommands.includes(command) ? 'require-escalated-first' : 'normal',
        })),
      },
    },
    tokenGuardrails: [
      '只把命中的 authority / prompt / QA 规则带入本次任务。',
      '先看统计、字段和少量样本，再开定向原文。',
      '生成型写回放到任务末尾一次执行，不把同步拆成多轮重跑。',
    ],
  }
}

export function runImagePromptGovernancePreflight({
  prompt,
  subjectHints = [],
  strictness = 'standard',
} = {}) {
  const normalizedPrompt = String(prompt || '').trim()
  const errors = []
  const warnings = []

  if (!normalizedPrompt) {
    errors.push('Prompt is empty.')
  }

  if (/\{\{|\$\{|\bTODO\b/u.test(normalizedPrompt)) {
    errors.push('Prompt still contains placeholders or TODO markers.')
  }

  const isLiluoPrompt = detectLiluoReference(normalizedPrompt, subjectHints)
  const combined = `${normalizedPrompt} ${subjectHints.join(' ')}`
  const missingCoreLiluoAnchors = isLiluoPrompt ? collectMissingAnchorLabels(liluoIdentityAnchorRules.core, combined) : []
  const missingExtendedLiluoAnchors = isLiluoPrompt ? collectMissingAnchorLabels(liluoIdentityAnchorRules.extended, combined) : []

  if (isLiluoPrompt) {
    if (strictness === 'canonical-liluo') {
      if (missingCoreLiluoAnchors.length) {
        errors.push(`Liluo prompt is missing core identity anchors: ${missingCoreLiluoAnchors.join('、')}.`)
      }
      if (missingExtendedLiluoAnchors.length) {
        errors.push(`Liluo prompt is missing extended figure anchors: ${missingExtendedLiluoAnchors.join('、')}.`)
      }
    } else if (strictness === 'liluo-live') {
      if (missingCoreLiluoAnchors.length) {
        errors.push(`Liluo live prompt is missing core identity anchors: ${missingCoreLiluoAnchors.join('、')}.`)
      }
      if (missingExtendedLiluoAnchors.length) {
        warnings.push(`Liluo live prompt should also补齐这些体态锚点: ${missingExtendedLiluoAnchors.join('、')}.`)
      }
    } else if (missingCoreLiluoAnchors.length || missingExtendedLiluoAnchors.length) {
      warnings.push(
        `Liluo prompt still lacks some project anchors. Core: ${
          missingCoreLiluoAnchors.length ? missingCoreLiluoAnchors.join('、') : '无'
        }；Extended: ${missingExtendedLiluoAnchors.length ? missingExtendedLiluoAnchors.join('、') : '无'}。`,
      )
    }
  }

  if (normalizedPrompt.length < 40) {
    warnings.push('Prompt is very short; confirm that task, scene, composition, and safety boundaries are explicit enough.')
  }

  return {
    status: errors.length ? 'blocked' : warnings.length ? 'needs-review' : 'ok',
    detectedSubject: isLiluoPrompt ? 'liluo' : 'generic',
    strictness,
    promptLayerOrder: imagePromptAssemblyLayers.map((item) => item.id),
    errors,
    warnings,
    missingAnchors: {
      core: missingCoreLiluoAnchors,
      extended: missingExtendedLiluoAnchors,
    },
  }
}
