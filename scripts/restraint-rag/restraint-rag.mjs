#!/usr/bin/env node
/**
 * 紧缚专业 RAG CLI
 * npm run restraint-rag:<command>
 *
 * Commands:
 *   scan-new-terms | candidates | create-stub | research | build-review-pack
 *   review | status | rebuild-affected | audit | export | migrate-pilot
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KNOWLEDGE_ROOT } from '../external-knowledge/lib/config.mjs';
import { readJson, writeJson } from '../external-knowledge/lib/store.mjs';
import {
  buildReviewPack,
  buildWritingJointContext,
  deriveOverallStatus,
  emptyExpressionBranch,
  emptyKnowledgeBranch,
  ensureProfessionalShape,
  migrateCardToProfessional,
  summarizeProfessionalStats,
  computeBranchCompleteness,
  PROFESSIONAL_RAG_VERSION,
} from '../external-knowledge/lib/professional-rag.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const CANDIDATES_PATH = path.join(KNOWLEDGE_ROOT, 'restraint-rag', 'candidates.json');
const REVIEW_DIR = path.join(KNOWLEDGE_ROOT, 'restraint-rag', 'review-packs');
const VERSIONS_DIR = path.join(KNOWLEDGE_ROOT, 'restraint-rag', 'versions');

const PILOT_CARD_IDS = [
  'rag.restraint.pose.leg-press-shackles', // 姿态类
  'rag.restraint.tool.handcuffs', // 器具类
  'rag.restraint.material.spider-silk', // 材料类
  'rag.restraint.state.confinement', // 状态类
  'rag.restraint.detail.水牢', // 复合概念类
];

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args.flags[key] = true;
      } else {
        args.flags[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

async function ensureDirs() {
  await fs.mkdir(path.dirname(CANDIDATES_PATH), { recursive: true });
  await fs.mkdir(REVIEW_DIR, { recursive: true });
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
}

async function loadAllRestraintCards() {
  const dir = path.join(KNOWLEDGE_ROOT, 'cards', 'restraint');
  const names = await fs.readdir(dir);
  const cards = [];
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    const card = await readJson(path.join(dir, name));
    cards.push({ fileName: name, filePath: path.join(dir, name), card });
  }
  return cards;
}

async function loadCandidates() {
  await ensureDirs();
  return readJson(CANDIDATES_PATH, {
    schemaVersion: 1,
    updatedAt: null,
    items: [],
    neverPrompt: [],
  });
}

async function saveCandidates(doc) {
  await ensureDirs();
  doc.updatedAt = new Date().toISOString();
  await writeJson(CANDIDATES_PATH, doc);
}

function slugifyTerm(term) {
  return String(term)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_.-]+/gu, '')
    .slice(0, 80);
}

function findExistingConcept(cards, term) {
  const needle = String(term).trim().toLocaleLowerCase();
  if (!needle) return null;
  for (const { card } of cards) {
    const shaped = ensureProfessionalShape(card);
    const names = [
      shaped.title,
      shaped.cardId,
      ...(shaped.aliases || []),
      ...(shaped.knowledge?.aliases || []),
    ]
      .filter(Boolean)
      .map((v) => String(v).toLocaleLowerCase());
    if (names.includes(needle)) {
      return { cardId: shaped.cardId, title: shaped.title, match: 'exact-or-alias' };
    }
  }
  return null;
}

async function cmdStatus() {
  const entries = await loadAllRestraintCards();
  const rawMigrated = entries.filter(
    (e) => e.card.professionalRagVersion >= 1 && e.card.knowledge && e.card.expression
  ).length;
  const cards = entries.map((e) => ensureProfessionalShape(e.card));
  const stats = summarizeProfessionalStats(cards);
  const result = {
    ok: true,
    professionalRagVersion: PROFESSIONAL_RAG_VERSION,
    migratedExplicit: rawMigrated,
    lazyShaped: cards.length,
    stats,
    pilotSuggested: PILOT_CARD_IDS,
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function cmdScanNewTerms(args) {
  const dryRun = Boolean(args.flags['dry-run']);
  const sourceText = String(args.flags.text || args.flags.query || '').trim();
  const sourceLabel = String(args.flags.source || 'manual');
  const entries = await loadAllRestraintCards();
  const candidatesDoc = await loadCandidates();
  const never = new Set(candidatesDoc.neverPrompt || []);
  const pending = new Set(
    (candidatesDoc.items || [])
      .filter((item) => item.status === 'pending')
      .map((item) => item.term)
  );

  // Lightweight term extraction: quoted /「」/ short CJK restraint-ish tokens from free text
  const rawTerms = [];
  if (sourceText) {
    const quoted = sourceText.match(/「([^」]{1,20})」|"([^"]{1,20})"|“([^”]{1,20})”/g) || [];
    for (const q of quoted) {
      rawTerms.push(q.replace(/^[「"“]|[」"”]$/g, ''));
    }
    if (!rawTerms.length) {
      rawTerms.push(...sourceText.split(/[\s,，、;；]+/).filter((t) => t.length >= 2 && t.length <= 16));
    }
  }

  const discovered = [];
  for (const term of [...new Set(rawTerms.map((t) => t.trim()).filter(Boolean))]) {
    if (never.has(term) || pending.has(term)) continue;
    const existing = findExistingConcept(entries, term);
    if (existing) continue;
    discovered.push({
      id: `cand-${slugifyTerm(term)}-${Date.now().toString(36)}`,
      term,
      status: 'pending',
      confidence: sourceText.includes(term) ? 'medium' : 'low',
      sources: [{ kind: sourceLabel, note: sourceText.slice(0, 120) }],
      createdAt: new Date().toISOString(),
      promptCount: 0,
    });
  }

  if (!dryRun && discovered.length) {
    candidatesDoc.items = [...(candidatesDoc.items || []), ...discovered];
    await saveCandidates(candidatesDoc);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        discovered: discovered.length,
        items: discovered,
        note: discovered.length
          ? '仅进入候选箱，不会自动正式纳入。请用 restraint-rag:candidates 查看。'
          : '未发现新的未建卡术语（或已在候选/永不提示中）。',
      },
      null,
      2
    )
  );
}

async function cmdCandidates(args) {
  const doc = await loadCandidates();
  const status = args.flags.status || 'pending';
  const items = (doc.items || []).filter((item) => status === 'all' || item.status === status);
  console.log(JSON.stringify({ ok: true, count: items.length, neverPrompt: doc.neverPrompt || [], items }, null, 2));
}

async function cmdCreateStub(args) {
  const dryRun = Boolean(args.flags['dry-run']);
  const title = String(args.flags.title || args.flags.term || '').trim();
  if (!title) {
    console.error(JSON.stringify({ ok: false, error: '缺少 --title' }));
    process.exitCode = 1;
    return;
  }
  const parent = String(args.flags.parent || '').trim();
  const cardId =
    String(args.flags.id || '').trim() ||
    `rag.restraint.term.${slugifyTerm(title) || Date.now().toString(36)}`;

  const entries = await loadAllRestraintCards();
  if (entries.some((e) => e.card.cardId === cardId)) {
    console.error(JSON.stringify({ ok: false, error: `cardId 已存在: ${cardId}` }));
    process.exitCode = 1;
    return;
  }
  const existing = findExistingConcept(entries, title);
  if (existing && !args.flags.force) {
    console.error(JSON.stringify({ ok: false, error: '可能已有同义概念', existing }));
    process.exitCode = 1;
    return;
  }

  const card = migrateCardToProfessional({
    cardId,
    title,
    domain: 'restraint',
    cardType: 'term',
    aliases: [],
    summary: `骨架卡：${title}（待用户确认后才可检索）`,
    definition: '',
    sourceRefs: [],
    evidenceStatus: 'missing',
    contentStatus: 'stub',
    reviewStatus: 'pending',
    directQuoteIncluded: false,
    canonical: false,
    knowledgeScope: 'external-fiction-reference',
    ragLayer: parent ? 'concept' : 'category',
    parentCardIds: parent ? [parent] : [],
    evidenceRefs: [],
    sourceRecordIds: [],
    claims: [],
    knowledge: emptyKnowledgeBranch({ aliases: [] }),
    expression: emptyExpressionBranch(),
    overallStatus: 'stub',
  });

  const filePath = path.join(KNOWLEDGE_ROOT, 'cards', 'restraint', `${cardId}.json`);
  if (!dryRun) {
    await writeJson(filePath, card);
  }
  console.log(JSON.stringify({ ok: true, dryRun, cardId, filePath: path.relative(REPO_ROOT, filePath).replace(/\\/g, '/') }, null, 2));
}

async function cmdResearch(args) {
  const cardId = String(args.flags.card || args.flags.id || '').trim();
  if (!cardId) {
    console.error(JSON.stringify({ ok: false, error: '缺少 --card' }));
    process.exitCode = 1;
    return;
  }
  const entries = await loadAllRestraintCards();
  const entry = entries.find((e) => e.card.cardId === cardId);
  if (!entry) {
    console.error(JSON.stringify({ ok: false, error: `未找到卡片: ${cardId}` }));
    process.exitCode = 1;
    return;
  }
  const shaped = ensureProfessionalShape(entry.card);
  const localHits = entries
    .filter((e) => e.card.cardId !== cardId)
    .map((e) => ensureProfessionalShape(e.card))
    .filter((c) => {
      const hay = `${c.title} ${(c.aliases || []).join(' ')} ${c.definition || ''}`.toLocaleLowerCase();
      return hay.includes(String(shaped.title).toLocaleLowerCase());
    })
    .slice(0, 8)
    .map((c) => ({ cardId: c.cardId, title: c.title, overallStatus: deriveOverallStatus(c) }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        cardId,
        searchOrder: [
          'user-confirmed-project-knowledge',
          'user-notes-and-gold-prose',
          'confirmed-project-rag',
          'imported-external-evidence',
          'ai-candidate-inference',
        ],
        localRelated: localHits,
        knowledgeEvidence: shaped.knowledge?.evidenceRefs || [],
        expressionRelatedStyle: shaped.expression?.relatedStyleRagRefs || [],
        note: '本命令只生成候选检索线索，不写入正式知识；AI 推断须单独标记。',
      },
      null,
      2
    )
  );
}

async function cmdBuildReviewPack(args) {
  const dryRun = Boolean(args.flags['dry-run']);
  const cardId = String(args.flags.card || args.flags.id || '').trim();
  if (!cardId) {
    console.error(JSON.stringify({ ok: false, error: '缺少 --card' }));
    process.exitCode = 1;
    return;
  }
  const entries = await loadAllRestraintCards();
  const entry = entries.find((e) => e.card.cardId === cardId);
  if (!entry) {
    console.error(JSON.stringify({ ok: false, error: `未找到卡片: ${cardId}` }));
    process.exitCode = 1;
    return;
  }
  const pack = buildReviewPack(entry.card);
  const outPath = path.join(REVIEW_DIR, `${cardId.replace(/[^\w.\u4e00-\u9fff-]+/g, '_')}.json`);
  if (!dryRun) {
    await ensureDirs();
    await writeJson(outPath, { generatedAt: new Date().toISOString(), pack });
  }
  console.log(JSON.stringify({ ok: true, dryRun, cardId, outPath: path.relative(REPO_ROOT, outPath).replace(/\\/g, '/'), pack }, null, 2));
}

async function cmdReview(args) {
  const dryRun = Boolean(args.flags['dry-run']);
  const cardId = String(args.flags.card || args.flags.id || '').trim();
  const branch = String(args.flags.branch || 'both'); // knowledge | expression | both
  const action = String(args.flags.action || 'confirm'); // confirm | defer | reject | open-knowledge | open-expression
  if (!cardId) {
    console.error(JSON.stringify({ ok: false, error: '缺少 --card' }));
    process.exitCode = 1;
    return;
  }
  const entries = await loadAllRestraintCards();
  const entry = entries.find((e) => e.card.cardId === cardId);
  if (!entry) {
    console.error(JSON.stringify({ ok: false, error: `未找到: ${cardId}` }));
    process.exitCode = 1;
    return;
  }

  let card = ensureProfessionalShape(entry.card, { materialize: true });
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
  const versionPath = path.join(VERSIONS_DIR, `${cardId.replace(/[^\w.\u4e00-\u9fff-]+/g, '_')}-${Date.now()}.json`);

  if (action === 'reject') {
    if (branch === 'knowledge' || branch === 'both') card.knowledge.reviewStatus = 'rejected';
    if (branch === 'expression' || branch === 'both') card.expression.reviewStatus = 'rejected';
  } else if (action === 'defer') {
    // keep pending
  } else if (action === 'confirm') {
    if (branch === 'knowledge' || branch === 'both') {
      card.knowledge.reviewStatus = 'confirmed';
      if (card.knowledge.status === 'stub') card.knowledge.status = 'usable';
      card.retrievalPolicy.knowledgeRetrievable = true;
    }
    if (branch === 'expression' || branch === 'both') {
      card.expression.reviewStatus = 'confirmed';
      if (card.expression.status === 'stub') card.expression.status = 'usable';
      card.retrievalPolicy.expressionRetrievable = true;
    }
    card.retrievalPolicy.contentRetrievable =
      Boolean(card.retrievalPolicy.knowledgeRetrievable) || Boolean(card.retrievalPolicy.expressionRetrievable);
    card.reviewStatus = 'confirmed';
    if (card.contentStatus === 'stub') card.contentStatus = 'usable';
  } else if (action === 'open-knowledge') {
    card.retrievalPolicy.knowledgeRetrievable = true;
  } else if (action === 'open-expression') {
    card.retrievalPolicy.expressionRetrievable = true;
  }

  card.overallStatus = deriveOverallStatus(card);
  card.professionalRagVersion = PROFESSIONAL_RAG_VERSION;

  if (!dryRun) {
    await writeJson(versionPath, entry.card);
    await writeJson(entry.filePath, card);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        cardId,
        action,
        branch,
        overallStatus: card.overallStatus,
        retrievalPolicy: card.retrievalPolicy,
        versionBackup: dryRun ? null : path.relative(REPO_ROOT, versionPath).replace(/\\/g, '/'),
      },
      null,
      2
    )
  );
}

async function cmdMigratePilot(args) {
  const dryRun = Boolean(args.flags['dry-run']);
  const commit = Boolean(args.flags.commit);
  const all = Boolean(args.flags.all);
  if (!dryRun && !commit) {
    console.error(JSON.stringify({ ok: false, error: '请使用 --dry-run 或 --commit' }));
    process.exitCode = 1;
    return;
  }
  const entries = await loadAllRestraintCards();
  const ids = args.flags.card
    ? [String(args.flags.card)]
    : all
      ? entries.map((e) => e.card.cardId)
      : PILOT_CARD_IDS;
  const batchId = all ? 'professional-rag-bulk-v1' : 'professional-rag-pilot-v1';
  const results = [];
  for (const cardId of ids) {
    const entry = entries.find((e) => e.card.cardId === cardId);
    if (!entry) {
      results.push({ cardId, ok: false, error: 'not-found' });
      continue;
    }
    if (entry.card.knowledge && entry.card.expression && entry.card.professionalRagVersion) {
      results.push({
        cardId,
        ok: true,
        skipped: true,
        reason: 'already-migrated',
        overallStatus: deriveOverallStatus(entry.card),
        knowledgeCompleteness: computeBranchCompleteness(entry.card.knowledge, 'knowledge'),
        expressionCompleteness: computeBranchCompleteness(entry.card.expression, 'expression'),
      });
      continue;
    }
    const migrated = migrateCardToProfessional(entry.card, {
      batchId,
      strategy: 'knowledge-from-legacy-expression-stub',
    });
    migrated.evidenceBindings = (migrated.evidenceRefs || []).map((evidenceId) => ({
      evidenceId,
      purpose: 'knowledge-evidence',
      branch: 'knowledge',
      supportStatus: 'pending',
    }));
    if (commit) {
      const versionPath = path.join(
        VERSIONS_DIR,
        `${cardId.replace(/[^\w.\u4e00-\u9fff-]+/g, '_')}-pre-${all ? 'bulk' : 'pilot'}.json`
      );
      await ensureDirs();
      await writeJson(versionPath, entry.card);
      await writeJson(entry.filePath, migrated);
    }
    results.push({
      cardId,
      ok: true,
      dryRun: !commit,
      title: migrated.title,
      cardType: migrated.cardType,
      ragLayer: migrated.ragLayer,
      overallStatus: migrated.overallStatus,
      knowledgeCompleteness: computeBranchCompleteness(migrated.knowledge, 'knowledge'),
      expressionCompleteness: computeBranchCompleteness(migrated.expression, 'expression'),
      knowledgeStatus: migrated.knowledge.status,
      expressionStatus: migrated.expression.status,
      evidenceBindings: migrated.evidenceBindings?.length || 0,
      retrievalPolicy: migrated.retrievalPolicy,
    });
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: commit ? 'commit' : 'dry-run',
        scope: all ? 'all-restraint-cards' : args.flags.card ? 'single' : 'pilot',
        migratedOrUpdated: results.filter((r) => r.ok && !r.skipped).length,
        skipped: results.filter((r) => r.skipped).length,
        note: all
          ? '批量迁移：每张紧缚卡一个主 ID + 知识/表达双分支骨架；不另建重复卡。'
          : '试迁移结果请先交给用户确认。',
        results,
      },
      null,
      2
    )
  );
}

async function cmdExport(args) {
  const entries = await loadAllRestraintCards();
  const publicSafe = Boolean(args.flags['public-safe']);
  const payload = entries.map(({ card }) => {
    const shaped = ensureProfessionalShape(card);
    if (!publicSafe) return shaped;
    return {
      cardId: shaped.cardId,
      title: shaped.title,
      aliases: shaped.aliases,
      overallStatus: deriveOverallStatus(shaped),
      knowledge: {
        definition: shaped.knowledge?.definition,
        status: shaped.knowledge?.status,
        reviewStatus: shaped.knowledge?.reviewStatus,
      },
      expression: {
        status: shaped.expression?.status,
        reviewStatus: shaped.expression?.reviewStatus,
        relatedStyleRagRefs: shaped.expression?.relatedStyleRagRefs,
      },
      retrievalPolicy: shaped.retrievalPolicy,
    };
  });
  console.log(JSON.stringify({ ok: true, publicSafe, count: payload.length, cards: payload }, null, 2));
}

async function cmdAudit() {
  const entries = await loadAllRestraintCards();
  const issues = [];
  for (const { card } of entries) {
    const shaped = ensureProfessionalShape(card);
    if (shaped.domain !== 'restraint') continue;
    if (shaped.professionalRagVersion && (!shaped.knowledge || !shaped.expression)) {
      issues.push({ cardId: shaped.cardId, issue: 'missing-branch' });
    }
    if (shaped.retrievalPolicy?.knowledgeRetrievable && shaped.knowledge?.reviewStatus !== 'confirmed') {
      issues.push({ cardId: shaped.cardId, issue: 'knowledge-retrievable-without-confirm' });
    }
    if (shaped.retrievalPolicy?.expressionRetrievable && shaped.expression?.reviewStatus !== 'confirmed') {
      issues.push({ cardId: shaped.cardId, issue: 'expression-retrievable-without-confirm' });
    }
    if (isSkeletonOnlyGuard(shaped) && shaped.retrievalPolicy?.contentRetrievable) {
      issues.push({ cardId: shaped.cardId, issue: 'skeleton-content-retrievable' });
    }
  }
  console.log(JSON.stringify({ ok: issues.length === 0, issueCount: issues.length, issues }, null, 2));
  if (issues.length) process.exitCode = 1;
}

function isSkeletonOnlyGuard(card) {
  const def = card.knowledge?.definition || card.definition || '';
  const hasKnowledge = Boolean(String(def).trim()) || (card.knowledge?.factualClaims || []).length > 0;
  const hasExpression =
    (card.expression?.visualFocus || []).length > 0 ||
    (card.expression?.expressionPrinciples || []).length > 0;
  return !hasKnowledge && !hasExpression;
}

async function cmdRebuildAffected(args) {
  const dryRun = !args.flags.commit;
  const cardId = String(args.flags.card || '').trim();
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        cardId: cardId || null,
        actions: [
          'recompute overallStatus',
          'refresh review packs for affected cards',
          'outline graph projection reload on next open',
        ],
        note: '失败不会改写索引；使用 --commit 才写回受影响卡片的派生字段。',
      },
      null,
      2
    )
  );
  if (!dryRun && cardId) {
    const entries = await loadAllRestraintCards();
    const entry = entries.find((e) => e.card.cardId === cardId);
    if (entry) {
      const shaped = ensureProfessionalShape(entry.card, { materialize: true });
      shaped.overallStatus = deriveOverallStatus(shaped);
      await writeJson(entry.filePath, shaped);
    }
  }
}

async function cmdWritingContext(args) {
  const cardId = String(args.flags.card || args.flags.id || '').trim();
  const entries = await loadAllRestraintCards();
  const entry = entries.find((e) => e.card.cardId === cardId);
  if (!entry) {
    console.error(JSON.stringify({ ok: false, error: `未找到: ${cardId}` }));
    process.exitCode = 1;
    return;
  }
  const ctx = buildWritingJointContext(entry.card, [], []);
  console.log(JSON.stringify({ ok: true, context: ctx }, null, 2));
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || 'status';

const handlers = {
  status: cmdStatus,
  'scan-new-terms': cmdScanNewTerms,
  candidates: cmdCandidates,
  'create-stub': cmdCreateStub,
  research: cmdResearch,
  'build-review-pack': cmdBuildReviewPack,
  review: cmdReview,
  export: cmdExport,
  audit: cmdAudit,
  'rebuild-affected': cmdRebuildAffected,
  'migrate-pilot': cmdMigratePilot,
  'writing-context': cmdWritingContext,
};

if (!handlers[command]) {
  console.error(JSON.stringify({ ok: false, error: `未知命令: ${command}`, commands: Object.keys(handlers) }));
  process.exitCode = 1;
} else {
  await handlers[command](args);
}
