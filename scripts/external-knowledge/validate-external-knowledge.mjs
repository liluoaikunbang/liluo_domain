import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, SCOPE } from './lib/config.mjs';
import { readJson } from './lib/store.mjs';
const errors = [], sources = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []), sourceIds = new Set();
for (const source of sources) { if (sourceIds.has(source.sourceId)) errors.push(`duplicate sourceId: ${source.sourceId}`); sourceIds.add(source.sourceId); if (source.knowledgeScope !== SCOPE || source.canonical !== false) errors.push(`invalid scope: ${source.sourceId}`); if (path.isAbsolute(source.relativePath)) errors.push(`absolute path: ${source.sourceId}`); }
const segmentDir = path.join(KNOWLEDGE_ROOT, 'index', 'segments'), segmentIds = new Set();
for (const name of await fs.readdir(segmentDir)) for (const segment of await readJson(path.join(segmentDir, name), [])) { if (segmentIds.has(segment.segmentId)) errors.push(`duplicate segmentId: ${segment.segmentId}`); segmentIds.add(segment.segmentId); if (!sourceIds.has(segment.sourceId)) errors.push(`orphan segment: ${segment.segmentId}`); if (segment.preview.length > 80) errors.push(`preview too long: ${segment.segmentId}`); }
const cardRoot = path.join(KNOWLEDGE_ROOT, 'cards');
const cardTypes = new Set(['expression', 'visual-structure', 'scene-pattern', 'fictional-state', 'trope', 'term', 'plot-pattern', 'pose', 'tool', 'material', 'structure', 'state', 'effect', 'sensory', 'duration', 'supernatural', 'context']);
const cards = [];
for (const type of await fs.readdir(cardRoot)) for (const name of await fs.readdir(path.join(cardRoot, type))) {
  const card = await readJson(path.join(cardRoot, type, name));
  cards.push(card);
  if (!cardTypes.has(card.cardType) || (type !== 'restraint' && card.cardType !== type)) errors.push(`invalid card type: ${card.cardId}`);
  if (card.directQuoteIncluded !== false || card.canonical !== false || card.knowledgeScope !== SCOPE || !['pending', 'candidate', 'reviewed'].includes(card.reviewStatus)) errors.push(`unsafe card: ${card.cardId}`);
  const isStub = card.contentStatus === 'stub';
  if (isStub && (card.evidenceStatus !== 'missing' || card.sourceRefs.length !== 0)) {
    errors.push(`invalid stub card evidence: ${card.cardId}`);
  }
  if (!isStub && card.sourceRefs.length === 0) errors.push(`missing source refs: ${card.cardId}`);
  if (card.cardType === 'term' && !isStub && (!card.definition || !Array.isArray(card.aliases) || !Array.isArray(card.distinctions))) errors.push(`invalid term card: ${card.cardId}`);
  if (card.cardType === 'plot-pattern' && (!card.prerequisites?.length || !card.progression?.length || !card.outcomes?.length)) errors.push(`invalid plot-pattern card: ${card.cardId}`);
  for (const ref of card.sourceRefs ?? []) if (!sourceIds.has(ref.sourceId) || !segmentIds.has(ref.segmentId) || path.isAbsolute(ref.sourcePath) || ref.startLine > ref.endLine) errors.push(`invalid card ref: ${card.cardId}`);
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
const result = { valid: errors.length === 0, sourceCount: sourceIds.size, segmentCount: segmentIds.size, errors }; console.log(JSON.stringify(result, null, 2)); if (errors.length) process.exitCode = 1;
