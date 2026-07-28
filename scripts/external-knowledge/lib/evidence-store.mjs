import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, REPO_ROOT } from './config.mjs';
import { sha256 } from './hashing.mjs';
import { readJson, writeJson } from './store.mjs';

export const EVIDENCE_ROOT = path.join(KNOWLEDGE_ROOT, 'evidence');
export const EVIDENCE_REGISTRY_PATH = path.join(EVIDENCE_ROOT, 'registry.json');
export const EVIDENCE_EXCERPTS_PATH = path.join(EVIDENCE_ROOT, 'excerpts.json');
export const EVIDENCE_REVIEWS_PATH = path.join(EVIDENCE_ROOT, 'reviews.json');
export const PRIVATE_EVIDENCE_CACHE = path.join(KNOWLEDGE_ROOT, 'private-evidence');
export const ROOT = REPO_ROOT;

const PREVIEW_MAX = 120;
const CONTEXT_PREVIEW_MAX = 80;

export function stableEvidenceId({ sourceId, lineStart, lineEnd, contentHash }) {
  const basis = `${sourceId}|${lineStart ?? ''}|${lineEnd ?? ''}|${contentHash ?? ''}`;
  const digest = createHash('sha256').update(basis).digest('hex').slice(0, 16);
  return `ev-${sourceId.replace(/[^a-z0-9]+/gi, '').toLowerCase().slice(0, 24) || 'src'}-${digest}`;
}

function clip(text, max) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

export async function loadEvidenceRegistry() {
  return readJson(EVIDENCE_REGISTRY_PATH, {
    schemaVersion: 1,
    updatedAt: null,
    excerptCount: 0,
    reviewCount: 0,
    sourceIndexOnce: true,
  });
}

export async function loadEvidenceExcerpts() {
  const payload = await readJson(EVIDENCE_EXCERPTS_PATH, { schemaVersion: 1, excerpts: [] });
  return Array.isArray(payload.excerpts) ? payload.excerpts : [];
}

export async function loadEvidenceReviews() {
  const payload = await readJson(EVIDENCE_REVIEWS_PATH, { schemaVersion: 1, reviews: [] });
  return Array.isArray(payload.reviews) ? payload.reviews : [];
}

export async function saveEvidenceLibrary({ excerpts, reviews, registry }) {
  await fs.mkdir(EVIDENCE_ROOT, { recursive: true });
  const nextRegistry = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    excerptCount: excerpts.length,
    reviewCount: reviews.length,
    sourceIndexOnce: true,
    ...(registry ?? {}),
  };
  await writeJson(EVIDENCE_REGISTRY_PATH, nextRegistry);
  await writeJson(EVIDENCE_EXCERPTS_PATH, { schemaVersion: 1, excerpts });
  await writeJson(EVIDENCE_REVIEWS_PATH, { schemaVersion: 1, reviews });
  return nextRegistry;
}

export function indexExcerptsById(excerpts) {
  return new Map((excerpts ?? []).map((item) => [item.id, item]));
}

export async function readSourceLines(sourcePath, lineStart, lineEnd, options = {}) {
  const absolute = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.join(options.root ?? ROOT, sourcePath);
  try {
    const text = await fs.readFile(absolute, 'utf8');
    const lines = text.split(/\r?\n/);
    const start = Math.max(1, Number(lineStart) || 1);
    const end = Math.max(start, Number(lineEnd) || start);
    const beforeStart = Math.max(1, start - (options.contextLines ?? 2));
    const afterEnd = Math.min(lines.length, end + (options.contextLines ?? 2));
    const excerpt = lines.slice(start - 1, end).join('\n');
    const contextBefore = lines.slice(beforeStart - 1, start - 1).join('\n');
    const contextAfter = lines.slice(end, afterEnd).join('\n');
    return {
      ok: true,
      absolutePath: absolute,
      excerpt,
      contextBefore,
      contextAfter,
      lineStart: start,
      lineEnd: end,
      contentHash: sha256(excerpt),
    };
  } catch (error) {
    return {
      ok: false,
      absolutePath: absolute,
      error: error.code === 'ENOENT' ? 'source-missing' : String(error.message ?? error),
      excerpt: '',
      contextBefore: '',
      contextAfter: '',
      lineStart: lineStart ?? null,
      lineEnd: lineEnd ?? null,
      contentHash: null,
    };
  }
}

/**
 * Resolve full excerpt text for verification UI.
 * Public export must use redactEvidenceForPublicExport instead.
 */
export async function resolveEvidenceBody(excerpt, options = {}) {
  if (!excerpt) {
    return { ok: false, error: 'missing-excerpt', excerpt: '', contextBefore: '', contextAfter: '' };
  }
  if (excerpt.excerptStorage === 'inline-public-safe' && excerpt.inlineExcerpt) {
    return {
      ok: true,
      excerpt: excerpt.inlineExcerpt,
      contextBefore: excerpt.inlineContextBefore ?? '',
      contextAfter: excerpt.inlineContextAfter ?? '',
      sourceMissing: false,
    };
  }
  const location = excerpt.location ?? {};
  const sourcePath = location.sourcePath;
  if (!sourcePath || !location.lineStart) {
    return {
      ok: false,
      error: 'missing-location',
      excerpt: '',
      contextBefore: '',
      contextAfter: '',
      sourceMissing: true,
    };
  }
  const resolved = await readSourceLines(sourcePath, location.lineStart, location.lineEnd, options);
  return {
    ok: resolved.ok,
    error: resolved.ok ? null : resolved.error,
    excerpt: resolved.excerpt,
    contextBefore: resolved.contextBefore,
    contextAfter: resolved.contextAfter,
    sourceMissing: !resolved.ok,
    contentHash: resolved.contentHash,
    absolutePath: resolved.absolutePath,
  };
}

