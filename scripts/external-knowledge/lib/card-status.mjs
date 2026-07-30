/** Normalize RAG card / claim / evidence status enums across legacy + v2 values. */

export const CONTENT_STATUS = Object.freeze({
  stub: 'stub',
  draft: 'draft',
  usable: 'usable',
  complete: 'complete',
});

export const EVIDENCE_STATUS = Object.freeze({
  missing: 'missing',
  partial: 'partial',
  sufficient: 'sufficient',
  conflicted: 'conflicted',
});

export const REVIEW_STATUS = Object.freeze({
  pending: 'pending',
  confirmed: 'confirmed',
  rejected: 'rejected',
});

const CONTENT_ALIASES = Object.freeze({
  stub: 'stub',
  draft: 'draft',
  usable: 'usable',
  complete: 'complete',
  partial: 'draft',
});

const EVIDENCE_ALIASES = Object.freeze({
  missing: 'missing',
  partial: 'partial',
  sufficient: 'sufficient',
  conflicted: 'conflicted',
  supported: 'sufficient',
});

const REVIEW_ALIASES = Object.freeze({
  pending: 'pending',
  confirmed: 'confirmed',
  rejected: 'rejected',
  candidate: 'pending',
  reviewed: 'confirmed',
  approved: 'confirmed',
});

export function normalizeContentStatus(value, fallback = 'stub') {
  const key = String(value ?? '').trim();
  return CONTENT_ALIASES[key] ?? fallback;
}

export function normalizeEvidenceStatus(value, fallback = 'missing') {
  const key = String(value ?? '').trim();
  return EVIDENCE_ALIASES[key] ?? fallback;
}

export function normalizeReviewStatus(value, fallback = 'pending') {
  const key = String(value ?? '').trim();
  return REVIEW_ALIASES[key] ?? fallback;
}

export function isLegacyReviewStatus(value) {
  return ['candidate', 'reviewed', 'approved'].includes(String(value ?? ''));
}

export function isStubCard(card) {
  return normalizeContentStatus(card?.contentStatus) === 'stub';
}

export function defaultRetrievalPolicy(card = {}) {
  const stub = isStubCard(card);
  const contentStatus = normalizeContentStatus(card.contentStatus);
  const reviewStatus = normalizeReviewStatus(card.reviewStatus);
  const confirmed = reviewStatus === 'confirmed';
  // Formal writing injection requires user confirmation; stubs stay graph/search anchors only.
  const contentRetrievable =
    card.retrievalPolicy?.contentRetrievable ?? (!stub && confirmed && contentStatus !== 'stub');
  return {
    graphVisible: card.retrievalPolicy?.graphVisible ?? true,
    searchable: card.retrievalPolicy?.searchable ?? true,
    relationAnchor: card.retrievalPolicy?.relationAnchor ?? true,
    contentRetrievable: Boolean(contentRetrievable),
    evidenceRetrievable:
      card.retrievalPolicy?.evidenceRetrievable ??
      (!stub && normalizeEvidenceStatus(card.evidenceStatus) !== 'missing'),
  };
}

export function deriveEvidenceStatusFromRefs(card, evidenceById = new Map()) {
  const refs = Array.isArray(card?.evidenceRefs) ? card.evidenceRefs : [];
  if (!refs.length && !(card?.sourceRefs?.length)) return EVIDENCE_STATUS.missing;
  if (!refs.length) return EVIDENCE_STATUS.partial;

  let confirmed = 0;
  let pending = 0;
  let rejected = 0;
  let conflicted = 0;
  for (const id of refs) {
    const ev = evidenceById.get(id);
    if (!ev) {
      pending += 1;
      continue;
    }
    const status = normalizeReviewStatus(ev.reviewStatus);
    if (status === 'confirmed') confirmed += 1;
    else if (status === 'rejected') rejected += 1;
    else pending += 1;
    if (ev.supportConflict) conflicted += 1;
  }
  if (conflicted > 0) return EVIDENCE_STATUS.conflicted;
  if (confirmed > 0 && pending === 0) return EVIDENCE_STATUS.sufficient;
  if (confirmed > 0 || pending > 0) return EVIDENCE_STATUS.partial;
  if (rejected > 0 && confirmed === 0) return EVIDENCE_STATUS.missing;
  return EVIDENCE_STATUS.partial;
}

export function claimNeedsEvidence(claim) {
  if (!claim) return false;
  if (claim.supportStatus === 'user-canonical') return false;
  if (claim.reviewStatus === 'rejected') return false;
  return !Array.isArray(claim.evidenceRefs) || claim.evidenceRefs.length === 0;
}
