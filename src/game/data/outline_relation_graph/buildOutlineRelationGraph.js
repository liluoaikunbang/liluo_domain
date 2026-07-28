import {
  GRAPH_SCHEMA_VERSION,
  DEFAULT_SUMMARY_MAX
} from './constants.js';
import {
  SEEDED_CONCEPTS,
  listGraphVisibleConcepts,
  resolveConceptLayer,
  CONCEPT_LAYERS
} from './conceptRegistry.js';
import {
  STYLE_TAXONOMY_DIMENSIONS,
  styleDimensionLabel,
  styleDimensionNodeId,
  styleEvidenceNodeId,
  styleTechniqueNodeId,
  styleValueLabel
} from './styleTaxonomyLabels.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values) {
  return [...new Set(asArray(values).map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function clipSummary(text, max = DEFAULT_SUMMARY_MAX) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function slugifyLabel(label) {
  return String(label ?? '')
    .trim()
    .toLocaleLowerCase('zh-CN')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_./]/gu, '')
    .slice(0, 80) || 'unnamed';
}

function nodeId(type, rawId) {
  return `${type}:${rawId}`;
}

function edgeId(source, target, relationType) {
  return `${relationType}:${source}->${target}`;
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input ?? '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Build a display-only relation graph from existing project sources.
 * Does not copy master prose bodies; only references + compact display fields.
 */
export function buildOutlineRelationGraph(input = {}) {
  const storySource = input.storySource ?? { rootKeys: [], nodes: [] };
  const plotCatalog = input.plotCatalog ?? { groups: [], entries: [] };
  const gameplayCatalog = input.gameplayCatalog ?? { categories: [], entries: [] };
  const characterOutline = input.characterOutline ?? { worlds: [] };
  const ragCards = asArray(input.ragCards);
  const cardRules = input.cardRules ?? { terms: [], plotPatterns: [] };
  const styleArticles = asArray(input.styleArticles);
  const styleTaxonomy = input.styleTaxonomy ?? null;
  const concepts = listGraphVisibleConcepts(input.concepts ?? SEEDED_CONCEPTS);
  const auditRecords = asArray(input.auditRegistry?.records);
  const builtAt = input.builtAt ?? new Date().toISOString();

  const nodes = new Map();
  const edges = new Map();
  const deferredEdges = [];

  function ensureNode(partial) {
    const id = partial.id;
    if (!id) return null;
    const existing = nodes.get(id);
    if (existing) {
      if (!existing.summary && partial.summary) existing.summary = clipSummary(partial.summary);
      if (partial.aliases?.length) {
        existing.aliases = uniqueStrings([...(existing.aliases ?? []), ...partial.aliases]);
      }
      if (partial.sourceIds?.length) {
        existing.sourceIds = uniqueStrings([...(existing.sourceIds ?? []), ...partial.sourceIds]);
      }
      if (partial.conceptIds?.length) {
        existing.conceptIds = uniqueStrings([...(existing.conceptIds ?? []), ...partial.conceptIds]);
      }
      if (partial.world && !existing.world) existing.world = partial.world;
      if (partial.auditStatus && existing.auditStatus === 'auto_generated') {
        existing.auditStatus = partial.auditStatus;
      }
      if (partial.meta && typeof partial.meta === 'object') {
        const merged = { ...(existing.meta || {}), ...partial.meta };
        for (const key of [
          'parentTagNodeIds',
          'parentBondageNodeIds',
          'parentStoryNodeIds',
          'parentConcepts',
          'linkedConceptIds'
        ]) {
          if (existing.meta?.[key] || partial.meta[key]) {
            merged[key] = uniqueStrings([
              ...asArray(existing.meta?.[key]),
              ...asArray(partial.meta[key])
            ]);
          }
        }
        existing.meta = merged;
      }
      return existing;
    }
    const node = {
      id,
      type: partial.type,
      title: partial.title || id,
      summary: clipSummary(partial.summary ?? ''),
      description: String(partial.description ?? ''),
      aliases: uniqueStrings(partial.aliases),
      sourceIds: uniqueStrings(partial.sourceIds),
      conceptIds: uniqueStrings(partial.conceptIds),
      world: partial.world ?? '',
      series: partial.series ?? '',
      visibility: partial.visibility ?? {
        primaryTag: true,
        detailPanel: true,
        graph: true,
        searchable: true,
        ragRetrievable: true
      },
      auditStatus: partial.auditStatus ?? 'auto_generated',
      confidence: typeof partial.confidence === 'number' ? partial.confidence : 1,
      origin: partial.origin ?? 'derived-field',
      updatedAt: partial.updatedAt ?? builtAt,
      meta: partial.meta ?? {}
    };
    nodes.set(id, node);
    return node;
  }

  function addEdge(partial) {
    if (!partial.source || !partial.target || partial.source === partial.target) return null;
    if (!nodes.has(partial.source) || !nodes.has(partial.target)) {
      deferredEdges.push(partial);
      return null;
    }
    const id = partial.id ?? edgeId(partial.source, partial.target, partial.relationType);
    if (edges.has(id)) return edges.get(id);
    const edge = {
      id,
      source: partial.source,
      target: partial.target,
      relationType: partial.relationType,
      sourceRef: partial.sourceRef ?? '',
      confidence: typeof partial.confidence === 'number' ? partial.confidence : 1,
      auditStatus: partial.auditStatus ?? 'auto_generated',
      autoGenerated: partial.autoGenerated !== false,
      note: partial.note ?? ''
    };
    edges.set(id, edge);
    return edge;
  }

  function flushDeferredEdges() {
    const pending = deferredEdges.splice(0, deferredEdges.length);
    for (const partial of pending) {
      if (!nodes.has(partial.source) || !nodes.has(partial.target)) continue;
      const id = partial.id ?? edgeId(partial.source, partial.target, partial.relationType);
      if (edges.has(id)) continue;
      edges.set(id, {
        id,
        source: partial.source,
        target: partial.target,
        relationType: partial.relationType,
        sourceRef: partial.sourceRef ?? '',
        confidence: typeof partial.confidence === 'number' ? partial.confidence : 1,
        auditStatus: partial.auditStatus ?? 'auto_generated',
        autoGenerated: partial.autoGenerated !== false,
        note: partial.note ?? ''
      });
    }
  }

  function resolveConceptIdByLabel(label) {
    return conceptNameToId.get(String(label ?? '').trim().toLocaleLowerCase('zh-CN')) ?? null;
  }

  function registerRagConceptLink(conceptId, ragNodeId) {
    if (!conceptId || !ragNodeId) return;
    if (!ragIdsByConceptId.has(conceptId)) ragIdsByConceptId.set(conceptId, []);
    const list = ragIdsByConceptId.get(conceptId);
    if (!list.includes(ragNodeId)) list.push(ragNodeId);
  }

  function titlesMatchConcept(ragNode, concept) {
    const title = String(ragNode?.title ?? '')
      .trim()
      .toLocaleLowerCase('zh-CN');
    if (!title) return false;
    return uniqueStrings([concept.canonicalName, ...asArray(concept.aliases)])
      .map((name) => name.toLocaleLowerCase('zh-CN'))
      .includes(title);
  }

  function applyRagHierarchyMeta(ragNode, conceptId) {
    const concept = conceptById.get(conceptId);
    if (!concept || !ragNode) return;
    const seedLayer = resolveConceptLayer(concept);
    // Only the canonical category card (title = 上位类别名) is a tree root.
    // Other cards that merely link to a category seed hang under it as 具体概念.
    const isCanonicalCategory =
      seedLayer === CONCEPT_LAYERS.CATEGORY && titlesMatchConcept(ragNode, concept);
    const effectiveLayer =
      seedLayer === CONCEPT_LAYERS.CATEGORY && !isCanonicalCategory
        ? CONCEPT_LAYERS.CONCEPT
        : seedLayer;
    const parents = [...asArray(concept.parentConcepts)];
    if (seedLayer === CONCEPT_LAYERS.CATEGORY && !isCanonicalCategory) {
      parents.push(conceptId);
    }

    const current = ragNode.meta?.ragLayer;
    const preferDetail =
      !current ||
      (current === CONCEPT_LAYERS.CATEGORY && effectiveLayer === CONCEPT_LAYERS.CONCEPT);
    ragNode.meta = {
      ...ragNode.meta,
      ...(preferDetail
        ? {
            ragLayer: effectiveLayer,
            ragLayerLabel: effectiveLayer === CONCEPT_LAYERS.CATEGORY ? '上位类别' : '具体概念'
          }
        : {}),
      parentConcepts: uniqueStrings([...(ragNode.meta?.parentConcepts ?? []), ...parents]),
      linkedConceptIds: uniqueStrings([...(ragNode.meta?.linkedConceptIds ?? []), conceptId])
    };
    ragNode.conceptIds = uniqueStrings([
      ...(ragNode.conceptIds ?? []),
      conceptId,
      concept.canonicalName,
      ...asArray(concept.aliases)
    ]);
  }

  function linkLabelToRag(label, fromNodeId, relationType = 'references') {
    const text = String(label ?? '').trim();
    if (!text || !fromNodeId) return;
    deferredRagLinks.push({ fromNodeId, label: text, relationType });
  }

  function flushLabelLinksToRag() {
    const ragNameIndex = new Map();
    for (const node of nodes.values()) {
      if (node.type !== 'rag') continue;
      const names = uniqueStrings([
        node.title,
        ...(node.aliases ?? []),
        ...(node.conceptIds ?? []),
        ...(node.meta?.linkedConceptIds ?? [])
      ]);
      // Also index canonical names from linked concept seeds.
      for (const conceptId of asArray(node.meta?.linkedConceptIds)) {
        const concept = conceptById.get(conceptId);
        if (!concept) continue;
        names.push(concept.canonicalName, ...asArray(concept.aliases));
      }
      for (const name of uniqueStrings(names)) {
        const key = name.toLocaleLowerCase('zh-CN');
        if (!ragNameIndex.has(key)) ragNameIndex.set(key, []);
        const list = ragNameIndex.get(key);
        if (!list.includes(node.id)) list.push(node.id);
      }
    }

    for (const { fromNodeId, label, relationType } of deferredRagLinks) {
      const conceptId = resolveConceptIdByLabel(label);
      const ragIds = new Set(ragNameIndex.get(label.toLocaleLowerCase('zh-CN')) ?? []);
      if (conceptId) {
        for (const ragId of ragIdsByConceptId.get(conceptId) ?? []) ragIds.add(ragId);
      }
      for (const ragNodeId of ragIds) {
        if (fromNodeId === ragNodeId) continue;
        addEdge({
          source: fromNodeId,
          target: ragNodeId,
          relationType,
          sourceRef: 'label→rag',
          confidence: 0.9,
          auditStatus: 'auto_generated',
          autoGenerated: true,
          note: '故事 / 情节 / 玩法通过正式引用直连普通 RAG'
        });
      }
    }
  }

  function projectRagHierarchyEdges() {
    for (const node of nodes.values()) {
      if (node.type !== 'rag' || node.meta?.ragLayer !== CONCEPT_LAYERS.CONCEPT) continue;
      for (const parentRagNodeId of uniqueStrings(node.meta?.parentRagNodeIds)) {
        if (!nodes.has(parentRagNodeId) || parentRagNodeId === node.id) continue;
        addEdge({
          source: parentRagNodeId,
          target: node.id,
          relationType: 'narrower',
          sourceRef: 'rag.parentCardIds',
          auditStatus: 'confirmed',
          autoGenerated: false
        });
        addEdge({
          source: node.id,
          target: parentRagNodeId,
          relationType: 'broader',
          sourceRef: 'rag.parentCardIds',
          auditStatus: 'confirmed',
          autoGenerated: false
        });
      }
    }

    const categoryRagByConceptId = new Map();
    for (const node of nodes.values()) {
      if (node.type !== 'rag' || node.meta?.ragLayer !== CONCEPT_LAYERS.CATEGORY) continue;
      for (const conceptId of asArray(node.meta?.linkedConceptIds)) {
        if (!categoryRagByConceptId.has(conceptId)) {
          categoryRagByConceptId.set(conceptId, node.id);
        }
      }
    }

    for (const node of nodes.values()) {
      if (node.type !== 'rag' || node.meta?.ragLayer !== CONCEPT_LAYERS.CONCEPT) continue;
      for (const parentConceptId of uniqueStrings(node.meta?.parentConcepts)) {
        const parentRagId = categoryRagByConceptId.get(parentConceptId);
        if (!parentRagId || parentRagId === node.id) continue;
        node.meta = {
          ...node.meta,
          parentRagNodeIds: uniqueStrings([...(node.meta?.parentRagNodeIds ?? []), parentRagId])
        };
        addEdge({
          source: parentRagId,
          target: node.id,
          relationType: 'narrower',
          sourceRef: 'rag-hierarchy-tree',
          confidence: 1,
          auditStatus: 'confirmed',
          autoGenerated: false,
          note: '上位类别 RAG → 具体概念 RAG'
        });
        addEdge({
          source: node.id,
          target: parentRagId,
          relationType: 'broader',
          sourceRef: 'rag-hierarchy-tree',
          confidence: 1,
          auditStatus: 'confirmed',
          autoGenerated: false,
          note: '具体概念 RAG → 上位类别 RAG'
        });
      }
    }
  }

  // --- Concept registry: hierarchy seed only (NOT graph nodes) ---
  const conceptById = new Map();
  const conceptNameToId = new Map();
  const ragIdsByConceptId = new Map();
  const deferredRagLinks = [];
  for (const concept of concepts) {
    if (!concept?.conceptId) continue;
    conceptById.set(concept.conceptId, concept);
    for (const name of uniqueStrings([concept.canonicalName, ...(concept.aliases ?? [])])) {
      conceptNameToId.set(name.toLocaleLowerCase('zh-CN'), concept.conceptId);
    }
  }

  // --- Worlds & story nodes ---
  const storyNodes = asArray(storySource.nodes);
  const plotEntries = asArray(plotCatalog.entries);
  const worldLabels = uniqueStrings(storyNodes.map((node) => node.world));
  for (const worldLabel of worldLabels) {
    ensureNode({
      id: nodeId('world', slugifyLabel(worldLabel)),
      type: 'world',
      title: worldLabel,
      summary: `世界：${worldLabel}`,
      sourceIds: [`story.world:${worldLabel}`],
      world: worldLabel,
      origin: 'story-outline',
      auditStatus: 'confirmed',
      meta: {
        laneKind: 'world',
        storyLayer: 'category',
        storyLayerLabel: '世界'
      }
    });
  }

  const rootKeySet = new Set(asArray(storySource.rootKeys));
  /** Series root story keys fold into the world node (same swimlane, no duplicate). */
  const seriesRootToWorldId = new Map();
  for (const story of storyNodes) {
    if (!story?.key || !rootKeySet.has(story.key)) continue;
    const worldLabel = String(story.world ?? '').trim();
    if (!worldLabel) continue;
    seriesRootToWorldId.set(story.key, nodeId('world', slugifyLabel(worldLabel)));
  }

  function resolveStoryAnchorId(key) {
    const raw = String(key ?? '').trim();
    if (!raw) return '';
    return seriesRootToWorldId.get(raw) || nodeId('story', raw);
  }

  for (const story of storyNodes) {
    const storyKey = story.key;
    if (!storyKey) continue;
    const worldLabel = story.world ?? '';
    const worldNodeId = worldLabel ? nodeId('world', slugifyLabel(worldLabel)) : '';
    const isSeriesRoot = rootKeySet.has(storyKey);

    // Fold series-root classification nodes into the world node — one card per world.
    if (isSeriesRoot) {
      if (worldNodeId) {
        ensureNode({
          id: worldNodeId,
          type: 'world',
          title: story.title || worldLabel,
          summary: story.summary || `世界：${worldLabel}`,
          description: story.summary || '',
          aliases: uniqueStrings([worldLabel, story.title]),
          sourceIds: [storyKey, `story.world:${worldLabel}`],
          world: worldLabel,
          origin: 'story-outline',
          auditStatus: 'confirmed',
          meta: {
            laneKind: 'world-series',
            seriesKey: storyKey,
            seriesTitle: story.title || '',
            status: story.status ?? '',
            mergedSeries: true,
            storyLayer: 'category',
            storyLayerLabel: '世界'
          }
        });
      }
      // Root has no separate series/story card; children still parent to the world via resolveStoryAnchorId.
      continue;
    }

    ensureNode({
      id: nodeId('story', storyKey),
      type: 'story',
      title: story.title || storyKey,
      summary: story.summary,
      description: story.summary,
      sourceIds: [storyKey],
      world: worldLabel,
      origin: 'story-outline',
      auditStatus: 'confirmed',
      meta: {
        status: story.status ?? '',
        parentKey: story.parentKey ?? '',
        questType: story.questType ?? '',
        storyLayer: 'concept',
        storyLayerLabel: '故事',
        parentStoryNodeIds: worldNodeId ? [worldNodeId] : [],
        missingItemCount: asArray(story.missingItems).length
      }
    });

    if (worldNodeId) {
      addEdge({
        source: worldNodeId,
        target: nodeId('story', storyKey),
        relationType: 'contains',
        sourceRef: 'story.world',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    if (story.parentKey) {
      addEdge({
        source: resolveStoryAnchorId(story.parentKey),
        target: nodeId('story', storyKey),
        relationType: 'parent',
        sourceRef: 'story.parentKey',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const ragRef of uniqueStrings(story.ragRefs)) {
      addEdge({
        source: nodeId('story', storyKey),
        target: nodeId('rag', ragRef),
        relationType: 'references',
        sourceRef: 'story.ragRefs',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }
    for (const plotRef of uniqueStrings(story.plotRefs)) {
      addEdge({
        source: nodeId('story', storyKey),
        target: nodeId('plot', plotRef),
        relationType: 'contains',
        sourceRef: 'story.plotRefs',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const name of uniqueStrings(story.characters)) {
      // character nodes created later from characterOutline; provisional link via name slug
      const personId = nodeId('character', `${slugifyLabel(worldLabel)}:${slugifyLabel(name)}`);
      ensureNode({
        id: personId,
        type: 'character',
        title: name,
        summary: `出现于 ${story.title || storyKey}`,
        world: worldLabel,
        origin: 'story-outline',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: personId,
        target: nodeId('story', storyKey),
        relationType: 'participates',
        sourceRef: 'story.characters',
        autoGenerated: false
      });
    }

    for (const location of uniqueStrings(story.locations)) {
      const locationId = nodeId('location', `${slugifyLabel(worldLabel)}:${slugifyLabel(location)}`);
      ensureNode({
        id: locationId,
        type: 'location',
        title: location,
        summary: `地点：${location}`,
        world: worldLabel,
        origin: 'story-outline',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: nodeId('story', storyKey),
        target: locationId,
        relationType: 'located_at',
        sourceRef: 'story.locations',
        autoGenerated: false
      });
    }

    for (const gameplayId of uniqueStrings(story.gameplayRefs)) {
      addEdge({
        source: nodeId('story', storyKey),
        target: nodeId('gameplay', gameplayId),
        relationType: 'references',
        sourceRef: 'story.gameplayRefs',
        autoGenerated: false,
        auditStatus: 'confirmed'
      });
    }
  }

  // --- Plot catalog ---
  for (const group of asArray(plotCatalog.groups)) {
    ensureNode({
      id: nodeId('plot', `group:${group.id}`),
      type: 'plot',
      title: group.title || group.id,
      summary: group.summary,
      sourceIds: [group.id],
      origin: 'plot-catalog',
      auditStatus: 'confirmed',
      meta: {
        kind: 'group',
        plotLayer: 'category',
        plotLayerLabel: '大情节'
      }
    });
  }

  for (const entry of plotEntries) {
    const plotNodeId = nodeId('plot', entry.id);
    const parentPlotNodeId = entry.groupId ? nodeId('plot', `group:${entry.groupId}`) : '';
    ensureNode({
      id: plotNodeId,
      type: 'plot',
      title: entry.title || entry.id,
      summary: entry.summary,
      description: [
        entry.development?.premise,
        entry.development?.escalation,
        entry.development?.turn,
        entry.development?.consequence
      ].filter(Boolean).join(' / '),
      sourceIds: [entry.id],
      origin: 'plot-catalog',
      auditStatus: 'confirmed',
      meta: {
        groupId: entry.groupId,
        usageStatus: entry.usageStatus,
        plotKind: entry.plotKind,
        usedByCount: asArray(entry.usedBy).length,
        plotLayer: 'concept',
        plotLayerLabel: '小情节',
        parentPlotNodeIds: parentPlotNodeId ? [parentPlotNodeId] : []
      }
    });

    if (parentPlotNodeId) {
      addEdge({
        source: parentPlotNodeId,
        target: plotNodeId,
        relationType: 'contains',
        sourceRef: 'plot.groupId',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const storyKey of uniqueStrings(entry.usedBy)) {
      addEdge({
        source: plotNodeId,
        target: resolveStoryAnchorId(storyKey),
        relationType: 'appears_in',
        sourceRef: 'plot.usedBy',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const ragRef of uniqueStrings(entry.ragRefs)) {
      addEdge({
        source: plotNodeId,
        target: nodeId('rag', ragRef),
        relationType: 'references',
        sourceRef: 'plot.ragRefs',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const name of uniqueStrings(entry.characters)) {
      const personId = nodeId('character', `plot:${slugifyLabel(name)}`);
      ensureNode({
        id: personId,
        type: 'character',
        title: name,
        summary: `情节人物：${name}`,
        origin: 'plot-catalog',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: personId,
        target: plotNodeId,
        relationType: 'participates',
        sourceRef: 'plot.characters',
        autoGenerated: true
      });
    }
  }

  // --- Gameplay ---
  for (const category of asArray(gameplayCatalog.categories)) {
    ensureNode({
      id: nodeId('gameplay', `category:${category.id}`),
      type: 'gameplay',
      title: category.title || category.id,
      summary: '玩法分类',
      sourceIds: [category.id],
      origin: 'gameplay-catalog',
      auditStatus: 'confirmed',
      meta: {
        kind: 'category',
        gameplayLayer: 'category',
        gameplayLayerLabel: '大玩法'
      }
    });
  }

  for (const entry of asArray(gameplayCatalog.entries)) {
    const gameplayNodeId = nodeId('gameplay', entry.id);
    const parentGameplayNodeId = entry.categoryId
      ? nodeId('gameplay', `category:${entry.categoryId}`)
      : '';
    ensureNode({
      id: gameplayNodeId,
      type: 'gameplay',
      title: entry.title || entry.id,
      summary: entry.summary,
      sourceIds: [entry.id],
      origin: 'gameplay-catalog',
      auditStatus: 'confirmed',
      meta: {
        categoryId: entry.categoryId,
        number: entry.number,
        gameplayLayer: 'concept',
        gameplayLayerLabel: '小玩法',
        parentGameplayNodeIds: parentGameplayNodeId ? [parentGameplayNodeId] : []
      }
    });
    if (parentGameplayNodeId) {
      addEdge({
        source: parentGameplayNodeId,
        target: gameplayNodeId,
        relationType: 'belongs_to',
        sourceRef: 'gameplay.categoryId',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }
  }

  // --- Characters / orgs from derived outline ---
  for (const world of asArray(characterOutline.worlds)) {
    for (const character of asArray(world.characters)) {
      const type = character.kind === 'organization' ? 'organization' : 'character';
      const id = nodeId(type, character.id || `${world.id}:${character.name}`);
      ensureNode({
        id,
        type,
        title: character.name,
        summary: `${type === 'organization' ? '组织' : '人物'} · ${world.label || world.id}`,
        world: world.label || world.id,
        sourceIds: [character.id],
        origin: 'story-character-outline',
        auditStatus: 'confirmed',
        meta: { appearanceCount: asArray(character.appearances).length }
      });
      for (const appearance of asArray(character.appearances)) {
        addEdge({
          source: id,
          target: resolveStoryAnchorId(appearance.key),
          relationType: 'participates',
          sourceRef: 'character.appearances',
          auditStatus: 'confirmed',
          autoGenerated: false
        });
      }
      for (const location of uniqueStrings(character.locations)) {
        const locationId = nodeId('location', `${slugifyLabel(world.id)}:${slugifyLabel(location)}`);
        ensureNode({
          id: locationId,
          type: 'location',
          title: location,
          world: world.label || world.id,
          origin: 'story-character-outline',
          auditStatus: 'auto_generated'
        });
        addEdge({
          source: id,
          target: locationId,
          relationType: 'located_at',
          sourceRef: 'character.locations',
          autoGenerated: true
        });
      }
    }
  }

  // --- Ordinary RAG cards ---
  const ragCardKeys = new Set();
  for (const card of ragCards) {
    const cardId = card.cardId || card.id;
    if (!cardId) continue;
    ragCardKeys.add(cardId);
    if (card.title) ragCardKeys.add(String(card.title).trim());
    const ragNodeId = nodeId('rag', cardId);
    ensureNode({
      id: ragNodeId,
      type: 'rag',
      title: card.title || cardId,
      summary: card.definition || card.summary || '',
      description: buildRagCardDescription(card),
      aliases: card.aliases,
      sourceIds: uniqueStrings([
        cardId,
        ...asArray(card.sourceRefs).map((ref) => ref.sourceId || ref.segmentId)
      ]),
      conceptIds: uniqueStrings([...(card.concepts ?? []), ...(card.linkedConceptIds ?? [])]),
      origin: 'external-knowledge-card',
      auditStatus: card.reviewStatus === 'approved' || card.reviewStatus === 'reviewed' ? 'confirmed' : 'pending_review',
      confidence: card.canonical ? 1 : 0.7,
      meta: {
        cardType: card.cardType,
        knowledgeScope: card.knowledgeScope,
        reviewStatus: card.reviewStatus,
        evidenceStatus: card.evidenceStatus,
        contentStatus: card.contentStatus,
        ragLayer: card.ragLayer,
        ragLayerLabel: card.ragLayer === 'category' ? '上位类别' : card.ragLayer === 'concept' ? '具体概念' : '',
        parentRagNodeIds: uniqueStrings(asArray(card.parentCardIds).map((id) => nodeId('rag', id))),
        role: 'card',
        linkedConceptIds: uniqueStrings(card.linkedConceptIds)
      }
    });

    if (!asArray(card.sourceRefs).length) {
      nodes.get(ragNodeId).auditStatus = 'missing_source';
    }

    linkRagNodeToConceptsAndTags({
      ragNodeId,
      card,
      ensureNode,
      addEdge,
      getNode: (id) => nodes.get(id),
      resolveConceptIdByLabel,
      registerRagConceptLink,
      applyRagHierarchyMeta,
      nodeId,
      slugifyLabel,
      uniqueStrings
    });
  }

  // Project card-rules that are not yet materialized as cards (content candidates; same RAG role).
  for (const term of asArray(cardRules.terms)) {
    if (!term?.id || !term.title) continue;
    const cardId = `fb-term-${term.id}`;
    if (ragCardKeys.has(cardId) || ragCardKeys.has(term.title)) continue;
    const ragNodeId = nodeId('rag', cardId);
    ensureNode({
      id: ragNodeId,
      type: 'rag',
      title: term.title,
      summary: term.definition || '',
      description: buildRagCardDescription(term),
      aliases: term.aliases,
      sourceIds: uniqueStrings([term.id]),
      conceptIds: uniqueStrings([term.title, ...(term.aliases ?? []), ...(term.linkedConceptIds ?? [])]),
      origin: 'card-rules-candidate',
      auditStatus: 'pending_review',
      confidence: 0.45,
      meta: {
        cardType: 'term',
        knowledgeScope: 'external-fiction-reference',
        reviewStatus: 'candidate',
        role: 'card-rule',
        ruleId: term.id,
        linkedConceptIds: uniqueStrings(term.linkedConceptIds)
      }
    });
    nodes.get(ragNodeId).auditStatus = 'missing_source';
    linkRagNodeToConceptsAndTags({
      ragNodeId,
      card: {
        title: term.title,
        aliases: term.aliases,
        concepts: [term.title, ...(term.aliases ?? [])],
        linkedConceptIds: term.linkedConceptIds,
        tags: []
      },
      ensureNode,
      addEdge,
      getNode: (id) => nodes.get(id),
      resolveConceptIdByLabel,
      registerRagConceptLink,
      applyRagHierarchyMeta,
      nodeId,
      slugifyLabel,
      uniqueStrings
    });
  }

  for (const pattern of asArray(cardRules.plotPatterns)) {
    if (!pattern?.id || !pattern.title) continue;
    const cardId = `fb-plot-pattern-${pattern.id}`;
    if (ragCardKeys.has(cardId) || ragCardKeys.has(pattern.title)) continue;
    const ragNodeId = nodeId('rag', cardId);
    ensureNode({
      id: ragNodeId,
      type: 'rag',
      title: pattern.title,
      summary: asArray(pattern.progression)[0] || '',
      description: buildRagCardDescription(pattern),
      aliases: pattern.aliases,
      sourceIds: uniqueStrings([pattern.id]),
      conceptIds: uniqueStrings([
        pattern.title,
        ...(pattern.conceptLabels ?? []),
        ...(pattern.linkedConceptIds ?? [])
      ]),
      origin: 'card-rules-candidate',
      auditStatus: 'pending_review',
      confidence: 0.45,
      meta: {
        cardType: 'plot-pattern',
        knowledgeScope: 'external-fiction-reference',
        reviewStatus: 'candidate',
        role: 'card-rule',
        ruleId: pattern.id,
        linkedConceptIds: uniqueStrings(pattern.linkedConceptIds)
      }
    });
    nodes.get(ragNodeId).auditStatus = 'missing_source';
    linkRagNodeToConceptsAndTags({
      ragNodeId,
      card: {
        title: pattern.title,
        concepts: [pattern.title, ...(pattern.conceptLabels ?? [])],
        linkedConceptIds: pattern.linkedConceptIds,
        tags: []
      },
      ensureNode,
      addEdge,
      getNode: (id) => nodes.get(id),
      resolveConceptIdByLabel,
      registerRagConceptLink,
      applyRagHierarchyMeta,
      nodeId,
      slugifyLabel,
      uniqueStrings
    });
  }

  projectRagHierarchyEdges();
  flushLabelLinksToRag();

  // --- Style-RAG: 写法名词网 (primary) + 文章证据挂点 (secondary) ---
  const techniqueIdsByKey = new Map();

  function ensureTechniqueNode(dimensionKey, value) {
    const key = `${dimensionKey}:${value}`;
    if (techniqueIdsByKey.has(key)) return techniqueIdsByKey.get(key);
    const dimId = styleDimensionNodeId(dimensionKey);
    if (!nodes.has(dimId)) {
      ensureNode({
        id: dimId,
        type: 'style_rag',
        title: styleDimensionLabel(dimensionKey),
        summary: `写法维度 · ${styleDimensionLabel(dimensionKey)}`,
        description: `Style taxonomy 维度：${dimensionKey}`,
        origin: 'style-taxonomy',
        auditStatus: 'confirmed',
        confidence: 1,
        visibility: {
          primaryTag: false,
          detailPanel: true,
          graph: true,
          searchable: true,
          ragRetrievable: false,
          overviewDefault: true
        },
        meta: {
          role: 'technique_dimension',
          dimensionKey
        }
      });
    }
    const techId = styleTechniqueNodeId(dimensionKey, value);
    ensureNode({
      id: techId,
      type: 'style_rag',
      title: styleValueLabel(dimensionKey, value),
      summary: `${styleDimensionLabel(dimensionKey)} · ${value}`,
      description: `写法名词（${styleDimensionLabel(dimensionKey)}）：${styleValueLabel(dimensionKey, value)}`,
      aliases: [value],
      origin: 'style-taxonomy',
      auditStatus: 'confirmed',
      confidence: 1,
      visibility: {
        primaryTag: false,
        detailPanel: true,
        graph: true,
        searchable: true,
        ragRetrievable: false,
        overviewDefault: true
      },
      meta: {
        role: 'technique',
        dimensionKey,
        taxonomyValue: value
      }
    });
    addEdge({
      source: dimId,
      target: techId,
      relationType: 'contains',
      sourceRef: 'style-taxonomy',
      confidence: 1,
      autoGenerated: true,
      auditStatus: 'confirmed'
    });
    techniqueIdsByKey.set(key, techId);
    return techId;
  }

  for (const dimensionKey of STYLE_TAXONOMY_DIMENSIONS) {
    const values = asArray(styleTaxonomy?.[dimensionKey]);
    for (const value of values) {
      ensureTechniqueNode(dimensionKey, value);
    }
  }

  for (const article of styleArticles) {
    const articleId = article.articleId || article.id;
    if (!articleId) continue;
    const styleNodeId = styleEvidenceNodeId(articleId);
    const title = article.title?.value || article.title || articleId;
    const reviewStatus = article.review?.status || 'unreviewed';
    const themeDomain = article.themeDomain || 'unknown';
    ensureNode({
      id: styleNodeId,
      type: 'style_rag',
      title,
      summary: `文章证据 · ${themeDomain} · ${reviewStatus}`,
      description: article.productionUse?.styleRecommendation || '',
      sourceIds: uniqueStrings([articleId, article.path, article.sourceId]),
      origin: 'style-rag-article-registry',
      auditStatus: reviewStatus === 'reviewed' ? 'confirmed' : 'pending_review',
      confidence: article.title?.confidence === 'high' ? 0.9 : 0.55,
      visibility: {
        primaryTag: false,
        detailPanel: true,
        graph: true,
        searchable: true,
        ragRetrievable: false,
        overviewDefault: false
      },
      meta: {
        role: 'evidence',
        themeDomain,
        restraintFunction: article.restraintFunction,
        authorId: article.author?.authorId,
        reviewStatus,
        articleId
      }
    });

    if (!article.path && !article.sourceId) {
      nodes.get(styleNodeId).auditStatus = 'missing_source';
    }

    const linkedTechniqueIds = new Set();
    const themeTechId = ensureTechniqueNode('themeDomains', themeDomain);
    linkedTechniqueIds.add(themeTechId);
    addEdge({
      source: styleNodeId,
      target: themeTechId,
      relationType: 'sourced_from',
      sourceRef: 'style.themeDomain',
      autoGenerated: true
    });

    for (const fn of uniqueStrings(article.restraintFunction)) {
      const techId = ensureTechniqueNode('restraintFunctions', fn);
      linkedTechniqueIds.add(techId);
      addEdge({
        source: styleNodeId,
        target: techId,
        relationType: 'style_reference',
        sourceRef: 'style.restraintFunction',
        autoGenerated: true
      });
    }

    const styleMeta = article.style && typeof article.style === 'object' ? article.style : {};
    const styleFieldMap = [
      ['sceneFunctions', 'sceneFunctions'],
      ['pov', 'pov'],
      ['narrativeDistance', 'narrativeDistance'],
      ['informationRelease', 'informationRelease'],
      ['sentenceRhythm', 'sentenceRhythm'],
      ['emotionExpression', 'emotionExpression'],
      ['sensoryPriority', 'sensoryPriority'],
      ['endingMode', 'endingMode'],
      ['languageIntensity', 'languageIntensity']
    ];
    for (const [field, dimensionKey] of styleFieldMap) {
      for (const value of uniqueStrings(styleMeta[field] ?? article[field])) {
        const techId = ensureTechniqueNode(dimensionKey, value);
        linkedTechniqueIds.add(techId);
        addEdge({
          source: styleNodeId,
          target: techId,
          relationType: 'style_reference',
          sourceRef: `style.${field}`,
          autoGenerated: true
        });
      }
    }

    // Unannotated articles only hang on theme domain — still evidence, not primary labels.
    nodes.get(styleNodeId).meta = {
      ...nodes.get(styleNodeId).meta,
      linkedTechniqueCount: linkedTechniqueIds.size
    };
  }

  // --- Audit registry overlay ---
  for (const record of auditRecords) {
    const assetId = record.sourceAssetId;
    if (!assetId) continue;
    const candidates = [
      styleEvidenceNodeId(assetId),
      nodeId('style_rag', assetId),
      nodeId('rag', assetId)
    ];
    for (const candidate of candidates) {
      const node = nodes.get(candidate);
      if (!node) continue;
      node.auditStatus = 'pending_review';
      node.meta = {
        ...node.meta,
        lastAuditId: record.auditId,
        issueCategories: record.issueCategories
      };
    }
  }

  flushDeferredEdges();

  // --- Derived audit flags (multi-to-multi; never fabricate missing cards) ---
  const adjacency = buildAdjacency(edges.values());
  for (const node of nodes.values()) {
    const degree = adjacency.get(node.id)?.size ?? 0;
    if (degree === 0) {
      if (!['pending_review', 'missing_source', 'conflict', 'low_confidence'].includes(node.auditStatus)) {
        node.auditStatus = node.auditStatus === 'confirmed' ? 'orphan' : 'orphan';
      }
    }

    if (node.type === 'plot' && node.meta?.kind !== 'group') {
      const linked = [...(adjacency.get(node.id) ?? [])];
      const hasStyle = linked.some((otherId) => nodes.get(otherId)?.type === 'style_rag');
      if (!hasStyle) {
        node.meta = { ...node.meta, gapFlags: uniqueStrings([...(node.meta.gapFlags ?? []), 'missing_style_rag']) };
      }
    }

    if (node.type === 'rag') {
      const hasHierarchySeed = asArray(node.meta?.linkedConceptIds).length > 0 || Boolean(node.meta?.ragLayer);
      if (!hasHierarchySeed) {
        node.meta = {
          ...node.meta,
          gapFlags: uniqueStrings([...(node.meta.gapFlags ?? []), 'rag_without_hierarchy'])
        };
      }
    }

    const gapFlags = [...asArray(node.meta?.gapFlags)];
    const isStructuralNode =
      node.type === 'world' ||
      node.meta?.kind === 'group' ||
      node.meta?.storyLayer === 'category' ||
      node.meta?.gameplayLayer === 'category' ||
      node.meta?.plotLayer === 'category';
    if (!isStructuralNode && !String(node.summary ?? '').trim()) gapFlags.push('empty_content');
    if (node.type === 'rag' && node.meta?.contentStatus === 'stub') gapFlags.push('empty_content');
    if (node.type === 'plot' && node.meta?.kind !== 'group' && node.meta?.usedByCount === 0) {
      gapFlags.push('unlinked_plot');
    }
    if (node.type === 'story' && node.meta?.missingItemCount > 0) gapFlags.push('missing_items');
    if (node.auditStatus === 'missing_source') gapFlags.push('missing_source');
    if (node.auditStatus === 'orphan' || degree === 0) gapFlags.push('orphan');
    const normalizedGapFlags = uniqueStrings(gapFlags);
    node.meta = {
      ...node.meta,
      gapFlags: normalizedGapFlags,
      hasContentGap: normalizedGapFlags.some((flag) =>
        ['empty_content', 'unlinked_plot', 'missing_items', 'missing_source', 'orphan'].includes(flag)
      )
    };

    if (typeof node.confidence === 'number' && node.confidence < 0.6) {
      if (!['conflict', 'missing_source'].includes(node.auditStatus)) {
        node.auditStatus = 'low_confidence';
      }
    }
  }

  let conceptWithoutRag = 0;
  for (const concept of concepts) {
    if (concept.visibility?.ragRetrievable === false) continue;
    if (!(ragIdsByConceptId.get(concept.conceptId)?.length)) conceptWithoutRag += 1;
  }

  const nodeList = [...nodes.values()];
  const edgeList = [...edges.values()];
  const stats = computeGraphStats(nodeList, edgeList, { conceptWithoutRag });

  return {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    builtAt,
    layoutSeed: hashString(input.layoutSeed ?? 'liluo-outline-relation-graph-v1'),
    nodes: nodeList,
    edges: edgeList,
    stats,
    meta: {
      sourceKinds: uniqueStrings([
        storyNodes.length ? 'story-outline' : '',
        asArray(plotCatalog.entries).length ? 'plot-catalog' : '',
        asArray(gameplayCatalog.entries).length ? 'gameplay-catalog' : '',
        asArray(characterOutline.worlds).length ? 'character-outline' : '',
        ragCards.length ? 'rag-cards' : '',
        asArray(cardRules.terms).length || asArray(cardRules.plotPatterns).length ? 'card-rules' : '',
        styleTaxonomy ? 'style-taxonomy' : '',
        styleArticles.length ? 'style-rag-articles' : '',
        concepts.length ? 'concept-registry-hierarchy-seed' : ''
      ]),
      note: 'Display/projection layer only. RAG hierarchy and formal story/plot/gameplay references are projected; retired Tag nodes are not.'
    }
  };
}

function buildRagCardDescription(card) {
  const parts = [];
  if (card.definition) parts.push(String(card.definition));
  for (const item of asArray(card.distinctions)) parts.push(`区分：${item}`);
  for (const item of asArray(card.prerequisites)) parts.push(`前提：${item}`);
  for (const item of asArray(card.progression)) parts.push(`推进：${item}`);
  for (const item of asArray(card.reversals)) parts.push(`反转：${item}`);
  for (const item of asArray(card.outcomes)) parts.push(`结果：${item}`);
  for (const item of asArray(card.abstractPatterns)) parts.push(`模式：${item}`);
  return parts.join('\n');
}

function linkRagNodeToConceptsAndTags(ctx) {
  const {
    ragNodeId,
    card,
    getNode,
    resolveConceptIdByLabel,
    registerRagConceptLink,
    applyRagHierarchyMeta,
    uniqueStrings
  } = ctx;

  const linkedIds = uniqueStrings(card.linkedConceptIds);
  const linkedById = new Set(linkedIds);
  const ragNode = getNode(ragNodeId);

  for (const conceptId of linkedIds) {
    registerRagConceptLink(conceptId, ragNodeId);
    applyRagHierarchyMeta(ragNode, conceptId);
  }

  // Name matching remains as fallback for cards without linkedConceptIds.
  for (const conceptLabel of uniqueStrings([...(card.concepts ?? []), ...(card.aliases ?? []), card.title])) {
    const conceptId = resolveConceptIdByLabel(conceptLabel);
    if (!conceptId || linkedById.has(conceptId)) continue;
    registerRagConceptLink(conceptId, ragNodeId);
    applyRagHierarchyMeta(ragNode, conceptId);
    linkedById.add(conceptId);
  }

  // card.tags stay on the RAG card for retrieval metadata only.
  // Do not project card metadata as graph nodes.
}

function buildAdjacency(edgeIterable) {
  const adjacency = new Map();
  for (const edge of edgeIterable) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source).add(edge.target);
    adjacency.get(edge.target).add(edge.source);
  }
  return adjacency;
}

export function computeGraphStats(nodes, edges, extras = {}) {
  const nodeList = asArray(nodes);
  const edgeList = asArray(edges);
  const byType = {};
  const byRelation = {};
  const byAudit = {};
  let orphanCount = 0;
  let pendingReviewCount = 0;
  let lowConfidenceEdgeCount = 0;
  let missingSourceCount = 0;
  let conceptWithoutRag = typeof extras.conceptWithoutRag === 'number' ? extras.conceptWithoutRag : 0;
  let plotWithoutStyle = 0;
  let highUseUnconfirmed = 0;
  let styleTechniqueCount = 0;
  let styleEvidenceCount = 0;
  let styleDimensionCount = 0;
  let conceptCategoryCount = 0;
  let conceptDetailCount = 0;
  let contentGapCount = 0;

  const degree = new Map();
  for (const edge of edgeList) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    byRelation[edge.relationType] = (byRelation[edge.relationType] ?? 0) + 1;
    if (edge.confidence < 0.6 || edge.auditStatus === 'low_confidence' || edge.auditStatus === 'pending_confirm') {
      lowConfidenceEdgeCount += 1;
    }
  }

  for (const node of nodeList) {
    byType[node.type] = (byType[node.type] ?? 0) + 1;
    byAudit[node.auditStatus] = (byAudit[node.auditStatus] ?? 0) + 1;
    if ((degree.get(node.id) ?? 0) === 0 || node.auditStatus === 'orphan') orphanCount += 1;
    if (node.auditStatus === 'pending_review') pendingReviewCount += 1;
    if (node.auditStatus === 'missing_source') missingSourceCount += 1;
    if (node.meta?.hasContentGap) contentGapCount += 1;
    if (node.type === 'plot' && asArray(node.meta?.gapFlags).includes('missing_style_rag')) plotWithoutStyle += 1;
    if ((degree.get(node.id) ?? 0) >= 5 && node.auditStatus !== 'confirmed') highUseUnconfirmed += 1;
    if (node.type === 'rag') {
      if (node.meta?.ragLayer === 'category') conceptCategoryCount += 1;
      else if (node.meta?.ragLayer === 'concept') conceptDetailCount += 1;
    }
    if (node.type === 'style_rag') {
      if (node.meta?.role === 'technique') styleTechniqueCount += 1;
      else if (node.meta?.role === 'evidence') styleEvidenceCount += 1;
      else if (node.meta?.role === 'technique_dimension') styleDimensionCount += 1;
    }
  }

  const recentNodes = [...nodeList]
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
    .slice(0, 8)
    .map((node) => ({ id: node.id, title: node.title, type: node.type, updatedAt: node.updatedAt }));

  return {
    nodeCount: nodeList.length,
    edgeCount: edgeList.length,
    byType,
    byRelation,
    byAudit,
    orphanCount,
    pendingReviewCount,
    lowConfidenceEdgeCount,
    missingSourceCount,
    conceptWithoutRag,
    plotWithoutStyle,
    highUseUnconfirmed,
    styleTechniqueCount,
    styleEvidenceCount,
    styleDimensionCount,
    conceptCategoryCount,
    conceptDetailCount,
    contentGapCount,
    recentNodes
  };
}

export function createEmptyGraph() {
  return buildOutlineRelationGraph({});
}

export { clipSummary, nodeId, slugifyLabel, hashString };
