#!/usr/bin/env node
/**
 * Record a user/AI verdict on whether an evidence excerpt supports a claim.
 *
 *   npm run external:knowledge:evidence:review -- --claim <id> --evidence <id> --verdict supports --by user
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT } from './lib/config.mjs';
import { readJson, writeJson } from './lib/store.mjs';
import {
  applyEvidenceReview,
  loadEvidenceExcerpts,
  loadEvidenceReviews,
  mapVerdictToSupportStatus,
  saveEvidenceLibrary,
} from './lib/evidence-store.mjs';
import { deriveEvidenceStatusFromRefs, normalizeReviewStatus } from './lib/card-status.mjs';

function parseArgs(argv) {
  const options = {
    claimId: null,
    evidenceId: null,
    cardId: null,
    verdict: null,
    note: '',
    by: 'user',
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--claim') options.claimId = argv[++i];
    else if (arg === '--evidence') options.evidenceId = argv[++i];
    else if (arg === '--card') options.cardId = argv[++i];
    else if (arg === '--verdict') options.verdict = argv[++i];
    else if (arg === '--note') options.note = argv[++i];
    else if (arg === '--by') options.by = argv[++i];
    else if (arg === '--dry-run') options.dryRun = true;
  }
  return options;
}

async function walkCards(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkCards(absolute)));
    else if (entry.name.endsWith('.json')) out.push(absolute);
  }
  return out;
}

async function findCardByClaim(claimId, cardIdHint) {
  const files = await walkCards(path.join(KNOWLEDGE_ROOT, 'cards'));
  for (const absolute of files) {
    const card = await readJson(absolute);
    if (cardIdHint && card.cardId !== cardIdHint) continue;
    const claim = (card.claims ?? []).find((item) => item.id === claimId);
    if (claim) return { absolute, card, claim };
  }
  return null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const allowed = new Set(['supports', 'partially-supports', 'does-not-support', 'ambiguous', 'conflicts']);
  if (!options.claimId || !options.evidenceId || !allowed.has(options.verdict)) {
    throw new Error('需要 --claim --evidence --verdict supports|partially-supports|does-not-support|ambiguous|conflicts');
  }
  if (!['user', 'ai'].includes(options.by)) throw new Error('--by 只能是 user|ai');

  const found = await findCardByClaim(options.claimId, options.cardId);
  if (!found) throw new Error(`找不到 claim: ${options.claimId}`);

  let excerpts = await loadEvidenceExcerpts();
  let reviews = await loadEvidenceReviews();
  const evidence = excerpts.find((item) => item.id === options.evidenceId);
  if (!evidence) throw new Error(`找不到 evidence: ${options.evidenceId}`);

  const review = {
    id: `evr-${createHash('sha256').update(`${options.claimId}|${options.evidenceId}|${options.by}`).digest('hex').slice(0, 12)}`,
    claimId: options.claimId,
    evidenceId: options.evidenceId,
    cardId: found.card.cardId,
    verdict: options.verdict,
    note: options.note || undefined,
    reviewedBy: options.by,
    reviewedAt: new Date().toISOString(),
  };

  // User verdicts override AI; AI cannot overwrite user.
  if (options.by === 'ai') {
    const existingUser = reviews.find(
      (item) => item.claimId === options.claimId && item.evidenceId === options.evidenceId && item.reviewedBy === 'user',
    );
    if (existingUser) {
      console.log(JSON.stringify({ skipped: true, reason: 'user-review-exists', existingUser }, null, 2));
      return;
    }
  }

  reviews = applyEvidenceReview(reviews, review);

  const { card, claim, absolute } = found;
  let evidenceRefs = [...(claim.evidenceRefs ?? [])];
  if (options.verdict === 'does-not-support') {
    evidenceRefs = evidenceRefs.filter((id) => id !== options.evidenceId);
  } else if (!evidenceRefs.includes(options.evidenceId)) {
    evidenceRefs.push(options.evidenceId);
  }

  const nextClaim = {
    ...claim,
    evidenceRefs,
    supportStatus: mapVerdictToSupportStatus(options.verdict),
    reviewStatus: options.by === 'user' ? (options.verdict === 'ambiguous' ? 'pending' : 'confirmed') : claim.reviewStatus,
  };

  const claims = (card.claims ?? []).map((item) => (item.id === claim.id ? nextClaim : item));
  const cardEvidenceRefs = [...new Set([...(card.evidenceRefs ?? []), ...claims.flatMap((item) => item.evidenceRefs ?? [])])];
  const evidenceById = new Map(excerpts.map((item) => [item.id, item]));

  if (options.verdict === 'does-not-support' && options.by === 'user') {
    excerpts = excerpts.map((item) => {
      if (item.id !== options.evidenceId) return item;
      return {
        ...item,
        reviewStatus: normalizeReviewStatus(item.reviewStatus) === 'confirmed' ? 'pending' : item.reviewStatus,
        usedByClaimIds: (item.usedByClaimIds ?? []).filter((id) => id !== options.claimId),
      };
    });
  } else if (options.verdict === 'supports' && options.by === 'user') {
    excerpts = excerpts.map((item) =>
      item.id === options.evidenceId ? { ...item, reviewStatus: 'confirmed' } : item,
    );
  }

  const nextCard = {
    ...card,
    claims,
    evidenceRefs: cardEvidenceRefs,
    evidenceStatus: deriveEvidenceStatusFromRefs({ ...card, evidenceRefs: cardEvidenceRefs, claims }, evidenceById),
  };

  if (!options.dryRun) {
    await writeJson(absolute, nextCard);
    await saveEvidenceLibrary({ excerpts, reviews });
  }

  console.log(
    JSON.stringify(
      {
        dryRun: options.dryRun,
        review,
        cardId: nextCard.cardId,
        claimId: nextClaim.id,
        supportStatus: nextClaim.supportStatus,
        evidenceStatus: nextCard.evidenceStatus,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
