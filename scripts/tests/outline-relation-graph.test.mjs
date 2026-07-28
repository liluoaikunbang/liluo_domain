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
  for (const required of ['story', 'world', 'plot', 'gameplay', 'rag', 'style_rag']) {
    assert.ok(types.has(required), `missing type ${required}`);
  }
  // Ordinary Tag lane may be empty after reset; tag type appears only when plotTags/tags exist.
  assert.equal(types.has('concept'), false, 'detail-concept nodes must not be projected');
});

test('does not project detail-concept nodes; hierarchy lives on RAG', () => {
  const graph = buildFixtureGraph();
  assert.ok(!graph.nodes.some((node) => node.type === 'concept'));
  assert.ok(!graph.nodes.some((node) => node.id.startsWith('concept:')));
  const detailRag = graph.nodes.find((node) => node.id === 'rag:rag.restraint.detail.挠痒-山药汁');
  assert.ok(detailRag);
  assert.equal(detailRag.meta.ragLayer, 'concept');
  assert.ok(detailRag.visibility?.searchable !== false);
});

test('detail RAG cards remain searchable without concept nodes', () => {
  const graph = buildFixtureGraph();
  const rag = graph.nodes.find((node) => node.title === '挠痒-山药汁');
  assert.ok(rag);
  assert.equal(rag.type, 'rag');
  const results = searchOutlineRelationGraph(graph, '挠痒-山药汁');
  assert.ok(results.some((row) => row.id === rag.id));
});

