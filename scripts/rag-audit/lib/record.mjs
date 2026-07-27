import {
  loadCategories,
  loadPolicy,
  makeAuditId,
  refreshRegistryFromDisk,
  saveAuditRecord,
  validateCategories,
  loadJson,
  ARTICLE_REGISTRY_PATH,
  computeCounts,
} from './registry.mjs'
import { assertAuditChannel, CHANNEL_RELATED_SKILLS } from './channels.mjs'
import { CONCEPT_REGISTRY_MODULE, PLOT_CATALOG_PATH, ROOT } from './paths.mjs'
import { mergeRelatedAdjustments, suggestRelatedAssets } from './related.mjs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const OPEN_STATUSES = new Set(['open', 'recorded', 'awaiting-skill-decision', 'rebuild-pending'])

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  const text = String(value).trim().toLowerCase()
  if (['是', 'yes', 'y', 'true', '1'].includes(text)) return true
  if (['否', 'no', 'n', 'false', '0'].includes(text)) return false
  return fallback
}

export function evaluateSkillUpgradeSuggestion(record, policy, siblingRecords = []) {
  const critical = policy.skillUpgrade?.criticalCategories ?? []
  const minN = policy.skillUpgrade?.minIndependentRecordsForPattern ?? 3
  const userExplicit = Boolean(record.skillUpgradeDecision?.userExplicitRuleRequest)
  if (userExplicit) {
    return {
      suggested: true,
      reason: '用户明确要求写入规范/以后都这样',
    }
  }
  if ((record.issueCategories ?? []).some((c) => critical.includes(c))) {
    return {
      suggested: true,
      reason: '触及正史/来源/连续性/版权/索引结构等严重类别（仍需抽象规则+用户批准后改 Skill）',
    }
  }
  if (!record.mayBecomeGeneralRule) {
    return { suggested: false, reason: '标记为个例或未声明可成通用规则；单次错误不升级 Skill' }
  }
  const sameCategory = siblingRecords.filter((other) => {
    if (other.auditId === record.auditId) return false
    if (other.channel !== record.channel) return false
    if (!other.mayBecomeGeneralRule) return false
    return (other.issueCategories ?? []).some((c) => (record.issueCategories ?? []).includes(c))
  })
  const independent = new Set([record.sourceAssetId, ...sameCategory.map((s) => s.sourceAssetId)])
  if (independent.size >= minN) {
    return {
      suggested: true,
      reason: `同类可成规则问题已在 ${independent.size} 个独立来源出现（阈值 ≥ ${minN}）`,
    }
  }
  return {
    suggested: false,
    reason: `独立重复仅 ${independent.size}/${minN}；禁止单次事件膨胀 Skill`,
  }
}

