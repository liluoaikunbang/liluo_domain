<template>
  <section class="relation-graph-panel" aria-label="关联图谱">
    <header class="rg-toolbar">
      <div class="rg-mode-controls" aria-label="图谱模式">
        <button
          v-for="option in modeOptions"
          :key="option.key"
          class="rg-tool-button"
          :class="{ 'rg-tool-button-active': mode === option.key }"
          type="button"
          :aria-pressed="mode === option.key"
          @click="setMode(option.key)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="rg-layout-controls" aria-label="布局预设">
        <button
          v-for="option in layoutOptions"
          :key="option.key"
          class="rg-tool-button"
          :class="{ 'rg-tool-button-active': layoutPreset === option.key }"
          type="button"
          :aria-pressed="layoutPreset === option.key"
          @click="layoutPreset = option.key"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="mode === 'focus'" class="rg-focus-controls" aria-label="聚焦深度">
        <button
          class="rg-tool-button"
          :class="{ 'rg-tool-button-active': focusDepth === 1 }"
          type="button"
          @click="focusDepth = 1"
        >
          一层
        </button>
        <button
          class="rg-tool-button"
          :class="{ 'rg-tool-button-active': focusDepth === 2 }"
          type="button"
          @click="focusDepth = 2"
        >
          两层
        </button>
      </div>

      <div class="rg-zoom-controls" aria-label="画布缩放">
        <button class="rg-tool-button" type="button" @click="zoomOut">-</button>
        <span class="rg-zoom-value">{{ zoomPercent }}</span>
        <button class="rg-tool-button" type="button" @click="zoomIn">+</button>
        <button class="rg-tool-button rg-tool-button-wide" type="button" @click="fitAll">适应全图</button>
        <button class="rg-tool-button rg-tool-button-wide" type="button" @click="resetView">重置</button>
        <button class="rg-tool-button rg-tool-button-wide" type="button" @click="rebuildGraph">重建</button>
      </div>

      <div class="rg-search" aria-label="图谱搜索">
        <input
          v-model="searchQuery"
          class="rg-search-input"
          type="search"
          placeholder="搜索名称 / ID / 别名 / Tag / RAG…"
          @keydown.enter.prevent="selectFirstSearchResult"
        />
        <ul v-if="searchResults.length" class="rg-search-results" role="listbox">
          <li
            v-for="result in searchResults"
            :key="result.id"
            class="rg-search-result"
            role="option"
            @click="jumpToNode(result.id, { openDetail: true, pushHistory: true })"
          >
            <strong>{{ result.title }}</strong>
            <span>{{ nodeTypeLabel(result.type) }} · {{ result.hint }}</span>
          </li>
        </ul>
      </div>
    </header>

    <div v-if="mode === 'filter'" class="rg-filter-bar" aria-label="筛选条件">
      <label>
        节点类别
        <select v-model="filterNodeType">
          <option value="">全部</option>
          <option v-for="type in legendNodeTypeOptions" :key="type" :value="type">{{ nodeTypeLabel(type) }}</option>
        </select>
      </label>
      <label>
        关系类型
        <select v-model="filterRelationType">
          <option value="">全部</option>
          <option v-for="type in relationTypeOptions" :key="type" :value="type">{{ relationTypeLabel(type) }}</option>
        </select>
      </label>
      <label>
        校准状态
        <select v-model="filterAuditStatus">
          <option value="">全部</option>
          <option v-for="status in auditStatusOptions" :key="status" :value="status">{{ auditStatusLabel(status) }}</option>
        </select>
      </label>
      <label>
        快捷筛选
        <select v-model="filterPresetId" @change="applySelectedPreset">
          <option value="">无</option>
          <option v-for="preset in filterPresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option>
        </select>
      </label>
    </div>

    <div class="rg-body">
      <GameScrollArea v-if="mode === 'summary'" class="rg-summary-scroll" aria-label="图谱汇总">
        <div class="rg-summary">
        <article v-for="card in summaryCards" :key="card.label" class="rg-summary-card">
          <h3>{{ card.label }}</h3>
          <p>{{ card.value }}</p>
        </article>
        <section class="rg-summary-lists">
          <div>
            <h3>类别分布</h3>
            <ul>
              <li v-for="row in typeRows" :key="row.type">{{ row.label }} · {{ row.count }}</li>
            </ul>
          </div>
          <div>
            <h3>关系分布</h3>
            <ul>
              <li v-for="row in relationRows" :key="row.type">
                <span class="rg-swatch" :style="{ background: relationColor(row.type) }" />
                {{ row.label }} · {{ row.count }}
              </li>
            </ul>
          </div>
          <div>
            <h3>最近节点</h3>
            <ul>
              <li
                v-for="node in stats.recentNodes || []"
                :key="node.id"
                class="rg-summary-link"
                @click="jumpToNode(node.id, { openDetail: true, pushHistory: true, switchMode: 'focus' })"
              >
                {{ node.title }}
              </li>
            </ul>
          </div>
        </section>
        <p class="rg-summary-note">
          汇总不修改正史。抽查请继续使用现有 `rag:audit:*` / `style-rag:audit:*` 闭环；图谱仅作发现与定位入口。
        </p>
        </div>
      </GameScrollArea>

      <div v-else class="rg-graph-layout">
        <aside class="rg-legend-column" :class="{ 'rg-legend-column-collapsed': !legendVisible }">
          <button
            type="button"
            class="rg-legend-toggle"
            :aria-expanded="legendVisible"
            @click="legendVisible = !legendVisible"
          >
            {{ legendVisible ? '隐藏图例' : '图例' }}
          </button>
          <GameScrollArea v-show="legendVisible" class="rg-legend-scroll" aria-label="图例">
            <div class="rg-legend">
              <header class="rg-legend-header">
                <strong>图例</strong>
                <button type="button" class="rg-legend-action" @click="showAllLegend">全部显示</button>
                <button type="button" class="rg-legend-action" @click="hideAllRelations">隐藏关系</button>
              </header>
              <div class="rg-legend-section">
                <h4>节点</h4>
                <button
                  v-for="type in legendNodeTypeOptions"
                  :key="`node-${type}`"
                  type="button"
                  class="rg-legend-item"
                  :class="{ 'rg-legend-item-off': isLegendNodeTypeHidden(type) }"
                  @click="toggleNodeType(type)"
                >
                  <span class="rg-swatch" :style="{ background: nodeColor(type) }" />
                  {{ nodeTypeLabel(type) }}
                </button>
                <button
                  type="button"
                  class="rg-legend-item"
                  :class="{ 'rg-legend-item-off': !showStyleEvidence }"
                  @click="showStyleEvidence = !showStyleEvidence"
                >
                  <span class="rg-swatch" :style="{ background: nodeColor('style_rag') }" />
                  {{ showStyleEvidence ? '文章证据：显示' : '文章证据：隐藏' }}
                </button>
              </div>
              <div class="rg-legend-section">
                <h4>关系</h4>
                <button
                  v-for="type in legendRelationTypes"
                  :key="`rel-${type}`"
                  type="button"
                  class="rg-legend-item"
                  :class="{
                    'rg-legend-item-off': hiddenRelationTypes.has(type),
                    'rg-legend-item-only': onlyRelationType === type
                  }"
                  @click="toggleRelationType(type)"
                >
                  <span class="rg-swatch" :style="{ background: relationColor(type) }" />
                  {{ relationTypeLabel(type) }}
                </button>
              </div>
            </div>
          </GameScrollArea>
        </aside>

        <GameScrollArea
          ref="viewportAreaRef"
          class="rg-viewport"
          :class="{ 'rg-viewport-dragging': isPanning }"
          tabindex="0"
          role="region"
          aria-label="关联图谱无限画布"
          @scroll.passive="onScroll"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel="onWheel"
        >
          <div class="rg-canvas-spacer" :style="canvasSpacerStyle">
            <canvas ref="canvasRef" class="rg-canvas-sticky" aria-hidden="true" />
          </div>
        </GameScrollArea>

        <GameScrollArea v-if="selectedNode" class="rg-detail-scroll" aria-label="节点详情">
          <aside class="rg-detail">
            <header class="rg-detail-header">
              <div class="rg-detail-heading">
                <p class="rg-detail-type">{{ detailTypeLabel(selectedNode) }}</p>
                <div class="rg-detail-title-row">
                  <h2>{{ selectedNode.title }}</h2>
                  <button
                    v-if="mode !== 'focus'"
                    type="button"
                    class="rg-tool-button rg-tool-button-active rg-focus-inline"
                    @click="enterFocusMode"
                  >
                    聚焦模式
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rg-tool-button rg-focus-inline"
                    @click="clearFocus"
                  >
                    取消聚焦
                  </button>
                </div>
              </div>
              <button type="button" class="rg-tool-button" @click="closeDetail">关闭</button>
            </header>

            <div class="rg-detail-nav">
              <button type="button" class="rg-tool-button" :disabled="!canGoBack" @click="historyBack">上一节点</button>
              <button type="button" class="rg-tool-button" :disabled="!canGoForward" @click="historyForward">下一节点</button>
              <button type="button" class="rg-tool-button" :disabled="!historyRootId" @click="returnToRoot">返回初始</button>
            </div>

            <dl class="rg-detail-list">
              <dt>稳定 ID</dt>
              <dd>{{ selectedNode.id }}</dd>
              <dt>摘要</dt>
              <dd>{{ selectedNode.summary || '（无）' }}</dd>
              <dt>描述</dt>
              <dd>{{ selectedNode.description || '（无）' }}</dd>
              <dt>来源</dt>
              <dd>{{ (selectedNode.sourceIds || []).join('、') || '（无）' }}</dd>
              <dt>世界</dt>
              <dd>{{ selectedNode.world || '（无）' }}</dd>
              <dt>别名</dt>
              <dd>{{ (selectedNode.aliases || []).join('、') || '（无）' }}</dd>
              <dt>概念 ID</dt>
              <dd>{{ (selectedNode.conceptIds || []).join('、') || '（无）' }}</dd>
              <dt>审核状态</dt>
              <dd>{{ auditStatusLabel(selectedNode.auditStatus) }}</dd>
              <dt>置信度</dt>
              <dd>{{ formatConfidence(selectedNode.confidence) }}</dd>
              <dt>是否自动生成</dt>
              <dd>{{ selectedNode.origin === 'derived-field' || selectedNode.origin?.includes('auto') ? '派生/自动' : selectedNode.origin }}</dd>
              <dt>缺口标记</dt>
              <dd>{{ (selectedNode.meta?.gapFlags || []).join('、') || '（无）' }}</dd>
              <dt>Style 角色</dt>
              <dd>{{ styleRoleLabel(selectedNode) }}</dd>
              <dt>最近更新</dt>
              <dd>{{ selectedNode.updatedAt || '（无）' }}</dd>
            </dl>

            <section class="rg-detail-related">
              <h3>关联节点</h3>
              <button
                v-for="related in relatedNodes"
                :key="related.id"
                type="button"
                class="rg-related-button"
                @click="jumpToNode(related.id, { openDetail: true, pushHistory: true, fromId: selectedNode.id })"
              >
                <strong>{{ related.title }}</strong>
                <span>{{ relatedNodeTypeLabel(related) }} · {{ relatedRelationLabel(related.id) }}</span>
              </button>
            </section>

            <section class="rg-detail-actions">
              <h3>校准入口</h3>
              <p>图谱不直接改写正史。请用现有抽查命令记录问题：</p>
              <ul>
                <li>`npm run knowledge:audit:sample` / `rag|style-rag|concept|plot:audit:record`</li>
                <li>`npm run rag:audit:sample` / `style-rag:audit:sample` / `concept:audit:sample` / `plot:audit:sample`</li>
                <li>`npm run outline:graph:validate` 校验投影完整性</li>
              </ul>
            </section>
          </aside>
        </GameScrollArea>
      </div>
    </div>

    <footer class="rg-status">
      节点 {{ visibleGraph.nodes.length }} / {{ graph.nodes.length }}
      · 关系 {{ visibleGraph.edges.length }} / {{ graph.edges.length }}
      · 模式 {{ modeLabel }}
      · 布局 {{ layoutPresetLabel }}
      <span v-if="hoveredEdge"> · 关系：{{ relationTypeLabel(hoveredEdge.relationType) }}（{{ hoveredEdge.source }} → {{ hoveredEdge.target }}，置信度 {{ formatConfidence(hoveredEdge.confidence) }}）</span>
    </footer>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import GameScrollArea from './GameScrollArea.vue';
