import { GRAPH_LANE_ORDER, LAYOUT_SEED, resolveGraphLaneType } from './constants.js';
import { hashString } from './buildOutlineRelationGraph.js';

const LANE_WIDTH = 220;
const LANE_GAP = 48;
const NODE_HEIGHT_OVERVIEW = 28;
const NODE_HEIGHT_DETAIL = 56;
const NODE_GAP = 10;
const LANE_PADDING_Y = 72;
const LANE_PADDING_X = 24;
const TREE_INDENT = 22;
const TREE_LANE_TYPES = new Set(['story', 'plot', 'gameplay', 'rag']);

/**
 * Deterministic partitioned (swimlane) layout.
 * 故事 / 情节 / 玩法 / RAG lanes use explicit 上位 → 具体 tree.
 */
export function layoutOutlineRelationGraph(graph, options = {}) {
  const preset = options.preset === 'aesthetic' ? 'aesthetic' : 'structure';
  const mode = options.mode || 'overview';
  const seed = options.seed ?? graph?.layoutSeed ?? hashString(LAYOUT_SEED);
  const overrides = options.positionOverrides || {};
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const showSummary = mode !== 'overview';
  const nodeHeight = showSummary ? NODE_HEIGHT_DETAIL : NODE_HEIGHT_OVERVIEW;

  const lanes = GRAPH_LANE_ORDER.map((type, laneIndex) => ({
    type,
    laneIndex,
    x: LANE_PADDING_X + laneIndex * (LANE_WIDTH + LANE_GAP),
    width: LANE_WIDTH,
    nodes: []
  }));
  const laneByType = new Map(lanes.map((lane) => [lane.type, lane]));

  const ranked = nodes.map((node) => {
    const laneType = resolveGraphLaneType(node.type);
    return {
      node,
      laneType,
      laneIndex: laneByType.get(laneType)?.laneIndex ?? 99,
      rank: hashString(`${seed}:${node.id}`) % 100000
    };
  });
  ranked.sort((left, right) => {
    if (left.laneIndex !== right.laneIndex) return left.laneIndex - right.laneIndex;
    if (TREE_LANE_TYPES.has(left.laneType) && TREE_LANE_TYPES.has(right.laneType)) return 0;
    if (left.rank !== right.rank) return left.rank - right.rank;
    return String(left.node.title).localeCompare(String(right.node.title), 'zh-CN');
  });

  for (const entry of ranked) {
    const lane = laneByType.get(entry.laneType) || laneByType.get('story');
    lane.nodes.push(entry);
  }

  const storyLane = laneByType.get('story');
  if (storyLane) storyLane.nodes = orderStoryTreeEntries(storyLane.nodes);
  const plotLane = laneByType.get('plot');
  if (plotLane) plotLane.nodes = orderPlotTreeEntries(plotLane.nodes);
  const gameplayLane = laneByType.get('gameplay');
  if (gameplayLane) gameplayLane.nodes = orderGameplayTreeEntries(gameplayLane.nodes);
  const ragLane = laneByType.get('rag');
  if (ragLane) ragLane.nodes = orderRagTreeEntries(ragLane.nodes);

  const positioned = [];
  const nodeById = new Map();
  let maxY = 0;
  let maxX = 0;

  for (const lane of lanes) {
    let cursorY = LANE_PADDING_Y;
    for (const entry of lane.nodes) {
      const node = entry.node;
      const override = overrides[node.id];
      const depth = Number.isFinite(entry.treeDepth) ? entry.treeDepth : 0;
      let x = lane.x + 12 + depth * TREE_INDENT;
      let y = cursorY;
      const width = Math.max(96, lane.width - 24 - depth * TREE_INDENT);

      if (preset === 'aesthetic' && !TREE_LANE_TYPES.has(lane.type)) {
        const wave = Math.sin((hashString(`${seed}:wave:${node.id}`) % 360) * (Math.PI / 180)) * 18;
        const drift = (hashString(`${seed}:drift:${node.id}`) % 40) - 20;
        x += drift * 0.35;
        y += wave;
      }

      if (override && Number.isFinite(override.x) && Number.isFinite(override.y)) {
        x = override.x;
        y = override.y;
      }

      const height = nodeHeight;
      const treeLayer =
        node.meta?.storyLayer ||
        node.meta?.plotLayer ||
        node.meta?.gameplayLayer ||
        node.meta?.ragLayer ||
        node.meta?.tagLayer ||
        node.meta?.bondageLayer ||
        '';
      const placed = {
        id: node.id,
        type: node.type,
        title: node.title,
        summary: node.summary || '',
        auditStatus: node.auditStatus,
        x,
        y,
        width,
        height,
        laneType: lane.type,
        laneIndex: lane.laneIndex,
        showSummary,
        treeDepth: depth,
        treeParentId: entry.treeParentId || '',
        treeLayer,
        ragLayer: node.meta?.ragLayer || ''
      };
      positioned.push(placed);
      nodeById.set(placed.id, placed);

      cursorY = Math.max(cursorY + height + NODE_GAP, y + height + NODE_GAP);
      maxY = Math.max(maxY, y + height);
      maxX = Math.max(maxX, x + width);
    }
    lane.height = Math.max(cursorY, LANE_PADDING_Y);
  }

  return {
    preset,
    mode,
    seed,
    nodeHeight,
    showSummary,
    lanes: lanes.map((lane) => ({
      type: lane.type,
      laneIndex: lane.laneIndex,
      x: lane.x,
      width: lane.width,
      height: lane.height,
      label: lane.type
    })),
    nodes: positioned,
    nodeById,
    canvasWidth: Math.max(maxX + 80, lanes.length * (LANE_WIDTH + LANE_GAP) + LANE_PADDING_X),
    canvasHeight: Math.max(maxY + 120, 640)
  };
}

