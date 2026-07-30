#!/usr/bin/env node
/**
 * Propose AI candidate evidence for RAG cards from existing sourceRefs / segment hits.
 * Candidates are always reviewStatus=pending; never auto-confirm.
 *
 *   node scripts/external-knowledge/propose-rag-evidence.mjs --card <cardId>
 *   node scripts/external-knowledge/propose-rag-evidence.mjs --all --commit
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
import { deriveEvidenceStatusFromRefs } from './lib/card-status.mjs';

function parseArgs(argv) {
  const options = { dryRun: true, all: false, cardId: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--commit') options.dryRun = false;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--all') options.all = true;
    else if (arg === '--card') options.cardId = argv[++i];
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await walkCards(path.join(KNOWLEDGE_ROOT, 'cards'));
  let excerpts = await loadEvidenceExcerpts();
  const reviews = await loadEvidenceReviews();
  const proposed = [];

  for (const absolute of files) {
    const card = await readJson(absolute);
    if (!card?.cardId) continue;
    if (options.cardId && card.cardId !== options.cardId) continue;
    if (!options.all && !options.cardId) continue;
    if (card.contentStatus === 'stub') continue;

    const evidenceIds = [...(card.evidenceRefs ?? [])];
    for (const ref of card.sourceRefs ?? []) {
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
        extractionOrigin: 'ai-proposed',
        reviewStatus: 'pending',
        evidenceRoles: ['definition', 'creative-reference'],
        usedByCardIds: [card.cardId],
      });
      const before = excerpts.find((item) => item.id === next.id);
      excerpts = upsertExcerpt(excerpts, next);
      if (!evidenceIds.includes(next.id)) evidenceIds.push(next.id);
      proposed.push({
        cardId: card.cardId,
        evidenceId: next.id,
        reused: Boolean(before),
        sourceMissing: !resolved.ok,
      });
    }

    const definitionClaim = (card.claims ?? []).find((claim) => claim.claimType === 'definition');
    const claims = Array.isArray(card.claims) ? [...card.claims] : [];
    if (definitionClaim) {
      const idx = claims.findIndex((claim) => claim.id === definitionClaim.id);
      claims[idx] = {
        ...definitionClaim,
        evidenceRefs: [...new Set([...(definitionClaim.evidenceRefs ?? []), ...evidenceIds])],
      };
    }

    const evidenceById = new Map(excerpts.map((item) => [item.id, item]));
    const nextCard = {
      ...card,
      evidenceRefs: evidenceIds,
      claims,
      evidenceStatus: deriveEvidenceStatusFromRefs({ ...card, evidenceRefs: evidenceIds }, evidenceById),
    };

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
        dryRun: options.dryRun,
        proposedCount: proposed.length,
        proposed: proposed.slice(0, 40),
        excerptTotal: excerpts.length,
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
