import fs from 'node:fs'
import path from 'node:path'
import {
  CONFIRMATIONS_DIR,
  MIGRATIONS_DIR,
  PLOT_CATALOG_PATH,
  PROPOSALS_DIR,
  QUEUE_PATH,
  REGISTRY_PATH,
  REVIEW_ROOT,
  SNAPSHOTS_DIR,
  STORY_SOURCES_DIR,
  UI_QUEUE_EXPORT_PATH
} from './paths.mjs'
import { ensureDir, nowIso, readJson, slugify, writeJson } from './io.mjs'
import { buildBaselineStats, loadPlotCatalog, loadRestraintCards, loadStoryNodes } from './load.mjs'
import { proposeAllPlotLayers } from './propose.mjs'
import { applyReviewStatus, nextPendingProposal, sortProposals, summarizeQueue } from './queue.mjs'

function emptyRegistry() {
  return {
    schemaVersion: 1,
    updatedAt: null,
    snapshotId: null,
    queueGeneratedAt: null,
    migrations: [],
    deferred: [],
    confirmed: []
  }
}

export function ensureReviewWorkspace() {
  ensureDir(REVIEW_ROOT)
  ensureDir(SNAPSHOTS_DIR)
  ensureDir(PROPOSALS_DIR)
  ensureDir(CONFIRMATIONS_DIR)
  ensureDir(MIGRATIONS_DIR)
  if (!readJson(REGISTRY_PATH, null)) writeJson(REGISTRY_PATH, emptyRegistry())
}

export function createReadonlySnapshot() {
  ensureReviewWorkspace()
  const catalog = loadPlotCatalog()
  const storyNodes = loadStoryNodes()
  const ragCards = loadRestraintCards()
  const stats = buildBaselineStats({ catalog, storyNodes, ragCards })
  const snapshotId = `pls-${Date.now().toString(36)}`
  const snapshot = {
    schemaVersion: 1,
    snapshotId,
    createdAt: nowIso(),
    gitHint: 'feature/plot-layer-governance',
    stats,
    catalogVersion: catalog.version ?? null,
    groups: catalog.groups ?? [],
    entries: (catalog.entries ?? []).map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      notes: entry.notes ?? '',
      groupId: entry.groupId,
      plotKind: entry.plotKind,
      usageStatus: entry.usageStatus,
      isUsed: entry.isUsed,
      usedBy: entry.usedBy ?? [],
      usedByLabels: entry.usedByLabels ?? [],
      characters: entry.characters ?? [],
      worldBiases: entry.worldBiases ?? [],
      ragRefs: entry.ragRefs ?? [],
      development: entry.development ?? {},
      maturity: entry.maturity ?? null,
      placementStatus: entry.placementStatus ?? null,
      origin: entry.origin ?? null,
      layerReviewStatus: entry.layerReviewStatus ?? null
    })),
    storyNodeCount: storyNodes.length,
    ragCardIds: ragCards.map((card) => card.cardId)
  }
  writeJson(path.join(SNAPSHOTS_DIR, `${snapshotId}.json`), snapshot)
  const registry = readJson(REGISTRY_PATH, emptyRegistry())
  registry.snapshotId = snapshotId
  registry.updatedAt = nowIso()
  writeJson(REGISTRY_PATH, registry)
  return snapshot
}

