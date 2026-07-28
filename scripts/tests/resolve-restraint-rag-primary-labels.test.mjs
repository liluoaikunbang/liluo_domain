import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRestraintRagMissingItem,
  cardNeedsRestraintBodyTodo,
  indexRagCardsById,
  resolveRestraintRagPrimaryLabels
} from '../../src/game/data/outline_relation_graph/resolveRestraintRagPrimaryLabels.js';

const cards = [
  {
    cardId: 'rag.restraint.effect.tickling',
    title: '挠痒',
    ragLayer: 'category',
    parentCardIds: [],
    summary: '痒感',
    sourceRefs: [{ sourceId: 'x' }],
    contentStatus: 'complete',
    evidenceStatus: 'partial'
  },
  {
    cardId: 'rag.restraint.detail.挠痒-山药汁',
    title: '挠痒-山药汁',
    ragLayer: 'concept',
    parentCardIds: ['rag.restraint.effect.tickling'],
    contentStatus: 'stub',
    evidenceStatus: 'missing',
    sourceRefs: []
  },
  {
    cardId: 'rag.restraint.tool.orphan-new',
    title: '临时新器具',
    ragLayer: 'category',
    parentCardIds: [],
    contentStatus: 'stub',
    evidenceStatus: 'missing',
    sourceRefs: []
  },
  {
    cardId: 'rag.restraint.detail.lonely-concept',
    title: '无父概念',
    ragLayer: 'concept',
    parentCardIds: [],
    contentStatus: 'stub',
    evidenceStatus: 'missing',
    sourceRefs: []
  }
];

test('category ragRef uses its own title as primary label', () => {
  const labels = resolveRestraintRagPrimaryLabels(['rag.restraint.effect.tickling'], cards);
  assert.deepEqual(labels, ['挠痒']);
});

test('concept ragRef bubbles to parent category title', () => {
  const labels = resolveRestraintRagPrimaryLabels(['rag.restraint.detail.挠痒-山药汁'], cards);
  assert.deepEqual(labels, ['挠痒']);
});

test('concept without parent falls back to own title', () => {
  const labels = resolveRestraintRagPrimaryLabels(['rag.restraint.detail.lonely-concept'], cards);
  assert.deepEqual(labels, ['无父概念']);
});

test('dedupes primary labels when multiple refs share a category', () => {
  const labels = resolveRestraintRagPrimaryLabels(
    ['rag.restraint.effect.tickling', 'rag.restraint.detail.挠痒-山药汁'],
    cards
  );
  assert.deepEqual(labels, ['挠痒']);
});

test('unknown ref falls back to raw id', () => {
  const labels = resolveRestraintRagPrimaryLabels(['rag.missing'], cards);
  assert.deepEqual(labels, ['rag.missing']);
});

test('missing-item helper and stub detection', () => {
  const byId = indexRagCardsById(cards);
  assert.equal(cardNeedsRestraintBodyTodo(byId.get('rag.restraint.detail.挠痒-山药汁')), true);
  assert.equal(cardNeedsRestraintBodyTodo(byId.get('rag.restraint.effect.tickling')), false);
  assert.equal(
    buildRestraintRagMissingItem(byId.get('rag.restraint.tool.orphan-new')),
    'RAG｜紧缚RAG｜补全「临时新器具」正文与来源'
  );
});
