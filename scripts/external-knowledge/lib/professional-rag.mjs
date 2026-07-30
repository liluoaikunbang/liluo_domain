/**
 * 紧缚专业 RAG：单卡双分支（知识 / 表达）契约与派生。
 * 未迁移旧卡可在读取时惰性合成分支，正式写入仍须显式迁移。
 */

import {
  normalizeContentStatus,
  normalizeEvidenceStatus,
  normalizeReviewStatus,
  isStubCard,
} from './card-status.mjs';

export const PROFESSIONAL_RAG_VERSION = 1;

export const OVERALL_STATUS = Object.freeze({
  stub: 'stub',
  'knowledge-only': 'knowledge-only',
  'expression-only': 'expression-only',
  usable: 'usable',
  confirmed: 'confirmed',
  conflicted: 'conflicted',
});

export const BRANCH_STATUS = Object.freeze({
  stub: 'stub',
  draft: 'draft',
  usable: 'usable',
  confirmed: 'confirmed',
});

export const EVIDENCE_PURPOSE = Object.freeze({
  knowledge: 'knowledge-evidence',
  expression: 'expression-evidence',
  both: 'both',
});

const emptyBranchMeta = (status = 'stub') => ({
  status,
  evidenceStatus: 'missing',
  reviewStatus: 'pending',
});

export function emptyKnowledgeBranch(overrides = {}) {
  return {
    definition: '',
    boundaries: { includes: [], excludes: [] },
    distinctions: [],
    aliases: [],
    parentConceptRefs: [],
    childConceptRefs: [],
    relatedConceptRefs: [],
    factualClaims: [],
    evidenceRefs: [],
    projectInterpretation: '',
    commonMisreadings: [],
    ...emptyBranchMeta('stub'),
    ...overrides,
  };
}

