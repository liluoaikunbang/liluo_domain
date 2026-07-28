/** Outline relation graph — display-layer constants (not master data). */

export const GRAPH_SCHEMA_VERSION = 1;

export const GRAPH_NODE_TYPES = Object.freeze([
  'story',
  'world',
  'series',
  'plot',
  'gameplay',
  'concept',
  'character',
  'organization',
  'location',
  'item',
  'rag',
  'style_rag'
]);

export const GRAPH_NODE_TYPE_LABELS = Object.freeze({
  story: '故事',
  world: '世界',
  series: '系列',
  plot: '情节',
  gameplay: '玩法',
  character: '人物',
  organization: '组织',
  location: '地点',
  item: '物品',
  rag: '普通 RAG',
  style_rag: 'Style-RAG'
});

/** Lane order for partitioned / swimlane layout. world folds into story tree. */
export const GRAPH_LANE_ORDER = Object.freeze([
  'story',
  'plot',
  'gameplay',
  'character',
  'organization',
  'location',
  'item',
  'rag',
  'style_rag'
]);

/** Map node types onto visual lanes (world/series fold into story). */
export function resolveGraphLaneType(type) {
  if (type === 'series' || type === 'world') return 'story';
  return type;
}

/** Legend node types — world/series folded into 故事; detail-concept lane removed. */
export const GRAPH_LEGEND_NODE_TYPES = Object.freeze(
  GRAPH_NODE_TYPES.filter((type) => type !== 'series' && type !== 'world' && type !== 'concept')
);

export function expandLegendNodeType(type) {
  if (type === 'story') return ['story', 'world', 'series'];
  return [type];
}
export const GRAPH_RELATION_TYPES = Object.freeze([
  'contains',
  'belongs_to',
  'appears_in',
  'involves',
  'participates',
  'located_at',
  'holds',
  'references',
  'explains',
  'style_reference',
  'sourced_from',
  'alias_of',
  'broader',
  'narrower',
  'precedes',
  'follows',
  'conflicts',
  'possibly_related',
  'pending_confirm',
  'concept_link',
  'parent'
]);

export const GRAPH_RELATION_TYPE_LABELS = Object.freeze({
  contains: '包含',
  belongs_to: '属于',
  appears_in: '出现于',
  involves: '涉及',
  participates: '参与',
  located_at: '位于',
  holds: '持有',
  references: '引用',
  explains: '解释',
  style_reference: '表达参考',
  sourced_from: '来源于',
  alias_of: '别名',
  broader: '上位类别',
  narrower: '具体概念',
  precedes: '前置',
  follows: '后续',
  conflicts: '冲突',
  possibly_related: '可能相关',
  pending_confirm: '待确认',
  concept_link: '概念关联',
  parent: '层级 / 包含'
});

/** Relation stroke colors — purple-theme friendly, distinct on dark canvas. */
export const GRAPH_RELATION_COLORS = Object.freeze({
  parent: '#d4c8e8',
  contains: '#d4c8e8',
  belongs_to: '#c8bdd8',
  concept_link: '#e8c45a',
  broader: '#e8d48a',
  narrower: '#e8d48a',
  participates: '#5a9be8',
  involves: '#5a9be8',
  appears_in: '#6aa8f0',
  located_at: '#4a8ad8',
  holds: '#4a8ad8',
  references: '#5ecf8a',
  explains: '#5ecf8a',
  style_reference: '#e86ab8',
  sourced_from: '#9ad87a',
  precedes: '#e8944a',
  follows: '#e8944a',
  conflicts: '#e85a5a',
  pending_confirm: '#e85a5a',
  possibly_related: '#e87878',
  alias_of: '#a8a0b8'
});

