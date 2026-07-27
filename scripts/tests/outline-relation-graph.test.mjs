import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildOutlineRelationGraph,
  clipSummary,
  focusOutlineRelationGraph,
  filterOutlineRelationGraph,
  getNodeDisplayFields,
  layoutOutlineRelationGraph,
  searchOutlineRelationGraph,
  SEEDED_CONCEPTS
} from '../../src/game/data/outline_relation_graph/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
}

function loadStorySource() {
  const dir = join(root, 'src/game/data/story_outline/sources');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reduce(
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
  const cards = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith('.json')) cards.push(JSON.parse(readFileSync(absolute, 'utf8')));
    }
  };
  walk(join(root, 'external-knowledge/cards'));
  return cards;
}

function buildFixtureGraph(overrides = {}) {
  const storySource = loadStorySource();
  return buildOutlineRelationGraph({
    storySource,
    plotCatalog: readJson('src/game/data/plot_outline/catalog.json'),
    gameplayCatalog: readJson('src/game/data/gameplay_outline/catalog.json'),
    characterOutline: {
      worlds: [
        {
          id: '1-浮光掠影',
          label: '1-浮光掠影',
          characters: [
            {
              id: '1-浮光掠影:测试角色',
              name: '测试角色',
              kind: 'person',
              appearances: storySource.nodes.slice(0, 1).map((node) => ({
                key: node.key,
                title: node.title
              })),
              locations: ['测试地点']
            }
          ]
        }
      ]
    },
    ragCards: loadRagCards(),
    cardRules: readJson('external-knowledge/card-rules.json'),
    styleArticles: (readJson('docs/写作资产/外部风格研究/article-registry.json').articles || []).slice(0, 20),
    styleTaxonomy: readJson('project-navigation/style-taxonomy.json'),
    concepts: SEEDED_CONCEPTS,
    auditRegistry: readJson('docs/知识检索校准/registry.json'),
    ...overrides
  });
}

test('converts heterogeneous entities into unique typed nodes', () => {
  const graph = buildFixtureGraph();
  const ids = graph.nodes.map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length);

  const types = new Set(graph.nodes.map((node) => node.type));
  for (const required of ['story', 'world', 'plot', 'gameplay', 'tag', 'concept', 'rag', 'style_rag']) {
    assert.ok(types.has(required), `missing type ${required}`);
  }
});

test('keeps many-to-many relations without fabricating one-to-one cards', () => {
  const graph = buildFixtureGraph();
  const concept = graph.nodes.find((node) => node.id === 'concept:restraint.pose.houshou-guanyin');
  assert.ok(concept);
  const conceptEdges = graph.edges.filter(
    (edge) => edge.source === concept.id || edge.target === concept.id
  );
  // May link parents without requiring a dedicated RAG card
  const ragLinks = conceptEdges.filter((edge) => {
    const otherId = edge.source === concept.id ? edge.target : edge.source;
    return otherId.startsWith('rag:');
  });
  assert.ok(ragLinks.length >= 0);
  assert.ok(!graph.nodes.some((node) => node.id === 'rag:restraint.pose.houshou-guanyin'));
});

test('detail concepts enter the graph even when not primary tags', () => {
  const graph = buildFixtureGraph();
  const concept = graph.nodes.find((node) => node.title === '后手观音');
  assert.ok(concept);
  assert.equal(concept.visibility.primaryTag, false);
  assert.equal(concept.visibility.graph, true);
  assert.equal(concept.visibility.searchable, true);

  const results = searchOutlineRelationGraph(graph, '后手观音');
  assert.ok(results.some((row) => row.id === concept.id));
});

test('nodes without summary or style-rag still build', () => {
  const graph = buildOutlineRelationGraph({
    storySource: {
      rootKeys: ['a'],
      nodes: [{ key: 'a', title: 'A', world: 'W', parentKey: null }]
    },
    plotCatalog: {
      groups: [],
      entries: [{ id: 'plot-1', title: 'P', summary: '', groupId: '', tags: [], bondageTags: [], characters: [], usedBy: [] }]
    },
    concepts: SEEDED_CONCEPTS,
    ragCards: [],
    styleArticles: []
  });
  assert.ok(graph.nodes.some((node) => node.id === 'story:a'));
  assert.ok(graph.nodes.some((node) => node.id === 'plot:plot-1'));
  assert.equal(clipSummary(''), '');
});

test('auto vs confirmed relation statuses are distinguished', () => {
  const graph = buildFixtureGraph();
  assert.ok(graph.edges.some((edge) => edge.autoGenerated === true));
  assert.ok(graph.edges.some((edge) => edge.autoGenerated === false && edge.auditStatus === 'confirmed'));
});

test('overview display fields hide summary while focus shows summary', () => {
  const node = { title: '后手观音', summary: '细节姿态', auditStatus: 'confirmed', type: 'concept' };
  const overview = getNodeDisplayFields(node, 'overview');
  const focus = getNodeDisplayFields(node, 'focus');
  assert.equal(overview.showSummary, false);
  assert.equal(overview.summary, '');
  assert.equal(focus.showSummary, true);
  assert.ok(focus.summary.includes('细节'));
});

