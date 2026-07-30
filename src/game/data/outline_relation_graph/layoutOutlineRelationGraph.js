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

  // 只保留有节点的泳道，并重新压紧横向位置（证据/来源等已下线类别不再占位）
  const visibleLanes = [];
  let visibleLaneIndex = 0;
  for (const lane of lanes) {
    if (!lane.nodes.length) continue;
    const x = LANE_PADDING_X + visibleLaneIndex * (LANE_WIDTH + LANE_GAP);
    const dx = x - lane.x;
    if (dx !== 0) {
      for (const placed of positioned) {
        if (placed.laneType !== lane.type) continue;
        placed.x += dx;
        placed.laneIndex = visibleLaneIndex;
        maxX = Math.max(maxX, placed.x + placed.width);
      }
    }
    visibleLanes.push({
      type: lane.type,
      laneIndex: visibleLaneIndex,
      x,
      width: lane.width,
      height: lane.height,
      label: lane.type
    });
    visibleLaneIndex += 1;
  }

  return {
    preset: 'structure',
    mode,
    seed,
    nodeHeight,
    showSummary,
    lanes: visibleLanes,
    nodes: positioned,
    nodeById,
    canvasWidth: Math.max(maxX + 80, visibleLanes.length * (LANE_WIDTH + LANE_GAP) + LANE_PADDING_X),
    canvasHeight: Math.max(maxY + 120, 640)
  };
}

/**
 * Deterministic free-canvas layout for knowledge roaming.
 * It intentionally has no swimlanes or hierarchy stubs: graph connections
 * determine proximity, while a bounded relaxation keeps cards legible.
 */
export function layoutRagNetworkGraph(graph, options = {}) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const seed = options.seed ?? graph?.layoutSeed ?? hashString(LAYOUT_SEED);
  const width = 172;
  const height = 44;
  const positions = new Map();
  const radius = Math.max(360, Math.sqrt(Math.max(nodes.length, 1)) * 160);

  nodes.forEach((node, index) => {
    const angle = ((hashString(`${seed}:angle:${node.id}`) % 360) * Math.PI) / 180;
    const ring = 0.35 + ((hashString(`${seed}:ring:${node.id}`) % 100) / 100) * 0.65;
    positions.set(node.id, { x: Math.cos(angle) * radius * ring, y: Math.sin(angle) * radius * ring, index });
  });

  const linked = edges.filter((edge) => positions.has(edge.source) && positions.has(edge.target));
  for (let iteration = 0; iteration < 120; iteration += 1) {
    const delta = new Map(nodes.map((node) => [node.id, { x: 0, y: 0 }]));
    for (let left = 0; left < nodes.length; left += 1) {
      const a = positions.get(nodes[left].id);
      for (let right = left + 1; right < nodes.length; right += 1) {
        const b = positions.get(nodes[right].id);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.max(18, Math.hypot(dx, dy));
        const force = Math.min(9, 18000 / (distance * distance));
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        delta.get(nodes[left].id).x -= fx;
        delta.get(nodes[left].id).y -= fy;
        delta.get(nodes[right].id).x += fx;
        delta.get(nodes[right].id).y += fy;
      }
    }
    for (const edge of linked) {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = Math.max(-5, Math.min(5, (distance - 210) * 0.018));
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      delta.get(edge.source).x += fx;
      delta.get(edge.source).y += fy;
      delta.get(edge.target).x -= fx;
      delta.get(edge.target).y -= fy;
    }
    const cooling = 0.72 - iteration * 0.0045;
    for (const node of nodes) {
      const point = positions.get(node.id);
      const move = delta.get(node.id);
      point.x += move.x * cooling;
      point.y += move.y * cooling;
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const placedNodes = nodes.map((node) => {
    const point = positions.get(node.id);
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x + width);
    maxY = Math.max(maxY, point.y + height);
    return {
      id: node.id,
      type: node.type,
      title: node.title,
      summary: node.summary || '',
      auditStatus: node.auditStatus,
      x: point.x,
      y: point.y,
      width,
      height,
      laneType: '',
      laneIndex: 0,
      showSummary: false,
      treeDepth: 0,
      treeParentId: '',
      treeLayer: '',
      ragLayer: node.meta?.ragLayer || ''
    };
  });
  const offsetX = Number.isFinite(minX) ? 140 - minX : 140;
  const offsetY = Number.isFinite(minY) ? 140 - minY : 140;
  for (const node of placedNodes) {
    node.x += offsetX;
    node.y += offsetY;
  }
  const nodeById = new Map(placedNodes.map((node) => [node.id, node]));
  return {
    preset: 'rag-network',
    mode: 'network',
    seed,
    nodeHeight: height,
    showSummary: false,
    lanes: [],
    nodes: placedNodes,
    nodeById,
    canvasWidth: Math.max(960, maxX - minX + 280),
    canvasHeight: Math.max(720, maxY - minY + 280)
  };
}

