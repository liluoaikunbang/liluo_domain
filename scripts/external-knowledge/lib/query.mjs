const list = (value) => !value ? [] : Array.isArray(value) ? value : String(value).split(',').map((item) => item.trim()).filter(Boolean);
export function matchQuery(item, options = {}) {
  if (options.sourceId && item.sourceId !== options.sourceId) return { matched: false, score: 0 };
  if (options.segmentId && item.segmentId !== options.segmentId) return { matched: false, score: 0 };
  if (options.cardType && item.cardType !== options.cardType) return { matched: false, score: 0 };
  if (list(options.tags).some((tag) => !(item.tags ?? []).includes(tag))) return { matched: false, score: 0 };
  const haystack = `${item.title ?? ''} ${item.headingPath?.join(' ') ?? ''} ${item.searchableText ?? ''} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase();
  if (list(options.exclude).some((term) => haystack.includes(term.toLocaleLowerCase()))) return { matched: false, score: 0 };
  const terms = String(options.query ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (String(options.mode).toLowerCase() === 'exact' && terms.length) {
    const query = String(options.query).trim().toLocaleLowerCase();
    const exactValues = [item.sourceId, item.segmentId, item.cardId, item.title, item.author, item.sourcePath, ...(item.tags ?? [])].filter(Boolean).map((value) => String(value).toLocaleLowerCase());
    const exactScore = item.contentStatus === 'stub' ? 2.5 : 10;
    return { matched: exactValues.includes(query), score: exactValues.includes(query) ? exactScore : 0 };
  }
  const hits = terms.map((term) => haystack.includes(term));
  const matched = !terms.length || (String(options.mode ?? 'and').toLowerCase() === 'or' ? hits.some(Boolean) : hits.every(Boolean));
  if (!matched) return { matched: false, score: 0 };
  const title = (item.title ?? '').toLocaleLowerCase(), headings = (item.headingPath ?? []).join(' ').toLocaleLowerCase();
  const score = hits.filter(Boolean).length + terms.filter((term) => title.includes(term)).length * 3 + terms.filter((term) => headings.includes(term)).length * 2;
  return { matched: true, score: item.contentStatus === 'stub' ? score * 0.25 : score };
}
