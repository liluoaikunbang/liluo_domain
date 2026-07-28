import fs from 'node:fs';
import path from 'node:path';

const cardRoot = 'external-knowledge/cards/restraint';
const segmentRoot = 'external-knowledge/index/segments';
const maxSources = Number(process.argv[2] ?? 3);

const cards = fs.readdirSync(cardRoot)
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({
    file,
    card: JSON.parse(fs.readFileSync(path.join(cardRoot, file), 'utf8'))
  }));
const segments = fs.readdirSync(segmentRoot)
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(segmentRoot, file), 'utf8')));

for (const { file, card } of cards) {
  const searchTerms = [...new Set([
    card.title,
    ...(card.aliases ?? []),
    ...(card.title.includes('-') ? [card.title.split('-').at(-1)] : [])
  ].filter((term) => term.length >= 2))];
  const seenSources = new Set();
  const matches = [];

  for (const segment of segments) {
    if (!searchTerms.some((term) => segment.preview.includes(term))) continue;
    if (seenSources.has(segment.sourceId)) continue;

    const sourceLines = fs.readFileSync(segment.sourcePath, 'utf8').split(/\r?\n/);
    const excerpt = sourceLines
      .slice(Math.max(0, segment.startLine - 1), segment.endLine)
      .join(' ')
      .replace(/\s+/g, ' ')
      .slice(0, 420);
    matches.push({
      sourceId: segment.sourceId,
      segmentId: segment.segmentId,
      sourcePath: segment.sourcePath,
      startLine: segment.startLine,
      endLine: segment.endLine,
      excerpt
    });
    seenSources.add(segment.sourceId);
    if (matches.length >= maxSources) break;
  }

  console.log(JSON.stringify({
    file,
    cardId: card.cardId,
    title: card.title,
    searchTerms,
    matches
  }));
}
