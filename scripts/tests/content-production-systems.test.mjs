import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { assessProvenance } from '../content-production/provenance.mjs';
import { buildPlayablePlan } from '../content-production/story-to-playable.mjs';
import { validateRoute, simulateRoute, resumeRoute } from '../content-production/route-validation.mjs';
import { validateMemoryRecord } from '../content-production/character-memory.mjs';
import { deriveCoverage } from '../content-production/production-coverage.mjs';

const fixture = async (name) => JSON.parse(await fs.readFile(new URL(`./fixtures/content-production/${name}`, import.meta.url), 'utf8'));

test('formal source gate allows verified categories and fails closed', () => {
  assert.equal(assessProvenance({ category: 'project-original' }).allowed, true);
  assert.equal(assessProvenance({ category: 'licensed-third-party', sourceId: 'asset-1', license: 'CC-BY-4.0', attribution: 'Author' }).allowed, true);
  for (const category of ['unknown-origin', 'reference-only', 'license-unclear', 'restricted', 'external-rag-raw', 'close-paraphrase-risk', 'unverified-third-party']) {
    assert.equal(assessProvenance({ category }).allowed, false, category);
  }
  assert.match(assessProvenance({ category: 'public-domain', sourceId: 'pd-1', verification: 'catalog-record' }).disclaimer, /不构成法律保证/);
});

test('story plan resolves real refs and reports missing refs without inventing ids', async () => {
  const node = await fixture('story-node.json');
  const plan = buildPlayablePlan(node, {
    maps: new Set(['city_jingjiang_school']),
    events: new Set(),
    dialogues: new Set(['campus_guide'])
  });
  assert.equal(plan.storyKey, node.key);
  assert.deepEqual(plan.resolved.maps, ['city_jingjiang_school']);
  assert.deepEqual(plan.missing.events, ['campus_arrival']);
  assert.equal(plan.readyForImplement, false);
  assert.deepEqual(plan.minimumPlayableVersion, node.minimumPlayableVersion);
});

test('route validator catches missing targets, unreachable nodes and non-terminating loops', async () => {
  const result = validateRoute(await fixture('route-invalid.json'));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-target'));
  assert.ok(result.errors.some((item) => item.code === 'unreachable-node'));
  assert.ok(result.errors.some((item) => item.code === 'non-terminating-component'));
  assert.ok(result.errors.some((item) => item.code === 'duplicate-node-id'));
});

test('route simulation reaches terminal and save-resume preserves state', async () => {
  const route = await fixture('route-valid.json');
  const simulation = simulateRoute(route);
  assert.equal(simulation.completed, true);
  assert.deepEqual(simulation.state, { campusEntered: true, rumorRead: true });
  const resumed = resumeRoute(route, { nodeId: 'forum', state: { campusEntered: true } });
  assert.equal(resumed.completed, true);
  assert.equal(resumed.state.rumorRead, true);
});

test('long-term memory rejects transient fluctuations and accepts evidenced lasting changes', () => {
  const transient = validateMemoryRecord({ kind: 'relationship', subjectId: 'liluo', counterpartId: 'friend', scope: 'scene', lasting: false, change: '短暂不快' });
  assert.equal(transient.valid, false);
  const lasting = validateMemoryRecord({ kind: 'character', subjectId: 'liluo', scope: 'world', lasting: true, change: '获得长期能力', evidence: ['story-key'], effectiveFrom: 'story-key' });
  assert.equal(lasting.valid, true);
});

test('coverage is evidence-derived and cannot infer playable from file counts', async () => {
  const report = deriveCoverage(await fixture('coverage.json'));
  const series = report.worlds[0].series[0];
  assert.equal(series.stage, 'skeleton');
  assert.equal(series.dimensions.playable, false);
  assert.ok(series.gaps.includes('graybox'));
});