export function runAudit({ writeArtifacts = true } = {}) {
  ensureReviewWorkspace()
  const snapshot = createReadonlySnapshot()
  const catalog = loadPlotCatalog()
  const storyNodes = loadStoryNodes()
  const ragCards = loadRestraintCards()
  const proposals = sortProposals(proposeAllPlotLayers(catalog, { storyNodes, ragCards }))
  const summary = summarizeQueue(proposals)
  const queueDoc = {
    schemaVersion: 1,
    generatedAt: nowIso(),
    snapshotId: snapshot.snapshotId,
    summary: {
      ...snapshot.stats,
      ...summary
    },
    items: proposals.map((item) => ({
      ...item,
      reviewStatus: 'proposed'
    }))
  }

  if (writeArtifacts) {
    writeJson(QUEUE_PATH, queueDoc)
    for (const item of queueDoc.items) {
      writeJson(path.join(PROPOSALS_DIR, `${item.sourcePlotId}.json`), item)
    }
    writeJson(UI_QUEUE_EXPORT_PATH, {
      schemaVersion: 1,
      generatedAt: queueDoc.generatedAt,
      snapshotId: snapshot.snapshotId,
      summary: queueDoc.summary,
      items: queueDoc.items.map((item) => ({
        sourcePlotId: item.sourcePlotId,
        title: item.title,
        recommendation: item.recommendation,
        recommendedLayer: item.recommendedLayer,
        confidence: item.confidence,
        reviewStatus: item.reviewStatus,
        rationale: item.rationale,
        questionsForUser: item.questionsForUser,
        affectedStoryEntries: item.affectedStoryEntries,
        proposedRagTarget: item.proposedRagTarget
          ? {
              title: item.proposedRagTarget.title,
              existingRagId: item.proposedRagTarget.existingRagId ?? null,
              newRagId: item.proposedRagTarget.newRagId ?? null
            }
          : null
      }))
    })
    const registry = readJson(REGISTRY_PATH, emptyRegistry())
    registry.queueGeneratedAt = queueDoc.generatedAt
    registry.snapshotId = snapshot.snapshotId
    registry.updatedAt = nowIso()
    writeJson(REGISTRY_PATH, registry)
  }

  return { snapshot, queueDoc, summary, first: nextPendingProposal(queueDoc) }
}

export function loadQueue() {
  const queue = readJson(QUEUE_PATH, null)
  if (!queue) throw new Error('review queue missing; run plot-layer:audit first')
  return queue
}

export function showProposal(plotId) {
  const fromFile = readJson(path.join(PROPOSALS_DIR, `${plotId}.json`), null)
  if (fromFile) return fromFile
  const queue = loadQueue()
  const hit = (queue.items ?? []).find((item) => item.sourcePlotId === plotId)
  if (!hit) throw new Error(`proposal not found: ${plotId}`)
  return hit
}

export function deferProposal(plotId, reason = '') {
  ensureReviewWorkspace()
  const queue = loadQueue()
  const updated = applyReviewStatus(queue, plotId, 'deferred', { deferReason: reason })
  writeJson(QUEUE_PATH, updated)
  writeJson(
    path.join(PROPOSALS_DIR, `${plotId}.json`),
    updated.items.find((item) => item.sourcePlotId === plotId)
  )
  const registry = readJson(REGISTRY_PATH, emptyRegistry())
  registry.deferred = [...new Set([...(registry.deferred ?? []), plotId])]
  registry.updatedAt = nowIso()
  writeJson(REGISTRY_PATH, registry)
  return { plotId, status: 'deferred', next: nextPendingProposal(updated) }
}

export function planMigration(proposal, decision, overrides = {}) {
  return {
    decision,
    sourcePlotId: proposal.sourcePlotId,
    targetRag: overrides.ragTarget ?? proposal.proposedRagTarget ?? null,
    plotRemainder: overrides.plotRemainder ?? proposal.proposedPlotRemainder ?? null,
    edgeMigrationPlan: overrides.edgeMigrationPlan ?? proposal.edgeMigrationPlan ?? [],
    affectedStoryEntries: proposal.affectedStoryEntries ?? [],
    affectedSourceFiles: proposal.affectedSourceFiles ?? [],
    note: 'plan only; main data untouched until apply with confirm token'
  }
}

/**
 * Record user decision. Formal writes require --apply and --confirm-token=<plotId>.
 */