/**
 * Deterministic RAG-card hierarchy for inspecting arbitrarily deep card trees.
 * A card with more than one parent is placed once under its stable first parent;
 * the remaining parent edges remain visible as cross-branch relations.
 */
export function layoutRagHierarchyGraph(graph, options = {}) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes.filter((node) => node.type === 'rag') : [];
  const seed = options.seed ?? graph?.layoutSeed ?? hashString(LAYOUT_SEED);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const parentsById = new Map();
  const childrenByParentId = new Map();

  for (const node of nodes) {
    const parents = uniqueSortedStrings(node.meta?.parentRagNodeIds).filter((id) => id !== node.id && nodeById.has(id));
    parentsById.set(node.id, parents);
    const primaryParentId = parents[0] || '';
    if (!primaryParentId) continue;
    if (!childrenByParentId.has(primaryParentId)) childrenByParentId.set(primaryParentId, []);
    childrenByParentId.get(primaryParentId).push(node.id);
  }
  for (const children of childrenByParentId.values()) children.sort((left, right) => titleCompareNodes(nodeById.get(left), nodeById.get(right)));

  const roots = nodes
    .filter((node) => !(parentsById.get(node.id) || []).length)
    .map((node) => node.id)
    .sort((left, right) => titleCompareNodes(nodeById.get(left), nodeById.get(right)));
  const ordered = [];
  const placedIds = new Set();
  const visit = (nodeId, depth, ancestry) => {
    if (placedIds.has(nodeId) || ancestry.has(nodeId)) return;
    placedIds.add(nodeId);
    ordered.push({ nodeId, depth, treeParentId: parentsById.get(nodeId)?.[0] || '' });
    const nextAncestry = new Set(ancestry);
    nextAncestry.add(nodeId);
    for (const childId of childrenByParentId.get(nodeId) || []) visit(childId, depth + 1, nextAncestry);
  };
  for (const rootId of roots) visit(rootId, 0, new Set());
  // Cycles and parent references outside the projection still remain inspectable.
  for (const node of [...nodes].sort(titleCompareNodes)) visit(node.id, 0, new Set());

  const nodeWidth = 196;
  const nodeHeight = 44;
  const columnGap = 72;
  const rowGap = 20;
  const padding = 64;
  let maxDepth = 0;
  const placedNodes = ordered.map((entry, index) => {
    maxDepth = Math.max(maxDepth, entry.depth);
    const node = nodeById.get(entry.nodeId);
    return {
      id: node.id,
      type: node.type,
      title: node.title,
      summary: node.summary || '',
      auditStatus: node.auditStatus,
      x: padding + entry.depth * (nodeWidth + columnGap),
      y: padding + index * (nodeHeight + rowGap),
      width: nodeWidth,
      height: nodeHeight,
      laneType: 'rag',
      laneIndex: entry.depth,
      showSummary: false,
      treeDepth: entry.depth,
      treeParentId: entry.treeParentId,
      treeLayer: node.meta?.ragLayer || 'concept',
      ragLayer: node.meta?.ragLayer || ''
    };
  });
  const placedById = new Map(placedNodes.map((node) => [node.id, node]));
  return {
    preset: 'rag-hierarchy',
    mode: 'hierarchy',
    seed,
    nodeHeight,
    showSummary: false,
    lanes: [],
    nodes: placedNodes,
    nodeById: placedById,
    canvasWidth: Math.max(960, padding * 2 + (maxDepth + 1) * nodeWidth + maxDepth * columnGap),
    canvasHeight: Math.max(720, padding * 2 + placedNodes.length * nodeHeight + Math.max(0, placedNodes.length - 1) * rowGap)
  };
}

function uniqueSortedStrings(value) {
  return [...new Set(asArray(value).map((entry) => String(entry || '').trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function titleCompareNodes(left, right) {
  return String(left?.title || '').localeCompare(String(right?.title || ''), 'zh-CN');
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