function titleCompare(left, right) {
  return String(left.node.title).localeCompare(String(right.node.title), 'zh-CN');
}

/**
 * 故事泳道：世界（一级，按前缀数字排序）→ 故事（二级）。
 */
export function orderStoryTreeEntries(entries) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const worlds = list
    .filter((entry) => entry.node?.type === 'world' || entry.node?.meta?.storyLayer === 'category')
    .sort((left, right) => {
      const keyDelta = worldSortKey(left.node) - worldSortKey(right.node);
      if (keyDelta !== 0) return keyDelta;
      return titleCompare(left, right);
    });
  const stories = list.filter(
    (entry) =>
      entry.node?.type === 'story' ||
      (entry.node?.meta?.storyLayer === 'concept' && entry.node?.type !== 'world')
  );
  const other = list.filter((entry) => !worlds.includes(entry) && !stories.includes(entry));

  const worldById = new Map(worlds.map((entry) => [entry.node.id, entry]));
  const worldByLabel = new Map();
  for (const world of worlds) {
    const label = String(world.node.world || world.node.title || '')
      .trim()
      .toLocaleLowerCase('zh-CN');
    if (label && !worldByLabel.has(label)) worldByLabel.set(label, world);
    for (const alias of world.node.aliases || []) {
      const key = String(alias).trim().toLocaleLowerCase('zh-CN');
      if (key && !worldByLabel.has(key)) worldByLabel.set(key, world);
    }
  }

  const childrenByWorldId = new Map();
  const orphanStories = [];
  const placed = new Set();

  for (const story of stories) {
    const parents = Array.isArray(story.node?.meta?.parentStoryNodeIds)
      ? story.node.meta.parentStoryNodeIds
      : [];
    let parent = null;
    for (const parentId of parents) {
      parent = worldById.get(parentId);
      if (parent) break;
    }
    if (!parent) {
      const label = String(story.node?.world || '')
        .trim()
        .toLocaleLowerCase('zh-CN');
      parent = worldByLabel.get(label) || null;
    }
    if (!parent) {
      orphanStories.push(story);
      continue;
    }
    if (placed.has(story.node.id)) continue;
    placed.add(story.node.id);
    const key = parent.node.id;
    if (!childrenByWorldId.has(key)) childrenByWorldId.set(key, []);
    childrenByWorldId.get(key).push(story);
  }

  const ordered = [];
  for (const world of worlds) {
    ordered.push({
      ...world,
      treeDepth: 0,
      treeParentId: ''
    });
    const children = (childrenByWorldId.get(world.node.id) ?? []).sort(titleCompare);
    for (const child of children) {
      ordered.push({
        ...child,
        treeDepth: 1,
        treeParentId: world.node.id
      });
    }
  }

  for (const story of orphanStories.sort(titleCompare)) {
    ordered.push({
      ...story,
      treeDepth: 1,
      treeParentId: ''
    });
  }

  for (const entry of other.sort(titleCompare)) {
    ordered.push({
      ...entry,
      treeDepth: 0,
      treeParentId: ''
    });
  }

  return ordered;
}

/** Leading digits in world label/title, e.g. 1-浮光掠影 → 1. */
export function worldSortKey(node) {
  const text = String(node?.world || node?.title || node?.aliases?.[0] || '');
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 9999;
}

/**
 * Build 上位类别 → 具体概念 order for the RAG swimlane.
 */
export function orderRagTreeEntries(entries) {
  return orderNodeIdTreeEntries(entries, {
    layerKey: 'ragLayer',
    categoryValue: 'category',
    conceptValue: 'concept',
    parentIdsKey: 'parentRagNodeIds'
  });
}

/** 情节：大情节 groups → 小情节 entries. */
export function orderPlotTreeEntries(entries) {
  return orderNodeIdTreeEntries(entries, {
    layerKey: 'plotLayer',
    categoryValue: 'category',
    conceptValue: 'concept',
    parentIdsKey: 'parentPlotNodeIds'
  });
}

/** 玩法：大玩法 categories → 小玩法 entries. */
export function orderGameplayTreeEntries(entries) {
  return orderNodeIdTreeEntries(entries, {
    layerKey: 'gameplayLayer',
    categoryValue: 'category',
    conceptValue: 'concept',
    parentIdsKey: 'parentGameplayNodeIds'
  });
}

