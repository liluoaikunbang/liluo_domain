import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildEvidenceFromSourceRef,
  redactEvidenceForPublicExport,
  stableEvidenceId,
  upsertExcerpt,
  applyEvidenceReview,
  mapVerdictToSupportStatus,
} from '../external-knowledge/lib/evidence-store.mjs';
import {
  defaultRetrievalPolicy,
  deriveEvidenceStatusFromRefs,
  isStubCard,
  normalizeContentStatus,
  normalizeEvidenceStatus,
  normalizeReviewStatus,
} from '../external-knowledge/lib/card-status.mjs';
import { matchQuery } from '../external-knowledge/lib/query.mjs';
import {
  buildOutlineRelationGraph,
  createOutlineRelationGraphExportPayload,
} from '../../src/game/data/outline_relation_graph/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
}

test('evidence IDs stay stable for the same source location', () => {
  const a = stableEvidenceId({ sourceId: 'fb-src-000001', lineStart: 13, lineEnd: 14, contentHash: 'abc' });
  const b = stableEvidenceId({ sourceId: 'fb-src-000001', lineStart: 13, lineEnd: 14, contentHash: 'abc' });
  assert.equal(a, b);
});

test('one source can produce multiple evidence excerpts and one excerpt can be reused', () => {
  let excerpts = [];
  const first = buildEvidenceFromSourceRef(
    {
      sourceId: 'fb-src-000001',
      segmentId: 'seg-1',
      sourcePath: 'external-knowledge/sources/fiction-bondage/a.md',
      startLine: 1,
      endLine: 2,
    },
    { excerptPreview: '第一段', usedByCardIds: ['card-a'] },
  );
  const second = buildEvidenceFromSourceRef(
    {
      sourceId: 'fb-src-000001',
      segmentId: 'seg-2',
      sourcePath: 'external-knowledge/sources/fiction-bondage/a.md',
      startLine: 10,
      endLine: 12,
    },
    { excerptPreview: '第二段', usedByCardIds: ['card-a'] },
  );
  excerpts = upsertExcerpt(excerpts, first);
  excerpts = upsertExcerpt(excerpts, second);
  excerpts = upsertExcerpt(excerpts, {
    ...first,
    usedByCardIds: ['card-a', 'card-b'],
  });
  assert.equal(excerpts.length, 2);
  assert.deepEqual(excerpts.find((item) => item.id === first.id).usedByCardIds.sort(), ['card-a', 'card-b']);
});

test('status aliases normalize legacy enums', () => {
  assert.equal(normalizeEvidenceStatus('supported'), 'sufficient');
  assert.equal(normalizeContentStatus('partial'), 'draft');
  assert.equal(normalizeReviewStatus('reviewed'), 'confirmed');
  assert.equal(normalizeReviewStatus('candidate'), 'pending');
});

test('stub cards are relation-visible but not writing-content-retrievable', () => {
  const stub = {
    contentStatus: 'stub',
    reviewStatus: 'pending',
    retrievalPolicy: { contentRetrievable: false, graphVisible: true, searchable: true, relationAnchor: true },
  };
  assert.equal(isStubCard(stub), true);
  assert.equal(defaultRetrievalPolicy(stub).contentRetrievable, false);
  assert.equal(matchQuery({ title: '后手观音', contentStatus: 'stub' }, { query: '后手观音', retrievalMode: 'writing' }).matched, false);
  assert.equal(matchQuery({ title: '后手观音', contentStatus: 'stub' }, { query: '后手观音', retrievalMode: 'view' }).matched, true);
});

test('rejected / does-not-support evidence no longer supports a claim mapping', () => {
  assert.equal(mapVerdictToSupportStatus('does-not-support'), 'unsupported');
  const reviews = applyEvidenceReview([], {
    id: 'evr-1',
    claimId: 'claim-1',
    evidenceId: 'ev-1',
    verdict: 'does-not-support',
    reviewedBy: 'user',
    reviewedAt: '2026-07-28T00:00:00.000Z',
  });
  assert.equal(reviews[0].verdict, 'does-not-support');
});

