/**
 * Build a self-describing JSON payload for the outline relation graph projection.
 * Projection only — does not replace story / plot / RAG master data.
 *
 * publicSafe=true strips private evidence excerpts / previews from the export.
 */
export function createOutlineRelationGraphExportPayload(graph, exportedAt = new Date(), options = {}) {
  const publicSafe = options.publicSafe !== false;
  const cloned = cloneSerializable(graph ?? {});
  const nodes = (Array.isArray(cloned.nodes) ? cloned.nodes : []).map((node) =>
    publicSafe ? redactNodeForPublicExport(node) : node
  );
  const edges = Array.isArray(cloned.edges) ? cloned.edges : [];

  return {
    exportType: 'outline-relation-graph',
    exportVersion: 2,
    exportedAt: toIsoString(exportedAt),
    schemaVersion: cloned.schemaVersion ?? null,
    builtAt: cloned.builtAt ?? null,
    layoutSeed: cloned.layoutSeed ?? null,
    publicSafe,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    stats: cloned.stats ?? {},
    meta: {
      ...(cloned.meta && typeof cloned.meta === 'object' ? cloned.meta : {}),
      exportNote:
        'Display/projection layer only. RAG cards link directly to story, plot and gameplay masters. Evidence excerpts and novel titles live on RAG detail meta (not canvas nodes). Retired Tag nodes are never exported. publicSafe exports omit private excerpt text.'
    },
    nodes,
    edges
  };
}

function redactNodeForPublicExport(node) {
  if (!node) return node;

  // Legacy evidence/source canvas nodes (removed from builders; keep redaction for old exports).
  if (node.type === 'evidence' || node.type === 'source') {
    const meta = node.meta && typeof node.meta === 'object' ? { ...node.meta } : {};
    const allowPreview = Boolean(meta.rightsScope?.publicExport);
    if (node.type === 'evidence') {
      return {
        ...node,
        summary: allowPreview ? node.summary : clip(node.id, 48),
        description: allowPreview
          ? node.description
          : [
              meta.location?.sourcePath
                ? `定位：${meta.location.sourcePath}:${meta.location.lineStart ?? '?'}-${meta.location.lineEnd ?? '?'}`
                : '',
              `审核：${meta.reviewStatus ?? 'pending'}`,
              '正文已按公开导出策略省略'
            ]
              .filter(Boolean)
              .join('\n'),
        meta: {
          ...meta,
          excerptPreview: allowPreview ? meta.excerptPreview ?? '' : '',
          contextBeforePreview: allowPreview ? meta.contextBeforePreview ?? '' : '',
          contextAfterPreview: allowPreview ? meta.contextAfterPreview ?? '' : '',
          paragraph: allowPreview ? meta.paragraph ?? '' : '',
          redacted: !allowPreview
        }
      };
    }
    return node;
  }

  if (node.type !== 'rag' || !node.meta || typeof node.meta !== 'object') return node;
  const meta = { ...node.meta };
  const items = Array.isArray(meta.evidenceItems) ? meta.evidenceItems : [];
  if (!items.length) return node;
  meta.evidenceItems = items.map((item) => {
    const allowPreview = Boolean(item?.rightsScope?.publicExport);
    if (allowPreview) return item;
    return {
      ...item,
      excerptPreview: '',
      contextBeforePreview: '',
      contextAfterPreview: '',
      paragraph: '',
      redacted: true
    };
  });
  return { ...node, meta };
}

function clip(text, max) {
  const value = String(text ?? '');
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
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
