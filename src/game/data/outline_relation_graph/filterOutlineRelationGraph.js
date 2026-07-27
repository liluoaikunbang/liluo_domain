import { GRAPH_FILTER_PRESETS } from './constants.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Filter graph nodes/edges for filter mode and legend toggles.
 */
export function filterOutlineRelationGraph(graph, filters = {}) {
  const nodes = asArray(graph?.nodes);
  const edges = asArray(graph?.edges);
  const nodeTypeSet = filters.nodeTypes ? new Set(filters.nodeTypes) : null;
  const relationTypeSet = filters.relationTypes ? new Set(filters.relationTypes) : null;
  const auditSet = filters.auditStatuses ? new Set(filters.auditStatuses) : null;
  const edgeAuditSet = filters.edgeAuditStatuses ? new Set(filters.edgeAuditStatuses) : null;
  const hiddenRelationTypes = new Set(asArray(filters.hiddenRelationTypes));
  const hiddenNodeTypes = new Set(asArray(filters.hiddenNodeTypes));
  const onlyRelationTypes = filters.onlyRelationTypes ? new Set(filters.onlyRelationTypes) : null;
  const query = String(filters.query ?? '').trim().toLocaleLowerCase('zh-CN');

  let visibleNodes = nodes.filter((node) => {
    if (hiddenNodeTypes.has(node.type)) return false;
    if (nodeTypeSet && !nodeTypeSet.has(node.type)) return false;
    if (auditSet && !auditSet.has(node.auditStatus) && !asArray(node.meta?.gapFlags).some((flag) => auditSet.has(flag))) {
      return false;
    }

    const isStyleEvidence = node.type === 'style_rag' && node.meta?.role === 'evidence';
    const matchesQuery = query ? collectSearchText(node).includes(query) : false;
    if (isStyleEvidence && !filters.includeStyleEvidence) {
      // Overview/filter: hide novel titles by default; focus/search may reveal evidence anchors.
      if (!filters.allowFocusedEvidence && !matchesQuery) return false;
    }

    if (!query) return true;
    return matchesQuery;
  });

  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

  let visibleEdges = edges.filter((edge) => {
    if (hiddenRelationTypes.has(edge.relationType)) return false;
    if (onlyRelationTypes && !onlyRelationTypes.has(edge.relationType)) return false;
    if (relationTypeSet && !relationTypeSet.has(edge.relationType)) return false;
    if (edgeAuditSet && !edgeAuditSet.has(edge.auditStatus) && !(edge.confidence < 0.6 && edgeAuditSet.has('low_confidence'))) {
      return false;
    }
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  });

  // Keep nodes that still have edges when edge-only filters are active
  if (edgeAuditSet || relationTypeSet || onlyRelationTypes) {
    const connected = new Set();
    for (const edge of visibleEdges) {
      connected.add(edge.source);
      connected.add(edge.target);
    }
    if (connected.size > 0 && (edgeAuditSet || onlyRelationTypes)) {
      visibleNodes = visibleNodes.filter((node) => connected.has(node.id));
      visibleNodeIds.clear();
      visibleNodes.forEach((node) => visibleNodeIds.add(node.id));
      visibleEdges = visibleEdges.filter(
        (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );
    }
  }

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
    filters
  };
}

export function applyFilterPreset(presetId) {
  const preset = GRAPH_FILTER_PRESETS.find((entry) => entry.id === presetId);
  if (!preset) return {};
  const result = {
    nodeTypes: preset.nodeTypes || null,
    relationTypes: preset.relationTypes || null,
    auditStatuses: preset.auditStatuses || null,
    edgeAuditStatuses: preset.edgeAuditStatuses || null
  };
  if (Object.prototype.hasOwnProperty.call(preset, 'includeStyleEvidence')) {
    result.includeStyleEvidence = Boolean(preset.includeStyleEvidence);
  }
  return result;
}

/**
 * Focus subgraph: selected node + N hops of undirected neighbors.
 */
export function focusOutlineRelationGraph(graph, focusNodeId, depth = 1) {
  const nodes = asArray(graph?.nodes);
  const edges = asArray(graph?.edges);
  if (!focusNodeId) {
    return { nodes, edges, focusNodeId: '', depth };
  }

  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source).push(edge);
    adjacency.get(edge.target).push(edge);
  }

  const keptNodeIds = new Set([focusNodeId]);
  let frontier = [focusNodeId];
  for (let hop = 0; hop < Math.max(1, depth); hop += 1) {
    const next = [];
    for (const nodeId of frontier) {
      for (const edge of adjacency.get(nodeId) || []) {
        const other = edge.source === nodeId ? edge.target : edge.source;
        if (!keptNodeIds.has(other)) {
          keptNodeIds.add(other);
          next.push(other);
        }
      }
    }
    frontier = next;
  }

  const focusedNodes = nodes.filter((node) => keptNodeIds.has(node.id));
  const focusedEdges = edges.filter(
    (edge) => keptNodeIds.has(edge.source) && keptNodeIds.has(edge.target)
  );

  return {
    nodes: focusedNodes,
    edges: focusedEdges,
    focusNodeId,
    depth
  };
}

export function searchOutlineRelationGraph(graph, query, limit = 30) {
  const needle = String(query ?? '').trim().toLocaleLowerCase('zh-CN');
  if (!needle) return [];
  return asArray(graph?.nodes)
    .filter((node) => node.visibility?.searchable !== false)
    .map((node) => ({
      node,
      score: scoreSearchMatch(node, needle)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.node.title.localeCompare(right.node.title, 'zh-CN'))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.node.id,
      title: entry.node.title,
      type: entry.node.type,
      lane: entry.node.type,
      hint: entry.node.summary || entry.node.id
    }));
}

function collectSearchText(node) {
  return [
    node.title,
    node.id,
    node.summary,
    node.description,
    ...(node.aliases ?? []),
    ...(node.conceptIds ?? []),
    ...(node.sourceIds ?? []),
    node.world,
    node.type
  ]
    .join(' ')
    .toLocaleLowerCase('zh-CN');
}

function scoreSearchMatch(node, needle) {
  const title = String(node.title ?? '').toLocaleLowerCase('zh-CN');
  const id = String(node.id ?? '').toLocaleLowerCase('zh-CN');
  if (title === needle || id === needle) return 100;
  if (title.startsWith(needle)) return 80;
  if ((node.aliases ?? []).some((alias) => String(alias).toLocaleLowerCase('zh-CN') === needle)) return 75;
  if (title.includes(needle)) return 60;
  if (id.includes(needle)) return 50;
  if (collectSearchText(node).includes(needle)) return 30;
  return 0;
}

export function getNeighborIds(graph, nodeId) {
  const ids = new Set();
  for (const edge of asArray(graph?.edges)) {
    if (edge.source === nodeId) ids.add(edge.target);
    if (edge.target === nodeId) ids.add(edge.source);
  }
  return [...ids];
}

export function findEdgesBetween(graph, leftId, rightId) {
  return asArray(graph?.edges).filter(
    (edge) =>
      (edge.source === leftId && edge.target === rightId) ||
      (edge.source === rightId && edge.target === leftId)
  );
}
