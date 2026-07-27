import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { ASSET_REGISTRY_PATH, MODEL_LOCK_PATH, repoPath, toPosixRelative } from './paths.mjs'

export async function loadAssetRegistry() {
  return JSON.parse(await readFile(repoPath(ASSET_REGISTRY_PATH), 'utf8'))
}

export async function saveAssetRegistry(registry) {
  registry.updatedAt = new Date().toISOString()
  registry.counts = computeCounts(registry.assets)
  await writeFile(repoPath(ASSET_REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
}

export function computeCounts(assets) {
  return {
    total: assets.length,
    approved: assets.filter((item) => item.status === 'approved').length,
    goldenApproved: assets.filter((item) => item.assetType === 'golden-approved' && item.status === 'approved').length,
    personalHistory: assets.filter((item) => item.assetType === 'personal-history').length,
    calibrationPairs: assets.filter((item) => item.assetType === 'calibration-pair').length,
  }
}

export async function hashFile(filePath) {
  const buf = await readFile(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

export async function validateAssetRegistry(registry = null) {
  const data = registry ?? await loadAssetRegistry()
  const schema = JSON.parse(await readFile(repoPath('schemas/workflows/writing-asset-registry.schema.json'), 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  const ok = validate(data)
  const errors = ok ? [] : (validate.errors ?? []).map((item) => `${item.instancePath || '/'} ${item.message}`)
  if (!['metadata-rag', 'explicit-only'].includes(data.policy?.styleRagStatus)) {
    errors.push('StyleRAG 状态必须是 metadata-rag 或 explicit-only（embedding/向量检索仍属 V2+ 暂缓）')
  }
  if (data.policy?.allowExistingCanonMigration !== false) errors.push('不得启用既有正文迁移')
  if (data.policy?.autoApproveByModel !== false) errors.push('不得允许模型自动批准')
  if (data.counts.goldenApproved > 0 && data.assets.every((item) => item.assetType !== 'golden-approved')) {
    errors.push('counts.goldenApproved 与 assets 不一致')
  }
  const forged = data.assets.filter(
    (item) => item.status === 'approved' && item.provenance?.approvedByUser !== true,
  )
  if (forged.length) errors.push('存在未由用户批准却标记 approved 的资产')
  return { ok: errors.length === 0, errors, registry: data }
}

export async function registerAsset(input, options = {}) {
  const dryRun = options.dryRun !== false
  const registry = await loadAssetRegistry()
  if (input.approvedByUser === true && options.allowUserApproval !== true) {
    const error = new Error('register 命令不得自动将 approvedByUser 设为 true；需显式 --user-approved')
    error.code = 'AUTO_APPROVAL_FORBIDDEN'
    throw error
  }
  if (input.assetType === 'personal-history' && input.promoteToGolden) {
    const error = new Error('personal-history 不得自动升级为 golden-approved')
    error.code = 'PERSONAL_TO_GOLDEN_FORBIDDEN'
    throw error
  }
  if (input.assetType === 'external-style-card' && input.fullExternalNovelPath) {
    const error = new Error('external-style-card 不接受整本外部小说原文')
    error.code = 'EXTERNAL_NOVEL_FORBIDDEN'
    throw error
  }

  const sourcePath = input.sourcePath ? (path.isAbsolute(input.sourcePath) ? input.sourcePath : repoPath(input.sourcePath)) : null
  let hash = input.hash ?? ''
  let relativePath = input.path ?? ''
  if (sourcePath && input.copyTo) {
    const target = path.isAbsolute(input.copyTo) ? input.copyTo : repoPath(input.copyTo)
    await mkdir(path.dirname(target), { recursive: true })
    if (!dryRun) await copyFile(sourcePath, target)
    hash = await hashFile(sourcePath)
    relativePath = toPosixRelative(target)
  } else if (sourcePath) {
    hash = await hashFile(sourcePath)
    relativePath = toPosixRelative(sourcePath)
  }

  const asset = {
    schemaVersion: 1,
    assetId: input.assetId ?? `wa-${Date.now().toString(36)}`,
    assetType: input.assetType,
    status: input.status ?? 'awaiting-user-input',
    title: input.title ?? '',
    path: relativePath,
    ownership: input.ownership ?? {
      category: 'unknown',
      source: '',
      permissionNote: '',
    },
    classification: input.classification ?? {
      sceneFunction: [],
      worldTypes: [],
      pov: '',
      dialogueDensity: '',
      actionDensity: '',
      tensionLevel: '',
    },
    provenance: {
      sourceModel: input.sourceModel ?? null,
      modelRunId: input.modelRunId ?? null,
      requestContractId: input.requestContractId ?? null,
      humanEdited: Boolean(input.humanEdited),
      approvedByUser: options.allowUserApproval === true ? Boolean(input.approvedByUser) : false,
      approvalBasis: input.approvalBasis ?? null,
      approvedAt: options.allowUserApproval === true && input.approvedByUser ? new Date().toISOString() : null,
    },
    authority: input.authority ?? {
      canonStatus: 'unknown',
      styleRecommendation: 'unreviewed',
      sourceOfTruthPath: relativePath,
    },
    qualityNotes: input.qualityNotes ?? {
      strengths: [],
      limitations: [],
      usableFor: [],
      notFor: [],
    },
    hash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!dryRun) {
    registry.assets.push(asset)
    await saveAssetRegistry(registry)
  }
  return { dryRun, asset, registryCounts: computeCounts([...registry.assets, ...(dryRun ? [asset] : [])]) }
}

export async function createCalibrationPair(input, options = {}) {
  const dryRun = options.dryRun !== false
  if (!input.beforePath || !input.afterPath) {
    throw new Error('calibration pair 必须同时提供 before 与 after')
  }
  const beforeAbs = path.isAbsolute(input.beforePath) ? input.beforePath : repoPath(input.beforePath)
  const afterAbs = path.isAbsolute(input.afterPath) ? input.afterPath : repoPath(input.afterPath)
  await readFile(beforeAbs, 'utf8')
  await readFile(afterAbs, 'utf8')

  const pair = {
    schemaVersion: 1,
    pairId: input.pairId ?? `cp-${Date.now().toString(36)}`,
    status: input.status ?? 'awaiting-user-input',
    sourceModel: input.sourceModel,
    modelRunId: input.modelRunId ?? null,
    requestContractId: input.requestContractId ?? null,
    beforePath: toPosixRelative(beforeAbs),
    afterPath: toPosixRelative(afterAbs),
    diffSummary: input.diffSummary ?? '',
    changeCategories: input.changeCategories ?? [],
    changeReasons: input.changeReasons ?? [],
    suitableForSkillUpgrade: Boolean(input.suitableForSkillUpgrade),
    upgradeSuggestionStatus: 'none',
    relatedSkillHints: input.relatedSkillHints ?? [],
    approvedByUser: options.allowUserApproval === true ? Boolean(input.approvedByUser) : false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const registry = await loadAssetRegistry()
  const approvedSameCategory = registry.assets.filter(
    (item) =>
      item.assetType === 'calibration-pair' &&
      item.status === 'approved' &&
      (item.changeCategories ?? []).some((cat) => pair.changeCategories.includes(cat)),
  )
  // Also count would-be pairs stored as assets with metadata
  const approvedPairs = [
    ...approvedSameCategory,
    ...registry.assets.filter((item) => item.assetType === 'calibration-pair' && item.status === 'approved'),
  ]
  const uniqueApproved = new Map()
  for (const item of approvedPairs) uniqueApproved.set(item.assetId, item)
  const categoryMatches = [...uniqueApproved.values()].filter((item) =>
    (item.changeCategories ?? item.classification?.sceneFunction ?? []).some((cat) =>
      pair.changeCategories.includes(cat),
    ),
  )
  if (pair.approvedByUser && categoryMatches.length >= 2 && pair.changeCategories.length) {
    pair.upgradeSuggestionStatus = 'suggested'
  }

  if (!dryRun) {
    const metaPath = repoPath('docs/写作资产/修改对照/待归档', `${pair.pairId}.json`)
    await mkdir(path.dirname(metaPath), { recursive: true })
    await writeFile(metaPath, `${JSON.stringify(pair, null, 2)}\n`, 'utf8')
    await registerAsset(
      {
        assetId: `wa-${pair.pairId}`,
        assetType: 'calibration-pair',
        status: pair.status,
        title: `修改对照 ${pair.pairId}`,
        path: toPosixRelative(metaPath),
        sourceModel: pair.sourceModel,
        modelRunId: pair.modelRunId,
        requestContractId: pair.requestContractId,
        humanEdited: true,
        approvedByUser: pair.approvedByUser,
        changeCategories: pair.changeCategories,
        classification: {
          sceneFunction: pair.changeCategories,
          worldTypes: [],
          pov: '',
          dialogueDensity: '',
          actionDensity: '',
          tensionLevel: '',
        },
      },
      { dryRun: false, allowUserApproval: options.allowUserApproval === true },
    )
  }

  return {
    dryRun,
    pair,
    skillUpgrade: {
      automatic: false,
      suggestionStatus: pair.upgradeSuggestionStatus,
      note:
        pair.upgradeSuggestionStatus === 'suggested'
          ? '已达到建议升级阈值，但仍不自动写入 Skill'
          : '单条或不足三条对照，不自动修改 Skill',
    },
  }
}

export async function syncGoldenFromCanon(input, options = {}) {
  const dryRun = options.dryRun !== false
  const registry = await loadAssetRegistry()
  const sourcePath = path.isAbsolute(input.sourceOfTruthPath)
    ? input.sourceOfTruthPath
    : repoPath(input.sourceOfTruthPath)
  const hash = await hashFile(sourcePath)
  const existing = registry.assets.find(
    (item) =>
      item.assetType === 'golden-approved' &&
      item.authority?.sourceOfTruthPath === toPosixRelative(sourcePath) &&
      item.status === 'approved',
  )

  if (input.excludeFromStyle) {
    if (existing && !dryRun) {
      existing.authority.styleRecommendation = 'excluded'
      existing.qualityNotes.notFor = [...new Set([...(existing.qualityNotes.notFor ?? []), 'user-excluded-style'])]
      existing.updatedAt = new Date().toISOString()
      await saveAssetRegistry(registry)
    }
    return { action: 'excluded-from-style', dryRun, assetId: existing?.assetId ?? null }
  }

  if (existing) {
    if (existing.hash !== hash) {
      if (!dryRun) {
        existing.status = 'superseded'
        existing.updatedAt = new Date().toISOString()
        const replacement = {
          ...existing,
          assetId: `wa-${Date.now().toString(36)}`,
          status: 'approved',
          hash,
          path: toPosixRelative(sourcePath),
          authority: {
            ...existing.authority,
            canonStatus: 'official',
            styleRecommendation: existing.authority.styleRecommendation === 'excluded' ? 'excluded' : 'recommended',
            sourceOfTruthPath: toPosixRelative(sourcePath),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        registry.assets.push(replacement)
        await saveAssetRegistry(registry)
        return { action: 'updated-hash', dryRun, superseded: existing.assetId, assetId: replacement.assetId }
      }
      return { action: 'would-update-hash', dryRun, assetId: existing.assetId }
    }
    return { action: 'unchanged', dryRun, assetId: existing.assetId }
  }

  const asset = {
    schemaVersion: 1,
    assetId: `wa-golden-${Date.now().toString(36)}`,
    assetType: 'golden-approved',
    status: 'approved',
    title: input.title ?? path.basename(sourcePath),
    path: toPosixRelative(sourcePath),
    ownership: {
      category: 'project-owned',
      source: 'canon-write',
      permissionNote: '用户批准写入正史后默认同步',
    },
    classification: input.classification ?? {
      sceneFunction: [],
      worldTypes: [],
      pov: '',
      dialogueDensity: '',
      actionDensity: '',
      tensionLevel: '',
    },
    provenance: {
      sourceModel: input.sourceModel ?? null,
      modelRunId: input.modelRunId ?? null,
      requestContractId: input.requestContractId ?? null,
      humanEdited: true,
      approvedByUser: true,
      approvalBasis: 'explicit-user-approval',
      approvedAt: new Date().toISOString(),
    },
    authority: {
      canonStatus: 'official',
      styleRecommendation: 'recommended',
      sourceOfTruthPath: toPosixRelative(sourcePath),
    },
    qualityNotes: {
      strengths: [],
      limitations: [],
      usableFor: ['style-reference'],
      notFor: [],
    },
    hash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!dryRun) {
    registry.assets.push(asset)
    await saveAssetRegistry(registry)
  }
  return { action: 'registered', dryRun, asset }
}

export async function loadModelLock() {
  return JSON.parse(await readFile(repoPath(MODEL_LOCK_PATH), 'utf8'))
}

export async function pinModels(options = {}) {
  const lock = await loadModelLock()
  const live = options.live === true
  if (!live) {
    return {
      dryRun: true,
      downloadedWeights: false,
      lock,
      note: '未联网 pin；revision 保持 null，status=awaiting-pin；不会下载权重',
    }
  }
  // Live pin would fetch model card metadata only; still never downloads weights.
  for (const model of lock.models) {
    model.metadataStatus = 'awaiting-pin'
    model.weightsArchiveStatus = 'not-downloaded'
    model.revision = model.revision ?? null
  }
  await writeFile(repoPath(MODEL_LOCK_PATH), `${JSON.stringify(lock, null, 2)}\n`, 'utf8')
  return { dryRun: false, downloadedWeights: false, lock }
}

export function remindOpenGaps(gaps, remindTopic) {
  return gaps.filter((gap) => {
    if (gap.status !== 'open' && gap.status !== 'awaiting-user-input') return false
    const topics = gap.remindWhen ?? []
    return topics.includes(remindTopic)
  })
}