import {
  GRAPH_AUDIT_STATUSES,
  GRAPH_AUDIT_STATUS_LABELS,
  GRAPH_FILTER_PRESETS,
  GRAPH_LAYOUT_PRESET_LABELS,
  GRAPH_LEGEND_NODE_TYPES,
  GRAPH_MODE_LABELS,
  GRAPH_MODES,
  GRAPH_NODE_COLORS,
  GRAPH_NODE_TYPE_LABELS,
  GRAPH_RELATION_COLORS,
  GRAPH_RELATION_TYPE_LABELS,
  GRAPH_RELATION_TYPES,
  VIEWPORT_CACHE_KEY,
  applyFilterPreset,
  expandLegendNodeType,
  filterOutlineRelationGraph,
  focusOutlineRelationGraph,
  getNeighborIds,
  layoutOutlineRelationGraph,
  findEdgesBetween,
  searchOutlineRelationGraph
} from '../../../data/outline_relation_graph/index.js';
import {
  getOutlineRelationGraph,
  invalidateOutlineRelationGraphCache
} from '../../../data/outline_relation_graph/loadOutlineRelationGraph.js';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 0.1;

const mode = ref('overview');
const layoutPreset = ref('structure');
const focusDepth = ref(1);
const searchQuery = ref('');
const filterNodeType = ref('');
const filterRelationType = ref('');
const filterAuditStatus = ref('');
const filterPresetId = ref('');
const selectedNodeId = ref('');
const hoveredEdgeId = ref('');
const highlightPair = ref(null);
const hiddenNodeTypes = ref(new Set());
const hiddenRelationTypes = ref(new Set());
const onlyRelationType = ref('');
const showStyleEvidence = ref(false);
const legendVisible = ref(true);
const historyStack = ref([]);
const historyIndex = ref(-1);
const historyRootId = ref('');

