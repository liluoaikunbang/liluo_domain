#!/usr/bin/env node
/**
 * Migrate RAG cards onto shared evidence layer:
 * - dedupe sourceRefs into central evidence excerpts (source-resolved, no full quote in git)
 * - add evidenceRefs + claims + retrievalPolicy
 * - preserve card IDs and existing story/plot/gameplay links
 *
 * Usage:
 *   node scripts/external-knowledge/migrate-rag-evidence.mjs --dry-run
 *   node scripts/external-knowledge/migrate-rag-evidence.mjs --commit
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, REPO_ROOT } from './lib/config.mjs';
import { readJson, writeJson } from './lib/store.mjs';
import {
  buildEvidenceFromSourceRef,
  loadEvidenceExcerpts,
  loadEvidenceReviews,
  readSourceLines,
  saveEvidenceLibrary,
  upsertExcerpt,
} from './lib/evidence-store.mjs';
import {
  defaultRetrievalPolicy,
  deriveEvidenceStatusFromRefs,
  normalizeContentStatus,
  normalizeReviewStatus,
} from './lib/card-status.mjs';

function parseArgs(argv) {
  const options = { dryRun: true, commit: false };
  for (const arg of argv) {
    if (arg === '--commit') {
      options.commit = true;
      options.dryRun = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
      options.commit = false;
    }
  }
  return options;
}

async function walkCards(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkCards(absolute)));
    else if (entry.name.endsWith('.json')) out.push(absolute);
  }
  return out;
}

function claimIdFor(cardId, kind, index = 0) {
  return `${cardId}::claim:${kind}:${index}`;
}

function buildClaims(card, evidenceIds) {
  if (Array.isArray(card.claims) && card.claims.length) {
    return card.claims.map((claim) => ({
      ...claim,
      evidenceRefs: [...new Set([...(claim.evidenceRefs ?? []), ...evidenceIds])],
      reviewStatus: normalizeReviewStatus(claim.reviewStatus, 'pending'),
    }));
  }
  const claims = [];
  const definition = String(card.definition ?? '').trim();
  if (definition) {
    claims.push({
      id: claimIdFor(card.cardId, 'definition', 0),
      label: '定义',
      content: definition,
      claimType: 'definition',
      evidenceRefs: [...evidenceIds],
      supportStatus: evidenceIds.length ? 'pending' : 'pending',
      reviewStatus: 'pending',
      origin: 'external-summary',
    });
  }
  const distinctions = Array.isArray(card.distinctions) ? card.distinctions : [];
  distinctions.forEach((text, index) => {
    const content = String(text ?? '').trim();
    if (!content) return;
    claims.push({
      id: claimIdFor(card.cardId, 'distinction', index),
      label: `区别 ${index + 1}`,
      content,
      claimType: 'distinction',
      evidenceRefs: [...evidenceIds],
      supportStatus: 'pending',
      reviewStatus: 'pending',
      origin: 'ai-proposed',
    });
  });
  return claims;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cardFiles = await walkCards(path.join(KNOWLEDGE_ROOT, 'cards'));
  let excerpts = await loadEvidenceExcerpts();
  const reviews = await loadEvidenceReviews();
  const byLocation = new Map(
    excerpts.map((item) => [
      `${item.sourceId}|${item.location?.lineStart}|${item.location?.lineEnd}|${item.location?.sourcePath}`,
      item.id,
    ]),
  );

  const report = {
    dryRun: options.dryRun,
    cardsTouched: 0,
    evidenceCreated: 0,
    evidenceReused: 0,
    sourceMissing: 0,
    stubs: 0,
  };

  for (const absolute of cardFiles) {
    const card = await readJson(absolute);
    if (!card?.cardId) continue;

    const contentStatus = normalizeContentStatus(card.contentStatus, card.contentStatus === 'stub' ? 'stub' : 'draft');
    const isStub = contentStatus === 'stub';
    if (isStub) report.stubs += 1;

    const evidenceIds = [...(card.evidenceRefs ?? [])];
    for (const ref of card.sourceRefs ?? []) {
      const key = `${ref.sourceId}|${ref.startLine}|${ref.endLine}|${ref.sourcePath}`;
      let evidenceId = byLocation.get(key);
      if (!evidenceId) {
        const resolved = await readSourceLines(ref.sourcePath, ref.startLine, ref.endLine, {
          root: REPO_ROOT,
          contextLines: 2,
        });
        const next = buildEvidenceFromSourceRef(ref, {
          excerptPreview: resolved.excerpt,
          contextBeforePreview: resolved.contextBefore,
          contextAfterPreview: resolved.contextAfter,
          contentHash: resolved.contentHash,
          sourceMissing: !resolved.ok,
          extractionOrigin: 'imported',
          reviewStatus: 'pending',
          evidenceRoles: ['definition'],
          usedByCardIds: [card.cardId],
        });
        if (!resolved.ok) report.sourceMissing += 1;
        excerpts = upsertExcerpt(excerpts, next);
        evidenceId = next.id;
        byLocation.set(key, evidenceId);
        report.evidenceCreated += 1;
      } else {
        const existing = excerpts.find((item) => item.id === evidenceId);
        if (existing) {
          excerpts = upsertExcerpt(excerpts, {
            ...existing,
            usedByCardIds: [...new Set([...(existing.usedByCardIds ?? []), card.cardId])],
          });
        }
        report.evidenceReused += 1;
      }
      if (!evidenceIds.includes(evidenceId)) evidenceIds.push(evidenceId);
    }

    const claims = isStub ? [] : buildClaims(card, evidenceIds);
    for (const claim of claims) {
      for (const evidenceId of claim.evidenceRefs ?? []) {
        const existing = excerpts.find((item) => item.id === evidenceId);
        if (!existing) continue;
        excerpts = upsertExcerpt(excerpts, {
          ...existing,
          usedByClaimIds: [...new Set([...(existing.usedByClaimIds ?? []), claim.id])],
        });
      }
    }

    const evidenceById = new Map(excerpts.map((item) => [item.id, item]));
    const nextCard = {
      ...card,
      contentStatus: isStub ? 'stub' : contentStatus === 'complete' ? 'complete' : contentStatus,
      evidenceStatus: isStub
        ? 'missing'
        : deriveEvidenceStatusFromRefs({ ...card, evidenceRefs: evidenceIds }, evidenceById),
      reviewStatus: card.reviewStatus, // keep legacy candidate/reviewed until user confirms
      evidenceRefs: evidenceIds,
      sourceRefs: card.sourceRefs ?? [],
      sourceRecordIds: [
        ...new Set([
          ...(card.sourceRecordIds ?? []),
          ...(card.sourceRefs ?? []).map((ref) => ref.sourceId).filter(Boolean),
        ]),
      ],
      claims,
      retrievalPolicy: defaultRetrievalPolicy({
        ...card,
        contentStatus: isStub ? 'stub' : contentStatus,
        retrievalPolicy: {
          graphVisible: card.retrievalPolicy?.graphVisible,
          searchable: card.retrievalPolicy?.searchable,
          relationAnchor: card.retrievalPolicy?.relationAnchor,
          // Recompute content/evidence flags from confirmation state; do not keep stale unlocks.
          contentRetrievable: undefined,
          evidenceRetrievable: undefined,
        },
      }),
      migration: {
        ...(card.migration ?? {}),
        evidenceLayer: 'v1',
        evidenceMigratedAt: new Date().toISOString(),
      },
    };

    // Preserve old evidenceStatus alias if still using supported
    if (nextCard.evidenceStatus === 'sufficient' && card.evidenceStatus === 'supported') {
      // write new canonical value
    }

    const changed = JSON.stringify(nextCard) !== JSON.stringify(card);
    if (!changed) continue;
    report.cardsTouched += 1;
    if (!options.dryRun) {
      await writeJson(absolute, nextCard);
    }
  }

  if (!options.dryRun) {
    await saveEvidenceLibrary({ excerpts, reviews });
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        excerptTotal: excerpts.length,
        reviewTotal: reviews.length,
        wrote: !options.dryRun,
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