export function confirmProposal(plotId, {
  decision,
  userNote = '',
  overrides = {},
  apply = false,
  confirmToken = null
} = {}) {
  ensureReviewWorkspace()
  if (!decision) throw new Error('decision is required')
  const allowed = new Set([
    'keep-as-plot',
    'move-to-rag',
    'split-plot-and-rag',
    'promote-to-story',
    'merge-into-existing-rag',
    'merge-into-existing-plot',
    'archive',
    'defer',
    'manual'
  ])
  if (!allowed.has(decision)) throw new Error(`unsupported decision: ${decision}`)

  const proposal = showProposal(plotId)
  const confirmationId = `plc-${Date.now().toString(36)}`
  const confirmation = {
    schemaVersion: 1,
    confirmationId,
    plotId,
    decision,
    userNote,
    overrides,
    proposalSnapshot: proposal,
    recordedAt: nowIso(),
    applied: false,
    dryRun: true,
    migrationId: null
  }
  writeJson(path.join(CONFIRMATIONS_DIR, `${confirmationId}.json`), confirmation)

  if (decision === 'defer') {
    return { confirmation, defer: deferProposal(plotId, userNote) }
  }

  const decisionStatus = apply ? 'confirmed' : 'decision-recorded'
  const queue = applyReviewStatus(loadQueue(), plotId, decisionStatus, {
    userDecision: decision,
    confirmationId
  })
  writeJson(QUEUE_PATH, queue)
  writeJson(
    path.join(PROPOSALS_DIR, `${plotId}.json`),
    queue.items.find((item) => item.sourcePlotId === plotId)
  )

  const registry = readJson(REGISTRY_PATH, emptyRegistry())
  registry.confirmed = [...new Set([...(registry.confirmed ?? []), plotId])]
  registry.updatedAt = nowIso()
  writeJson(REGISTRY_PATH, registry)

  if (!apply) {
    return {
      confirmation,
      applied: false,
      message:
        '已记录用户确认，但未写入正式主数据（默认 dry-run）。若要执行迁移，请显式 --apply --confirm-token <plotId>。',
      planned: planMigration(proposal, decision, overrides),
      next: nextPendingProposal(queue)
    }
  }

  if (confirmToken !== plotId) {
    throw new Error('refuse apply: --confirm-token must equal plotId')
  }

  if (
    decision === 'move-to-rag' ||
    decision === 'split-plot-and-rag' ||
    decision === 'keep-as-plot' ||
    decision === 'archive'
  ) {
    const migration = applyMigration(proposal, decision, overrides, confirmationId)
    confirmation.applied = true
    confirmation.dryRun = false
    confirmation.migrationId = migration.migrationId
    writeJson(path.join(CONFIRMATIONS_DIR, `${confirmationId}.json`), confirmation)
    return {
      confirmation,
      applied: true,
      migration,
      next: nextPendingProposal(loadQueue())
    }
  }

  throw new Error(
    `decision ${decision} 已记录确认，但自动写入尚未覆盖该分支；请补充 overrides 后人工执行，或改用已支持的决策。`
  )
}

function patchCatalogEntry(catalog, plotId, patch) {
  const index = catalog.entries.findIndex((entry) => entry.id === plotId)
  if (index < 0) throw new Error(`plot missing in catalog: ${plotId}`)
  catalog.entries[index] = { ...catalog.entries[index], ...patch }
  return catalog.entries[index]
}

function listStorySourceFiles() {
  return fs
    .readdirSync(STORY_SOURCES_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(STORY_SOURCES_DIR, name))
}

function redirectStoryPlotToRag(storyKey, plotId, ragId) {
  const changed = []
  for (const filePath of listStorySourceFiles()) {
    const doc = readJson(filePath)
    let dirty = false
    for (const node of doc.nodes ?? []) {
      if (node.key !== storyKey) continue
      const plotRefs = [...(node.plotRefs ?? [])]
      const ragRefs = [...(node.ragRefs ?? [])]
      const nextPlots = plotRefs.filter((id) => id !== plotId)
      if (nextPlots.length !== plotRefs.length) {
        node.plotRefs = nextPlots
        dirty = true
      }
      if (ragId && !ragRefs.includes(ragId)) {
        node.ragRefs = [...ragRefs, ragId]
        dirty = true
      }
    }
    if (dirty) {
      writeJson(filePath, doc)
      changed.push(path.relative(process.cwd(), filePath).replaceAll('\\', '/'))
    }
  }
  return changed
}

