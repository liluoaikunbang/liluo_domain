export const ALLOWED_SOURCE_CATEGORIES = new Set([
  'project-original', 'user-owned', 'project-generated', 'licensed-third-party',
  'public-domain', 'compatible-open-source'
]);

export const BLOCKED_SOURCE_CATEGORIES = new Set([
  'unknown-origin', 'reference-only', 'license-unclear', 'restricted',
  'external-rag-raw', 'close-paraphrase-risk', 'unverified-third-party'
]);

const DISCLAIMER = '本门槛是项目内部的保守写入检查，不构成法律保证或法律意见；公开发布前仍需按具体来源与用途人工复核。';

export function assessProvenance(input = {}) {
  const category = String(input.category ?? '').trim();
  const reasons = [];
  let allowed = ALLOWED_SOURCE_CATEGORIES.has(category);

  if (!category || (!allowed && !BLOCKED_SOURCE_CATEGORIES.has(category))) {
    allowed = false;
    reasons.push('来源分类缺失或不受支持，按 fail-closed 处理。');
  } else if (BLOCKED_SOURCE_CATEGORIES.has(category)) {
    allowed = false;
    reasons.push(`来源分类 ${category} 禁止写入正式项目内容。`);
  }

  if (['licensed-third-party', 'public-domain', 'compatible-open-source'].includes(category)) {
    if (!String(input.sourceId ?? '').trim()) reasons.push('第三方或公版来源缺少可审计 sourceId。');
  }
  if (['licensed-third-party', 'compatible-open-source'].includes(category) && !String(input.license ?? '').trim()) {
    reasons.push('缺少已核验许可证标识。');
  }
  if (category === 'compatible-open-source' && input.compatibilityVerified !== true) {
    reasons.push('尚未逐项确认许可证、用途、署名与再分发义务的兼容性。');
  }
  if (input.closeParaphraseRisk === true) reasons.push('存在近似改写风险。');
  if (reasons.length > 0) allowed = false;

  return {
    allowed,
    category: category || 'unknown-origin',
    reasons,
    attributionRequired: allowed && ['licensed-third-party', 'public-domain', 'compatible-open-source'].includes(category),
    attribution: input.attribution ?? null,
    disclaimer: DISCLAIMER
  };
}