const viewportAreaRef = ref(null);
const canvasRef = ref(null);
const zoom = ref(0.85);
const isPanning = ref(false);
const pointerState = ref(null);

const graph = ref(getOutlineRelationGraph());

const modeOptions = GRAPH_MODES.map((key) => ({ key, label: GRAPH_MODE_LABELS[key] }));
const layoutOptions = Object.entries(GRAPH_LAYOUT_PRESET_LABELS).map(([key, label]) => ({ key, label }));
const filterPresets = GRAPH_FILTER_PRESETS;
const legendNodeTypeOptions = GRAPH_LEGEND_NODE_TYPES;
const relationTypeOptions = GRAPH_RELATION_TYPES;
const auditStatusOptions = GRAPH_AUDIT_STATUSES;

const modeLabel = computed(() => GRAPH_MODE_LABELS[mode.value] || mode.value);
const layoutPresetLabel = computed(() => GRAPH_LAYOUT_PRESET_LABELS[layoutPreset.value] || layoutPreset.value);
const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`);
const stats = computed(() => graph.value.stats || {});

const searchResults = computed(() => searchOutlineRelationGraph(graph.value, searchQuery.value, 12));

const activeFilters = computed(() => {
  const filters = {
    hiddenNodeTypes: [...hiddenNodeTypes.value],
    hiddenRelationTypes: [...hiddenRelationTypes.value],
    onlyRelationTypes: onlyRelationType.value ? [onlyRelationType.value] : null,
    includeStyleEvidence: showStyleEvidence.value,
    allowFocusedEvidence: mode.value === 'focus'
  };
  if (mode.value === 'filter') {
    if (filterNodeType.value) filters.nodeTypes = expandLegendNodeType(filterNodeType.value);
    if (filterRelationType.value) filters.relationTypes = [filterRelationType.value];
    if (filterAuditStatus.value) filters.auditStatuses = [filterAuditStatus.value];
    if (filterPresetId.value) {
      const presetFilters = applyFilterPreset(filterPresetId.value);
      Object.assign(filters, presetFilters);
      if (!Object.prototype.hasOwnProperty.call(presetFilters, 'includeStyleEvidence')) {
        filters.includeStyleEvidence = showStyleEvidence.value;
      }
    }
  }
  return filters;
});

const visibleGraph = computed(() => {
  let working = {
    nodes: graph.value.nodes,
    edges: graph.value.edges
  };

  if (mode.value === 'focus' && selectedNodeId.value) {
    working = focusOutlineRelationGraph(graph.value, selectedNodeId.value, focusDepth.value);
  }

  return filterOutlineRelationGraph(
    { ...graph.value, nodes: working.nodes, edges: working.edges },
    activeFilters.value
  );
});

const layout = computed(() =>
  layoutOutlineRelationGraph(
    { ...graph.value, nodes: visibleGraph.value.nodes, edges: visibleGraph.value.edges },
    {
      preset: layoutPreset.value,
      mode: mode.value === 'overview' ? 'overview' : 'focus',
      seed: graph.value.layoutSeed
    }
  )
);

const canvasSpacerStyle = computed(() => ({
  width: `${layout.value.canvasWidth * zoom.value}px`,
  height: `${layout.value.canvasHeight * zoom.value}px`
}));

function getViewportEl() {
  return viewportAreaRef.value?.scrollAreaElement ?? viewportAreaRef.value?.$el ?? null;
}

const graphNodeById = computed(() => {
  const map = new Map();
  for (const node of graph.value.nodes) map.set(node.id, node);
  return map;
});

const selectedNode = computed(() => graphNodeById.value.get(selectedNodeId.value) || null);

const relatedNodes = computed(() => {
  if (!selectedNode.value) return [];
  const ids = getNeighborIds(graph.value, selectedNode.value.id);
  return ids
    .map((id) => graphNodeById.value.get(id))
    .filter(Boolean)
    .slice(0, 40);
});

const hoveredEdge = computed(() => {
  if (!hoveredEdgeId.value) return null;
  return visibleGraph.value.edges.find((edge) => edge.id === hoveredEdgeId.value) || null;
});

const legendRelationTypes = computed(() => {
  const present = new Set();
  for (const edge of graph.value.edges) present.add(edge.relationType);
  return GRAPH_RELATION_TYPES.filter((type) => present.has(type));
});

const summaryCards = computed(() => [
  { label: '节点总数', value: stats.value.nodeCount ?? 0 },
  { label: '关系总数', value: stats.value.edgeCount ?? 0 },
  { label: '写法名词', value: stats.value.styleTechniqueCount ?? 0 },
  { label: '文章证据', value: stats.value.styleEvidenceCount ?? 0 },
  { label: '孤立节点', value: stats.value.orphanCount ?? 0 },
  { label: '待抽查', value: stats.value.pendingReviewCount ?? 0 },
  { label: '低置信度关系', value: stats.value.lowConfidenceEdgeCount ?? 0 },
  { label: '缺少来源', value: stats.value.missingSourceCount ?? 0 },
  { label: '有概念但无 RAG', value: stats.value.conceptWithoutRag ?? 0 },
  { label: '有情节但无 Style-RAG', value: stats.value.plotWithoutStyle ?? 0 },
  { label: '高频未确认', value: stats.value.highUseUnconfirmed ?? 0 }
]);

const typeRows = computed(() =>
  Object.entries(stats.value.byType || {}).map(([type, count]) => ({
    type,
    label: nodeTypeLabel(type),
    count
  }))
);

const relationRows = computed(() =>
  Object.entries(stats.value.byRelation || {}).map(([type, count]) => ({
    type,
    label: relationTypeLabel(type),
    count
  }))
);

const canGoBack = computed(() => historyIndex.value > 0);
const canGoForward = computed(() => historyIndex.value >= 0 && historyIndex.value < historyStack.value.length - 1);

let rafId = 0;
let hoverRafId = 0;
let canvasBufferKey = '';
let pendingHoverEdgeId = '';

onMounted(() => {
  const savedViewport = loadJson(VIEWPORT_CACHE_KEY, null);
  if (savedViewport?.zoom) {
    zoom.value = savedViewport.zoom;
  }
  nextTick(() => {
    const viewport = getViewportEl();
    if (viewport && savedViewport) {
      viewport.scrollLeft = savedViewport.scrollLeft ?? 40;
      viewport.scrollTop = savedViewport.scrollTop ?? 20;
    }
    ensureCanvasBuffer();
    scheduleDraw();
  });
  window.addEventListener('resize', onWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(hoverRafId);
  persistViewport();
});

watch(
  () => [
    layout.value.canvasWidth,
    layout.value.canvasHeight,
    layout.value.mode,
    layoutPreset.value,
    zoom.value,
    mode.value
  ],
  () => {
    nextTick(() => {
      ensureCanvasBuffer(true);
      scheduleDraw();
    });
  }
);

watch([selectedNodeId, highlightPair, hiddenNodeTypes, hiddenRelationTypes, onlyRelationType], () => {
  scheduleDraw();
});

watch(mode, (next) => {
  if (next === 'overview') {
    highlightPair.value = null;
  }
});

function setMode(next) {
  mode.value = next;
}

function rebuildGraph() {
  invalidateOutlineRelationGraphCache();
  graph.value = getOutlineRelationGraph({ forceRebuild: true });
  nextTick(() => {
    ensureCanvasBuffer(true);
    scheduleDraw();
  });
}

function applySelectedPreset() {
  // computed activeFilters reads filterPresetId
}

function nodeTypeLabel(type) {
  return GRAPH_NODE_TYPE_LABELS[type] || type;
}

function styleRoleLabel(node) {
  const role = node?.meta?.role;
  if (role === 'evidence') return '文章证据';
  if (role === 'technique') return '写法名词';
  if (role === 'technique_dimension') return '写法维度';
  if (node?.type === 'style_rag') return 'Style-RAG';
  return '—';
}

function relatedNodeTypeLabel(node) {
  if (node?.type === 'style_rag') return styleRoleLabel(node);
  return nodeTypeLabel(node?.type);
}

function detailTypeLabel(nodeOrType) {
  const node = typeof nodeOrType === 'string' ? { type: nodeOrType } : nodeOrType;
  if (!node) return '';
  if (node.type === 'world') return '世界';
  if (node.type === 'series') return '系列';
  if (node.type === 'style_rag') return styleRoleLabel(node);
  return nodeTypeLabel(node.type);
}

function relationTypeLabel(type) {
  return GRAPH_RELATION_TYPE_LABELS[type] || type;
}

function auditStatusLabel(status) {
  return GRAPH_AUDIT_STATUS_LABELS[status] || status || '（无）';
}

function nodeColor(type) {
  return GRAPH_NODE_COLORS[type] || '#9b6bc7';
}

function relationColor(type) {
  return GRAPH_RELATION_COLORS[type] || '#c8bdd8';
}

function formatConfidence(value) {
  if (typeof value !== 'number') return '—';
  return value.toFixed(2);
}

function relatedRelationLabel(targetId) {
  const edges = findEdgesBetween(graph.value, selectedNodeId.value, targetId);
  if (!edges.length) return '关联';
  return relationTypeLabel(edges[0].relationType);
}

function isLegendNodeTypeHidden(type) {
  return expandLegendNodeType(type).every((entry) => hiddenNodeTypes.value.has(entry));
}

function toggleNodeType(type) {
  const group = expandLegendNodeType(type);
  const next = new Set(hiddenNodeTypes.value);
  const shouldHide = !group.every((entry) => next.has(entry));
  for (const entry of group) {
    if (shouldHide) next.add(entry);
    else next.delete(entry);
  }
  hiddenNodeTypes.value = next;
}
function toggleRelationType(type) {
  if (onlyRelationType.value === type) {
    onlyRelationType.value = '';
    const next = new Set(hiddenRelationTypes.value);
    next.delete(type);
    hiddenRelationTypes.value = next;
    return;
  }
  if (hiddenRelationTypes.value.has(type)) {
    const next = new Set(hiddenRelationTypes.value);
    next.delete(type);
    hiddenRelationTypes.value = next;
    onlyRelationType.value = type;
    return;
  }
  // first click: highlight only this relation
  onlyRelationType.value = type;
}

function showAllLegend() {
  hiddenNodeTypes.value = new Set();
  hiddenRelationTypes.value = new Set();
  onlyRelationType.value = '';
}

function hideAllRelations() {
  onlyRelationType.value = '';
  hiddenRelationTypes.value = new Set(legendRelationTypes.value);
}

function selectFirstSearchResult() {
  if (searchResults.value[0]) {
    jumpToNode(searchResults.value[0].id, { openDetail: true, pushHistory: true });
  }
}

function closeDetail() {
  selectedNodeId.value = '';
}

function enterFocusMode() {
  if (!selectedNodeId.value) return;
  mode.value = 'focus';
  nextTick(() => {
    const nodeId = selectedNodeId.value;
    const laid = layout.value.nodeById?.get(nodeId) || layout.value.nodes.find((entry) => entry.id === nodeId);
    const viewport = getViewportEl();
    if (!laid || !viewport) return;
    viewport.scrollLeft = Math.max(
      0,
      (laid.x + laid.width / 2) * zoom.value - viewport.clientWidth / 2
    );
    viewport.scrollTop = Math.max(
      0,
      (laid.y + laid.height / 2) * zoom.value - viewport.clientHeight / 2
    );
    persistViewport();
    ensureCanvasBuffer(true);
    scheduleDraw();
  });
}

function clearFocus() {
  highlightPair.value = null;
  if (mode.value === 'focus') mode.value = 'overview';
  nextTick(() => {
    if (selectedNodeId.value) {
      jumpToNode(selectedNodeId.value, { openDetail: true, pushHistory: false });
      return;
    }
    fitAll();
  });
}

function historyBack() {
  if (!canGoBack.value) return;
  historyIndex.value -= 1;
  jumpToNode(historyStack.value[historyIndex.value], { openDetail: true, pushHistory: false });
}

function historyForward() {
  if (!canGoForward.value) return;
  historyIndex.value += 1;
  jumpToNode(historyStack.value[historyIndex.value], { openDetail: true, pushHistory: false });
}

function returnToRoot() {
  if (!historyRootId.value) return;
  historyIndex.value = 0;
  historyStack.value = [historyRootId.value];
  jumpToNode(historyRootId.value, { openDetail: true, pushHistory: false });
}

function jumpToNode(nodeId, options = {}) {
  const node = graphNodeById.value.get(nodeId);
  if (!node) return;

  // Only switch mode when explicitly requested (e.g. detail "聚焦模式" or summary shortcut).
  if (options.switchMode) mode.value = options.switchMode;

  if (node.type === 'style_rag' && node.meta?.role === 'evidence') {
    showStyleEvidence.value = true;
  }

  selectedNodeId.value = nodeId;
  searchQuery.value = '';

  if (options.pushHistory) {
    const truncated = historyStack.value.slice(0, historyIndex.value + 1);
    if (truncated[truncated.length - 1] !== nodeId) truncated.push(nodeId);
    historyStack.value = truncated;
    historyIndex.value = truncated.length - 1;
    if (!historyRootId.value) historyRootId.value = nodeId;
  }

  if (selectedNodeId.value && options.fromId) {
    highlightPair.value = { from: options.fromId, to: nodeId };
  } else if (historyStack.value.length >= 2) {
    highlightPair.value = {
      from: historyStack.value[Math.max(0, historyIndex.value - 1)],
      to: nodeId
    };
  }

  nextTick(() => {
    const laid = layout.value.nodeById?.get(nodeId) || layout.value.nodes.find((entry) => entry.id === nodeId);
    const viewport = getViewportEl();
    if (!laid || !viewport) return;
    viewport.scrollLeft = Math.max(
      0,
      (laid.x + laid.width / 2) * zoom.value - viewport.clientWidth / 2
    );
    viewport.scrollTop = Math.max(
      0,
      (laid.y + laid.height / 2) * zoom.value - viewport.clientHeight / 2
    );
    persistViewport();
    ensureCanvasBuffer();
    scheduleDraw();
  });
}

function setZoom(nextZoom, anchorEvent = null) {
  const viewport = getViewportEl();
  const currentZoom = zoom.value;
  const normalizedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));

  if (!viewport || normalizedZoom === currentZoom) {
    zoom.value = normalizedZoom;
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const anchorX = anchorEvent ? anchorEvent.clientX - rect.left : viewport.clientWidth / 2;
  const anchorY = anchorEvent ? anchorEvent.clientY - rect.top : viewport.clientHeight / 2;
  const contentX = (viewport.scrollLeft + anchorX) / currentZoom;
  const contentY = (viewport.scrollTop + anchorY) / currentZoom;

  zoom.value = normalizedZoom;

  nextTick(() => {
    viewport.scrollLeft = Math.max(0, contentX * normalizedZoom - anchorX);
    viewport.scrollTop = Math.max(0, contentY * normalizedZoom - anchorY);
    ensureCanvasBuffer(true);
    scheduleDraw();
    persistViewport();
  });
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP);
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP);
}

function resetView() {
  zoom.value = 0.85;
  nextTick(() => {
    const viewport = getViewportEl();
    if (viewport) {
      viewport.scrollLeft = 40;
      viewport.scrollTop = 20;
    }
    ensureCanvasBuffer(true);
    scheduleDraw();
    persistViewport();
  });
}

function fitAll() {
  const viewport = getViewportEl();
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();
  const width = Math.max(layout.value.canvasWidth, 1);
  const height = Math.max(layout.value.canvasHeight, 1);
  const scale = Math.min(rect.width / width, rect.height / height, 1.2) * 0.92;
  setZoom(Math.max(MIN_ZOOM, scale));
  nextTick(() => {
    viewport.scrollLeft = Math.max(0, (width * zoom.value - rect.width) / 2);
    viewport.scrollTop = Math.max(0, (height * zoom.value - rect.height) / 2);
    persistViewport();
  });
}

function onScroll() {
  scheduleDraw();
}

function onPointerDown(event) {
  if (event.button !== 0 || event.target.closest('button')) return;

  const viewport = getViewportEl();
  if (!viewport) return;

  const hit = hitTest(event, { includeEdges: true });
  if (hit?.node) {
    jumpToNode(hit.node.id, { openDetail: true, pushHistory: true });
    return;
  }

  if (hit?.edge) {
    setHoveredEdge(hit.edge.id);
  }

  isPanning.value = true;
  pointerState.value = {
    kind: 'pan',
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop
  };
  viewport.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  const viewport = getViewportEl();
  const state = pointerState.value;

  if (state?.kind === 'pan' && viewport) {
    viewport.scrollLeft = state.scrollLeft - (event.clientX - state.startX);
    viewport.scrollTop = state.scrollTop - (event.clientY - state.startY);
    scheduleDraw();
    return;
  }

  if (state) return;

  // Hover: nodes only (cheap). Edge hover only on click.
  const hit = hitTest(event, { includeEdges: false });
  setHoveredEdge(hit?.edge?.id || '');
}

function setHoveredEdge(edgeId) {
  pendingHoverEdgeId = edgeId || '';
  if (hoverRafId) return;
  hoverRafId = requestAnimationFrame(() => {
    hoverRafId = 0;
    if (hoveredEdgeId.value === pendingHoverEdgeId) return;
    hoveredEdgeId.value = pendingHoverEdgeId;
    scheduleDraw();
  });
}

function onPointerUp(event) {
  const viewport = getViewportEl();
  if (pointerState.value?.kind === 'pan') {
    persistViewport();
  }
  pointerState.value = null;
  isPanning.value = false;
  try {
    viewport?.releasePointerCapture(event.pointerId);
  } catch {
    // ignore
  }
}

function onWheel(event) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    setZoom(zoom.value + (event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), event);
  }
}

function hitTest(event, options = {}) {
  const includeEdges = options.includeEdges !== false;
  const viewport = getViewportEl();
  if (!viewport) return null;
  const rect = viewport.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const x = (viewport.scrollLeft + localX) / zoom.value;
  const y = (viewport.scrollTop + localY) / zoom.value;
  const nodes = layout.value.nodes;
  const nodeById = layout.value.nodeById;

  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
      return { node };
    }
  }

  if (!includeEdges) return null;

  let best = null;
  let bestDistance = 8 / zoom.value;
  for (const edge of visibleGraph.value.edges) {
    const from = nodeById.get(edge.source);
    const to = nodeById.get(edge.target);
    if (!from || !to) continue;
    const distance = distanceToSegment(
      x,
      y,
      from.x + from.width / 2,
      from.y + from.height / 2,
      to.x + to.width / 2,
      to.y + to.height / 2
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = edge;
    }
  }
  return best ? { edge: best } : null;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function ensureCanvasBuffer(force = false) {
  const canvas = canvasRef.value;
  const viewport = getViewportEl();
  if (!canvas || !viewport) return null;

  const viewW = Math.max(1, Math.floor(viewport.clientWidth));
  const viewH = Math.max(1, Math.floor(viewport.clientHeight));
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  const key = `${viewW}x${viewH}@${ratio}`;
  if (!force && key === canvasBufferKey && canvas.width > 0) {
    return canvas.getContext('2d');
  }

  canvasBufferKey = key;
  canvas.width = Math.max(1, Math.floor(viewW * ratio));
  canvas.height = Math.max(1, Math.floor(viewH * ratio));
  canvas.style.width = `${viewW}px`;
  canvas.style.height = `${viewH}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function scheduleDraw() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

