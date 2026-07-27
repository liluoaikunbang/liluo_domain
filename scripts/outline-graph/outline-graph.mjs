#!/usr/bin/env node
/**
 * Outline relation graph CLI — validate / stats / orphans / unreviewed.
 * Projection layer only; does not mutate canon story/plot/RAG masters.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const graphModuleUrl = pathToFileURL(
  join(root, 'src/game/data/outline_relation_graph/buildOutlineRelationGraph.js')
).href;
const conceptModuleUrl = pathToFileURL(
  join(root, 'src/game/data/outline_relation_graph/conceptRegistry.js')
).href;

const { buildOutlineRelationGraph } = await import(graphModuleUrl);
const { SEEDED_CONCEPTS } = await import(conceptModuleUrl);

function readJson(relativePath) {
  const absolute = join(root, relativePath);
  if (!existsSync(absolute)) return null;
  return JSON.parse(readFileSync(absolute, 'utf8'));
}

function loadStorySource() {
  const dir = join(root, 'src/game/data/story_outline/sources');
  const files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  return files.reduce(
    (merged, name) => {
      const source = JSON.parse(readFileSync(join(dir, name), 'utf8'));
      return {
        rootKeys: [...merged.rootKeys, ...(source.rootKeys ?? [])],
        nodes: [...merged.nodes, ...(source.nodes ?? [])]
      };
    },
    { rootKeys: [], nodes: [] }
  );
}

function loadRagCards() {
  const cardsDir = join(root, 'external-knowledge/cards');
  if (!existsSync(cardsDir)) return [];
  const cards = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith('.json')) {
        cards.push(JSON.parse(readFileSync(absolute, 'utf8')));
      }
    }
  };
  walk(cardsDir);
  return cards;
}

function buildCharacterOutline(storySource) {
  // Lightweight mirror of storyCharacterOutline for Node without Vue bundling.
  const organizationNames = new Set(['缄枷会', '盐坞帮', '夜栈']);
  const worlds = [];
  const worldMap = new Map();
  for (const node of storySource.nodes ?? []) {
    if (!node.world) continue;
    if (!worldMap.has(node.world)) {
      const world = { id: node.world, label: node.world, characters: [] };
      worldMap.set(node.world, world);
      worlds.push(world);
    }
    const world = worldMap.get(node.world);
    for (const name of node.characters ?? []) {
      let character = world.characters.find((entry) => entry.name === name);
      if (!character) {
        character = {
          id: `${world.id}:${name}`,
          name,
          kind: organizationNames.has(name) ? 'organization' : 'person',
          appearances: [],
          locations: []
        };
        world.characters.push(character);
      }
      character.appearances.push({ key: node.key, title: node.title });
      for (const location of node.locations ?? []) {
        if (!character.locations.includes(location)) character.locations.push(location);
      }
    }
  }
  return { worlds };
}

function buildGraph() {
  const storySource = loadStorySource();
  const plotCatalog = readJson('src/game/data/plot_outline/catalog.json') ?? { groups: [], entries: [] };
  const gameplayCatalog = readJson('src/game/data/gameplay_outline/catalog.json') ?? {
    categories: [],
    entries: []
  };
  const articleRegistry = readJson('docs/写作资产/外部风格研究/article-registry.json');
  const auditRegistry = readJson('docs/知识检索校准/registry.json');
  const styleTaxonomy = readJson('project-navigation/style-taxonomy.json');
  const cardRules = readJson('external-knowledge/card-rules.json') ?? { terms: [], plotPatterns: [] };

  return buildOutlineRelationGraph({
    storySource,
    plotCatalog,
    gameplayCatalog,
    characterOutline: buildCharacterOutline(storySource),
    ragCards: loadRagCards(),
    cardRules,
    styleArticles: articleRegistry?.articles ?? [],
    styleTaxonomy,
    concepts: SEEDED_CONCEPTS,
    auditRegistry
  });
}

function printStats(graph) {
  const { stats } = graph;
  console.log(JSON.stringify({
    builtAt: graph.builtAt,
    nodeCount: stats.nodeCount,
    edgeCount: stats.edgeCount,
    orphanCount: stats.orphanCount,
    pendingReviewCount: stats.pendingReviewCount,
    lowConfidenceEdgeCount: stats.lowConfidenceEdgeCount,
    missingSourceCount: stats.missingSourceCount,
    conceptWithoutRag: stats.conceptWithoutRag,
    plotWithoutStyle: stats.plotWithoutStyle,
    styleTechniqueCount: stats.styleTechniqueCount,
    styleEvidenceCount: stats.styleEvidenceCount,
    styleDimensionCount: stats.styleDimensionCount,
    byType: stats.byType,
    byRelation: stats.byRelation
  }, null, 2));
}

function validate(graph) {
  const errors = [];
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (nodeIds.size !== graph.nodes.length) errors.push('duplicate node ids');
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`edge ${edge.id} references missing node`);
    }
    if (!edge.relationType) errors.push(`edge ${edge.id} missing relationType`);
  }
  const detailConcept = graph.nodes.find((node) => node.id === 'concept:restraint.pose.houshou-guanyin');
  if (!detailConcept) errors.push('missing seeded detail concept 后手观音');
  if (detailConcept?.visibility?.primaryTag !== false) {
    errors.push('后手观音 should not be primary_tag');
  }
  const technique = graph.nodes.find(
    (node) => node.type === 'style_rag' && node.meta?.role === 'technique' && node.title === '日常互动'
  );
  if (!technique) errors.push('missing Style-RAG technique noun 日常互动');
  const evidence = graph.nodes.find((node) => node.type === 'style_rag' && node.meta?.role === 'evidence');
  if (!evidence) errors.push('missing Style-RAG article evidence anchors');
  if (evidence && evidence.visibility?.overviewDefault !== false) {
    errors.push('article evidence should default hidden in overview');
  }
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    ok: true,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    detailConcept: detailConcept.title
  }, null, 2));
}

function listByAudit(graph, statuses) {
  const wanted = new Set(statuses);
  const rows = graph.nodes
    .filter((node) => wanted.has(node.auditStatus) || (node.meta?.gapFlags || []).some((flag) => wanted.has(flag)))
    .slice(0, 200)
    .map((node) => ({ id: node.id, title: node.title, type: node.type, auditStatus: node.auditStatus, gapFlags: node.meta?.gapFlags || [] }));
  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
}

const command = process.argv[2] || 'stats';
const graph = buildGraph();

switch (command) {
  case 'stats':
    printStats(graph);
    break;
  case 'validate':
    validate(graph);
    break;
  case 'find-orphans':
    listByAudit(graph, ['orphan']);
    break;
  case 'find-unreviewed':
    listByAudit(graph, ['pending_review', 'low_confidence', 'missing_source', 'missing_rag', 'relation_pending']);
    break;
  case 'rebuild':
    printStats(graph);
    console.error('Projection rebuilt in-memory (no separate master DB written).');
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: outline:graph:<stats|validate|find-orphans|find-unreviewed|rebuild>');
    process.exitCode = 1;
}
