const list = (value) => !value ? [] : Array.isArray(value) ? value : String(value).split(',').map((item) => item.trim()).filter(Boolean);

function isContentRetrievable(item) {
  if (item?.retrievalPolicy) {
    if (typeof item.retrievalPolicy.knowledgeRetrievable === 'boolean' ||
        typeof item.retrievalPolicy.expressionRetrievable === 'boolean') {
      return Boolean(
        item.retrievalPolicy.knowledgeRetrievable || item.retrievalPolicy.expressionRetrievable
      );
    }
    if (typeof item.retrievalPolicy.contentRetrievable === 'boolean') {
      return item.retrievalPolicy.contentRetrievable;
    }
  }
  return item?.contentStatus !== 'stub';
}

/**
 * @param {'writing'|'view'|'calibration'|string} mode
 * writing: confirmed/usable content only; stubs excluded from content injection
 * view: full card + claims metadata
 * calibration: include pending claims/evidence markers
 */
export function matchQuery(item, options = {}) {
  // Default view/search keeps stubs discoverable as relation anchors.
  // Formal writing injection must pass retrievalMode=writing (excludes stubs / non-retrievable).
  const retrievalMode = String(options.retrievalMode ?? options.contentMode ?? 'view').toLowerCase();
  if (retrievalMode === 'writing' && !isContentRetrievable(item)) {
    return { matched: false, score: 0 };
  }
  if (options.sourceId && item.sourceId !== options.sourceId) return { matched: false, score: 0 };
  if (options.segmentId && item.segmentId !== options.segmentId) return { matched: false, score: 0 };
  if (options.cardType && item.cardType !== options.cardType) return { matched: false, score: 0 };
  if (list(options.tags).some((tag) => !(item.tags ?? []).includes(tag))) return { matched: false, score: 0 };
  const claimText = (item.claims ?? []).map((claim) => claim.content).join(' ');
  const evidenceText = (item.evidenceSearchText ?? item.excerptPreview ?? '');
  const haystack = `${item.title ?? ''} ${(item.aliases ?? []).join(' ')} ${item.headingPath?.join(' ') ?? ''} ${item.searchableText ?? ''} ${claimText} ${evidenceText} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase();
  if (list(options.exclude).some((term) => haystack.includes(term.toLocaleLowerCase()))) return { matched: false, score: 0 };
  const terms = String(options.query ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (String(options.mode).toLowerCase() === 'exact' && terms.length) {
    const query = String(options.query).trim().toLocaleLowerCase();
    const exactValues = [item.sourceId, item.segmentId, item.cardId, item.title, item.author, item.sourcePath, ...(item.tags ?? []), ...(item.aliases ?? [])].filter(Boolean).map((value) => String(value).toLocaleLowerCase());
    const exactScore = item.contentStatus === 'stub' ? 2.5 : 10;
    return { matched: exactValues.includes(query), score: exactValues.includes(query) ? exactScore : 0 };
  }
  const hits = terms.map((term) => haystack.includes(term));
  const matched = !terms.length || (String(options.mode ?? 'and').toLowerCase() === 'or' ? hits.some(Boolean) : hits.every(Boolean));
  if (!matched) return { matched: false, score: 0 };
  const title = (item.title ?? '').toLocaleLowerCase(), headings = (item.headingPath ?? []).join(' ').toLocaleLowerCase();
  let score = hits.filter(Boolean).length + terms.filter((term) => title.includes(term)).length * 3 + terms.filter((term) => headings.includes(term)).length * 2;
  if (item.contentStatus === 'stub') score *= 0.25;
  if (retrievalMode === 'calibration' && item.evidenceStatus === 'missing') score += 1;
  return { matched: true, score };
}