test('public export redacts private evidence bodies', () => {
  const redacted = redactEvidenceForPublicExport({
    id: 'ev-1',
    sourceId: 'fb-src-1',
    excerptPreview: '不应公开的长文',
    excerptStorage: 'source-resolved',
    location: { sourcePath: 'a.md', lineStart: 1, lineEnd: 2 },
    evidenceRoles: ['definition'],
    extractionOrigin: 'ai-proposed',
    reviewStatus: 'pending',
    rightsScope: { privateRag: true, publicExport: false },
  });
  assert.equal(redacted.excerptPreview, '');
  assert.equal(redacted.redacted, true);
  assert.equal(redacted.rightsScope.publicExport, false);
});

test('migrated cards expose claims and evidenceRefs', () => {
  const card = readJson('external-knowledge/cards/restraint/rag.restraint.tool.handcuffs.json');
  assert.ok(Array.isArray(card.evidenceRefs));
  assert.ok(card.evidenceRefs.length >= 1);
  assert.ok(Array.isArray(card.claims));
  assert.ok(card.claims.some((claim) => claim.claimType === 'definition'));
  assert.ok(card.retrievalPolicy);
  assert.equal(card.retrievalPolicy.contentRetrievable, false);
});

test('graph hangs evidence paragraphs on RAG detail meta, not canvas nodes', () => {
  const excerpts = readJson('external-knowledge/evidence/excerpts.json').excerpts;
  const sources = readJson('external-knowledge/catalog/sources.json');
  const card = readJson('external-knowledge/cards/restraint/rag.restraint.tool.handcuffs.json');
  const graph = buildOutlineRelationGraph({
    storySource: { rootKeys: [], nodes: [] },
    plotCatalog: { groups: [], entries: [] },
    gameplayCatalog: { categories: [], entries: [] },
    characterOutline: { worlds: [] },
    ragCards: [card],
    cardRules: { terms: [], plotPatterns: [] },
    styleArticles: [],
    styleTaxonomy: null,
    evidenceExcerpts: excerpts,
    evidenceReviews: [],
    sourceCatalog: sources,
    concepts: [],
    auditRegistry: { records: [] },
  });
  assert.equal(graph.schemaVersion, 4);
  assert.equal(graph.nodes.some((node) => node.type === 'evidence'), false);
  assert.equal(graph.nodes.some((node) => node.type === 'source'), false);
  assert.equal(graph.edges.some((edge) => edge.relationType === 'supported_by'), false);
  assert.equal(graph.edges.some((edge) => edge.relationType === 'excerpt_of'), false);

  const ragNode = graph.nodes.find((node) => node.type === 'rag' && node.sourceIds?.includes(card.cardId));
  assert.ok(ragNode);
  assert.ok(Array.isArray(ragNode.meta?.evidenceItems));
  assert.ok(ragNode.meta.evidenceItems.length >= 1);
  assert.ok(ragNode.meta.evidenceItems.some((item) => String(item.paragraph || item.excerptPreview || '').length > 0));
  assert.ok(Array.isArray(ragNode.meta?.sourceTitles));

  const exported = createOutlineRelationGraphExportPayload(graph, new Date('2026-07-28T00:00:00.000Z'), {
    publicSafe: true,
  });
  assert.equal(exported.exportVersion, 2);
  const exportedRag = exported.nodes.find((node) => node.id === ragNode.id);
  assert.ok(exportedRag);
  assert.ok(Array.isArray(exportedRag.meta?.evidenceItems));
  assert.ok(exportedRag.meta.evidenceItems.every((item) => (item.excerptPreview ?? '') === ''));
  assert.ok(exportedRag.meta.evidenceItems.every((item) => (item.paragraph ?? '') === ''));
});

test('deriveEvidenceStatusFromRefs handles missing and partial', () => {
  const missing = deriveEvidenceStatusFromRefs({ evidenceRefs: [], sourceRefs: [] });
  assert.equal(missing, 'missing');
  const partial = deriveEvidenceStatusFromRefs(
    { evidenceRefs: ['ev-1'] },
    new Map([['ev-1', { reviewStatus: 'pending' }]]),
  );
  assert.equal(partial, 'partial');
  const sufficient = deriveEvidenceStatusFromRefs(
    { evidenceRefs: ['ev-1'] },
    new Map([['ev-1', { reviewStatus: 'confirmed' }]]),
  );
  assert.equal(sufficient, 'sufficient');
});
