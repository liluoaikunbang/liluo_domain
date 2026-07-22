function longestCommonSubstringLength(a, b) {
  let previous = new Uint32Array(b.length + 1), longest = 0;
  for (let i = 1; i <= a.length; i += 1) { const current = new Uint32Array(b.length + 1); for (let j = 1; j <= b.length; j += 1) if (a[i - 1] === b[j - 1]) { current[j] = previous[j - 1] + 1; longest = Math.max(longest, current[j]); } previous = current; }
  return longest;
}
function ngrams(text, size = 6) { const normalized = text.replace(/\s+/g, ''), values = new Set(); for (let i = 0; i <= normalized.length - size; i += 1) values.add(normalized.slice(i, i + size)); return values; }
export function assessSimilarity(generatedText, sources) {
  const generated = generatedText.replace(/\s+/g, ''), generatedNgrams = ngrams(generated);
  const matches = sources.map((source) => { const sourceText = source.text.replace(/\s+/g, ''), sourceNgrams = ngrams(sourceText); let overlap = 0; for (const gram of generatedNgrams) if (sourceNgrams.has(gram)) overlap += 1; return { sourceId: source.sourceId, sourcePath: source.sourcePath, startLine: source.startLine, endLine: source.endLine, longestSharedChars: overlap ? longestCommonSubstringLength(generated, sourceText) : 0, ngramOverlap: generatedNgrams.size ? Number((overlap / generatedNgrams.size).toFixed(4)) : 0 }; })
    .filter((match) => match.longestSharedChars >= 8 || match.ngramOverlap >= 0.1).sort((a, b) => b.longestSharedChars - a.longestSharedChars || b.ngramOverlap - a.ngramOverlap);
  const highest = matches[0], risk = !highest ? 'low' : highest.longestSharedChars >= 30 || highest.ngramOverlap >= 0.55 ? 'high' : highest.longestSharedChars >= 18 || highest.ngramOverlap >= 0.3 ? 'medium' : 'low';
  return { risk, rewriteRecommended: risk !== 'low', matches: matches.slice(0, 20), disclaimer: 'This is a conservative writing-similarity warning, not a legal copyright determination.' };
}