function createRestraintStubCard(target) {
  const cardId = target.existingRagId || target.newRagId
  if (!cardId) throw new Error('rag target id missing')
  const filePath = path.join(process.cwd(), 'external-knowledge/cards/restraint', `${cardId}.json`)
  if (fs.existsSync(filePath)) {
    return {
      cardId,
      filePath: path.relative(process.cwd(), filePath).replaceAll('\\', '/'),
      created: false
    }
  }
  const ragLayer = target.ragLayer || (target.parentCardIds?.length ? 'concept' : 'category')
  const parentCardIds = target.parentCardIds ?? []
  const knowledgeDefinition =
    (target.knowledgeSeed && target.knowledgeSeed[0]) ||
    `${target.title}（由情节层级迁移生成的骨架卡）`
  const card = {
    cardId,
    title: target.title,
    domain: 'restraint',
    cardType: target.cardType || 'context',
    aliases: target.aliases ?? [],
    summary: knowledgeDefinition,
    definition: knowledgeDefinition,
    sourceRefs: [],
    evidenceStatus: 'missing',
    contentStatus: 'stub',
    reviewStatus: 'candidate',
    directQuoteIncluded: false,
    canonical: false,
    knowledgeScope: 'external-fiction-reference',
    ragLayer,
    parentCardIds,
    migration: {
      batchId: 'plot-layer-governance-v1',
      oldIds: target.oldIds ?? [],
      generatedFrom: 'plot-layer-migration',
      createdAt: nowIso()
    },
    evidenceRefs: [],
    sourceRecordIds: [],
    claims: [],
    retrievalPolicy: {
      graphVisible: true,
      searchable: true,
      relationAnchor: true,
      contentRetrievable: false,
      evidenceRetrievable: false,
      knowledgeRetrievable: false,
      expressionRetrievable: false
    },
    professionalRagVersion: 1,
    knowledge: {
      definition: knowledgeDefinition,
      boundaries: {
        includes: target.knowledgeSeed?.slice(1) ?? [],
        excludes: ['不保存某次故事里的唯一人物、地点与结局过程']
      },
      distinctions: [],
      aliases: target.aliases ?? [],
      parentConceptRefs: parentCardIds,
      childConceptRefs: [],
      relatedConceptRefs: [],
      factualClaims: [],
      evidenceRefs: [],
      projectInterpretation: target.knowledgeSeed?.[1] || '',
      commonMisreadings: [],
      status: 'stub',
      evidenceStatus: 'missing',
      reviewStatus: 'pending'
    },
    expression: {
      visualFocus: [],
      actionLogic: [],
      movementEffects: [],
      postureEffects: [],
      sensoryFocus: [],
      emotionalPossibilities: [],
      narrativeUses: target.expressionSeed ?? [],
      applicableScenes: [],
      unsuitableScenes: [],
      expressionPrinciples: target.expressionSeed ?? [],
      commonFailures: [],
      prohibitedMisreadings: [],
      styleEvidenceRefs: [],
      goldExampleRefs: [],
      calibrationPairRefs: [],
      relatedStyleRagRefs: [],
      evidenceRefs: [],
      status: 'stub',
      evidenceStatus: 'missing',
      reviewStatus: 'pending'
    },
    overallStatus: 'stub',
    evidenceBindings: []
  }
  writeJson(filePath, card)
  return {
    cardId,
    filePath: path.relative(process.cwd(), filePath).replaceAll('\\', '/'),
    created: true
  }
}

function addStoryRagRef(storyKey, ragId, { clearOccupationPending = false, clearLegacyOccupationTag = null } = {}) {
  const changed = []
  for (const filePath of listStorySourceFiles()) {
    const doc = readJson(filePath)
    let dirty = false
    for (const node of doc.nodes ?? []) {
      if (node.key !== storyKey) continue
      const ragRefs = [...(node.ragRefs ?? [])]
      if (ragId && !ragRefs.includes(ragId)) {
        node.ragRefs = [...ragRefs, ragId]
        dirty = true
      }
      if (clearOccupationPending && Array.isArray(node.migrationPending)) {
        const before = node.migrationPending.length
        node.migrationPending = node.migrationPending.filter(
          (item) => !/职业-火车乘务员/.test(String(item))
        )
        if (node.migrationPending.length !== before) dirty = true
      }
      if (clearLegacyOccupationTag && Array.isArray(node.legacyTagRefs)) {
        const before = node.legacyTagRefs.length
        node.legacyTagRefs = node.legacyTagRefs.filter(
          (item) => !String(item).includes(clearLegacyOccupationTag)
        )
        if (node.legacyTagRefs.length !== before) dirty = true
      }
    }
    if (dirty) {
      writeJson(filePath, doc)
      changed.push(path.relative(process.cwd(), filePath).replaceAll('\\', '/'))
    }
  }
  return changed
}

