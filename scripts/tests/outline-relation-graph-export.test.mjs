import assert from 'node:assert/strict';
import test from 'node:test';
import { createOutlineRelationGraphExportPayload } from '../../src/game/data/outline_relation_graph/outlineRelationGraphExport.js';

test('creates a self-describing JSON export for the outline relation graph', () => {
  const graph = {
    schemaVersion: 1,
    builtAt: '2026-07-27T00:00:00.000Z',
    layoutSeed: 42,
    nodes: [{ id: 'n1', title: '示例', type: 'story' }],
    edges: [{ id: 'e1', source: 'n1', target: 'n1', relationType: 'parent' }],
    stats: { nodeCount: 1, edgeCount: 1 },
    meta: { sourceKinds: ['story-outline'], note: 'projection' }
  };

  const payload = createOutlineRelationGraphExportPayload(
    graph,
    new Date('2026-07-27T12:00:00.000Z')
  );

  assert.equal(payload.exportType, 'outline-relation-graph');
  assert.equal(payload.exportVersion, 1);
  assert.equal(payload.exportedAt, '2026-07-27T12:00:00.000Z');
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.builtAt, '2026-07-27T00:00:00.000Z');
  assert.equal(payload.layoutSeed, 42);
  assert.equal(payload.nodeCount, 1);
  assert.equal(payload.edgeCount, 1);
  assert.deepEqual(payload.nodes, graph.nodes);
  assert.deepEqual(payload.edges, graph.edges);
  assert.notEqual(payload.nodes, graph.nodes);
  assert.notEqual(payload.edges, graph.edges);
  assert.match(payload.meta.exportNote, /projection/iu);
  assert.deepEqual(payload.meta.sourceKinds, ['story-outline']);
});

test('export payload tolerates empty or missing graph fields', () => {
  const payload = createOutlineRelationGraphExportPayload(
    null,
    new Date('2026-07-27T12:00:00.000Z')
  );

  assert.equal(payload.nodeCount, 0);
  assert.equal(payload.edgeCount, 0);
  assert.deepEqual(payload.nodes, []);
  assert.deepEqual(payload.edges, []);
  assert.equal(payload.schemaVersion, null);
});