test('nodes without summary or style-rag still build', () => {
  const graph = buildOutlineRelationGraph({
    storySource: {
      rootKeys: ['root'],
      nodes: [
        { key: 'root', title: 'RootSeries', world: 'W', parentKey: null, status: '分类' },
        { key: 'a', title: 'A', world: 'W', parentKey: 'root' }
      ]
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
  assert.ok(graph.nodes.some((node) => node.type === 'world' && node.meta?.mergedSeries));
  assert.equal(graph.nodes.filter((node) => node.type === 'series').length, 0);
  assert.ok(graph.nodes.some((node) => node.id === 'plot:plot-1'));
  assert.equal(clipSummary(''), '');
});

test('auto vs confirmed relation statuses are distinguished', () => {
  const graph = buildFixtureGraph();
  assert.ok(graph.edges.some((edge) => edge.autoGenerated === true));
  assert.ok(graph.edges.some((edge) => edge.autoGenerated === false && edge.auditStatus === 'confirmed'));
});

test('overview display fields hide summary while focus shows summary', () => {
  const node = { title: '后手观音', summary: '细节姿态', auditStatus: 'confirmed', type: 'rag' };
  const overview = getNodeDisplayFields(node, 'overview');
  const focus = getNodeDisplayFields(node, 'focus');
  assert.equal(overview.showSummary, false);
  assert.equal(overview.summary, '');
  assert.equal(focus.showSummary, true);
  assert.ok(focus.summary.includes('细节'));
});

test('layout merges world into story lane as a numbered tree', async () => {
  const { resolveGraphLaneType, GRAPH_LANE_ORDER } = await import(
    '../../src/game/data/outline_relation_graph/constants.js'
  );
  assert.equal(resolveGraphLaneType('series'), 'story');
  assert.equal(resolveGraphLaneType('world'), 'story');
  assert.equal(resolveGraphLaneType('story'), 'story');
  assert.ok(GRAPH_LANE_ORDER.includes('story'));
  assert.equal(GRAPH_LANE_ORDER.includes('world'), false);
  assert.equal(GRAPH_LANE_ORDER.includes('series'), false);
  assert.equal(GRAPH_LANE_ORDER.includes('concept'), false);

  const graph = buildFixtureGraph();
  const worldNodes = graph.nodes.filter((node) => node.type === 'world');
  const seriesNodes = graph.nodes.filter((node) => node.type === 'series');
  assert.equal(seriesNodes.length, 0, 'series roots fold into world nodes');
  assert.equal(worldNodes.length, 6, `expected 6 worlds, got ${worldNodes.length}`);
  assert.ok(worldNodes.every((node) => node.meta?.mergedSeries));
  assert.ok(worldNodes.every((node) => node.meta?.storyLayer === 'category'));
  assert.ok(!graph.nodes.some((node) => node.id.startsWith('series:')));

  const layout = layoutOutlineRelationGraph(graph, { preset: 'structure', mode: 'overview', seed: 3 });
  const storyLaneNodes = layout.nodes.filter((node) => node.laneType === 'story');
  assert.ok(storyLaneNodes.some((node) => node.type === 'world' && node.treeDepth === 0));
  assert.ok(storyLaneNodes.some((node) => node.type === 'story' && node.treeDepth === 1));

  const worldOrder = storyLaneNodes
    .filter((node) => node.type === 'world')
    .map((node) => node.title);
  const indexes = ['浮光掠影', '寂土挽歌', '尘寰问道', '慕妮卡', '星宇织梦', '咒缚回响'].map((part) =>
    worldOrder.findIndex((title) => title.includes(part))
  );
  assert.ok(indexes.every((index) => index >= 0));
  for (let i = 1; i < indexes.length; i += 1) {
    assert.ok(indexes[i] > indexes[i - 1], `worlds should sort by leading number: ${worldOrder.join(' > ')}`);
  }

  const modern = storyLaneNodes.find((node) => node.type === 'world' && node.title.includes('浮光掠影'));
  const child = storyLaneNodes.find(
    (node) => node.type === 'story' && node.treeParentId === modern?.id
  );
  assert.ok(modern && child);
  assert.equal(child.treeDepth, 1);
  assert.ok(child.x > modern.x);
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

test('RAG cards include definitions and hierarchy metadata', () => {
  const graph = buildFixtureGraph();
  const ragNodes = graph.nodes.filter((node) => node.type === 'rag');
  assert.ok(ragNodes.length >= 14, `expected enriched RAG cards, got ${ragNodes.length}`);
  assert.ok(ragNodes.some((node) => node.title === '挠痒'));
  assert.ok(ragNodes.some((node) => node.title === '挠痒-山药汁'));
  const tickling = ragNodes.find((node) => node.title === '挠痒');
  assert.ok(tickling?.summary || tickling?.description);
});

test('RAG hierarchy is 上位类别 → 具体概念 and links directly to plots/stories', async () => {
  const { validateConceptHierarchy, CONCEPT_LAYERS } = await import(
    '../../src/game/data/outline_relation_graph/conceptRegistry.js'
  );

  const hierarchy = validateConceptHierarchy(SEEDED_CONCEPTS);
  assert.equal(hierarchy.ok, true, hierarchy.errors.join('; '));

  const graph = buildFixtureGraph();
  assert.ok(graph.stats.conceptCategoryCount >= 3);
  assert.ok(graph.stats.conceptDetailCount >= 6);

  const category = graph.nodes.find((node) => node.id === 'rag:rag.restraint.effect.tickling');
  const detail = graph.nodes.find((node) => node.id === 'rag:rag.restraint.detail.挠痒-山药汁');
  assert.equal(category.meta.ragLayer, CONCEPT_LAYERS.CATEGORY);
  assert.equal(detail.meta.ragLayer, CONCEPT_LAYERS.CONCEPT);
  assert.ok(!graph.nodes.some((node) => node.title === '身后束手'));
  assert.ok(graph.nodes.some((node) => node.id === 'rag:rag.restraint.detail.挠痒-蚊子'));
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.relationType === 'narrower' &&
        edge.source === category.id &&
        edge.target === detail.id
    )
  );

  // Direct links from story / plot refs to RAG (no Tag or concept hop).
  const catalog = readJson('src/game/data/plot_outline/catalog.json');
  const probeGraph = buildFixtureGraph({
    plotCatalog: {
      ...catalog,
      entries: [
        {
          id: 'plot-link-probe',
          title: '探针-挠痒',
          summary: '图谱直连探针',
          groupId: catalog.groups?.[0]?.id || '',
          plotKind: 'restraint',
          ragRefs: ['rag.restraint.effect.tickling'],
          characters: [],
          usedBy: [],
          usageStatus: 'unused',
          isUsed: false,
          isBondagePlot: false,
          worldBiases: []
        },
        ...(catalog.entries || [])
      ]
    }
  });
  const tickling = probeGraph.nodes.find((node) => node.id === 'rag:rag.restraint.effect.tickling');
  const probePlot = probeGraph.nodes.find((node) => node.id === 'plot:plot-link-probe');
  assert.ok(tickling);
  assert.ok(probePlot);
  assert.ok(
    probeGraph.edges.some(
      (edge) =>
        edge.target === tickling.id &&
        edge.source === probePlot.id &&
        edge.sourceRef === 'plot.ragRefs'
    ),
    'expected direct plot → RAG edge'
  );

  const layout = layoutOutlineRelationGraph(graph, { preset: 'structure', mode: 'overview', seed: 1 });
  const behind = layout.nodes.find((node) => node.id === category.id);
  const houshou = layout.nodes.find((node) => node.id === detail.id);
  assert.ok(behind && houshou);
  assert.equal(behind.treeDepth, 0);
  assert.equal(houshou.treeDepth, 1);
  assert.equal(houshou.treeParentId, behind.id);
  assert.ok(houshou.x > behind.x, '具体概念 should be indented under 上位类别');
  assert.ok(houshou.y > behind.y, '具体概念 should appear below its 上位类别');

  const filtered = filterOutlineRelationGraph(graph, {
    nodeTypes: ['rag'],
    relationTypes: ['broader', 'narrower']
  });
  assert.ok(filtered.nodes.every((node) => node.type === 'rag'));
  assert.ok(filtered.edges.every((edge) => edge.relationType === 'broader' || edge.relationType === 'narrower'));
});

test('retired ordinary and bondage Tag lanes never project', () => {
  const graph = buildFixtureGraph();
  assert.ok(!graph.nodes.some((node) => node.type === 'tag' || node.type === 'bondage_tag'));
  assert.ok(!graph.edges.some((edge) => edge.relationType === 'tagged_with' || edge.relationType === 'bondage_tagged_with'));
  const skeleton = graph.nodes.find((node) => node.type === 'rag' && node.meta?.contentStatus === 'stub');
  if (skeleton) assert.equal(skeleton.auditStatus, 'missing_source');
  const layout = layoutOutlineRelationGraph(graph, { preset: 'structure', mode: 'overview', seed: 2 });

  const plotGroups = graph.nodes.filter(
    (node) => node.type === 'plot' && node.meta?.plotLayer === 'category'
  );
  const plotEntries = graph.nodes.filter(
    (node) => node.type === 'plot' && node.meta?.plotLayer === 'concept'
  );
  assert.ok(plotGroups.length >= 1, 'expected plot groups (大情节)');
  assert.ok(plotEntries.length >= 1, 'expected plot entries (小情节)');
  const samplePlot = plotEntries.find((node) => (node.meta?.parentPlotNodeIds || []).length > 0);
  assert.ok(samplePlot, 'expected a small plot with parent group');
  const parentPlot = graph.nodes.find((node) => node.id === samplePlot.meta.parentPlotNodeIds[0]);
  assert.ok(parentPlot && parentPlot.meta?.plotLayer === 'category');
  const samplePlotLaid = layout.nodes.find((node) => node.id === samplePlot.id);
  const parentPlotLaid = layout.nodes.find((node) => node.id === parentPlot.id);
  assert.equal(parentPlotLaid.treeDepth, 0);
  assert.equal(samplePlotLaid.treeDepth, 1);
  assert.equal(samplePlotLaid.treeParentId, parentPlot.id);
  assert.ok(
    parentPlotLaid.y < samplePlotLaid.y,
    '大情节 should appear above its 小情节 in the swimlane'
  );

  const gameplayCategories = graph.nodes.filter(
    (node) => node.type === 'gameplay' && node.meta?.gameplayLayer === 'category'
  );
  const gameplayEntries = graph.nodes.filter(
    (node) => node.type === 'gameplay' && node.meta?.gameplayLayer === 'concept'
  );
  assert.ok(gameplayCategories.length >= 1, 'expected gameplay categories (大玩法)');
  assert.ok(gameplayEntries.length >= 1, 'expected gameplay entries (小玩法)');
  const sampleGameplay = gameplayEntries.find(
    (node) => (node.meta?.parentGameplayNodeIds || []).length > 0
  );
  assert.ok(sampleGameplay, 'expected a small gameplay with parent category');
  const parentGameplay = graph.nodes.find(
    (node) => node.id === sampleGameplay.meta.parentGameplayNodeIds[0]
  );
  assert.ok(parentGameplay && parentGameplay.meta?.gameplayLayer === 'category');
  const sampleGameplayLaid = layout.nodes.find((node) => node.id === sampleGameplay.id);
  const parentGameplayLaid = layout.nodes.find((node) => node.id === parentGameplay.id);
  assert.equal(parentGameplayLaid.treeDepth, 0);
  assert.equal(sampleGameplayLaid.treeDepth, 1);
  assert.equal(sampleGameplayLaid.treeParentId, parentGameplay.id);
});

test('restraint RAG cards project their explicit two-level hierarchy', () => {
  const graph = buildFixtureGraph();
  const tickling = graph.nodes.find((node) => node.id === 'rag:rag.restraint.effect.tickling');
  const yam = graph.nodes.find((node) => node.id === 'rag:rag.restraint.detail.挠痒-山药汁');
  const mosquito = graph.nodes.find((node) => node.id === 'rag:rag.restraint.detail.挠痒-蚊子');

  assert.equal(tickling?.meta?.ragLayer, 'category');
  assert.equal(yam?.meta?.ragLayer, 'concept');
  assert.equal(mosquito?.meta?.ragLayer, 'concept');
  assert.deepEqual(yam?.meta?.parentRagNodeIds, [tickling.id]);
  assert.ok(graph.edges.some((edge) => edge.source === tickling.id && edge.target === yam.id && edge.relationType === 'narrower'));
  assert.ok(graph.edges.some((edge) => edge.source === yam.id && edge.target === tickling.id && edge.relationType === 'broader'));
});

test('empty, source-less and orphan graph nodes expose a visible content gap state', () => {
  const graph = buildFixtureGraph();
  const emptyRag = graph.nodes.find((node) => node.id === 'rag:rag.restraint.detail.挠痒-山药汁');
  assert.equal(emptyRag?.meta?.hasContentGap, true);
  assert.ok(emptyRag?.meta?.gapFlags.includes('empty_content'));

  const isolatedPlotGraph = buildFixtureGraph({
    storySource: { rootKeys: [], nodes: [] },
    plotCatalog: {
      groups: [{ id: 'plot-group-test', title: '测试组' }],
      entries: [{
        id: 'plot-test-orphan',
        groupId: 'plot-group-test',
        title: '未关联情节',
        summary: '',
        plotKind: 'ordinary',
        ragRefs: [],
        usedBy: []
      }]
    },
    gameplayCatalog: { groups: [], entries: [] },
    ragCards: [],
    cardRules: { termCards: [], plotPatternCards: [] },
    styleArticles: [],
    styleTaxonomy: { dimensions: [] },
    concepts: [],
    auditRegistry: { records: [] }
  });
  const orphan = isolatedPlotGraph.nodes.find((node) => node.id === 'plot:plot-test-orphan');
  assert.equal(orphan?.meta?.hasContentGap, true);
  assert.ok(orphan?.meta?.gapFlags.includes('unlinked_plot'));
});

test('performance smoke: synthetic 1000 nodes layout completes quickly', () => {
  const nodes = [];
  const edges = [];
  for (let index = 0; index < 1000; index += 1) {
    const type = ['story', 'plot', 'tag', 'rag', 'style_rag', 'bondage_tag'][index % 6];
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
