import {
  GRAPH_SCHEMA_VERSION,
  DEFAULT_SUMMARY_MAX
} from './constants.js';
import { SEEDED_CONCEPTS, listGraphVisibleConcepts } from './conceptRegistry.js';
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
  const conceptNameIndex = new Map();
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

  function indexConceptNames(conceptNode, concept) {
    for (const name of uniqueStrings([concept.canonicalName, ...(concept.aliases ?? [])])) {
      conceptNameIndex.set(name.toLocaleLowerCase('zh-CN'), conceptNode.id);
    }
  }

  function resolveConceptIdByLabel(label) {
    return conceptNameIndex.get(String(label ?? '').trim().toLocaleLowerCase('zh-CN')) ?? null;
  }

  // --- Concepts ---
  for (const concept of concepts) {
    const id = nodeId('concept', concept.conceptId);
    const conceptNode = ensureNode({
      id,
      type: 'concept',
      title: concept.canonicalName,
      summary: concept.summary,
      description: concept.summary,
      aliases: concept.aliases,
      conceptIds: [concept.conceptId],
      visibility: {
        primaryTag: concept.visibility?.primaryTag !== false,
        detailPanel: concept.visibility?.detailPanel !== false,
        graph: concept.visibility?.graph !== false,
        searchable: concept.visibility?.searchable !== false,
        ragRetrievable: concept.visibility?.ragRetrievable !== false
      },
      origin: 'concept-registry',
      auditStatus: 'confirmed',
      meta: { conceptId: concept.conceptId }
    });
    indexConceptNames(conceptNode, concept);
  }

  for (const concept of concepts) {
    const childId = nodeId('concept', concept.conceptId);
    for (const parentConceptId of asArray(concept.parentConcepts)) {
      addEdge({
        source: nodeId('concept', parentConceptId),
        target: childId,
        relationType: 'narrower',
        sourceRef: 'concept-registry',
        confidence: 1,
        auditStatus: 'confirmed',
        autoGenerated: false,
        note: '上位/下位概念'
      });
      addEdge({
        source: childId,
        target: nodeId('concept', parentConceptId),
        relationType: 'broader',
        sourceRef: 'concept-registry',
        confidence: 1,
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }
  }

  // --- Worlds & story nodes ---
  const storyNodes = asArray(storySource.nodes);
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
      auditStatus: 'confirmed'
    });
  }

  const rootKeySet = new Set(asArray(storySource.rootKeys));
  for (const story of storyNodes) {
    const storyKey = story.key;
    if (!storyKey) continue;
    const worldLabel = story.world ?? '';
    const worldNodeId = worldLabel ? nodeId('world', slugifyLabel(worldLabel)) : '';
    const isSeriesLike = rootKeySet.has(storyKey) || story.status === '分类';
    const type = isSeriesLike && rootKeySet.has(storyKey) ? 'series' : 'story';

    ensureNode({
      id: nodeId(type === 'series' ? 'series' : 'story', storyKey),
      type: type === 'series' ? 'series' : 'story',
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
        questType: story.questType ?? ''
      }
    });

    // Always also register as story id for edge targets from plot usedBy
    if (type === 'series') {
      ensureNode({
        id: nodeId('story', storyKey),
        type: 'story',
        title: story.title || storyKey,
        summary: story.summary,
        sourceIds: [storyKey],
        world: worldLabel,
        origin: 'story-outline',
        auditStatus: 'confirmed',
        meta: { mirroredFrom: 'series' }
      });
    }

    if (worldNodeId) {
      addEdge({
        source: worldNodeId,
        target: nodeId(type === 'series' ? 'series' : 'story', storyKey),
        relationType: 'contains',
        sourceRef: 'story.world',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    if (story.parentKey) {
      addEdge({
        source: nodeId('story', story.parentKey),
        target: nodeId('story', storyKey),
        relationType: 'parent',
        sourceRef: 'story.parentKey',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const tag of uniqueStrings(story.storyTags)) {
      const tagNodeId = nodeId('tag', `story:${slugifyLabel(tag)}`);
      ensureNode({
        id: tagNodeId,
        type: 'tag',
        title: tag,
        summary: `故事标签：${tag}`,
        sourceIds: [`storyTag:${tag}`],
        world: worldLabel,
        origin: 'story-outline',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: nodeId('story', storyKey),
        target: tagNodeId,
        relationType: 'tagged_with',
        sourceRef: 'story.storyTags',
        autoGenerated: true
      });
    }

    for (const tag of uniqueStrings(story.plotTags)) {
      const tagNodeId = nodeId('tag', `plot:${slugifyLabel(tag)}`);
      ensureNode({
        id: tagNodeId,
        type: 'tag',
        title: tag,
        summary: `情节标签：${tag}`,
        sourceIds: [`plotTag:${tag}`],
        origin: 'story-outline',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: nodeId('story', storyKey),
        target: tagNodeId,
        relationType: 'tagged_with',
        sourceRef: 'story.plotTags',
        autoGenerated: true
      });
      linkLabelToConcept(tag, tagNodeId);
    }

    for (const tag of uniqueStrings(story.bondageTags)) {
      const tagNodeId = nodeId('bondage_tag', slugifyLabel(tag));
      ensureNode({
        id: tagNodeId,
        type: 'bondage_tag',
        title: tag,
        summary: `紧缚标签：${tag}`,
        sourceIds: [`bondageTag:${tag}`],
        origin: 'story-outline',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: nodeId('story', storyKey),
        target: tagNodeId,
        relationType: 'bondage_tagged_with',
        sourceRef: 'story.bondageTags',
        autoGenerated: true
      });
      linkLabelToConcept(tag, tagNodeId);
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

  function linkLabelToConcept(label, fromNodeId) {
    const conceptNodeId = resolveConceptIdByLabel(label);
    if (!conceptNodeId) return;
    addEdge({
      source: fromNodeId,
      target: conceptNodeId,
      relationType: 'concept_link',
      sourceRef: 'label-concept-match',
      confidence: 0.85,
      auditStatus: 'auto_generated',
      autoGenerated: true
    });
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
      meta: { kind: 'group' }
    });
  }

  for (const entry of asArray(plotCatalog.entries)) {
    const plotNodeId = nodeId('plot', entry.id);
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
        isBondagePlot: Boolean(entry.isBondagePlot)
      }
    });

    if (entry.groupId) {
      addEdge({
        source: nodeId('plot', `group:${entry.groupId}`),
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
        target: nodeId('story', storyKey),
        relationType: 'appears_in',
        sourceRef: 'plot.usedBy',
        auditStatus: 'confirmed',
        autoGenerated: false
      });
    }

    for (const tag of uniqueStrings(entry.tags)) {
      const tagNodeId = nodeId('tag', `plot:${slugifyLabel(tag)}`);
      ensureNode({
        id: tagNodeId,
        type: 'tag',
        title: tag,
        summary: `情节标签：${tag}`,
        origin: 'plot-catalog',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: plotNodeId,
        target: tagNodeId,
        relationType: 'tagged_with',
        sourceRef: 'plot.tags',
        autoGenerated: true
      });
      linkLabelToConcept(tag, tagNodeId);
    }

    for (const tag of uniqueStrings(entry.bondageTags)) {
      const tagNodeId = nodeId('bondage_tag', slugifyLabel(tag));
      ensureNode({
        id: tagNodeId,
        type: 'bondage_tag',
        title: tag,
        summary: `紧缚标签：${tag}`,
        origin: 'plot-catalog',
        auditStatus: 'auto_generated'
      });
      addEdge({
        source: plotNodeId,
        target: tagNodeId,
        relationType: 'bondage_tagged_with',
        sourceRef: 'plot.bondageTags',
        autoGenerated: true
      });
      linkLabelToConcept(tag, tagNodeId);
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
      meta: { kind: 'category' }
    });
  }

  for (const entry of asArray(gameplayCatalog.entries)) {
    const gameplayNodeId = nodeId('gameplay', entry.id);
    ensureNode({
      id: gameplayNodeId,
      type: 'gameplay',
      title: entry.title || entry.id,
      summary: entry.summary,
      sourceIds: [entry.id],
      origin: 'gameplay-catalog',
      auditStatus: 'confirmed',
      meta: { categoryId: entry.categoryId, number: entry.number }
    });
    if (entry.categoryId) {
      addEdge({
        source: nodeId('gameplay', `category:${entry.categoryId}`),
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
          target: nodeId('story', appearance.key),
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
      conceptIds: uniqueStrings(card.concepts),
      origin: 'external-knowledge-card',
      auditStatus: card.reviewStatus === 'approved' || card.reviewStatus === 'reviewed' ? 'confirmed' : 'pending_review',
      confidence: card.canonical ? 1 : 0.7,
      meta: {
        cardType: card.cardType,
        knowledgeScope: card.knowledgeScope,
        reviewStatus: card.reviewStatus,
        role: 'card'
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
      linkLabelToConcept,
      resolveConceptIdByLabel,
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
      conceptIds: uniqueStrings([term.title, ...(term.aliases ?? [])]),
      origin: 'card-rules-candidate',
      auditStatus: 'pending_review',
      confidence: 0.45,
      meta: {
        cardType: 'term',
        knowledgeScope: 'external-fiction-reference',
        reviewStatus: 'candidate',
        role: 'card-rule',
        ruleId: term.id
      }
    });
    nodes.get(ragNodeId).auditStatus = 'missing_source';
    linkRagNodeToConceptsAndTags({
      ragNodeId,
      card: { title: term.title, aliases: term.aliases, concepts: [term.title], tags: [] },
      ensureNode,
      addEdge,
      linkLabelToConcept,
      resolveConceptIdByLabel,
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
      conceptIds: uniqueStrings([pattern.title]),
      origin: 'card-rules-candidate',
      auditStatus: 'pending_review',
      confidence: 0.45,
      meta: {
        cardType: 'plot-pattern',
        knowledgeScope: 'external-fiction-reference',
        reviewStatus: 'candidate',
        role: 'card-rule',
        ruleId: pattern.id
      }
    });
    nodes.get(ragNodeId).auditStatus = 'missing_source';
    linkRagNodeToConceptsAndTags({
      ragNodeId,
      card: { title: pattern.title, concepts: [pattern.title], tags: [] },
      ensureNode,
      addEdge,
      linkLabelToConcept,
      resolveConceptIdByLabel,
      nodeId,
      slugifyLabel,
      uniqueStrings
    });
  }

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
    const degree = (adjacency.get(node.id)?.size ?? 0);
    if (degree === 0) {
      node.auditStatus = node.auditStatus === 'confirmed' ? 'orphan' : node.auditStatus;
      if (node.auditStatus !== 'orphan' && node.origin !== 'concept-registry') {
        // keep stronger statuses; otherwise mark orphan
        if (!['pending_review', 'missing_source', 'conflict', 'low_confidence'].includes(node.auditStatus)) {
          node.auditStatus = 'orphan';
        }
      }
    }

    if (node.type === 'concept') {
      const linked = [...(adjacency.get(node.id) ?? [])];
      const hasRag = linked.some((otherId) => nodes.get(otherId)?.type === 'rag');
      if (!hasRag && node.visibility?.ragRetrievable) {
        if (!['orphan', 'missing_source', 'conflict'].includes(node.auditStatus)) {
          node.meta = { ...node.meta, gapFlags: uniqueStrings([...(node.meta.gapFlags ?? []), 'missing_rag']) };
          if (node.auditStatus === 'auto_generated') node.auditStatus = 'missing_rag';
          else if (node.auditStatus === 'confirmed') {
            node.meta.gapFlags = uniqueStrings([...(node.meta.gapFlags ?? []), 'missing_rag']);
          }
        }
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
      const linked = [...(adjacency.get(node.id) ?? [])];
      const hasConcept = linked.some((otherId) => nodes.get(otherId)?.type === 'concept');
      if (!hasConcept) {
        node.meta = { ...node.meta, gapFlags: uniqueStrings([...(node.meta.gapFlags ?? []), 'rag_without_concept']) };
      }
    }

    if (typeof node.confidence === 'number' && node.confidence < 0.6) {
      if (!['conflict', 'missing_source'].includes(node.auditStatus)) {
        node.auditStatus = 'low_confidence';
      }
    }
  }

  const nodeList = [...nodes.values()];
  const edgeList = [...edges.values()];
  const stats = computeGraphStats(nodeList, edgeList);

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
        concepts.length ? 'concept-registry' : ''
      ]),
      note: 'Display/projection layer only — does not modify canon master data. Style-RAG primary nodes are writing-technique nouns; articles are evidence anchors.'
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
    ensureNode,
    addEdge,
    linkLabelToConcept,
    resolveConceptIdByLabel,
    nodeId,
    slugifyLabel,
    uniqueStrings
  } = ctx;

  for (const conceptLabel of uniqueStrings([...(card.concepts ?? []), ...(card.aliases ?? []), card.title])) {
    linkLabelToConcept(conceptLabel, ragNodeId);
    const conceptNodeId = resolveConceptIdByLabel(conceptLabel);
    if (conceptNodeId) {
      addEdge({
        source: ragNodeId,
        target: conceptNodeId,
        relationType: 'explains',
        sourceRef: 'rag.concepts',
        confidence: 0.9,
        autoGenerated: true
      });
    }
  }

  for (const tag of uniqueStrings(card.tags)) {
    const tagNodeId = nodeId('tag', `rag:${slugifyLabel(tag)}`);
    ensureNode({
      id: tagNodeId,
      type: 'tag',
      title: tag,
      summary: `RAG 标签：${tag}`,
      origin: 'external-knowledge-card',
      auditStatus: 'auto_generated'
    });
    addEdge({
      source: ragNodeId,
      target: tagNodeId,
      relationType: 'tagged_with',
      sourceRef: 'rag.tags',
      autoGenerated: true
    });
  }
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

export function computeGraphStats(nodes, edges) {
  const nodeList = asArray(nodes);
  const edgeList = asArray(edges);
  const byType = {};
  const byRelation = {};
  const byAudit = {};
  let orphanCount = 0;
  let pendingReviewCount = 0;
  let lowConfidenceEdgeCount = 0;
  let missingSourceCount = 0;
  let conceptWithoutRag = 0;
  let plotWithoutStyle = 0;
  let highUseUnconfirmed = 0;
  let styleTechniqueCount = 0;
  let styleEvidenceCount = 0;
  let styleDimensionCount = 0;

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
    if (node.type === 'concept' && asArray(node.meta?.gapFlags).includes('missing_rag')) conceptWithoutRag += 1;
    if (node.type === 'plot' && asArray(node.meta?.gapFlags).includes('missing_style_rag')) plotWithoutStyle += 1;
    if ((degree.get(node.id) ?? 0) >= 5 && node.auditStatus !== 'confirmed') highUseUnconfirmed += 1;
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
    recentNodes
  };
}

export function createEmptyGraph() {
  return buildOutlineRelationGraph({});
}

export { clipSummary, nodeId, slugifyLabel, hashString };
