import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, SCOPE } from './lib/config.mjs';
import { readJson } from './lib/store.mjs';
const errors = [], sources = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []), sourceIds = new Set();
for (const source of sources) { if (sourceIds.has(source.sourceId)) errors.push(`duplicate sourceId: ${source.sourceId}`); sourceIds.add(source.sourceId); if (source.knowledgeScope !== SCOPE || source.canonical !== false) errors.push(`invalid scope: ${source.sourceId}`); if (path.isAbsolute(source.relativePath)) errors.push(`absolute path: ${source.sourceId}`); }
const segmentDir = path.join(KNOWLEDGE_ROOT, 'index', 'segments'), segmentIds = new Set();
for (const name of await fs.readdir(segmentDir)) for (const segment of await readJson(path.join(segmentDir, name), [])) { if (segmentIds.has(segment.segmentId)) errors.push(`duplicate segmentId: ${segment.segmentId}`); segmentIds.add(segment.segmentId); if (!sourceIds.has(segment.sourceId)) errors.push(`orphan segment: ${segment.segmentId}`); if (segment.preview.length > 80) errors.push(`preview too long: ${segment.segmentId}`); }
const cardRoot = path.join(KNOWLEDGE_ROOT, 'cards');
for (const type of await fs.readdir(cardRoot)) for (const name of await fs.readdir(path.join(cardRoot, type))) { const card = await readJson(path.join(cardRoot, type, name)); if (card.directQuoteIncluded !== false || card.canonical !== false) errors.push(`unsafe card: ${card.cardId}`); for (const ref of card.sourceRefs ?? []) if (!sourceIds.has(ref.sourceId) || !segmentIds.has(ref.segmentId)) errors.push(`invalid card ref: ${card.cardId}`); }
const result = { valid: errors.length === 0, sourceCount: sourceIds.size, segmentCount: segmentIds.size, errors }; console.log(JSON.stringify(result, null, 2)); if (errors.length) process.exitCode = 1;