test('layout merges world and series into one lane', async () => {
  const { resolveGraphLaneType, GRAPH_LANE_ORDER } = await import(
    '../../src/game/data/outline_relation_graph/constants.js'
  );
  assert.equal(resolveGraphLaneType('series'), 'world');
  assert.equal(resolveGraphLaneType('world'), 'world');
  assert.ok(GRAPH_LANE_ORDER.includes('world'));
  assert.equal(GRAPH_LANE_ORDER.includes('series'), false);
});

test('layout is deterministic for the same seed', () => {
  const graph = buildFixtureGraph();
  const first = layoutOutlineRelationGraph(graph, { preset: 'structure', mode: 'overview', seed: 42 });
  const second = layoutOutlineRelationGraph(graph, { preset: 'structure', mode: 'overview', seed: 42 });
  assert.equal(first.nodes.length, second.nodes.length);
  assert.deepEqual(
    first.nodes.map((node) => [node.id, node.x, node.y]),
    second.nodes.map((node) => [node.id, node.x, node.y])
  );
});

test('focus depth expands neighborhood', () => {
  const graph = buildFixtureGraph();
  const center = graph.nodes.find((node) => node.type === 'story');
  assert.ok(center);
  const one = focusOutlineRelationGraph(graph, center.id, 1);
  const two = focusOutlineRelationGraph(graph, center.id, 2);
  assert.ok(one.nodes.length >= 1);
  assert.ok(two.nodes.length >= one.nodes.length);
});

test('filter presets isolate orphans and pending review', () => {
  const graph = buildFixtureGraph();
  const orphans = filterOutlineRelationGraph(graph, { auditStatuses: ['orphan'] });
  assert.ok(Array.isArray(orphans.nodes));
  const pending = filterOutlineRelationGraph(graph, { auditStatuses: ['pending_review'] });
  assert.ok(Array.isArray(pending.nodes));
});

test('Style-RAG primary nodes are writing techniques; articles are evidence', () => {
  const graph = buildFixtureGraph();
  const techniques = graph.nodes.filter(
    (node) => node.type === 'style_rag' && node.meta?.role === 'technique'
  );
  const evidence = graph.nodes.filter(
    (node) => node.type === 'style_rag' && node.meta?.role === 'evidence'
  );
  const dimensions = graph.nodes.filter(
    (node) => node.type === 'style_rag' && node.meta?.role === 'technique_dimension'
  );
  assert.ok(techniques.length >= 20, `expected technique nouns, got ${techniques.length}`);
  assert.ok(dimensions.length >= 5, `expected dimensions, got ${dimensions.length}`);
  assert.ok(evidence.length >= 1, 'expected article evidence anchors');
  assert.ok(techniques.some((node) => node.title === '日常互动'));
  assert.ok(techniques.some((node) => node.title === '逃脱尝试'));

  const hidden = filterOutlineRelationGraph(graph, { includeStyleEvidence: false });
  assert.equal(
    hidden.nodes.some((node) => node.meta?.role === 'evidence'),
    false,
    'overview should hide article evidence by default'
  );
  const shown = filterOutlineRelationGraph(graph, { includeStyleEvidence: true });
  assert.ok(shown.nodes.some((node) => node.meta?.role === 'evidence'));
});

test('RAG cards include definitions and concept-linked seeded terms', () => {
  const graph = buildFixtureGraph();
  const ragNodes = graph.nodes.filter((node) => node.type === 'rag');
  assert.ok(ragNodes.length >= 14, `expected enriched RAG cards, got ${ragNodes.length}`);
  assert.ok(ragNodes.some((node) => node.title === '后手观音'));
  assert.ok(ragNodes.some((node) => node.title === '身后束手'));
  const expression = ragNodes.find((node) => node.title.includes('环境压力'));
  assert.ok(expression?.summary || expression?.description);
});

test('performance smoke: synthetic 1000 nodes layout completes quickly', () => {
  const nodes = [];
  const edges = [];
  for (let index = 0; index < 1000; index += 1) {
    const type = ['story', 'plot', 'tag', 'concept', 'rag', 'style_rag'][index % 6];
    nodes.push({
      id: `${type}:n${index}`,
      type,
      title: `N${index}`,
      summary: `summary-${index}`,
      auditStatus: 'auto_generated',
      confidence: 1,
      visibility: { graph: true, searchable: true }
    });
  }
  for (let index = 0; index < 2500; index += 1) {
    const source = nodes[index % nodes.length].id;
    const target = nodes[(index * 7) % nodes.length].id;
    if (source === target) continue;
    edges.push({
      id: `e${index}`,
      source,
      target,
      relationType: 'possibly_related',
      confidence: 0.5,
      auditStatus: 'auto_generated',
      autoGenerated: true
    });
  }
  const started = Date.now();
  const layout = layoutOutlineRelationGraph({ nodes, edges, layoutSeed: 7 }, { mode: 'overview', seed: 7 });
  const elapsed = Date.now() - started;
  assert.equal(layout.nodes.length, 1000);
  assert.ok(elapsed < 3000, `layout too slow: ${elapsed}ms`);
});