export function emptyExpressionBranch(overrides = {}) {
  return {
    visualFocus: [],
    actionLogic: [],
    movementEffects: [],
    postureEffects: [],
    sensoryFocus: [],
    emotionalPossibilities: [],
    narrativeUses: [],
    applicableScenes: [],
    unsuitableScenes: [],
    expressionPrinciples: [],
    commonFailures: [],
    prohibitedMisreadings: [],
    styleEvidenceRefs: [],
    goldExampleRefs: [],
    calibrationPairRefs: [],
    relatedStyleRagRefs: [],
    evidenceRefs: [],
    ...emptyBranchMeta('stub'),
    ...overrides,
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function branchHasContent(branch, kind) {
  if (!branch) return false;
  if (kind === 'knowledge') {
    return (
      nonEmptyString(branch.definition) ||
      asArray(branch.factualClaims).length > 0 ||
      asArray(branch.evidenceRefs).length > 0 ||
      nonEmptyString(branch.projectInterpretation) ||
      asArray(branch.boundaries?.includes).length > 0 ||
      asArray(branch.distinctions).length > 0
    );
  }
  return (
    asArray(branch.visualFocus).length > 0 ||
    asArray(branch.actionLogic).length > 0 ||
    asArray(branch.expressionPrinciples).length > 0 ||
    asArray(branch.goldExampleRefs).length > 0 ||
    asArray(branch.calibrationPairRefs).length > 0 ||
    asArray(branch.relatedStyleRagRefs).length > 0 ||
    asArray(branch.evidenceRefs).length > 0 ||
    asArray(branch.commonFailures).length > 0
  );
}

export function deriveOverallStatus(card) {
  const knowledge = card?.knowledge;
  const expression = card?.expression;
  // Prefer live branch state; stored overallStatus is a cache filled by writers.
  if (!knowledge && !expression && card?.overallStatus && OVERALL_STATUS[card.overallStatus]) {
    return card.overallStatus;
  }
  const kReview = normalizeReviewStatus(knowledge?.reviewStatus);
  const eReview = normalizeReviewStatus(expression?.reviewStatus);
  const kStatus = normalizeContentStatus(knowledge?.status ?? 'stub');
  const eStatus = normalizeContentStatus(expression?.status ?? 'stub');
  const kConflict = normalizeEvidenceStatus(knowledge?.evidenceStatus) === 'conflicted';
  const eConflict = normalizeEvidenceStatus(expression?.evidenceStatus) === 'conflicted';
  if (kConflict || eConflict) return OVERALL_STATUS.conflicted;

  const kConfirmed = kReview === 'confirmed' && kStatus !== 'stub';
  const eConfirmed = eReview === 'confirmed' && eStatus !== 'stub';
  const kUsable = branchHasContent(knowledge, 'knowledge') && kStatus !== 'stub';
  const eUsable = branchHasContent(expression, 'expression') && eStatus !== 'stub';

  if (kConfirmed && eConfirmed) return OVERALL_STATUS.confirmed;
  if (kUsable && eUsable) return OVERALL_STATUS.usable;
  if (kUsable && !eUsable) return OVERALL_STATUS['knowledge-only'];
  if (!kUsable && eUsable) return OVERALL_STATUS['expression-only'];
  return OVERALL_STATUS.stub;
}

export function computeBranchCompleteness(branch, kind) {
  if (!branch) return 0;
  const checks =
    kind === 'knowledge'
      ? [
          nonEmptyString(branch.definition),
          asArray(branch.boundaries?.includes).length > 0 || asArray(branch.boundaries?.excludes).length > 0,
          asArray(branch.distinctions).length > 0,
          asArray(branch.evidenceRefs).length > 0 || asArray(branch.factualClaims).length > 0,
          normalizeReviewStatus(branch.reviewStatus) === 'confirmed',
        ]
      : [
          asArray(branch.visualFocus).length > 0 || asArray(branch.actionLogic).length > 0,
          asArray(branch.expressionPrinciples).length > 0 || asArray(branch.commonFailures).length > 0,
          asArray(branch.goldExampleRefs).length > 0 || asArray(branch.calibrationPairRefs).length > 0,
          asArray(branch.relatedStyleRagRefs).length > 0 || asArray(branch.evidenceRefs).length > 0,
          normalizeReviewStatus(branch.reviewStatus) === 'confirmed',
        ];
  const hit = checks.filter(Boolean).length;
  return Math.round((hit / checks.length) * 100);
}

/**
 * 从旧卡字段惰性合成双分支（不改文件）。
 */
export function ensureProfessionalShape(card, { materialize = false } = {}) {
  if (!card || typeof card !== 'object') return card;
  const hasBranches = card.knowledge && card.expression;
  if (hasBranches && !materialize) {
    return {
      ...card,
      professionalRagVersion: card.professionalRagVersion ?? PROFESSIONAL_RAG_VERSION,
      overallStatus: deriveOverallStatus(card),
      retrievalPolicy: normalizeProfessionalRetrievalPolicy(card),
    };
  }

  const stub = isStubCard(card);
  const knowledgeStatus = stub
    ? 'stub'
    : normalizeContentStatus(card.contentStatus) === 'complete'
      ? 'usable'
      : normalizeContentStatus(card.contentStatus);

  const knowledge = card.knowledge
    ? { ...emptyKnowledgeBranch(), ...card.knowledge }
    : emptyKnowledgeBranch({
        definition: card.definition || card.summary || '',
        aliases: asArray(card.aliases),
        parentConceptRefs: asArray(card.parentCardIds),
        relatedConceptRefs: asArray(card.linkedConceptIds),
        factualClaims: asArray(card.claims),
        evidenceRefs: asArray(card.evidenceRefs),
        distinctions: asArray(card.distinctions).map((item) =>
          typeof item === 'string'
            ? { targetConceptId: '', description: item }
            : item
        ),
        status: knowledgeStatus,
        evidenceStatus: normalizeEvidenceStatus(card.evidenceStatus),
        reviewStatus: normalizeReviewStatus(card.reviewStatus),
      });

  const expression = card.expression
    ? { ...emptyExpressionBranch(), ...card.expression }
    : emptyExpressionBranch({
        // 旧卡没有专属表达时保持 stub，避免 AI 把空壳当成可写知识
        status: 'stub',
        evidenceStatus: 'missing',
        reviewStatus: 'pending',
      });

  const shaped = {
    ...card,
    professionalRagVersion: PROFESSIONAL_RAG_VERSION,
    knowledge,
    expression,
    overallStatus: deriveOverallStatus({ ...card, knowledge, expression }),
    retrievalPolicy: normalizeProfessionalRetrievalPolicy({
      ...card,
      knowledge,
      expression,
    }),
  };
  return shaped;
}

export function normalizeProfessionalRetrievalPolicy(card = {}) {
  const stub = isStubCard(card) || deriveOverallStatus(card) === 'stub';
  const knowledge = card.knowledge;
  const expression = card.expression;
  const knowledgeConfirmed =
    normalizeReviewStatus(knowledge?.reviewStatus) === 'confirmed' &&
    normalizeContentStatus(knowledge?.status ?? 'stub') !== 'stub';
  const expressionConfirmed =
    normalizeReviewStatus(expression?.reviewStatus) === 'confirmed' &&
    normalizeContentStatus(expression?.status ?? 'stub') !== 'stub';

  const base = {
    graphVisible: card.retrievalPolicy?.graphVisible ?? true,
    searchable: card.retrievalPolicy?.searchable ?? true,
    relationAnchor: card.retrievalPolicy?.relationAnchor ?? true,
    contentRetrievable: Boolean(card.retrievalPolicy?.contentRetrievable),
    evidenceRetrievable: Boolean(card.retrievalPolicy?.evidenceRetrievable),
  };

  return {
    ...base,
    knowledgeRetrievable:
      card.retrievalPolicy?.knowledgeRetrievable ??
      (!stub && knowledgeConfirmed && base.contentRetrievable),
    expressionRetrievable:
      card.retrievalPolicy?.expressionRetrievable ??
      (!stub && expressionConfirmed),
    evidenceRetrievable:
      card.retrievalPolicy?.evidenceRetrievable ??
      (!stub && normalizeEvidenceStatus(card.evidenceStatus) !== 'missing'),
  };
}

/**
 * 正式迁移：把旧知识字段写入 knowledge 分支；表达保留骨架。
 * 若有 creative-note / abstractPatterns，迁入表达分支草稿（仍待用户确认）。
 * 不发明表达内容；不另建第二张卡。
 */
export function migrateCardToProfessional(card, options = {}) {
  const shaped = ensureProfessionalShape(card, { materialize: true });
  const now = options.migratedAt || new Date().toISOString();

  // 从旧字段吸收表达草稿（不另开重复卡）
  const creativeNotes = asArray(shaped.claims)
    .filter((claim) => claim?.claimType === 'creative-note' && nonEmptyString(claim.content))
    .map((claim) => claim.content);
  const abstractPatterns = asArray(shaped.abstractPatterns).filter(nonEmptyString);
  if (creativeNotes.length || abstractPatterns.length) {
    shaped.expression = {
      ...emptyExpressionBranch(),
      ...shaped.expression,
      expressionPrinciples: uniqueStrings([
        ...asArray(shaped.expression?.expressionPrinciples),
        ...abstractPatterns,
        ...creativeNotes,
      ]),
      status:
        normalizeContentStatus(shaped.expression?.status) === 'stub' ? 'draft' : shaped.expression.status,
      reviewStatus: 'pending',
      evidenceStatus: normalizeEvidenceStatus(shaped.expression?.evidenceStatus || 'missing'),
    };
  }

  // 保证双分支骨架始终存在
  shaped.knowledge = { ...emptyKnowledgeBranch(), ...shaped.knowledge };
  shaped.expression = { ...emptyExpressionBranch(), ...shaped.expression };

  const migration = {
    ...(shaped.migration || {}),
    professionalRag: {
      batchId: options.batchId || 'professional-rag-dual-branch-v1',
      migratedAt: now,
      strategy: options.strategy || 'knowledge-from-legacy-expression-stub',
      notes:
        options.notes ||
        '知识分支由既有 definition/claims/evidence 迁入；表达分支保留骨架（有 creative-note/abstractPatterns 时写入草稿）；同一概念不另建重复卡。',
    },
  };

  return {
    ...shaped,
    professionalRagVersion: PROFESSIONAL_RAG_VERSION,
    migration,
    overallStatus: deriveOverallStatus(shaped),
    retrievalPolicy: {
      ...normalizeProfessionalRetrievalPolicy(shaped),
      knowledgeRetrievable: false,
      expressionRetrievable: false,
      contentRetrievable: false,
    },
  };
}

function uniqueStrings(values) {
  return [...new Set(asArray(values).map((v) => String(v ?? '').trim()).filter(Boolean))];
}

export function isSkeletonOnly(card) {
  const shaped = ensureProfessionalShape(card);
  const titleOnly =
    nonEmptyString(shaped.title) &&
    !branchHasContent(shaped.knowledge, 'knowledge') &&
    !branchHasContent(shaped.expression, 'expression');
  return titleOnly || deriveOverallStatus(shaped) === 'stub';
}

/**
 * 写作联合检索上下文（不注入未确认知识定义）。
 */
export function buildWritingJointContext(card, styleAssets = [], goldExamples = []) {
  const shaped = ensureProfessionalShape(card);
  const policy = normalizeProfessionalRetrievalPolicy(shaped);
  const knowledge =
    policy.knowledgeRetrievable && shaped.knowledge
      ? {
          definition: shaped.knowledge.definition,
          boundaries: shaped.knowledge.boundaries,
          distinctions: shaped.knowledge.distinctions,
          projectInterpretation: shaped.knowledge.projectInterpretation,
          claims: asArray(shaped.knowledge.factualClaims).filter(
            (claim) => normalizeReviewStatus(claim.reviewStatus) === 'confirmed'
          ),
        }
      : null;

  const expression =
    policy.expressionRetrievable && shaped.expression
      ? {
          visualFocus: shaped.expression.visualFocus,
          actionLogic: shaped.expression.actionLogic,
          expressionPrinciples: shaped.expression.expressionPrinciples,
          commonFailures: shaped.expression.commonFailures,
          prohibitedMisreadings: shaped.expression.prohibitedMisreadings,
          goldExampleRefs: shaped.expression.goldExampleRefs,
          relatedStyleRagRefs: shaped.expression.relatedStyleRagRefs,
        }
      : null;

  const warnings = [];
  if (!knowledge) warnings.push('概念知识未确认：不得自行补定义');
  if (!expression) warnings.push('缺少概念专属表达参考：可回退通用 Style-RAG');

  const relatedStyle = asArray(styleAssets).filter((asset) => {
    const refs = asArray(shaped.expression?.relatedStyleRagRefs);
    if (!refs.length) return true;
    return refs.includes(asset.id || asset.assetId || asset.nodeId);
  });

  return {
    cardId: shaped.cardId,
    title: shaped.title,
    overallStatus: deriveOverallStatus(shaped),
    knowledge,
    expression,
    styleRag: relatedStyle,
    goldExamples: asArray(goldExamples),
    warnings,
    weights: {
      confirmedKnowledge: knowledge ? 100 : 0,
      confirmedExpression: expression ? 90 : 0,
      goldExamples: goldExamples.length ? 80 : 0,
      confirmedStyleRag: 60,
      aiStyleRag: 30,
      externalCandidate: 10,
      modelCommonsense: 0,
    },
  };
}

export function buildReviewPack(card, extras = {}) {
  const shaped = ensureProfessionalShape(card);
  return {
    cardId: shaped.cardId,
    title: shaped.title,
    aliases: asArray(shaped.aliases).length ? shaped.aliases : asArray(shaped.knowledge?.aliases),
    candidateParents: asArray(shaped.parentCardIds),
    candidateRelated: asArray(shaped.linkedConceptIds),
    knowledgeDraft: shaped.knowledge,
    expressionDraft: shaped.expression,
    knowledgeEvidence: asArray(shaped.knowledge?.evidenceRefs),
    expressionEvidence: asArray(shaped.expression?.evidenceRefs),
    goldExamples: asArray(shaped.expression?.goldExampleRefs),
    relatedStyleRag: asArray(shaped.expression?.relatedStyleRagRefs),
    linkedStories: asArray(extras.linkedStoryIds ?? shaped.linkedStoryIds),
    linkedPlots: asArray(extras.linkedPlotIds ?? shaped.linkedPlotIds),
    linkedGameplay: asArray(extras.linkedGameplayIds ?? shaped.linkedGameplayIds),
    conflicts: extras.conflicts || [],
    unresolvedQuestions: extras.unresolvedQuestions || [
      '正式名称是否需要调整？',
      '表达分支是否已有用户认可的黄金范例？',
      '知识证据是否足以支撑定义？',
    ],
    overallStatus: deriveOverallStatus(shaped),
    retrievalPolicy: normalizeProfessionalRetrievalPolicy(shaped),
  };
}

export function summarizeProfessionalStats(cards) {
  const list = asArray(cards).map((card) => ensureProfessionalShape(card));
  const stats = {
    total: list.length,
    knowledgeConfirmed: 0,
    expressionConfirmed: 0,
    bothConfirmed: 0,
    knowledgeOnly: 0,
    expressionOnly: 0,
    stub: 0,
    missingEvidence: 0,
    conflicted: 0,
    withGold: 0,
    withCalibration: 0,
  };
  for (const card of list) {
    const overall = deriveOverallStatus(card);
    if (overall === 'stub') stats.stub += 1;
    if (overall === 'knowledge-only') stats.knowledgeOnly += 1;
    if (overall === 'expression-only') stats.expressionOnly += 1;
    if (overall === 'conflicted') stats.conflicted += 1;
    const kOk = normalizeReviewStatus(card.knowledge?.reviewStatus) === 'confirmed';
    const eOk = normalizeReviewStatus(card.expression?.reviewStatus) === 'confirmed';
    if (kOk) stats.knowledgeConfirmed += 1;
    if (eOk) stats.expressionConfirmed += 1;
    if (kOk && eOk) stats.bothConfirmed += 1;
    if (normalizeEvidenceStatus(card.knowledge?.evidenceStatus) === 'missing' &&
        normalizeEvidenceStatus(card.expression?.evidenceStatus) === 'missing') {
      stats.missingEvidence += 1;
    }
    if (asArray(card.expression?.goldExampleRefs).length) stats.withGold += 1;
    if (asArray(card.expression?.calibrationPairRefs).length) stats.withCalibration += 1;
  }
  return stats;
}
