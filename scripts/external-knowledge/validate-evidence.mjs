#!/usr/bin/env node
import path from 'node:path';
import { KNOWLEDGE_ROOT } from './lib/config.mjs';
import { readJson } from './lib/store.mjs';
import { loadEvidenceExcerpts, loadEvidenceRegistry, loadEvidenceReviews } from './lib/evidence-store.mjs';
import { normalizeReviewStatus } from './lib/card-status.mjs';

const errors = [];
const registry = await loadEvidenceRegistry();
const excerpts = await loadEvidenceExcerpts();
const reviews = await loadEvidenceReviews();
const sources = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []);
const sourceIds = new Set(sources.map((item) => item.sourceId));
const ids = new Set();

for (const excerpt of excerpts) {
  if (!excerpt?.id) {
    errors.push('excerpt missing id');
    continue;
  }
  if (ids.has(excerpt.id)) errors.push(`duplicate evidence id: ${excerpt.id}`);
  ids.add(excerpt.id);
  if (!excerpt.sourceId) errors.push(`evidence missing sourceId: ${excerpt.id}`);
  if (excerpt.sourceId && !sourceIds.has(excerpt.sourceId) && !String(excerpt.sourceId).startsWith('user-note:')) {
    // Style-RAG / user notes may use non-fb ids; warn only for fb-src pattern orphans
    if (String(excerpt.sourceId).startsWith('fb-src-')) {
      errors.push(`evidence source missing from catalog: ${excerpt.id} -> ${excerpt.sourceId}`);
    }
  }
  if (!Array.isArray(excerpt.evidenceRoles) || !excerpt.evidenceRoles.length) {
    errors.push(`evidence roles empty: ${excerpt.id}`);
  }
  if (!['pending', 'confirmed', 'rejected'].includes(normalizeReviewStatus(excerpt.reviewStatus))) {
    errors.push(`invalid evidence reviewStatus: ${excerpt.id}`);
  }
  if (excerpt.rightsScope?.publicExport === true && excerpt.excerptStorage !== 'inline-public-safe') {
    errors.push(`publicExport evidence must be inline-public-safe: ${excerpt.id}`);
  }
  if (excerpt.excerptPreview && excerpt.excerptPreview.length > 120) {
    errors.push(`excerptPreview too long: ${excerpt.id}`);
  }
}

for (const review of reviews) {
  if (!review?.id || !review.claimId || !review.evidenceId) {
    errors.push(`invalid review record: ${review?.id ?? '?'}`);
    continue;
  }
  if (!ids.has(review.evidenceId)) errors.push(`review points to missing evidence: ${review.id}`);
  if (!['supports', 'partially-supports', 'does-not-support', 'ambiguous', 'conflicts'].includes(review.verdict)) {
    errors.push(`invalid verdict: ${review.id}`);
  }
}

const orphanEvidence = excerpts.filter(
  (item) => !(item.usedByCardIds ?? []).length && !(item.usedByClaimIds ?? []).length,
).length;

const result = {
  valid: errors.length === 0,
  excerptCount: excerpts.length,
  reviewCount: reviews.length,
  registryExcerptCount: registry.excerptCount ?? null,
  orphanEvidence,
  errors,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