export const GRAPH_NODE_COLORS = Object.freeze({
  story: '#9b6bc7',
  world: '#d8b36d',
  series: '#d8b36d',
  plot: '#7a9bc8',
  gameplay: '#6bb89a',
  concept: '#e8d48a',
  character: '#6aa8f0',
  organization: '#4a8ad8',
  location: '#5a9be8',
  item: '#7ab0e0',
  rag: '#5ecf8a',
  style_rag: '#e86ab8'
});

export const GRAPH_CONTENT_GAP_COLOR = '#f2a65a';

export const GRAPH_AUDIT_STATUSES = Object.freeze([
  'confirmed',
  'auto_generated',
  'pending_review',
  'low_confidence',
  'conflict',
  'missing_source',
  'orphan',
  'missing_rag',
  'missing_style_rag',
  'relation_pending'
]);

export const GRAPH_AUDIT_STATUS_LABELS = Object.freeze({
  confirmed: '已人工确认',
  auto_generated: '自动生成',
  pending_review: '待抽查',
  low_confidence: '低置信度',
  conflict: '存在冲突',
  missing_source: '缺少来源',
  orphan: '孤立节点',
  missing_rag: '有分层种子但无 RAG',
  missing_style_rag: '有情节但无 Style-RAG',
  relation_pending: '关系待确认'
});

export const GRAPH_MODES = Object.freeze(['overview', 'focus', 'filter', 'summary']);

export const GRAPH_MODE_LABELS = Object.freeze({
  overview: '全图',
  focus: '聚焦',
  filter: '筛选',
  summary: '汇总'
});

export const GRAPH_LAYOUT_PRESETS = Object.freeze(['structure', 'aesthetic']);

export const GRAPH_LAYOUT_PRESET_LABELS = Object.freeze({
  structure: '结构优先',
  aesthetic: '美观优先'
});

export const GRAPH_FILTER_PRESETS = Object.freeze([
  { id: 'plot-character', label: '只看情节与人物', nodeTypes: ['plot', 'character'], relationTypes: null },
  { id: 'plot-location', label: '只看情节与地点', nodeTypes: ['plot', 'location'], relationTypes: null },
  { id: 'plot-hierarchy', label: '只看大情节 / 小情节', nodeTypes: ['plot'], relationTypes: ['contains'] },
  { id: 'gameplay-hierarchy', label: '只看大玩法 / 小玩法', nodeTypes: ['gameplay'], relationTypes: ['belongs_to'] },
  { id: 'rag-hierarchy', label: '只看普通 RAG 上位/具体', nodeTypes: ['rag'], relationTypes: ['broader', 'narrower'], includeStyleEvidence: false },
  { id: 'rag-story-plot', label: '只看普通 RAG 与大纲/情节', nodeTypes: ['rag', 'story', 'plot'], relationTypes: null },
  { id: 'style-techniques', label: '只看写法名词（Style-RAG）', nodeTypes: ['style_rag'], relationTypes: null, includeStyleEvidence: false },
  { id: 'style-with-evidence', label: '写法名词 + 文章证据', nodeTypes: ['style_rag'], relationTypes: null, includeStyleEvidence: true },
  { id: 'rag-style', label: '只看普通 RAG 与 Style-RAG', nodeTypes: ['rag', 'style_rag'], relationTypes: null },
  { id: 'pending-audit', label: '只看待校准节点', nodeTypes: null, auditStatuses: ['pending_review', 'low_confidence', 'conflict', 'missing_source', 'relation_pending'] },
  { id: 'orphans', label: '只看孤立节点', nodeTypes: null, auditStatuses: ['orphan'] },
  { id: 'low-confidence', label: '只看低置信度关系', nodeTypes: null, edgeAuditStatuses: ['low_confidence', 'pending_confirm'] }
]);

export const DEFAULT_SUMMARY_MAX = 48;
export const LAYOUT_SEED = 'liluo-outline-relation-graph-v1';
export const LAYOUT_CACHE_KEY = 'liluo-outline-relation-graph-layout-v1';
export const VIEWPORT_CACHE_KEY = 'liluo-outline-relation-graph-viewport-v1';
