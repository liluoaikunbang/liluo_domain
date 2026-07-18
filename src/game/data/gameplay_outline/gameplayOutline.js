import catalog from './catalog.json' with { type: 'json' };

export const gameplayOutline = Object.freeze({
  ...catalog
});

export function createGameplayIndex(outline = gameplayOutline) {
  return {
    categoryById: new Map(outline.categories.map((category) => [category.id, category])),
    entryById: new Map(outline.entries.map((entry) => [entry.id, entry]))
  };
}

export function findGameplayEntries(outline = gameplayOutline, filters = {}) {
  const query = normalizeSearchText(filters.query);

  return outline.entries.filter((entry) => {
    if (filters.categoryId && entry.categoryId !== filters.categoryId) {
      return false;
    }

    if (filters.presentationMode && !entry.presentationModes.includes(filters.presentationMode)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableText = [
      entry.number,
      entry.title,
      entry.summary,
      ...entry.designReferences,
      ...entry.variants.flatMap((variant) => [variant.title, variant.description])
    ].join(' ');

    return normalizeSearchText(searchableText).includes(query);
  });
}

export function resolveStoryGameplayLinks(storyNode, outline = gameplayOutline) {
  const { entryById } = createGameplayIndex(outline);

  return normalizeGameplayRefs(storyNode?.gameplayRefs)
    .map((gameplayId) => entryById.get(gameplayId))
    .filter(Boolean);
}

export function updateStoryGameplayRefs(storyNode, gameplayRefs) {
  return {
    ...storyNode,
    gameplayRefs: normalizeGameplayRefs(gameplayRefs)
  };
}

export function updateOutlineNodeGameplayRefs(nodes, nodeKey, gameplayRefs) {
  return nodes.map((node) => {
    if (node.key === nodeKey) {
      return updateStoryGameplayRefs(node, gameplayRefs);
    }

    if (!Array.isArray(node.children)) {
      return node;
    }

    const children = updateOutlineNodeGameplayRefs(node.children, nodeKey, gameplayRefs);
    const hasChangedChildren = children.some((child, index) => child !== node.children[index]);

    return hasChangedChildren ? { ...node, children } : node;
  });
}

function normalizeGameplayRefs(gameplayRefs) {
  return [...new Set(
    (Array.isArray(gameplayRefs) ? gameplayRefs : [])
      .map((gameplayId) => String(gameplayId ?? '').trim())
      .filter(Boolean)
  )];
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLocaleLowerCase('zh-CN');
}
