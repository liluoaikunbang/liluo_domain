/**
 * Browser-safe professional RAG shape helpers for graph / maintain UI.
 * Keep in sync with scripts/external-knowledge/lib/professional-rag.mjs
 */

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeReviewStatus(value) {
  const key = String(value ?? '').trim();
  if (key === 'candidate' || key === 'reviewed' || key === 'approved') {
    return key === 'candidate' ? 'pending' : 'confirmed';
  }
  return ['pending', 'confirmed', 'rejected'].includes(key) ? key : 'pending';
}

function normalizeContentStatus(value) {
  const key = String(value ?? '').trim();
  if (key === 'partial') return 'draft';
  return ['stub', 'draft', 'usable', 'complete', 'confirmed'].includes(key) ? (key === 'complete' ? 'usable' : key) : 'stub';
}

function normalizeEvidenceStatus(value) {
  const key = String(value ?? '').trim();
  if (key === 'supported') return 'sufficient';
  return ['missing', 'partial', 'sufficient', 'conflicted'].includes(key) ? key : 'missing';
}

function branchHasContent(branch, kind) {
  if (!branch) return false;
  if (kind === 'knowledge') {
    return (
      nonEmptyString(branch.definition) ||
      asArray(branch.factualClaims).length > 0 ||
      asArray(branch.evidenceRefs).length > 0 ||
      nonEmptyString(branch.projectInterpretation)
    );
  }
  return (
    asArray(branch.visualFocus).length > 0 ||
    asArray(branch.actionLogic).length > 0 ||
    asArray(branch.expressionPrinciples).length > 0 ||
    asArray(branch.goldExampleRefs).length > 0 ||
    asArray(branch.relatedStyleRagRefs).length > 0 ||
    asArray(branch.evidenceRefs).length > 0
  );
}

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
    status: 'stub',
    evidenceStatus: 'missing',
    reviewStatus: 'pending',
    ...overrides
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
    status: 'stub',
    evidenceStatus: 'missing',
    reviewStatus: 'pending',
    ...overrides
  };
}

export function deriveOverallStatus(card) {
  const knowledge = card?.knowledge;
  const expression = card?.expression;
  if (!knowledge && !expression && card?.overallStatus) return card.overallStatus;
  const kConflict = normalizeEvidenceStatus(knowledge?.evidenceStatus) === 'conflicted';
  const eConflict = normalizeEvidenceStatus(expression?.evidenceStatus) === 'conflicted';
  if (kConflict || eConflict) return 'conflicted';
  const kConfirmed = normalizeReviewStatus(knowledge?.reviewStatus) === 'confirmed';
  const eConfirmed = normalizeReviewStatus(expression?.reviewStatus) === 'confirmed';
  const kUsable = branchHasContent(knowledge, 'knowledge') && normalizeContentStatus(knowledge?.status) !== 'stub';
  const eUsable = branchHasContent(expression, 'expression') && normalizeContentStatus(expression?.status) !== 'stub';
  if (kConfirmed && eConfirmed && normalizeContentStatus(knowledge?.status) !== 'stub' && normalizeContentStatus(expression?.status) !== 'stub') {
    return 'confirmed';
  }
  if (kUsable && eUsable) return 'usable';
  if (kUsable && !eUsable) return 'knowledge-only';
  if (!kUsable && eUsable) return 'expression-only';
  return 'stub';
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
          normalizeReviewStatus(branch.reviewStatus) === 'confirmed'
        ]
      : [
          asArray(branch.visualFocus).length > 0 || asArray(branch.actionLogic).length > 0,
          asArray(branch.expressionPrinciples).length > 0 || asArray(branch.commonFailures).length > 0,
          asArray(branch.goldExampleRefs).length > 0 || asArray(branch.calibrationPairRefs).length > 0,
          asArray(branch.relatedStyleRagRefs).length > 0 || asArray(branch.evidenceRefs).length > 0,
          normalizeReviewStatus(branch.reviewStatus) === 'confirmed'
        ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function ensureProfessionalShape(card) {
  if (!card || typeof card !== 'object') return card;
  if (card.knowledge && card.expression) {
    return {
      ...card,
      overallStatus: deriveOverallStatus(card)
    };
  }
  const stub = normalizeContentStatus(card.contentStatus) === 'stub';
  const knowledge = emptyKnowledgeBranch({
    definition: card.definition || card.summary || '',
    aliases: asArray(card.aliases),
    parentConceptRefs: asArray(card.parentCardIds),
    relatedConceptRefs: asArray(card.linkedConceptIds),
    factualClaims: asArray(card.claims),
    evidenceRefs: asArray(card.evidenceRefs),
    distinctions: asArray(card.distinctions).map((item) =>
      typeof item === 'string' ? { targetConceptId: '', description: item } : item
    ),
    status: stub ? 'stub' : normalizeContentStatus(card.contentStatus) === 'complete' ? 'usable' : normalizeContentStatus(card.contentStatus),
    evidenceStatus: normalizeEvidenceStatus(card.evidenceStatus),
    reviewStatus: normalizeReviewStatus(card.reviewStatus)
  });
  const expression = emptyExpressionBranch();
  return {
    ...card,
    knowledge,
    expression,
    overallStatus: deriveOverallStatus({ ...card, knowledge, expression })
  };
}

export const OVERALL_STATUS_LABELS = Object.freeze({
  stub: '骨架',
  'knowledge-only': '仅知识',
  'expression-only': '仅表达',
  usable: '可用',
  confirmed: '已确认',
  conflicted: '冲突'
});
