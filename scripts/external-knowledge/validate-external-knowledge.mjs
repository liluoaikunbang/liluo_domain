import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, SCOPE } from './lib/config.mjs';
import { readJson } from './lib/store.mjs';
import {
  isStubCard,
  normalizeContentStatus,
  normalizeEvidenceStatus,
  normalizeReviewStatus,
} from './lib/card-status.mjs';
import { loadEvidenceExcerpts } from './lib/evidence-store.mjs';

const errors = [];
const sources = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []);
const sourceIds = new Set();
for (const source of sources) {
  if (sourceIds.has(source.sourceId)) errors.push(`duplicate sourceId: ${source.sourceId}`);
  sourceIds.add(source.sourceId);
  if (source.knowledgeScope !== SCOPE || source.canonical !== false) errors.push(`invalid scope: ${source.sourceId}`);
  if (path.isAbsolute(source.relativePath)) errors.push(`absolute path: ${source.sourceId}`);
}
const segmentDir = path.join(KNOWLEDGE_ROOT, 'index', 'segments');
const segmentIds = new Set();
for (const name of await fs.readdir(segmentDir)) {
  for (const segment of await readJson(path.join(segmentDir, name), [])) {
    if (segmentIds.has(segment.segmentId)) errors.push(`duplicate segmentId: ${segment.segmentId}`);
    segmentIds.add(segment.segmentId);
    if (!sourceIds.has(segment.sourceId)) errors.push(`orphan segment: ${segment.segmentId}`);
    if (segment.preview.length > 80) errors.push(`preview too long: ${segment.segmentId}`);
  }
}

const excerpts = await loadEvidenceExcerpts();
const evidenceIds = new Set(excerpts.map((item) => item.id));

const cardRoot = path.join(KNOWLEDGE_ROOT, 'cards');
const cardTypes = new Set([
  'expression',
  'visual-structure',
  'scene-pattern',
  'fictional-state',
  'trope',
  'term',
  'plot-pattern',
  'pose',
  'tool',
  'material',
  'structure',
  'state',
  'effect',
  'sensory',
  'duration',
  'supernatural',
  'context',
]);
const allowedReview = new Set(['pending', 'candidate', 'reviewed', 'confirmed', 'rejected']);
const allowedContent = new Set(['complete', 'partial', 'stub', 'draft', 'usable']);
const allowedEvidence = new Set(['supported', 'partial', 'missing', 'sufficient', 'conflicted']);
const cards = [];

