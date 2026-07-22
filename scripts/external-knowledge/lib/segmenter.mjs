import { sha256 } from './hashing.mjs';
import { SCOPE } from './config.mjs';
const HEADING = /^(?:#{1,6}\s+(.+)|\s*(第[零〇一二三四五六七八九十百千万0-9]+[章节卷部回幕].*))\s*$/;

export function segmentText(text, { sourceId, sourcePath, maxChars = 1400 }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const result = [], headingPath = [];
  let buffer = [], startLine = 1;
  const flush = (endLine) => {
    const content = buffer.join('\n').trim(); buffer = [];
    if (!content) return;
    result.push({ segmentId: `${sourceId}-seg-${String(result.length + 1).padStart(5, '0')}`, sourceId, sourcePath,
      headingPath: [...headingPath], startLine, endLine, characterCount: content.length, contentHash: sha256(content),
      preview: content.replace(/\s+/g, ' ').slice(0, 80), keywords: [], tags: [], knowledgeScope: SCOPE, canonical: false });
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index], heading = line.match(HEADING);
    if (heading) {
      flush(index);
      const level = line.match(/^#+/)?.[0].length ?? 1;
      headingPath.splice(Math.max(0, level - 1)); headingPath[level - 1] = (heading[1] ?? heading[2]).trim();
      startLine = index + 2; continue;
    }
    if (!buffer.length && !line.trim()) { startLine = index + 2; continue; }
    const nextLength = buffer.reduce((sum, value) => sum + value.length + 1, 0) + line.length;
    if (buffer.length && nextLength > maxChars) { flush(index); startLine = index + 1; }
    buffer.push(line);
    if (!line.trim() && buffer.join('\n').trim().length >= Math.floor(maxChars * 0.55)) { flush(index + 1); startLine = index + 2; }
  }
  flush(lines.length); return result;
}
