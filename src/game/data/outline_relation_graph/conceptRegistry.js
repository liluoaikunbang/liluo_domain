/**
 * Seeded detail-concept registry for the outline relation graph.
 * These are a semantic connection layer — not a second master lore DB.
 * visibility.primary_tag=false concepts stay out of main Tag filters but remain
 * searchable and graph-visible.
 */

export const SEEDED_CONCEPTS = Object.freeze([
  {
    conceptId: 'restraint.arms.behind-back',
    canonicalName: '身后束手',
    aliases: ['反绑', '背后束手'],
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '上肢被限制在身后的上位姿态概念。'
  },
  {
    conceptId: 'restraint.upper-body.restricted',
    canonicalName: '上肢受限',
    aliases: ['手臂受限', '上身受限'],
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '上肢活动范围被限制的上位状态概念。'
  },
  {
    conceptId: 'restraint.pose.fixed',
    canonicalName: '固定姿态',
    aliases: ['定姿', '强制姿势'],
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '身体被固定在某一可识别姿态上。'
  },
  {
    conceptId: 'restraint.escape.attempt',
    canonicalName: '脱困尝试',
    aliases: ['挣脱', '尝试脱困'],
    parentConcepts: [],
    visibility: {
      primaryTag: true,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '角色尝试恢复行动权或退出受限状态。'
  },
  {
    conceptId: 'restraint.pose.houshou-guanyin',
    canonicalName: '后手观音',
    aliases: ['后手观音式', '观音反手'],
    parentConcepts: ['restraint.arms.behind-back', 'restraint.upper-body.restricted'],
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
    conceptId: 'restraint.detail.arm-orientation',
    canonicalName: '手臂朝向',
    aliases: ['手臂方向'],
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
  {
    conceptId: 'restraint.detail.wrist-relative',
    canonicalName: '手腕相对位置',
    aliases: ['手腕位置'],
    parentConcepts: ['restraint.arms.behind-back'],
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
    conceptId: 'restraint.detail.mobility-range',
    canonicalName: '身体活动范围',
    aliases: ['活动范围'],
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
  {
    conceptId: 'restraint.detail.state-change',
    canonicalName: '状态变化',
    aliases: ['受限状态变化'],
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
    conceptId: 'restraint.term.wuhuada-bang',
    canonicalName: '五花大绑',
    aliases: ['五花绑', '中式五花大绑'],
    parentConcepts: ['restraint.upper-body.restricted', 'restraint.arms.behind-back'],
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
    conceptId: 'restraint.pattern.voluntary-entry-loss-of-control',
    canonicalName: '送绑玩脱',
    aliases: ['送绑', '玩脱', '主动入局后失控'],
    parentConcepts: ['restraint.escape.attempt'],
    visibility: {
      primaryTag: false,
      detailPanel: true,
      graph: true,
      searchable: true,
      ragRetrievable: true
    },
    summary: '主动进入受限后失去退出权的情节模式概念。'
  }
]);

export function getSeededConceptById(conceptId) {
  return SEEDED_CONCEPTS.find((concept) => concept.conceptId === conceptId) ?? null;
}

export function listGraphVisibleConcepts(concepts = SEEDED_CONCEPTS) {
  return concepts.filter((concept) => concept.visibility?.graph !== false);
}