function draw() {
  const viewport = getViewportEl();
  const canvas = canvasRef.value;
  if (!canvas || !viewport) return;

  const ctx = ensureCanvasBuffer();
  if (!ctx) return;

  const viewW = viewport.clientWidth;
  const viewH = viewport.clientHeight;
  const scrollLeft = viewport.scrollLeft;
  const scrollTop = viewport.scrollTop;
  const z = zoom.value;
  const pad = 40;
  const ratio = canvas.width / Math.max(1, viewW);

  // Visible world AABB
  const worldLeft = scrollLeft / z - pad;
  const worldTop = scrollTop / z - pad;
  const worldRight = (scrollLeft + viewW) / z + pad;
  const worldBottom = (scrollTop + viewH) / z + pad;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, viewW, viewH);

  const gradient = ctx.createRadialGradient(
    viewW * 0.5,
    viewH * 0.35,
    40,
    viewW * 0.5,
    viewH * 0.5,
    Math.max(viewW, viewH) * 0.7
  );
  gradient.addColorStop(0, 'rgba(78, 40, 92, 0.55)');
  gradient.addColorStop(1, 'rgba(12, 9, 18, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(-scrollLeft, -scrollTop);
  ctx.scale(z, z);

  for (const lane of layout.value.lanes) {
    if (hiddenNodeTypes.value.has(lane.type)) continue;
    if (lane.x > worldRight || lane.x + lane.width < worldLeft) continue;
    if (16 > worldBottom || 52 < worldTop) continue;
    ctx.fillStyle = 'rgba(216, 179, 109, 0.16)';
    ctx.fillRect(lane.x, 16, lane.width, 36);
    ctx.strokeStyle = 'rgba(216, 179, 109, 0.35)';
    ctx.strokeRect(lane.x, 16, lane.width, 36);
    ctx.fillStyle = '#fff3cf';
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(nodeTypeLabel(lane.type), lane.x + 10, 38);
  }

  const nodeById = layout.value.nodeById;
  const pair = highlightPair.value;
  const hoveredId = hoveredEdgeId.value;
  const selectedId = selectedNodeId.value;
  const connectedEdges = [];
  const normalEdges = [];

  for (const edge of visibleGraph.value.edges) {
    const from = nodeById.get(edge.source);
    const to = nodeById.get(edge.target);
    if (!from || !to) continue;

    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x + from.width, to.x + to.width);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y + from.height, to.y + to.height);
    if (maxX < worldLeft || minX > worldRight || maxY < worldTop || minY > worldBottom) continue;

    const connectedToSelected =
      Boolean(selectedId) && (edge.source === selectedId || edge.target === selectedId);
    const pairMatch =
      pair &&
      ((pair.from === edge.source && pair.to === edge.target) ||
        (pair.from === edge.target && pair.to === edge.source));
    const isHighlight = hoveredId === edge.id || connectedToSelected || pairMatch;
    const packed = { edge, from, to, isHighlight, connectedToSelected };
    if (isHighlight) connectedEdges.push(packed);
    else normalEdges.push(packed);
  }

  const strokeEdge = ({ edge, from, to, isHighlight }) => {
    ctx.beginPath();
    ctx.moveTo(from.x + from.width / 2, from.y + from.height / 2);
    const midX = (from.x + to.x) / 2;
    ctx.bezierCurveTo(
      midX,
      from.y + from.height / 2,
      midX,
      to.y + to.height / 2,
      to.x + to.width / 2,
      to.y + to.height / 2
    );
    ctx.strokeStyle = relationColor(edge.relationType);
    if (selectedId) {
      ctx.globalAlpha = isHighlight ? 0.95 : 0.07;
      ctx.lineWidth = isHighlight ? 2.6 : 0.9;
    } else {
      ctx.globalAlpha = isHighlight ? 0.95 : 0.28;
      ctx.lineWidth = isHighlight ? 2.4 : 1;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  for (const packed of normalEdges) strokeEdge(packed);
  for (const packed of connectedEdges) strokeEdge(packed);

  const showSummary = layout.value.showSummary;
  const neighborIds = selectedId
    ? new Set(
        visibleGraph.value.edges.flatMap((edge) => {
          if (edge.source === selectedId) return [edge.target];
          if (edge.target === selectedId) return [edge.source];
          return [];
        })
      )
    : null;

  for (const node of layout.value.nodes) {
    if (
      node.x > worldRight ||
      node.x + node.width < worldLeft ||
      node.y > worldBottom ||
      node.y + node.height < worldTop
    ) {
      continue;
    }

    const isSelected = node.id === selectedId;
    const isNeighbor = neighborIds?.has(node.id);
    ctx.fillStyle = 'rgba(19, 15, 29, 0.92)';
    ctx.strokeStyle = isSelected ? '#d8b36d' : isNeighbor ? '#fff3cf' : nodeColor(node.type);
    ctx.lineWidth = isSelected ? 2.4 : isNeighbor ? 1.8 : 1.2;
    if (selectedId && !isSelected && !isNeighbor) {
      ctx.globalAlpha = 0.45;
    }
    roundRect(ctx, node.x, node.y, node.width, node.height, 6);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (node.auditStatus && !['confirmed', 'auto_generated'].includes(node.auditStatus)) {
      ctx.beginPath();
      ctx.fillStyle = node.auditStatus === 'orphan' ? '#e8c45a' : '#e85a5a';
      ctx.arc(node.x + node.width - 8, node.y + 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fff5fc';
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(truncateCanvasText(ctx, node.title, node.width - 16), node.x + 8, node.y + 18);

    // HARD RULE: overview mode never renders summary text
    if (showSummary && mode.value !== 'overview' && node.summary) {
      ctx.fillStyle = '#bdb2ca';
      ctx.font = '10px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(truncateCanvasText(ctx, node.summary, node.width - 16), node.x + 8, node.y + 36);
      ctx.fillStyle = 'rgba(189, 178, 202, 0.85)';
      ctx.fillText(detailTypeLabel(node), node.x + 8, node.y + 50);
    }
  }

  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function truncateCanvasText(ctx, text, maxWidth) {
  const value = String(text ?? '');
  if (ctx.measureText(value).width <= maxWidth) return value;
  let current = value;
  while (current.length > 1 && ctx.measureText(`${current}…`).width > maxWidth) {
    current = current.slice(0, -1);
  }
  return `${current}…`;
}

function onWindowResize() {
  ensureCanvasBuffer(true);
  scheduleDraw();
}

function persistViewport() {
  const viewport = getViewportEl();
  if (!viewport) return;
  saveJson(VIEWPORT_CACHE_KEY, {
    zoom: zoom.value,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop
  });
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}
</script>

<style scoped>
.relation-graph-panel {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 8px;
  color: #fff5fc;
}

.rg-toolbar,
.rg-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rg-mode-controls,
.rg-layout-controls,
.rg-focus-controls,
.rg-zoom-controls {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background: rgba(19, 15, 29, 0.9);
  box-shadow: 3px 3px 0 rgba(8, 6, 13, 0.72);
}

.rg-tool-button {
  min-width: 52px;
  padding: 6px 12px;
  border: 0;
  color: #bdb2ca;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.rg-tool-button-wide {
  min-width: 72px;
}

.rg-tool-button:hover,
.rg-tool-button:focus-visible {
  color: #fff3cf;
  background: rgba(118, 88, 145, 0.24);
  outline: none;
}

.rg-tool-button-active {
  color: #fff3cf;
  background: rgba(139, 97, 166, 0.42);
  box-shadow: inset 0 -2px 0 #d8b36d;
}

.rg-tool-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.rg-zoom-value {
  min-width: 48px;
  text-align: center;
  color: #fff3cf;
  line-height: 32px;
}

.rg-search {
  position: relative;
  flex: 1 1 220px;
  min-width: 200px;
}

.rg-search-input,
.rg-filter-bar select {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid rgba(129, 111, 152, 0.48);
  color: #fff5fc;
  background: rgba(19, 15, 29, 0.92);
  font: inherit;
}

.rg-filter-bar label {
  display: grid;
  gap: 4px;
  color: #bdb2ca;
  font-size: 12px;
}

.rg-search-results {
  position: absolute;
  z-index: 5;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 240px;
  overflow: auto;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background: rgba(19, 15, 29, 0.98);
}

.rg-search-result {
  display: grid;
  gap: 2px;
  padding: 8px;
  cursor: pointer;
}

.rg-search-result:hover {
  background: rgba(139, 97, 166, 0.35);
}

.rg-search-result span {
  color: #bdb2ca;
  font-size: 12px;
}

.rg-body {
  min-height: 0;
}

.rg-graph-layout {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
}

.rg-legend-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  min-height: 0;
  width: 196px;
}

.rg-legend-column-collapsed {
  width: auto;
}

.rg-legend-toggle {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid rgba(129, 111, 152, 0.48);
  color: #fff3cf;
  background: rgba(19, 15, 29, 0.92);
  font: inherit;
  cursor: pointer;
}

.rg-legend-column-collapsed .rg-legend-toggle {
  width: auto;
  min-width: 52px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 12px 8px;
}

.rg-legend-scroll {
  min-height: 0;
  max-height: 100%;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background: rgba(19, 15, 29, 0.88);
}

.rg-legend {
  padding: 8px;
  font-size: 12px;
}

.rg-legend-header {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-bottom: 6px;
}

.rg-legend-action {
  border: 0;
  padding: 2px 6px;
  color: #fff3cf;
  background: rgba(139, 97, 166, 0.35);
  cursor: pointer;
}

.rg-legend-section {
  display: grid;
  gap: 2px;
  margin-bottom: 8px;
}

.rg-legend-section h4 {
  margin: 4px 0;
  color: #d8b36d;
  font-size: 12px;
}

.rg-legend-item {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  border: 0;
  padding: 3px 4px;
  color: #fff5fc;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.rg-legend-item-off {
  opacity: 0.35;
}

.rg-legend-item-only {
  background: rgba(139, 97, 166, 0.35);
}

.rg-viewport {
  min-width: 0;
  min-height: 0;
  height: 100%;
  cursor: grab;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background:
    linear-gradient(rgba(255, 241, 249, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 241, 249, 0.045) 1px, transparent 1px),
    rgba(12, 9, 18, 0.96);
  background-size: 32px 32px, 32px 32px, auto;
  box-shadow: inset 0 0 40px rgba(78, 40, 92, 0.35);
}

.rg-viewport-dragging {
  cursor: grabbing;
  user-select: none;
}

.rg-canvas-spacer {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.rg-canvas-sticky {
  position: sticky;
  top: 0;
  left: 0;
  display: block;
  pointer-events: none;
}

.rg-detail-scroll {
  width: min(320px, 36vw);
  min-height: 0;
  max-height: 100%;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background: rgba(57, 27, 68, 0.92);
}

.rg-detail {
  padding: 12px;
}

.rg-summary-scroll {
  min-height: 0;
  max-height: 100%;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background: rgba(19, 15, 29, 0.9);
}

.rg-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.rg-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: start;
}

.rg-detail-heading {
  min-width: 0;
  flex: 1 1 auto;
}

.rg-detail-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rg-detail-header h2 {
  margin: 0;
  font-size: 18px;
  color: #fff3cf;
}

.rg-focus-inline {
  flex: 0 0 auto;
  min-width: 0;
  padding: 4px 10px;
  font-size: 12px;
}

.rg-detail-type {
  margin: 0 0 4px;
  color: #d8b36d;
  font-size: 12px;
}

.rg-detail-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 10px 0;
}

.rg-detail-list {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 6px 8px;
  margin: 0;
  font-size: 12px;
}

.rg-detail-list dt {
  color: #bdb2ca;
}

.rg-detail-list dd {
  margin: 0;
  color: #fff5fc;
  word-break: break-word;
}

.rg-detail-related,
.rg-detail-actions {
  margin-top: 14px;
}

.rg-detail-related h3,
.rg-detail-actions h3 {
  margin: 0 0 8px;
  color: #d8b36d;
  font-size: 13px;
}

.rg-related-button {
  display: grid;
  gap: 2px;
  width: 100%;
  margin-bottom: 6px;
  padding: 8px;
  border: 1px solid rgba(129, 111, 152, 0.4);
  color: inherit;
  background: rgba(19, 15, 29, 0.55);
  text-align: left;
  cursor: pointer;
}

.rg-related-button span {
  color: #bdb2ca;
  font-size: 11px;
}

.rg-summary {
  padding: 10px;
  display: grid;
  gap: 12px;
  color: #fff5fc;
}

.rg-summary-card {
  display: inline-grid;
  min-width: 140px;
  padding: 10px 12px;
  border: 1px solid rgba(129, 111, 152, 0.4);
  background: rgba(78, 40, 92, 0.35);
}

.rg-summary-card h3 {
  margin: 0;
  color: #bdb2ca;
  font-size: 12px;
  font-weight: 500;
}

.rg-summary-card p {
  margin: 6px 0 0;
  color: #fff3cf;
  font-size: 22px;
}

.rg-summary {
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  align-content: start;
}

.rg-summary-lists {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.rg-summary-lists h3 {
  margin: 0 0 8px;
  color: #d8b36d;
}

.rg-summary-lists ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.rg-summary-lists li {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
  color: #fff5fc;
  font-size: 12px;
}

.rg-summary-link {
  cursor: pointer;
  text-decoration: underline;
}

.rg-summary-note {
  grid-column: 1 / -1;
  margin: 0;
  color: #bdb2ca;
  font-size: 12px;
}

.rg-status {
  color: #bdb2ca;
  font-size: 12px;
  padding: 2px 4px;
}

@media (max-width: 1100px) {
  .rg-graph-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }

  .rg-legend-column {
    width: auto;
  }

  .rg-legend-column-collapsed .rg-legend-toggle {
    writing-mode: horizontal-tb;
    width: 100%;
  }

  .rg-detail-scroll {
    width: auto;
    max-height: 280px;
  }

  .rg-summary-lists {
    grid-template-columns: 1fr;
  }
}
</style>