for (const type of await fs.readdir(cardRoot)) {
  for (const name of await fs.readdir(path.join(cardRoot, type))) {
    const card = await readJson(path.join(cardRoot, type, name));
    cards.push(card);
    if (!cardTypes.has(card.cardType) || (type !== 'restraint' && card.cardType !== type)) {
      errors.push(`invalid card type: ${card.cardId}`);
    }
    if (
      card.directQuoteIncluded !== false ||
      card.canonical !== false ||
      card.knowledgeScope !== SCOPE ||
      !allowedReview.has(card.reviewStatus)
    ) {
      errors.push(`unsafe card: ${card.cardId}`);
    }
    if (card.contentStatus != null && !allowedContent.has(card.contentStatus)) {
      errors.push(`invalid contentStatus: ${card.cardId}`);
    }
    if (card.evidenceStatus != null && !allowedEvidence.has(card.evidenceStatus)) {
      errors.push(`invalid evidenceStatus: ${card.cardId}`);
    }

    const stub = isStubCard(card);
    const sourceRefCount = Array.isArray(card.sourceRefs) ? card.sourceRefs.length : 0;
    const evidenceRefCount = Array.isArray(card.evidenceRefs) ? card.evidenceRefs.length : 0;
    if (stub && (normalizeEvidenceStatus(card.evidenceStatus) !== 'missing' || sourceRefCount !== 0 || evidenceRefCount !== 0)) {
      errors.push(`invalid stub card evidence: ${card.cardId}`);
    }
    if (!stub && sourceRefCount === 0 && evidenceRefCount === 0) {
      errors.push(`missing source refs: ${card.cardId}`);
    }
    if (card.cardType === 'term' && !stub && (!card.definition || !Array.isArray(card.aliases) || !Array.isArray(card.distinctions))) {
      errors.push(`invalid term card: ${card.cardId}`);
    }
    if (
      card.cardType === 'plot-pattern' &&
      (!card.prerequisites?.length || !card.progression?.length || !card.outcomes?.length)
    ) {
      errors.push(`invalid plot-pattern card: ${card.cardId}`);
    }
    for (const ref of card.sourceRefs ?? []) {
      if (
        !sourceIds.has(ref.sourceId) ||
        !segmentIds.has(ref.segmentId) ||
        path.isAbsolute(ref.sourcePath) ||
        ref.startLine > ref.endLine
      ) {
        errors.push(`invalid card ref: ${card.cardId}`);
      }
    }
    for (const evidenceId of card.evidenceRefs ?? []) {
      if (evidenceIds.size && !evidenceIds.has(evidenceId)) {
        errors.push(`card evidence missing: ${card.cardId} -> ${evidenceId}`);
      }
    }
    for (const claim of card.claims ?? []) {
      if (!claim?.id || !claim.content) errors.push(`invalid claim on ${card.cardId}`);
      for (const evidenceId of claim.evidenceRefs ?? []) {
        if (evidenceIds.size && !evidenceIds.has(evidenceId)) {
          errors.push(`claim evidence missing: ${card.cardId}/${claim.id} -> ${evidenceId}`);
        }
      }
    }
    if (stub && card.retrievalPolicy?.contentRetrievable === true) {
      errors.push(`stub must not be contentRetrievable: ${card.cardId}`);
    }
    if (card.retrievalPolicy?.knowledgeRetrievable === true && normalizeReviewStatus(card.knowledge?.reviewStatus) !== 'confirmed') {
      if (card.knowledge) errors.push(`knowledgeRetrievable requires confirmed knowledge: ${card.cardId}`);
    }
    if (card.retrievalPolicy?.expressionRetrievable === true && normalizeReviewStatus(card.expression?.reviewStatus) !== 'confirmed') {
      if (card.expression) errors.push(`expressionRetrievable requires confirmed expression: ${card.cardId}`);
    }
    if (card.professionalRagVersion != null) {
      if (!card.knowledge || !card.expression) {
        errors.push(`professional RAG missing branches: ${card.cardId}`);
      }
    }
    // Touch normalizers so accidental unknown aliases stay visible in future audits.
    normalizeContentStatus(card.contentStatus);
    normalizeReviewStatus(card.reviewStatus);
  }
}

const cardById = new Map(cards.map((card) => [card.cardId, card]));
for (const card of cards.filter((entry) => entry.domain === 'restraint')) {
  if (!['category', 'concept'].includes(card.ragLayer)) errors.push(`missing RAG layer: ${card.cardId}`);
  const parents = Array.isArray(card.parentCardIds) ? card.parentCardIds : [];
  if (card.ragLayer === 'category' && parents.length) errors.push(`RAG category has parent: ${card.cardId}`);
  if (card.ragLayer === 'concept' && parents.length === 0) errors.push(`RAG concept missing parent: ${card.cardId}`);
  for (const parentId of parents) {
    const parent = cardById.get(parentId);
    if (!parent) errors.push(`missing RAG parent: ${card.cardId} -> ${parentId}`);
    else if (parent.ragLayer !== 'category') errors.push(`RAG parent is not category: ${card.cardId} -> ${parentId}`);
  }
}

const result = {
  valid: errors.length === 0,
  sourceCount: sourceIds.size,
  segmentCount: segmentIds.size,
  evidenceCount: evidenceIds.size,
  errors,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
