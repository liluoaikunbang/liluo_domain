/**
 * Build a self-describing JSON payload for the outline relation graph projection.
 * Projection only — does not replace story / plot / RAG master data.
 */
export function createOutlineRelationGraphExportPayload(graph, exportedAt = new Date()) {
  const cloned = cloneSerializable(graph ?? {});
  const nodes = Array.isArray(cloned.nodes) ? cloned.nodes : [];
  const edges = Array.isArray(cloned.edges) ? cloned.edges : [];

  return {
    exportType: 'outline-relation-graph',
    exportVersion: 1,
    exportedAt: toIsoString(exportedAt),
    schemaVersion: cloned.schemaVersion ?? null,
    builtAt: cloned.builtAt ?? null,
    layoutSeed: cloned.layoutSeed ?? null,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    stats: cloned.stats ?? {},
    meta: {
      ...(cloned.meta && typeof cloned.meta === 'object' ? cloned.meta : {}),
      exportNote:
        'Display/projection layer only. RAG cards link directly to story, plot and gameplay masters. Retired Tag nodes are never exported.'
    },
    nodes,
    edges
  };
}

function cloneSerializable(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function toIsoString(value) {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}
