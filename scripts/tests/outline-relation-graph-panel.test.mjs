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
    /\{ key: 'story', label: '故事' \},\s*\{ key: 'plot', label: '情节' \},\s*\{ key: 'gameplay', label: '玩法' \},\s*\{ key: 'character', label: '人物\/组织' \},\s*\{ key: 'relation-graph', label: '关联图谱' \}/u
  );
  assert.match(outlinePanelSource, /RelationGraphPanel/u);
  assert.match(outlinePanelSource, /activeSection === 'relation-graph'/u);
  assert.match(outlinePanelSource, /activeSection === 'story'/u);
  assert.match(outlinePanelSource, /activeSection === 'plot'/u);
  assert.match(outlinePanelSource, /activeSection === 'gameplay'/u);
  assert.match(outlinePanelSource, /activeSection === 'character'/u);
});

test('graph panel exposes four modes and overview title-only rule', () => {
  assert.match(graphPanelSource, /全图/u);
  assert.match(graphPanelSource, /聚焦/u);
  assert.match(graphPanelSource, /筛选/u);
  assert.match(graphPanelSource, /汇总/u);
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

test('graph panel can toggle Style-RAG article evidence visibility', () => {
  assert.match(graphPanelSource, /showStyleEvidence/u);
  assert.match(graphPanelSource, /文章证据：显示|文章证据：隐藏/u);
  assert.match(graphPanelSource, /includeStyleEvidence/u);
  assert.match(graphPanelSource, /allowFocusedEvidence/u);
  assert.match(graphPanelSource, /写法名词/u);
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