export function redactEvidenceForPublicExport(excerpt) {
  const base = { ...(excerpt ?? {}) };
  const publicExport = Boolean(base.rightsScope?.publicExport);
  if (publicExport && base.excerptStorage === 'inline-public-safe') {
    return base;
  }
  return {
    id: base.id,
    sourceId: base.sourceId,
    segmentId: base.segmentId ?? null,
    excerptPreview: publicExport ? base.excerptPreview ?? '' : '',
    excerptStorage: 'source-resolved',
    location: base.location
      ? {
          lineStart: base.location.lineStart,
          lineEnd: base.location.lineEnd,
          sourcePath: base.location.sourcePath,
          heading: base.location.heading,
        }
      : undefined,
    evidenceRoles: base.evidenceRoles ?? [],
    extractionOrigin: base.extractionOrigin,
    reviewStatus: base.reviewStatus,
    rightsScope: {
      privateRag: Boolean(base.rightsScope?.privateRag),
      publicExport: false,
    },
    contentHash: base.contentHash,
    sourceMissing: Boolean(base.sourceMissing),
    usedByCardIds: base.usedByCardIds ?? [],
    usedByClaimIds: base.usedByClaimIds ?? [],
    redacted: true,
  };
}

export function buildEvidenceFromSourceRef(ref, options = {}) {
  const sourceId = ref.sourceId;
  const lineStart = ref.startLine ?? ref.location?.lineStart;
  const lineEnd = ref.endLine ?? ref.location?.lineEnd ?? lineStart;
  const sourcePath = ref.sourcePath ?? ref.location?.sourcePath;
  const contentHash = options.contentHash ?? null;
  const id =
    options.id ??
    stableEvidenceId({
      sourceId,
      lineStart,
      lineEnd,
      contentHash: contentHash ?? `${sourcePath}:${lineStart}:${lineEnd}`,
    });
  return {
    id,
    sourceId,
    segmentId: ref.segmentId ?? null,
    excerptPreview: clip(options.excerptPreview ?? '', PREVIEW_MAX),
    excerptStorage: 'source-resolved',
    location: {
      lineStart,
      lineEnd,
      sourcePath,
      heading: options.heading ?? undefined,
      section: options.section ?? undefined,
    },
    contextBeforePreview: clip(options.contextBeforePreview ?? '', CONTEXT_PREVIEW_MAX),
    contextAfterPreview: clip(options.contextAfterPreview ?? '', CONTEXT_PREVIEW_MAX),
    evidenceRoles: options.evidenceRoles ?? ['definition'],
    extractionOrigin: options.extractionOrigin ?? 'ai-proposed',
    reviewStatus: options.reviewStatus ?? 'pending',
    rightsScope: {
      privateRag: true,
      publicExport: false,
      ...(options.rightsScope ?? {}),
    },
    contentHash,
    sourceMissing: Boolean(options.sourceMissing),
    usedByCardIds: [...new Set(options.usedByCardIds ?? [])],
    usedByClaimIds: [...new Set(options.usedByClaimIds ?? [])],
    createdAt: options.createdAt ?? new Date().toISOString(),
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  };
}

export function upsertExcerpt(excerpts, next) {
  const list = [...(excerpts ?? [])];
  const index = list.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    const prev = list[index];
    list[index] = {
      ...prev,
      ...next,
      usedByCardIds: [...new Set([...(prev.usedByCardIds ?? []), ...(next.usedByCardIds ?? [])])],
      usedByClaimIds: [...new Set([...(prev.usedByClaimIds ?? []), ...(next.usedByClaimIds ?? [])])],
      updatedAt: new Date().toISOString(),
    };
    return list;
  }
  list.push(next);
  return list;
}

export function applyEvidenceReview(reviews, review) {
  const list = [...(reviews ?? [])];
  const index = list.findIndex(
    (item) => item.claimId === review.claimId && item.evidenceId === review.evidenceId && item.reviewedBy === 'user',
  );
  // User reviews override prior AI reviews for the same pair.
  const withoutAiDup = list.filter(
    (item) =>
      !(
        item.claimId === review.claimId &&
        item.evidenceId === review.evidenceId &&
        item.reviewedBy === 'ai' &&
        review.reviewedBy === 'user'
      ),
  );
  if (index >= 0) {
    withoutAiDup[index] = { ...withoutAiDup[index], ...review };
    return withoutAiDup;
  }
  withoutAiDup.push(review);
  return withoutAiDup;
}

export function latestReviewForPair(reviews, claimId, evidenceId) {
  const matches = (reviews ?? []).filter(
    (item) => item.claimId === claimId && item.evidenceId === evidenceId,
  );
  if (!matches.length) return null;
  const user = matches.filter((item) => item.reviewedBy === 'user');
  const pool = user.length ? user : matches;
  return pool.sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt)))[0];
}

export function mapVerdictToSupportStatus(verdict) {
  switch (verdict) {
    case 'supports':
      return 'supported';
    case 'partially-supports':
      return 'partially-supported';
    case 'does-not-support':
      return 'unsupported';
    case 'conflicts':
      return 'conflicted';
    case 'ambiguous':
    default:
      return 'pending';
  }
}