export function applyMigration(proposal, decision, overrides = {}, confirmationId) {
  const migrationId = `plm-${Date.now().toString(36)}`
  const beforeCatalog = loadPlotCatalog()
  const plan = planMigration(proposal, decision, overrides)
  const changedFiles = []
  let ragResult = null
  let parentRagResult = null
  const catalog = structuredClone(beforeCatalog)

  if (decision === 'keep-as-plot') {
    const current = beforeCatalog.entries.find((entry) => entry.id === proposal.sourcePlotId)
    const linkedCount =
      (proposal.affectedStoryEntries ?? []).length ||
      (current?.usedBy ?? []).length
    patchCatalogEntry(catalog, proposal.sourcePlotId, {
      origin: overrides.origin ?? 'legacy-migration',
      placementStatus:
        overrides.placementStatus ?? (linkedCount ? 'placed' : 'unplaced'),
      maturity: overrides.maturity ?? (linkedCount ? 'scene-ready' : 'seed'),
      layerReviewStatus: 'confirmed-keep-as-plot',
      layerReviewConfirmationId: confirmationId
    })
  } else if (decision === 'archive') {
    const current = beforeCatalog.entries.find((entry) => entry.id === proposal.sourcePlotId)
    patchCatalogEntry(catalog, proposal.sourcePlotId, {
      placementStatus: 'archived',
      layerReviewStatus: 'archived',
      layerReviewConfirmationId: confirmationId,
      notes: [current?.notes || '', '[层级核对] 已归档。'].filter(Boolean).join('\n')
    })
  } else if (decision === 'move-to-rag') {
    const target = { ...(plan.targetRag || {}) }
    if (!target.title) throw new Error('move-to-rag requires rag target title')
    if (!target.existingRagId && !target.newRagId) {
      target.newRagId = `rag.restraint.context.${slugify(target.title)}`
    }
    ragResult = target.existingRagId
      ? { cardId: target.existingRagId, created: false, filePath: null }
      : createRestraintStubCard(target)
    const ragId = ragResult.cardId
    if (ragResult.filePath) changedFiles.push(ragResult.filePath)
    const current = beforeCatalog.entries.find((entry) => entry.id === proposal.sourcePlotId)
    patchCatalogEntry(catalog, proposal.sourcePlotId, {
      placementStatus: 'archived',
      layerReviewStatus: 'migrated-to-rag',
      migratedToRagId: ragId,
      layerReviewConfirmationId: confirmationId,
      origin: 'legacy-migration',
      notes: [
        current?.notes || '',
        `[层级核对] 已迁入 RAG ${ragId}；本情节节点归档保留，不物理删除。`
      ]
        .filter(Boolean)
        .join('\n')
    })
    for (const storyKey of proposal.affectedStoryEntries ?? []) {
      changedFiles.push(...redirectStoryPlotToRag(storyKey, proposal.sourcePlotId, ragId))
    }
  } else if (decision === 'split-plot-and-rag') {
    const parentTarget = overrides.parentRagTarget || null
    if (parentTarget?.title) {
      if (!parentTarget.existingRagId && !parentTarget.newRagId) {
        parentTarget.newRagId = `rag.restraint.context.${slugify(parentTarget.title)}`
      }
      parentTarget.ragLayer = parentTarget.ragLayer || 'category'
      parentTarget.parentCardIds = parentTarget.parentCardIds ?? []
      parentRagResult = parentTarget.existingRagId
        ? { cardId: parentTarget.existingRagId, created: false, filePath: null }
        : createRestraintStubCard(parentTarget)
      if (parentRagResult.filePath) changedFiles.push(parentRagResult.filePath)
    }

    const target = { ...(plan.targetRag || {}) }
    if (!target.title) throw new Error('split requires rag target')
    if (!target.existingRagId && !target.newRagId) {
      target.newRagId = `rag.restraint.context.${slugify(target.title)}`
    }
    if (parentRagResult?.cardId) {
      target.parentCardIds = [...new Set([...(target.parentCardIds ?? []), parentRagResult.cardId])]
      target.ragLayer = 'concept'
    }
    ragResult = target.existingRagId
      ? { cardId: target.existingRagId, created: false, filePath: null }
      : createRestraintStubCard(target)
    const ragId = ragResult.cardId
    if (ragResult.filePath) changedFiles.push(ragResult.filePath)

    // Link parent.childConceptRefs when parent was created/updated in this run
    if (parentRagResult?.cardId) {
      const parentPath = path.join(
        process.cwd(),
        'external-knowledge/cards/restraint',
        `${parentRagResult.cardId}.json`
      )
      if (fs.existsSync(parentPath)) {
        const parentCard = readJson(parentPath)
        const children = [...new Set([...(parentCard.knowledge?.childConceptRefs ?? []), ragId])]
        parentCard.knowledge = {
          ...(parentCard.knowledge || {}),
          childConceptRefs: children
        }
        writeJson(parentPath, parentCard)
        changedFiles.push(path.relative(process.cwd(), parentPath).replaceAll('\\', '/'))
      }
    }

    const remainder = plan.plotRemainder ?? {}
    const current = beforeCatalog.entries.find((entry) => entry.id === proposal.sourcePlotId)
    const patch = {
      title: remainder.proposedTitle ?? current.title,
      summary: remainder.proposedSummary ?? current.summary,
      ragRefs: [...new Set([...(current.ragRefs ?? []), ragId])],
      origin: 'legacy-migration',
      placementStatus: (proposal.affectedStoryEntries ?? []).length ? 'placed' : 'unplaced',
      maturity: remainder.maturity ?? 'scene-ready',
      layerReviewStatus: 'split-plot-and-rag',
      layerReviewConfirmationId: confirmationId,
      notes: [
        current?.notes || '',
        `[层级核对] 已拆分：保留情节实例，并引用 RAG ${ragId}${
          parentRagResult?.cardId ? `（上位 ${parentRagResult.cardId}）` : ''
        }。`
      ]
        .filter(Boolean)
        .join('\n')
    }
    if (remainder.characters) patch.characters = remainder.characters
    if (remainder.worldBiases) patch.worldBiases = remainder.worldBiases
    if (remainder.development) patch.development = remainder.development
    if (remainder.usedByLabels) patch.usedByLabels = remainder.usedByLabels
    if (remainder.usedBy) {
      patch.usedBy = remainder.usedBy
      patch.isUsed = remainder.usedBy.length > 0
      if (!remainder.usageStatus) {
        patch.usageStatus = remainder.usedBy.length > 0 ? 'used' : 'unused'
      }
    }
    if (remainder.usageStatus) patch.usageStatus = remainder.usageStatus
    if (remainder.plotKind) patch.plotKind = remainder.plotKind
    patchCatalogEntry(catalog, proposal.sourcePlotId, patch)

    const ragStoryKeys = overrides.ragStoryKeys
      ?? (proposal.affectedStoryEntries ?? []).filter((key) => {
        const action = (overrides.storyActions ?? []).find((item) => item.storyKey === key)
        return !(action && action.addRagId === false)
      })

    for (const storyKey of ragStoryKeys) {
      changedFiles.push(
        ...addStoryRagRef(storyKey, ragId, {
          clearOccupationPending: true,
          clearLegacyOccupationTag: target.oldIds?.[0] || null
        })
      )
    }

    // Optional per-story edge overrides (e.g. remove mistaken plotRefs without adding RAG).
    for (const action of overrides.storyActions ?? []) {
      if (!action?.storyKey) continue
      for (const filePath of listStorySourceFiles()) {
        const doc = readJson(filePath)
        let dirty = false
        for (const node of doc.nodes ?? []) {
          if (node.key !== action.storyKey) continue
          if (action.removePlotId && Array.isArray(node.plotRefs)) {
            const next = node.plotRefs.filter((id) => id !== action.removePlotId)
            if (next.length !== node.plotRefs.length) {
              node.plotRefs = next
              dirty = true
            }
          }
          if (action.removeRagId && Array.isArray(node.ragRefs)) {
            const next = node.ragRefs.filter((id) => id !== action.removeRagId)
            if (next.length !== node.ragRefs.length) {
              node.ragRefs = next
              dirty = true
            }
          }
          if (action.clearLegacyIncludes && Array.isArray(node.legacyTagRefs)) {
            const before = node.legacyTagRefs.length
            node.legacyTagRefs = node.legacyTagRefs.filter(
              (item) => !action.clearLegacyIncludes.some((needle) => String(item).includes(needle))
            )
            if (node.legacyTagRefs.length !== before) dirty = true
          }
        }
        if (dirty) {
          writeJson(filePath, doc)
          changedFiles.push(path.relative(process.cwd(), filePath).replaceAll('\\', '/'))
        }
      }
    }
  } else {
    throw new Error(`applyMigration unsupported decision: ${decision}`)
  }

  writeJson(PLOT_CATALOG_PATH, catalog)
  changedFiles.push('src/game/data/plot_outline/catalog.json')

  const migration = {
    schemaVersion: 1,
    migrationId,
    confirmationId,
    decision,
    sourcePlotId: proposal.sourcePlotId,
    createdAt: nowIso(),
    plan,
    ragResult,
    parentRagResult: parentRagResult ?? null,
    changedFiles: [...new Set(changedFiles)],
    rollback: {
      restoreCatalogFromSnapshot: true,
      snapshotHint: readJson(REGISTRY_PATH, {}).snapshotId ?? null
    }
  }
  writeJson(path.join(MIGRATIONS_DIR, `${migrationId}.json`), migration)

  const queue = applyReviewStatus(loadQueue(), proposal.sourcePlotId, 'migrated', {
    migrationId,
    userDecision: decision
  })
  writeJson(QUEUE_PATH, queue)

  const registry = readJson(REGISTRY_PATH, emptyRegistry())
  registry.migrations = [...(registry.migrations ?? []), migrationId]
  registry.updatedAt = nowIso()
  writeJson(REGISTRY_PATH, registry)

  return migration
}

