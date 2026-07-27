/**
 * Chinese display labels for Style-RAG taxonomy → 写法名词 graph nodes.
 * Taxonomy enums remain authoritative in project-navigation/style-taxonomy.json.
 */

export const STYLE_TAXONOMY_DIMENSIONS = Object.freeze([
  'sceneFunctions',
  'themeDomains',
  'restraintFunctions',
  'pov',
  'narrativeDistance',
  'informationRelease',
  'sentenceRhythm',
  'emotionExpression',
  'sensoryPriority',
  'endingMode',
  'languageIntensity'
]);

export const STYLE_DIMENSION_LABELS = Object.freeze({
  sceneFunctions: '场景功能',
  themeDomains: '适用域',
  restraintFunctions: '紧缚写法功能',
  pov: '叙述视角',
  narrativeDistance: '叙事距离',
  informationRelease: '信息披露',
  sentenceRhythm: '句式节奏',
  emotionExpression: '情绪表达',
  sensoryPriority: '感官优先',
  endingMode: '收束方式',
  languageIntensity: '语言强度'
});

export const STYLE_VALUE_LABELS = Object.freeze({
  sceneFunctions: {
    'daily-interaction': '日常互动',
    'exploration-investigation': '探索调查',
    'tension-action': '紧张行动',
    'restricted-action-escape': '受限行动与逃脱',
    'dialogue-conflict': '对话冲突',
    'suspense-supernatural': '悬疑灵异',
    'world-atmosphere': '世界氛围',
    'discovery-reveal': '发现与揭示',
    'aftermath-recovery': '事后恢复',
    'chapter-transition': '章节过渡'
  },
  themeDomains: {
    'restraint-themed': '紧缚题材写法域',
    'general-prose': '一般散文写法域',
    mixed: '混合写法域',
    unknown: '未定适用域'
  },
  restraintFunctions: {
    none: '无紧缚功能',
    'background-element': '背景元素',
    'restricted-movement': '行动受限',
    'capture-confinement': '捕获与拘禁',
    'escape-attempt': '逃脱尝试',
    'performance-or-challenge': '表演或挑战',
    'daily-social-system': '日常社会制度',
    'psychological-tension': '心理张力',
    'technical-spatial-description': '技术与空间描写',
    mixed: '混合功能'
  },
  pov: {
    'first-person': '第一人称',
    'second-person': '第二人称',
    'third-person-limited': '第三人称有限',
    'third-person-omniscient': '第三人称全知',
    mixed: '混合视角',
    unknown: '视角未知'
  },
  narrativeDistance: {
    intimate: '极近',
    close: '近',
    medium: '中',
    distant: '远',
    unknown: '距离未知'
  },
  informationRelease: {
    'front-loaded': '前置披露',
    progressive: '渐进披露',
    delayed: '延迟披露',
    fragmented: '碎片披露',
    unknown: '披露未知'
  },
  sentenceRhythm: {
    short: '短句为主',
    medium: '中句为主',
    long: '长句为主',
    'short-medium-alternating': '短中交替',
    varied: '节奏多变',
    unknown: '节奏未知'
  },
  emotionExpression: {
    'internal-monologue': '内心独白',
    'observable-reaction': '可观察反应',
    subtext: '潜台词',
    'direct-statement': '直接陈述',
    mixed: '混合表达'
  },
  sensoryPriority: {
    visual: '视觉优先',
    auditory: '听觉优先',
    tactile: '触觉优先',
    olfactory: '嗅觉优先',
    spatial: '空间感优先',
    bodily: '身体感优先',
    temperature: '温度感优先',
    kinesthetic: '动觉优先'
  },
  endingMode: {
    closed: '闭合收束',
    open: '开放收束',
    cliffhanger: '悬念收束',
    aftermath: '余波收束',
    unknown: '收束未知'
  },
  languageIntensity: {
    restrained: '克制',
    moderate: '适中',
    intense: '强烈',
    unknown: '强度未知'
  }
});

export function styleDimensionLabel(dimensionKey) {
  return STYLE_DIMENSION_LABELS[dimensionKey] || dimensionKey;
}

export function styleValueLabel(dimensionKey, value) {
  return STYLE_VALUE_LABELS[dimensionKey]?.[value] || value;
}

export function styleTechniqueNodeId(dimensionKey, value) {
  return `style_rag:tech:${dimensionKey}:${value}`;
}

export function styleDimensionNodeId(dimensionKey) {
  return `style_rag:dim:${dimensionKey}`;
}

export function styleEvidenceNodeId(articleId) {
  return `style_rag:evidence:${articleId}`;
}