function orderNodeIdTreeEntries(entries, options) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const layerKey = options.layerKey;
  const categoryValue = options.categoryValue;
  const conceptValue = options.conceptValue;
  const parentIdsKey = options.parentIdsKey;

  const categories = list
    .filter((entry) => entry.node?.meta?.[layerKey] === categoryValue)
    .sort(titleCompare);
  const details = list.filter((entry) => entry.node?.meta?.[layerKey] === conceptValue);
  const other = list.filter(
    (entry) =>
      entry.node?.meta?.[layerKey] !== categoryValue &&
      entry.node?.meta?.[layerKey] !== conceptValue
  );

  const categoryById = new Map(categories.map((entry) => [entry.node.id, entry]));
  const childrenByCategoryId = new Map();
  const orphanDetails = [];
  const placedDetailIds = new Set();

  for (const detail of details) {
    const parents = asArray(detail.node?.meta?.[parentIdsKey]);
    let parentCategory = null;
    for (const parentId of parents) {
      parentCategory = categoryById.get(parentId);
      if (parentCategory) break;
    }
    if (!parentCategory) {
      orphanDetails.push(detail);
      continue;
    }
    if (placedDetailIds.has(detail.node.id)) continue;
    placedDetailIds.add(detail.node.id);
    const key = parentCategory.node.id;
    if (!childrenByCategoryId.has(key)) childrenByCategoryId.set(key, []);
    childrenByCategoryId.get(key).push(detail);
  }

  return flattenTreeOrder(categories, childrenByCategoryId, orphanDetails, other);
}

function orderConceptIdTreeEntries(entries, options) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const layerKey = options.layerKey;
  const categoryValue = options.categoryValue;
  const conceptValue = options.conceptValue;
  const parentConceptIdsKey = options.parentConceptIdsKey;
  const categoryConceptIdsFrom = options.categoryConceptIdsFrom;

  const categories = list
    .filter((entry) => entry.node?.meta?.[layerKey] === categoryValue)
    .sort(titleCompare);
  const details = list.filter((entry) => entry.node?.meta?.[layerKey] === conceptValue);
  const other = list.filter(
    (entry) =>
      entry.node?.meta?.[layerKey] !== categoryValue &&
      entry.node?.meta?.[layerKey] !== conceptValue
  );

  const categoryByConceptId = new Map();
  for (const category of categories) {
    for (const conceptId of asArray(category.node?.meta?.[categoryConceptIdsFrom])) {
      if (!categoryByConceptId.has(conceptId)) categoryByConceptId.set(conceptId, category);
    }
  }

  const childrenByCategoryId = new Map();
  const orphanDetails = [];
  const placedDetailIds = new Set();

  for (const detail of details) {
    const parents = asArray(detail.node?.meta?.[parentConceptIdsKey]);
    let parentCategory = null;
    for (const parentConceptId of parents) {
      parentCategory = categoryByConceptId.get(parentConceptId);
      if (parentCategory) break;
    }
    if (!parentCategory) {
      orphanDetails.push(detail);
      continue;
    }
    if (placedDetailIds.has(detail.node.id)) continue;
    placedDetailIds.add(detail.node.id);
    const key = parentCategory.node.id;
    if (!childrenByCategoryId.has(key)) childrenByCategoryId.set(key, []);
    childrenByCategoryId.get(key).push(detail);
  }

  return flattenTreeOrder(categories, childrenByCategoryId, orphanDetails, other);
}

function flattenTreeOrder(categories, childrenByCategoryId, orphanDetails, other) {
  const ordered = [];
  for (const category of categories) {
    ordered.push({
      ...category,
      treeDepth: 0,
      treeParentId: ''
    });
    const children = (childrenByCategoryId.get(category.node.id) ?? []).sort(titleCompare);
    for (const child of children) {
      ordered.push({
        ...child,
        treeDepth: 1,
        treeParentId: category.node.id
      });
    }
  }

  for (const detail of orphanDetails.sort(titleCompare)) {
    ordered.push({
      ...detail,
      treeDepth: 1,
      treeParentId: ''
    });
  }

  for (const entry of other.sort(titleCompare)) {
    ordered.push({
      ...entry,
      treeDepth: 0,
      treeParentId: ''
    });
  }

  return ordered;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getNodeDisplayFields(node, mode) {
  if (mode === 'overview') {
    return {
      title: node.title,
      summary: '',
      showSummary: false,
      showCategory: false,
      showStatus: Boolean(
        node.auditStatus && node.auditStatus !== 'confirmed' && node.auditStatus !== 'auto_generated'
      )
    };
  }

  return {
    title: node.title,
    summary: node.summary || '',
    showSummary: true,
    showCategory: true,
    showStatus: true,
    conceptLayerLabel:
      node?.meta?.storyLayerLabel ||
      node?.meta?.plotLayerLabel ||
      node?.meta?.gameplayLayerLabel ||
      node?.meta?.ragLayerLabel ||
      node?.meta?.tagLayerLabel ||
      node?.meta?.bondageLayerLabel ||
      node?.meta?.conceptLayerLabel ||
      ''
  };
}

export { LANE_WIDTH, LANE_GAP, TREE_INDENT, TREE_INDENT as RAG_TREE_INDENT };
