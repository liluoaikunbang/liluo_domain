import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const outlinePanelSource = readFileSync(
  new URL('../../src/game/views/components/base/OutlineMenuPanel.vue', import.meta.url),
  'utf8'
);
const graphPanelSource = readFileSync(
  new URL('../../src/game/views/components/base/RelationGraphPanel.vue', import.meta.url),
  'utf8'
);

test('outline keeps original sections and adds relation graph tab', () => {
  assert.match(
    outlinePanelSource,
    /\{ key: 'story', label: '故事' \},\s*\{ key: 'plot', label: '情节' \},\s*\{ key: 'gameplay', label: '玩法' \},\s*\{ key: 'character', label: '人物\/组织' \},\s*\{ key: 'relation-graph', label: '关联图谱' \},\s*\{ key: 'rag-network', label: 'RAG 网络' \}/u
  );
  assert.match(outlinePanelSource, /RelationGraphPanel/u);
  assert.doesNotMatch(outlinePanelSource, /RestraintRagMaintainPanel/u);
  assert.doesNotMatch(outlinePanelSource, /restraint-rag/u);
  assert.match(outlinePanelSource, /activeSection === 'relation-graph'/u);
  assert.match(outlinePanelSource, /activeSection === 'rag-network'/u);
  assert.match(outlinePanelSource, /activeSection === 'story'/u);
  assert.match(outlinePanelSource, /activeSection === 'plot'/u);
  assert.match(outlinePanelSource, /activeSection === 'gameplay'/u);
  assert.match(outlinePanelSource, /activeSection === 'character'/u);
});

test('graph panel exposes hierarchy and overview title-only rule', () => {
  assert.match(graphPanelSource, /全图/u);
  assert.match(graphPanelSource, /聚焦/u);
  assert.match(graphPanelSource, /筛选/u);
  assert.match(graphPanelSource, /汇总/u);
  assert.match(graphPanelSource, /hierarchy/u);
  assert.match(graphPanelSource, /HARD RULE: overview mode never renders summary text/u);
  assert.match(graphPanelSource, /mode\.value !== 'overview'/u);
  assert.match(graphPanelSource, /showSummary && mode\.value !== 'overview'/u);
});

test('graph panel keeps navigation inside outline relation graph', () => {
  assert.match(graphPanelSource, /jumpToNode/u);
  assert.match(graphPanelSource, /historyBack/u);
  assert.match(graphPanelSource, /返回初始/u);
  assert.doesNotMatch(graphPanelSource, /router\.push|window\.location|activeTabKey\s*=/u);
  assert.match(graphPanelSource, /rg-detail/u);
  assert.match(graphPanelSource, /关联节点/u);
  assert.match(graphPanelSource, /GameScrollArea/u);
});

test('clicking a node opens detail without auto-switching to focus mode', () => {
  assert.match(graphPanelSource, /enterFocusMode/u);
  assert.match(graphPanelSource, /聚焦模式/u);
  assert.match(graphPanelSource, /rg-detail-title-row/u);
  assert.doesNotMatch(
    graphPanelSource,
    /mode\.value === 'overview' && options\.openDetail\) mode\.value = 'focus'/u
  );
  assert.match(
    graphPanelSource,
    /Only switch mode when explicitly requested/u
  );
});

test('selected node highlights connected edges and merges world/series lane', () => {
  assert.match(graphPanelSource, /connectedToSelected/u);
  assert.match(graphPanelSource, /expandLegendNodeType/u);
  assert.match(graphPanelSource, /GRAPH_LEGEND_NODE_TYPES/u);
  assert.match(graphPanelSource, /detailTypeLabel/u);
});

test('graph panel uses a dedicated free canvas for RAG knowledge roaming', () => {
  assert.match(graphPanelSource, /layoutRagNetworkGraph/u);
  assert.match(graphPanelSource, /layoutRagHierarchyGraph/u);
  assert.match(graphPanelSource, /rag-network/u);
  assert.match(graphPanelSource, /仅 RAG 条目|含证据与来源|纳入关联节点/u);
  assert.doesNotMatch(graphPanelSource, /showStyleEvidence|Style-RAG|通用写法/u);
});
test('graph panel hides AI calibration entry and off-canvas evidence categories', () => {
  assert.doesNotMatch(graphPanelSource, /校准入口/u);
  assert.doesNotMatch(graphPanelSource, /knowledge:audit:sample/u);
  assert.doesNotMatch(graphPanelSource, /原文证据条数|原始来源书名|原始来源节点|原文证据节点/u);
  assert.match(graphPanelSource, /原文证据/u); // detail tab still exists
  assert.match(graphPanelSource, /rg-evidence-expand/u);
});

test('legend is left-side and hideable with project scroll areas', () => {
  assert.match(graphPanelSource, /rg-legend-column/u);
  assert.match(graphPanelSource, /legendVisible/u);
  assert.match(graphPanelSource, /隐藏图例/u);
  assert.match(graphPanelSource, /rg-legend-scroll/u);
  assert.match(graphPanelSource, /rg-detail-scroll/u);
});

test('canvas does not support node dragging or layout overrides', () => {
  assert.doesNotMatch(graphPanelSource, /positionOverrides|dragNodeId|LAYOUT_CACHE_KEY|persistLayout/u);
});

test('canvas viewport uses native scrollbars with drag pan and wheel', () => {
  assert.match(graphPanelSource, /viewportAreaRef/u);
  assert.match(graphPanelSource, /scrollLeft/u);
  assert.match(graphPanelSource, /rg-viewport/u);
  assert.match(graphPanelSource, /canvasSpacerStyle/u);
  assert.match(graphPanelSource, /ensureCanvasBuffer|rg-canvas-sticky/u);
  assert.doesNotMatch(graphPanelSource, /@wheel\.prevent/u);
});

test('legend supports interactive relation filtering', () => {
  assert.match(graphPanelSource, /toggleRelationType/u);
  assert.match(graphPanelSource, /showAllLegend/u);
  assert.match(graphPanelSource, /hideAllRelations/u);
  assert.match(graphPanelSource, /onlyRelationType/u);
});

test('canvas interactions cover pan zoom fit and search', () => {
  assert.match(graphPanelSource, /fitAll/u);
  assert.match(graphPanelSource, /onWheel/u);
  assert.match(graphPanelSource, /isPanning/u);
  assert.match(graphPanelSource, /searchOutlineRelationGraph/u);
  assert.match(graphPanelSource, /适应全图/u);
});

test('graph panel can export projection JSON via shared download helper', () => {
  assert.match(graphPanelSource, /exportGraphJson/u);
  assert.match(graphPanelSource, /导出JSON/u);
  assert.match(graphPanelSource, /createOutlineRelationGraphExportPayload/u);
  assert.match(graphPanelSource, /downloadJsonPayload/u);
  assert.match(graphPanelSource, /liluo-outline-relation-graph\.json/u);
});

test('graph panel renders incomplete nodes with a dedicated gap frame color', () => {
  assert.match(graphPanelSource, /GRAPH_CONTENT_GAP_COLOR/u);
  assert.match(graphPanelSource, /hasContentGap/u);
  assert.match(graphPanelSource, /内容缺口/u);
});
