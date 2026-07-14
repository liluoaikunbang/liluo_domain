export function createAllStoryExportPayload(outline, options = {}) {
  const includeMarkdown = Boolean(options.includeMarkdown);
  const tree = cloneExportTree(outline, { includeMarkdown });
  const stats = createExportStats(tree);

  return {
    exportType: includeMarkdown ? 'story-outline-full' : 'story-outline-summary',
    exportVersion: 2,
    exportedAt: new Date().toISOString(),
    includeMarkdown,
    rootKeys: tree.map((node) => node.key).filter(Boolean),
    nodeCount: stats.nodeCount,
    duplicateKeys: stats.duplicateKeys,
    tree
  };
}

export function createCategoryExportPayload(categoryNode, options = {}) {
  const includeMarkdown = Boolean(options.includeMarkdown);
  const tree = cloneExportNode(categoryNode, { includeMarkdown });
  const stats = createExportStats([tree]);

  return {
    exportType: 'story-category',
    exportVersion: 2,
    exportedAt: new Date().toISOString(),
    includeMarkdown,
    rootKey: tree.key ?? '',
    rootTitle: tree.title ?? '',
    nodeCount: stats.nodeCount,
    duplicateKeys: stats.duplicateKeys,
    tree
  };
}

export function findOutlineNodeByKey(nodes, key) {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }

    if (Array.isArray(node.children)) {
      const foundNode = findOutlineNodeByKey(node.children, key);

      if (foundNode) {
        return foundNode;
      }
    }
  }

  return null;
}

export function sanitizeStoryExportFilename(value) {
  const normalizedValue = String(value ?? '').trim().replace(/[\\/:*?"<>|]+/g, '-');

  return normalizedValue || 'story-category';
}

function cloneExportTree(outline, options) {
  return Array.isArray(outline)
    ? outline.map((node) => cloneExportNode(node, options))
    : [];
}

function cloneExportNode(node, options) {
  return stripExportMarkdown(cloneSerializableValue(node), options);
}

function cloneSerializableValue(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function stripExportMarkdown(value, options = {}) {
  if (options.includeMarkdown) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripExportMarkdown(item, options));
  }

  const nextValue = { ...value };
  delete nextValue.detailMarkdown;

  if (Array.isArray(nextValue.children)) {
    nextValue.children = nextValue.children.map((child) => stripExportMarkdown(child, options));
  }

  return nextValue;
}

function createExportStats(rootNodes) {
  const seenKeys = new Set();
  const duplicateKeys = new Set();
  let nodeCount = 0;

  walkExportNodes(rootNodes, (node) => {
    nodeCount += 1;

    if (!node?.key) {
      return;
    }

    if (seenKeys.has(node.key)) {
      duplicateKeys.add(node.key);
    } else {
      seenKeys.add(node.key);
    }
  });

  return {
    nodeCount,
    duplicateKeys: [...duplicateKeys]
  };
}

function walkExportNodes(nodes, visitor) {
  if (!Array.isArray(nodes)) {
    return;
  }

  nodes.forEach((node) => {
    visitor(node);
    walkExportNodes(node?.children, visitor);
  });
}
