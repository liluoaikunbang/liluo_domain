import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReviewPack,
  buildWritingJointContext,
  computeBranchCompleteness,
  deriveOverallStatus,
  ensureProfessionalShape,
  isSkeletonOnly,
  migrateCardToProfessional,
  summarizeProfessionalStats,
} from '../external-knowledge/lib/professional-rag.mjs';
import { buildOutlineRelationGraph } from '../../src/game/data/outline_relation_graph/buildOutlineRelationGraph.js';

const sampleLegacy = {
  cardId: 'rag.restraint.tool.handcuffs',
  title: '手铐',
  domain: 'restraint',
  cardType: 'tool',
  aliases: ['铐'],
  definition: '作用于手腕的成对铐具',
  summary: '腕部铐具',
  contentStatus: 'complete',
  evidenceStatus: 'partial',
  reviewStatus: 'candidate',
  ragLayer: 'concept',
  parentCardIds: ['rag.restraint.tool.shackles'],
  evidenceRefs: ['ev-demo'],
  claims: [
    {
      id: 'c1',
      content: '作用于手腕的成对铐具',
      claimType: 'definition',
      evidenceRefs: ['ev-demo'],
      supportStatus: 'pending',
      reviewStatus: 'pending',
      origin: 'external-summary',
    },
  ],
  retrievalPolicy: {
    graphVisible: true,
    searchable: true,
    relationAnchor: true,
    contentRetrievable: false,
    evidenceRetrievable: true,
  },
};

test('professional RAG keeps one main id with two branches', () => {
  const migrated = migrateCardToProfessional(sampleLegacy);
  assert.equal(migrated.cardId, sampleLegacy.cardId);
  assert.ok(migrated.knowledge);
  assert.ok(migrated.expression);
  assert.equal(migrated.knowledge.definition, sampleLegacy.definition);
  assert.equal(migrated.expression.status, 'stub');
  assert.equal(migrated.retrievalPolicy.knowledgeRetrievable, false);
  assert.equal(migrated.retrievalPolicy.expressionRetrievable, false);
});

test('branches can be independently empty or confirmed', () => {
  const shaped = ensureProfessionalShape(sampleLegacy);
  shaped.knowledge.reviewStatus = 'confirmed';
  shaped.knowledge.status = 'usable';
  shaped.expression.reviewStatus = 'pending';
  shaped.expression.status = 'stub';
  assert.equal(deriveOverallStatus(shaped), 'knowledge-only');
  shaped.expression.visualFocus = ['铐环贴腕'];
  shaped.expression.status = 'usable';
  shaped.expression.reviewStatus = 'confirmed';
  assert.equal(deriveOverallStatus(shaped), 'confirmed');
});

test('skeleton cards stay out of formal writing retrieval', () => {
  const stub = migrateCardToProfessional({
    cardId: 'rag.restraint.pose.leg-press-shackles',
    title: '压腿铐',
    contentStatus: 'stub',
    evidenceStatus: 'missing',
    reviewStatus: 'pending',
    definition: '',
    claims: [],
    evidenceRefs: [],
  });
  assert.equal(isSkeletonOnly(stub), true);
  const ctx = buildWritingJointContext(stub);
  assert.equal(ctx.knowledge, null);
  assert.equal(ctx.expression, null);
  assert.ok(ctx.warnings.some((w) => w.includes('不得自行补定义')));
});

test('user confirmation beats AI candidate defaults', () => {
  const card = migrateCardToProfessional(sampleLegacy);
  card.knowledge.reviewStatus = 'confirmed';
  card.knowledge.status = 'usable';
  card.retrievalPolicy.knowledgeRetrievable = true;
  const ctx = buildWritingJointContext(card);
  assert.ok(ctx.knowledge);
  assert.equal(ctx.weights.modelCommonsense, 0);
  assert.ok(ctx.weights.confirmedKnowledge > ctx.weights.aiStyleRag);
});

test('review pack contains dual-branch draft fields', () => {
  const pack = buildReviewPack(sampleLegacy);
  assert.equal(pack.cardId, sampleLegacy.cardId);
  assert.ok(pack.knowledgeDraft);
  assert.ok(pack.expressionDraft);
  assert.ok(Array.isArray(pack.unresolvedQuestions));
});

test('graph keeps one RAG node; knowledge/expression live in detail tabs only', () => {
  const migrated = migrateCardToProfessional(sampleLegacy);
  const graph = buildOutlineRelationGraph({
    ragCards: [migrated],
    storySource: { rootKeys: [], nodes: [] },
    plotCatalog: { groups: [], entries: [] },
    gameplayCatalog: { categories: [], entries: [] },
    characterOutline: { worlds: [] },
  });
  const ragNodes = graph.nodes.filter((n) => n.type === 'rag');
  const branches = graph.nodes.filter((n) => n.type === 'rag_branch');
  assert.equal(ragNodes.length, 1);
  assert.equal(branches.length, 0);
  assert.equal(graph.edges.some((e) => e.relationType === 'has_branch'), false);
  const rag = ragNodes[0];
  assert.ok(rag.meta.knowledge);
  assert.ok(rag.meta.expression);
  assert.equal(typeof rag.meta.knowledgeCompleteness, 'number');
  assert.notEqual(String(rag.description || ''), String(rag.meta.knowledge.definition || ''));
});

test('stats summarize dual-branch inventory', () => {
  const stats = summarizeProfessionalStats([
    migrateCardToProfessional(sampleLegacy),
    migrateCardToProfessional({
      cardId: 'rag.restraint.detail.水牢',
      title: '水牢',
      contentStatus: 'stub',
      evidenceStatus: 'missing',
      definition: '',
    }),
  ]);
  assert.equal(stats.total, 2);
  assert.ok(stats.stub >= 1);
  assert.equal(typeof computeBranchCompleteness(migrateCardToProfessional(sampleLegacy).knowledge, 'knowledge'), 'number');
});
