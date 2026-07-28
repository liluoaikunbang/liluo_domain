/**
 * Hierarchy seed for ordinary RAG (上位类别 → 具体概念).
 * This is NOT a graph node type and NOT a second lore DB.
 * Association graph projects hierarchy onto RAG cards and links
 * story / plot / gameplay directly to RAG — no concept lane.
 */

export const CONCEPT_LAYERS = Object.freeze({
  CATEGORY: 'category',
  CONCEPT: 'concept'
});

export const CONCEPT_LAYER_LABELS = Object.freeze({
  category: '上位类别',
  concept: '具体概念'
});

export const SEEDED_CONCEPTS = Object.freeze([
  // --- 上位类别 ---
  {
    conceptId: 'restraint.upper-body.restricted',
    canonicalName: '上肢受限',
    aliases: ['手臂受限', '上身受限'],
    layer: 'category',
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '上肢活动范围被限制的上位状态类别；可下挂普通后手缚、并肘、高手小缚、后手观音等具体形态。'
  },
  {
    conceptId: 'restraint.pose.fixed',
    canonicalName: '固定姿态',
    aliases: ['定姿', '强制姿势'],
    layer: 'category',
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '身体被固定在某一可识别姿态上的上位类别。'
  },
  {
    conceptId: 'restraint.escape.attempt',
    canonicalName: '脱困尝试',
    aliases: ['挣脱', '尝试脱困'],
    layer: 'category',
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '角色尝试恢复行动权或退出受限状态的上位情节类别。'
  },

  // --- 具体概念：上肢受限 ---
  {
    conceptId: 'restraint.pose.houshou-common',
    canonicalName: '普通后手缚',
    aliases: ['普通反绑', '常规后手'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '双手置于身后的基础后手形态，不含并肘或高手小缚等更具体识别点。'
  },
  {
    conceptId: 'restraint.pose.houshou-bingzhou',
    canonicalName: '后手并肘',
    aliases: ['欧式并肘', '并肘反绑'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '双肘在身后靠拢或并合的可识别后手姿态；俗称欧式并肘。'
  },
  {
    conceptId: 'restraint.pose.houshou-gaoshou-xiaofu',
    canonicalName: '后手高手小缚',
    aliases: ['日式束缚', '高手小缚', '后手高手'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '双手抬高贴背、以小范围腕臂固定为识别点的后手姿态；俗称日式束缚。'
  },
  {
    conceptId: 'restraint.pose.houshou-guanyin',
    canonicalName: '后手观音',
    aliases: ['后手观音式', '观音反手'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '双手于身后特定相对位置形成的可识别紧缚姿态细节。'
  },
  {
    conceptId: 'restraint.term.wuhuada-bang',
    canonicalName: '五花大绑',
    aliases: ['五花绑', '中式五花大绑'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '综合性上身反绑称呼，对应外部知识术语卡。'
  },
  {
    conceptId: 'restraint.detail.wrist-relative',
    canonicalName: '手腕相对位置',
    aliases: ['手腕位置'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '描述双腕叠压、并拢或交叉等相对关系。'
  },
  {
    conceptId: 'restraint.detail.arm-orientation',
    canonicalName: '手臂朝向',
    aliases: ['手臂方向'],
    layer: 'concept',
    parentConcepts: ['restraint.upper-body.restricted'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '描述手臂相对躯干朝向的细节概念。'
  },

  // --- 具体概念：固定姿态 ---
  {
    conceptId: 'restraint.detail.mobility-range',
    canonicalName: '身体活动范围',
    aliases: ['活动范围'],
    layer: 'concept',
    parentConcepts: ['restraint.pose.fixed'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '受限状态下身体仍可活动的幅度。'
  },
  {
    conceptId: 'restraint.detail.anchor-relation',
    canonicalName: '固定关系',
    aliases: ['固定点类型', '锚点关系'],
    layer: 'concept',
    parentConcepts: ['restraint.pose.fixed'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '身体与固定点、家具或环境的连接关系。'
  },

  // --- 具体概念：脱困尝试 ---
  {
    conceptId: 'restraint.detail.state-change',
    canonicalName: '状态变化',
    aliases: ['受限状态变化'],
    layer: 'concept',
    parentConcepts: ['restraint.escape.attempt'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '受限强度、姿态或退出条件随情节推进发生的变化。'
  },
  {
    conceptId: 'restraint.pattern.voluntary-entry-loss-of-control',
    canonicalName: '送绑玩脱',
    aliases: ['送绑', '玩脱', '主动入局后失控'],
    layer: 'concept',
    parentConcepts: ['restraint.escape.attempt'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '主动进入受限后失去退出权的情节模式概念。'
  },
  {
    conceptId: 'restraint.pattern.rescue-without-agency',
    canonicalName: '获救但未恢复行动权',
    aliases: ['获救未恢复', '营救后仍受限'],
    layer: 'concept',
    parentConcepts: ['restraint.escape.attempt'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '外部威胁解除后，身体仍保持受限、行动权未同步恢复。'
  }
]);

export function getSeededConceptById(conceptId) {
  return SEEDED_CONCEPTS.find((concept) => concept.conceptId === conceptId) ?? null;
}

export function listGraphVisibleConcepts(concepts = SEEDED_CONCEPTS) {
  return concepts.filter((concept) => concept.visibility?.graph !== false);
}

export function listCategoryConcepts(concepts = SEEDED_CONCEPTS) {
  return concepts.filter((concept) => resolveConceptLayer(concept) === CONCEPT_LAYERS.CATEGORY);
}

export function listDetailConcepts(concepts = SEEDED_CONCEPTS) {
  return concepts.filter((concept) => resolveConceptLayer(concept) === CONCEPT_LAYERS.CONCEPT);
}

export function resolveConceptLayer(concept) {
  if (concept?.layer === CONCEPT_LAYERS.CATEGORY || concept?.layer === CONCEPT_LAYERS.CONCEPT) {
    return concept.layer;
  }
  return asArray(concept?.parentConcepts).length === 0
    ? CONCEPT_LAYERS.CATEGORY
    : CONCEPT_LAYERS.CONCEPT;
}

export function conceptLayerLabel(layer) {
  return CONCEPT_LAYER_LABELS[layer] || layer || '';
}

export function validateConceptHierarchy(concepts = SEEDED_CONCEPTS) {
  const errors = [];
  const byId = new Map();
  for (const concept of concepts) {
    if (!concept?.conceptId) {
      errors.push('concept missing conceptId');
      continue;
    }
    if (byId.has(concept.conceptId)) {
      errors.push(`duplicate conceptId: ${concept.conceptId}`);
    }
    byId.set(concept.conceptId, concept);
  }

  for (const concept of byId.values()) {
    const layer = resolveConceptLayer(concept);
    const parents = asArray(concept.parentConcepts);

    if (layer === CONCEPT_LAYERS.CATEGORY) {
      if (parents.length > 0) {
        errors.push(`上位类别 ${concept.conceptId} 不得挂 parentConcepts（当前仅允许两层）`);
      }
      continue;
    }

    if (parents.length === 0) {
      errors.push(`具体概念 ${concept.conceptId} 必须至少挂一个上位类别`);
      continue;
    }

    for (const parentId of parents) {
      const parent = byId.get(parentId);
      if (!parent) {
        errors.push(`具体概念 ${concept.conceptId} 的父概念不存在: ${parentId}`);
        continue;
      }
      if (resolveConceptLayer(parent) !== CONCEPT_LAYERS.CATEGORY) {
        errors.push(
          `具体概念 ${concept.conceptId} 的父概念 ${parentId} 必须是上位类别（禁止三层以上）`
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