export async function recordAudit(input = {}) {
  const channel = assertAuditChannel(input.channel)
  if (!input.sourceAssetId) throw new Error('需要 sourceAssetId')
  if (!input.reportedIssue) throw new Error('需要 reportedIssue')
  if (!input.correctResult) throw new Error('需要 correctResult')
  const categories = [].concat(input.issueCategories ?? input.category ?? []).flat().filter(Boolean)
  if (!categories.length) throw new Error('需要至少一条 issueCategories')

  const catalog = await loadCategories()
  const catCheck = validateCategories(channel, categories, catalog)
  if (!catCheck.ok) {
    throw new Error(`非法问题类别：${catCheck.bad.join(', ')}；允许：${catCheck.allowed.join(', ')}`)
  }

  const policy = await loadPolicy()
  let sourcePath = input.sourcePath ?? ''
  let sourceTitle = input.sourceTitle ?? ''
  let sourceAuthor = input.sourceAuthor ?? ''
  let themeDomain = input.themeDomain ?? null
  let currentResult = input.currentResult ?? {}

  if (channel === 'style-rag') {
    const articles = await loadJson(ARTICLE_REGISTRY_PATH, { articles: [] })
    const article = (articles.articles ?? []).find((a) => a.articleId === input.sourceAssetId)
    if (article) {
      sourcePath = sourcePath || article.path
      sourceTitle = sourceTitle || article.title?.value || ''
      sourceAuthor = sourceAuthor || article.author?.displayName || ''
      themeDomain = themeDomain || article.themeDomainOverride || article.themeDomain
      currentResult =
        Object.keys(currentResult).length > 0
          ? currentResult
          : {
              themeDomain,
              review: article.review,
              productionUse: article.productionUse,
              title: article.title,
              author: article.author,
            }
    }
  } else if (channel === 'concept') {
    const moduleUrl = pathToFileURL(path.join(ROOT, CONCEPT_REGISTRY_MODULE)).href
    const { SEEDED_CONCEPTS } = await import(moduleUrl)
    const concept = (SEEDED_CONCEPTS ?? []).find((c) => c.conceptId === input.sourceAssetId)
    if (concept) {
      sourcePath = sourcePath || CONCEPT_REGISTRY_MODULE
      sourceTitle = sourceTitle || concept.canonicalName || ''
      sourceAuthor = sourceAuthor || 'seed'
      themeDomain = themeDomain || 'restraint-themed'
      currentResult =
        Object.keys(currentResult).length > 0
          ? currentResult
          : {
              conceptId: concept.conceptId,
              canonicalName: concept.canonicalName,
              aliases: concept.aliases ?? [],
              parentConcepts: concept.parentConcepts ?? [],
              visibility: concept.visibility,
              summary: concept.summary ?? '',
            }
    }
  } else if (channel === 'plot') {
    const plotCatalog = await loadJson(PLOT_CATALOG_PATH, { entries: [] })
    const entry = (plotCatalog.entries ?? []).find((e) => e.id === input.sourceAssetId)
    if (entry) {
      sourcePath = sourcePath || PLOT_CATALOG_PATH
      sourceTitle = sourceTitle || entry.title || ''
      sourceAuthor = sourceAuthor || 'plot-catalog'
      themeDomain =
        themeDomain || ((entry.bondageTags ?? []).length ? 'restraint-themed' : 'general-prose')
      currentResult =
        Object.keys(currentResult).length > 0
          ? currentResult
          : {
              id: entry.id,
              title: entry.title,
              summary: entry.summary ?? '',
              tags: entry.tags ?? [],
              bondageTags: entry.bondageTags ?? [],
              characters: entry.characters ?? [],
              usedBy: entry.usedBy ?? [],
            }
    }
  }

  const record = {
    schemaVersion: 1,
    auditId: input.auditId ?? makeAuditId(input.sourceAssetId),
    channel,
    batchId: input.batchId ?? null,
    sourceAssetId: input.sourceAssetId,
    sourcePath,
    sourceTitle,
    sourceAuthor,
    themeDomain,
    currentResult,
    reportedIssue: String(input.reportedIssue),
    correctResult: String(input.correctResult),
    issueCategories: categories,
    isSingleCase: parseBool(input.isSingleCase, true),
    mayBecomeGeneralRule: parseBool(input.mayBecomeGeneralRule, false),
    relatedSkills:
      input.relatedSkills?.length
        ? [].concat(input.relatedSkills).flat()
        : [...(CHANNEL_RELATED_SKILLS[channel] ?? [])],
    fixStatus: input.fixStatus ?? 'recorded',
    needsIndexRebuild: parseBool(input.needsIndexRebuild, false),
    rebuildScope: input.rebuildScope ?? {
      sourcePaths: sourcePath ? [sourcePath] : [],
      assetIds: [input.sourceAssetId],
      fields: [].concat(input.fields ?? []).flat(),
    },
    skillUpgradeDecision: {
      suggested: false,
      reason: '',
      patternGroupId: null,
      userExplicitRuleRequest: parseBool(input.userExplicitRuleRequest, false),
      approvedByUser: false,
    },
    hitCountHint: input.hitCountHint ?? null,
    confidenceNotes: input.confidenceNotes ?? '',
    notes: input.notes ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
  }

  if (record.isSingleCase && record.mayBecomeGeneralRule) {
    // allow both true when user marks "this case also suggests a general rule"
  }

  const suggestedRelated = await suggestRelatedAssets({
    channel,
    assetId: record.sourceAssetId,
    limit: 12,
  })
  const providedRelated = [].concat(input.relatedAdjustments ?? []).flat().filter(Boolean)
  record.relatedAdjustments = mergeRelatedAdjustments(suggestedRelated, providedRelated)
  const pendingRelated = record.relatedAdjustments.filter(
    (item) => !item.action || item.action === 'needed' || item.action === 'deferred',
  )
  record.relatedReviewComplete = parseBool(
    input.relatedReviewComplete,
    pendingRelated.length === 0 && record.relatedAdjustments.length > 0
      ? true
      : providedRelated.length > 0 && pendingRelated.length === 0,
  )

  const { loadAllAuditRecords } = await import('./registry.mjs')
  const siblings = await loadAllAuditRecords()
  const decision = evaluateSkillUpgradeSuggestion(record, policy, siblings)
  record.skillUpgradeDecision.suggested = decision.suggested
  record.skillUpgradeDecision.reason = decision.reason
  if (decision.suggested) record.fixStatus = 'awaiting-skill-decision'

  const saved = await saveAuditRecord(record)
  const registry = await refreshRegistryFromDisk()
  const relatedReminder =
    pendingRelated.length > 0
      ? `仍有 ${pendingRelated.length} 条关联项待检查/调整（见 relatedAdjustments）；改主条目时须一并处理，禁止只改单点。`
      : record.relatedAdjustments.length
        ? '关联项已标记完成或无需改动。'
        : '未发现自动关联项；若你知道手工关联，请补 relatedAdjustments。'
  return {
    ok: true,
    path: saved.path,
    record: saved.record,
    skillUpgrade: record.skillUpgradeDecision,
    relatedAdjustments: record.relatedAdjustments,
    relatedReviewComplete: record.relatedReviewComplete,
    registryCounts: registry.counts,
    reminder: [
      decision.suggested
        ? '已建议 Skill 升级，但仍需抽象规则 + 用户批准；禁止针对单篇文章写补丁。'
        : '已记录；单次错误不会自动更新 Skill。',
      relatedReminder,
      suggestedRelated.rule,
    ].join(' '),
  }
}