export function rollbackMigration(migrationId) {
  const migration = readJson(path.join(MIGRATIONS_DIR, `${migrationId}.json`), null)
  if (!migration) throw new Error(`migration not found: ${migrationId}`)
  const registry = readJson(REGISTRY_PATH, emptyRegistry())
  const snapshotId = migration.rollback?.snapshotHint || registry.snapshotId
  if (!snapshotId) throw new Error('no snapshot available for rollback')
  const snapshot = readJson(path.join(SNAPSHOTS_DIR, `${snapshotId}.json`), null)
  if (!snapshot) throw new Error(`snapshot missing: ${snapshotId}`)

  const catalog = loadPlotCatalog()
  const snapEntry = (snapshot.entries ?? []).find((entry) => entry.id === migration.sourcePlotId)
  if (!snapEntry) throw new Error('snapshot entry missing')
  const index = catalog.entries.findIndex((entry) => entry.id === migration.sourcePlotId)
  if (index < 0) throw new Error('catalog entry missing')
  const restored = {
    ...catalog.entries[index],
    title: snapEntry.title,
    summary: snapEntry.summary,
    notes: snapEntry.notes,
    ragRefs: snapEntry.ragRefs,
    usageStatus: snapEntry.usageStatus,
    isUsed: snapEntry.isUsed,
    usedBy: snapEntry.usedBy,
    usedByLabels: snapEntry.usedByLabels
  }
  if (snapEntry.placementStatus != null) restored.placementStatus = snapEntry.placementStatus
  else delete restored.placementStatus
  if (snapEntry.maturity != null) restored.maturity = snapEntry.maturity
  else delete restored.maturity
  if (snapEntry.origin != null) restored.origin = snapEntry.origin
  else delete restored.origin
  delete restored.layerReviewStatus
  delete restored.migratedToRagId
  delete restored.layerReviewConfirmationId
  catalog.entries[index] = restored
  writeJson(PLOT_CATALOG_PATH, catalog)

  migration.rolledBackAt = nowIso()
  writeJson(path.join(MIGRATIONS_DIR, `${migrationId}.json`), migration)
  return {
    migrationId,
    restoredPlotId: migration.sourcePlotId,
    warning:
      '已恢复情节条目快照字段。若迁移曾改写故事 ragRefs/plotRefs 或新建 RAG 卡，请按 migration.changedFiles 人工核对后决定是否继续回滚这些文件。'
  }
}

export function statusReport() {
  ensureReviewWorkspace()
  const registry = readJson(REGISTRY_PATH, emptyRegistry())
  const queue = readJson(QUEUE_PATH, null)
  return {
    registry,
    summary: queue?.summary ?? null,
    pendingCount: (queue?.items ?? []).filter((item) =>
      ['proposed', 'confirmed'].includes(item.reviewStatus)
    ).length,
    next: queue ? nextPendingProposal(queue) : null
  }
}

export function rebuildAffectedHint(plotId) {
  const proposal = showProposal(plotId)
  return {
    plotId,
    suggestedCommands: [
      'npm run outline:graph:rebuild',
      'npm run outline:graph:validate'
    ],
    affectedStoryEntries: proposal.affectedStoryEntries ?? [],
    affectedSourceFiles: proposal.affectedSourceFiles ?? [],
    note: '索引与图谱按受影响范围重建；本命令只给出提示，不静默全量重建无关内容。'
  }
}