export async function auditStatus(options = {}) {
  const registry = await refreshRegistryFromDisk()
  const { loadAllAuditRecords } = await import('./registry.mjs')
  let records = await loadAllAuditRecords()
  if (options.channel) records = records.filter((r) => r.channel === options.channel)
  if (options.openOnly) records = records.filter((r) => OPEN_STATUSES.has(r.fixStatus))
  return {
    ok: true,
    counts: options.channel ? computeCounts(await loadAllAuditRecords().then((all) => all.filter((r) => r.channel === options.channel))) : registry.counts,
    patternGroups: registry.patternGroups.filter((g) =>
      options.channel ? g.channel === options.channel : true,
    ),
    openRecords: records
      .filter((r) => OPEN_STATUSES.has(r.fixStatus))
      .slice(0, Number(options.limit ?? 20))
      .map((r) => ({
        auditId: r.auditId,
        channel: r.channel,
        sourceAssetId: r.sourceAssetId,
        categories: r.issueCategories,
        fixStatus: r.fixStatus,
        needsIndexRebuild: r.needsIndexRebuild,
        skillUpgradeSuggested: r.skillUpgradeDecision?.suggested ?? false,
        reason: r.skillUpgradeDecision?.reason ?? '',
      })),
    skillUpgradeGate: {
      minIndependentRecords: (await loadPolicy()).skillUpgrade.minIndependentRecordsForPattern,
      forbidSingleIncidentSkillPatch: true,
    },
  }
}
