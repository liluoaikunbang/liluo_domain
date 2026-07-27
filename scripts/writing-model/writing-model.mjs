#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  computeRuntimeStatus,
  loadWritingModelsRegistry,
  resolveModelAlias,
  validateAgainstSchema,
  validateRegistryShape,
} from './lib/config.mjs'
import { chatCompletion, healthCheckModel } from './lib/client.mjs'
import { buildChatMessages, loadFormalProseRequest } from './lib/request-contract.mjs'
import {
  assertNotCanonPath,
  createCompareGroupId,
  ensureWorkspace,
  persistRunArtifacts,
  writeJsonSafe,
  writeTextSafe,
} from './lib/run-manifest.mjs'
import {
  createCalibrationPair,
  loadAssetRegistry,
  pinModels,
  registerAsset,
  remindOpenGaps,
  syncGoldenFromCanon,
  validateAssetRegistry,
} from './lib/assets.mjs'
import { ASSET_ROOT, ENV_EXAMPLE_FILE, ENV_LOCAL_FILE, ROOT, WORKSPACE_ROOT, repoPath, toPosixRelative } from './lib/paths.mjs'
import { redactText, summarizeHost } from './lib/redaction.mjs'
import { scanExternalInventory } from './lib/external-inventory.mjs'
import {
  exportReviewBatch,
  importReviewBatch,
  validateExternalRegistries,
} from './lib/external-review.mjs'
import { loadAuthorRegistry, listAuthors, applyAuthorPrior, saveAuthorRegistry } from './lib/external-author-registry.mjs'
import {
  createStyleQueryFromContract,
  loadStyleRagPolicy,
  loadStyleTaxonomy,
  validateScoringWeights,
  validateStyleQuery,
} from './lib/style-query.mjs'
import { runStylePack, runStyleSearch } from './lib/style-search.mjs'
import { explainSearchResult } from './lib/style-explain.mjs'
import { recordStyleFeedback } from './lib/style-feedback.mjs'
import { approveWritingSheet, draftWritingSheet, loadWritingSheet } from './lib/writing-sheet.mjs'
import {
  STYLE_RAG_POLICY_PATH,
  STYLE_TAXONOMY_PATH,
  EXTERNAL_STYLE_SOURCES_PATH,
  EXTERNAL_ARTICLE_REGISTRY_PATH,
  EXTERNAL_AUTHOR_REGISTRY_PATH,
  WRITING_SHEET_CURRENT_PATH,
} from './lib/paths.mjs'

function parseArgs(argv) {
  const args = { _: [], flags: {} }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token.startsWith('--')) {
      const key = token.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) args.flags[key] = true
      else {
        if (args.flags[key] === undefined) args.flags[key] = next
        else if (Array.isArray(args.flags[key])) args.flags[key].push(next)
        else args.flags[key] = [args.flags[key], next]
        i += 1
      }
    } else args._.push(token)
  }
  return args
}

async function exists(file) {
  try {
    await access(file, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

async function commandValidate() {
  const registry = await loadWritingModelsRegistry()
  const shapeErrors = validateRegistryShape(registry)
  const schema = await validateAgainstSchema(registry, 'schemas/workflows/writing-models.schema.json')
  const asset = await validateAssetRegistry()
  const requiredPaths = [
    ENV_EXAMPLE_FILE,
    ASSET_ROOT,
    'schemas/workflows/writing-models.schema.json',
    'schemas/workflows/formal-prose-request.schema.json',
    'schemas/workflows/writing-asset.schema.json',
    'schemas/workflows/writing-calibration-pair.schema.json',
    'schemas/workflows/writing-model-run.schema.json',
    'schemas/workflows/writing-asset-registry.schema.json',
    'schemas/workflows/style-rag-policy.schema.json',
    'schemas/workflows/style-taxonomy.schema.json',
    'schemas/workflows/style-query.schema.json',
    'schemas/workflows/style-pack.schema.json',
    'schemas/workflows/external-style-sources.schema.json',
    'schemas/workflows/external-article.schema.json',
    'schemas/workflows/external-author.schema.json',
    STYLE_RAG_POLICY_PATH,
    STYLE_TAXONOMY_PATH,
    EXTERNAL_STYLE_SOURCES_PATH,
    '.agents/skills/liluo-project/liluo-formal-prose-pipeline/SKILL.md',
    '.agents/skills/liluo-project/liluo-style-rag/SKILL.md',
    'docs/写作资产/registry.json',
    'docs/写作资产/模型归档/model-lock.json',
    'docs/写作资产/工作区/README.md',
    WRITING_SHEET_CURRENT_PATH,
    '.cursor',
    '.codex',
  ]
  const missing = []
  for (const rel of requiredPaths) if (!(await exists(repoPath(rel)))) missing.push(rel)
  const packageJson = JSON.parse(await readFile(repoPath('package.json'), 'utf8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const banned = ['chromadb', 'faiss', '@xenova/transformers', 'openai', '@huggingface/inference']
  const introduced = banned.filter((name) => deps[name])
  const policy = await loadStyleRagPolicy()
  const weightCheck = validateScoringWeights(policy)
  const errors = [
    ...shapeErrors,
    ...schema.errors.map((item) => `schema: ${item}`),
    ...asset.errors.map((item) => `assets: ${item}`),
    ...missing.map((item) => `missing: ${item}`),
    ...introduced.map((item) => `banned dependency introduced: ${item}`),
    ...weightCheck.errors,
  ]
  if (!policy.enabledModes?.includes('metadata') || !policy.enabledModes?.includes('explicit')) {
    errors.push('style-rag-policy 必须启用 explicit 与 metadata')
  }
  if (!policy.deferredModes?.includes('embedding')) {
    errors.push('embedding 必须仍在 deferredModes')
  }
  const result = {
    ok: errors.length === 0,
    status: (await computeRuntimeStatus({ registry })).status,
    errors,
    goldenApprovedCount: asset.registry.counts.goldenApproved,
    styleRag: asset.registry.policy.styleRagStatus,
    styleRagStage: policy.implementationStage,
  }
  printJson(result)
  if (!result.ok) process.exitCode = 1
}

async function commandStatus() {
  const runtime = await computeRuntimeStatus()
  printJson({
    status: runtime.status,
    models: runtime.models.map((model) => ({
      id: model.id,
      displayName: model.displayName,
      configured: model.configured,
      servedModel: model.servedModel,
      hostSummary: model.hostSummary,
      hasApiKey: model.hasApiKey,
      urlError: model.urlError,
    })),
    warnings: runtime.warnings,
    productionDefault: runtime.defaults.productionDefault ?? null,
    routingStatus: runtime.defaults.routingStatus ?? 'awaiting-calibration',
    note: '不显示 API Key；不访问网络',
  })
}

async function commandHealth(flags) {
  if (!flags.live) {
    printJson({
      ok: false,
      skipped: true,
      reason: 'health 默认不访问网络；请显式传入 --live',
    })
    process.exitCode = 1
    return
  }
  const registry = await loadWritingModelsRegistry()
  const selector = resolveModelAlias(registry, flags.model ?? 'both')
  const ids =
    selector === 'both'
      ? registry.models.map((model) => model.id)
      : selector
        ? [selector]
        : null
  if (!ids) {
    printJson({ ok: false, error: `未知 --model：${flags.model}` })
    process.exitCode = 1
    return
  }
  const results = []
  for (const id of ids) results.push(await healthCheckModel(registry, id))
  const healthy = results.filter((item) => item.ok).length
  let status = 'failed'
  if (healthy === 0) status = results.every((item) => item.status === 'unconfigured') ? 'unconfigured' : 'failed'
  else if (healthy === registry.models.length) status = 'healthy'
  else status = 'degraded'
  printJson({ status, results })
  if (status === 'failed' || status === 'unconfigured') process.exitCode = 1
}

async function loadStyleSnippets(ids = []) {
  if (!ids.length) return []
  const registry = await loadAssetRegistry()
  const snippets = []
  for (const id of ids.slice(0, 3)) {
    const asset = registry.assets.find((item) => item.assetId === id)
    if (!asset) throw new Error(`未找到文风样本 ${id}；styleReferenceIds 不自动检索`)
    if (asset.status !== 'approved' && asset.status !== 'candidate') {
      throw new Error(`样本 ${id} 状态为 ${asset.status}，不可用作参考`)
    }
    const text = await readFile(repoPath(asset.path), 'utf8')
    snippets.push({ id, text })
  }
  return snippets
}

async function commandDraft(flags) {
  const registry = await loadWritingModelsRegistry()
  if (!flags.model) {
    printJson({ ok: false, error: 'draft 必须显式 --model dsr1|qwen3，禁止静默双调' })
    process.exitCode = 1
    return
  }
  const modelId = resolveModelAlias(registry, flags.model)
  if (!modelId || modelId === 'both') {
    printJson({ ok: false, error: 'draft 只允许单个模型；双模型请用 compare' })
    process.exitCode = 1
    return
  }
  if (!flags.contract) {
    printJson({ ok: false, error: '缺少 --contract' })
    process.exitCode = 1
    return
  }
  const { data: contract, absolutePath } = await loadFormalProseRequest(flags.contract)
  assertNotCanonPath(toPosixRelative(absolutePath))
  const styleIds = []
    .concat(flags['style-reference'] ?? [])
    .concat(contract.expression.styleReferenceIds ?? [])
    .flat()
    .filter(Boolean)
    .slice(0, 3)
  const snippets = await loadStyleSnippets(styleIds)
  let stylePackMarkdown = null
  let stylePackMeta = null
  if (flags['style-query'] || flags['style-pack'] === true || contract.expression?.styleQueryPath) {
    const queryPath = flags['style-query'] ?? contract.expression.styleQueryPath
    let query
    if (queryPath) {
      query = JSON.parse(await readFile(repoPath(String(queryPath)), 'utf8'))
    } else {
      query = createStyleQueryFromContract(contract, {
        targetModel: modelId,
        mode: styleIds.length ? 'hybrid-explicit' : 'metadata',
      })
    }
    const packed = await runStylePack(query)
    stylePackMarkdown = packed.pack.renderedMarkdown
    stylePackMeta = { packId: packed.pack.packId, status: packed.pack.status, selected: packed.pack.selectedAssets }
  }
  const mode = flags.live ? 'live' : 'mock'
  if (mode === 'live') {
    console.error(`将 live 调用模型 ${modelId}（不显示 Key）`)
  }
  const result = await chatCompletion({
    registry,
    modelId,
    mode,
    messages: buildChatMessages(contract, snippets, stylePackMarkdown),
    requestContractId: contract.requestId,
    styleReferenceIds: styleIds,
    inputSources: [toPosixRelative(absolutePath), ...styleIds],
  })
  const persisted = await persistRunArtifacts(result, {
    debugRawPath: flags.debug
      ? repoPath(WORKSPACE_ROOT, 'debug', `${result.runId}.raw.json`)
      : null,
  })
  if (flags.debug) {
    await writeJsonSafe(repoPath(WORKSPACE_ROOT, 'debug', `${result.runId}.raw.json`), result.rawPayload)
  }
  printJson({
    ok: true,
    mode: persisted.mode,
    runId: persisted.runId,
    modelProfile: persisted.modelProfile,
    draftPath: persisted.workspacePaths.draft,
    manifestPath: persisted.workspacePaths.manifest,
    stylePack: stylePackMeta,
    warnings: persisted.warnings,
    note: '候选正文仅在工作区，未写入正式 canon',
  })
}

async function commandCompare(flags) {
  const registry = await loadWritingModelsRegistry()
  if (!flags.contract) {
    printJson({ ok: false, error: '缺少 --contract' })
    process.exitCode = 1
    return
  }
  console.error('compare 将调用两个模型生成盲评候选（除显式 --live 外使用 mock）')
  const { data: contract, absolutePath } = await loadFormalProseRequest(flags.contract)
  const mode = flags.live ? 'live' : 'mock'
  const groupId = createCompareGroupId()
  const styleIds = (contract.expression.styleReferenceIds ?? []).slice(0, 3)
  const snippets = await loadStyleSnippets(styleIds)
  const messages = buildChatMessages(contract, snippets)
  const labels = ['a', 'b']
  const mapping = {}
  const outputs = []
  await ensureWorkspace()
  const compareDir = repoPath(WORKSPACE_ROOT, 'compare', groupId)
  await mkdir(compareDir, { recursive: true })
  for (let index = 0; index < registry.models.length; index += 1) {
    const model = registry.models[index]
    const result = await chatCompletion({
      registry,
      modelId: model.id,
      mode,
      messages,
      requestContractId: contract.requestId,
      styleReferenceIds: styleIds,
      inputSources: [toPosixRelative(absolutePath)],
    })
    result.compareGroupId = groupId
    result.blindLabel = labels[index]
    const persisted = await persistRunArtifacts(result)
    mapping[labels[index]] = {
      modelProfile: model.id,
      runId: persisted.runId,
      draftPath: persisted.workspacePaths.draft,
    }
    const blindPath = path.join(compareDir, `candidate-${labels[index]}.md`)
    await writeTextSafe(blindPath, persisted.draft)
    outputs.push({
      blindLabel: labels[index],
      path: toPosixRelative(blindPath),
      runId: persisted.runId,
    })
  }
  await writeJsonSafe(path.join(compareDir, 'internal-mapping.json'), mapping)
  printJson({
    ok: true,
    mode,
    compareGroupId: groupId,
    blindCandidates: outputs,
    mappingPath: toPosixRelative(path.join(compareDir, 'internal-mapping.json')),
    note: '盲评副本不含模型名；内部 mapping 仅供主智能体使用',
  })
}

async function commandAssetsValidate() {
  const result = await validateAssetRegistry()
  printJson(result)
  if (!result.ok) process.exitCode = 1
}

async function commandAssetsRegister(flags) {
  const result = await registerAsset(
    {
      assetType: flags.type,
      title: flags.title,
      sourcePath: flags.source,
      copyTo: flags['copy-to'],
      status: flags.status ?? 'awaiting-user-input',
      approvedByUser: flags['user-approved'] === true,
      promoteToGolden: flags['promote-to-golden'] === true,
      fullExternalNovelPath: flags['full-novel'],
    },
    {
      dryRun: flags['dry-run'] !== false && flags.commit !== true,
      allowUserApproval: flags['user-approved'] === true,
    },
  )
  printJson(result)
}

async function commandCalibrationCreate(flags) {
  const result = await createCalibrationPair(
    {
      sourceModel: flags.model,
      modelRunId: flags.run,
      requestContractId: flags.contract,
      beforePath: flags.before,
      afterPath: flags.after,
      diffSummary: flags.summary ?? '',
      changeCategories: [].concat(flags.category ?? []).flat(),
      changeReasons: [].concat(flags.reason ?? []).flat(),
      approvedByUser: flags['user-approved'] === true,
      status: flags['user-approved'] === true ? 'approved' : 'awaiting-user-input',
    },
    {
      dryRun: flags.commit !== true,
      allowUserApproval: flags['user-approved'] === true,
    },
  )
  printJson(result)
}

async function commandPin(flags) {
  const result = await pinModels({ live: flags.live === true })
  printJson(result)
}

async function commandRemind(flags) {
  const gapsPath = repoPath('project-navigation/manual-gaps.json')
  const gaps = JSON.parse(await readFile(gapsPath, 'utf8')).gaps ?? []
  const topic = flags.topic
  if (!topic) {
    printJson({ ok: false, error: '需要 --topic' })
    process.exitCode = 1
    return
  }
  printJson({
    topic,
    gaps: remindOpenGaps(gaps, topic).map((gap) => ({
      id: gap.id,
      title: gap.title,
      missing: gap.missing,
      nextAction: gap.nextAction,
      unlocks: gap.unlocks,
    })),
  })
}

async function commandSyncGolden(flags) {
  if (!flags.source) {
    printJson({ ok: false, error: '需要 --source' })
    process.exitCode = 1
    return
  }
  const result = await syncGoldenFromCanon(
    {
      sourceOfTruthPath: flags.source,
      title: flags.title,
      excludeFromStyle: flags.exclude === true,
      sourceModel: flags.model ?? null,
      modelRunId: flags.run ?? null,
      requestContractId: flags.contract ?? null,
    },
    { dryRun: flags.commit !== true },
  )
  printJson(result)
}

async function loadQueryFromFlags(flags) {
  if (flags.query) {
    return JSON.parse(await readFile(repoPath(String(flags.query)), 'utf8'))
  }
  if (flags.contract) {
    const { data } = await loadFormalProseRequest(flags.contract)
    return createStyleQueryFromContract(data, {
      targetModel: flags.model ?? null,
      mode: flags.mode ?? 'metadata',
    })
  }
  throw new Error('需要 --query 或 --contract')
}

async function commandStyleValidate() {
  const policy = await loadStyleRagPolicy()
  const taxonomy = await loadStyleTaxonomy()
  const weightCheck = validateScoringWeights(policy)
  const policySchema = await validateAgainstSchema(policy, 'schemas/workflows/style-rag-policy.schema.json')
  const taxSchema = await validateAgainstSchema(taxonomy, 'schemas/workflows/style-taxonomy.schema.json')
  const sources = JSON.parse(await readFile(repoPath(EXTERNAL_STYLE_SOURCES_PATH), 'utf8'))
  const sourcesSchema = await validateAgainstSchema(sources, 'schemas/workflows/external-style-sources.schema.json')
  const sheet = await loadWritingSheet()
  const errors = [
    ...weightCheck.errors,
    ...policySchema.errors.map((e) => `policy: ${e}`),
    ...taxSchema.errors.map((e) => `taxonomy: ${e}`),
    ...sourcesSchema.errors.map((e) => `sources: ${e}`),
  ]
  if (policy.deferredModes.includes('embedding') === false) errors.push('embedding 必须暂缓')
  const result = {
    ok: errors.length === 0,
    errors,
    implementationStage: policy.implementationStage,
    enabledModes: policy.enabledModes,
    deferredModes: policy.deferredModes,
    writingSheetStatus: sheet.status,
    scoringWeightSum: weightCheck.sum,
  }
  printJson(result)
  if (!result.ok) process.exitCode = 1
}

async function commandStyleQuery(flags) {
  const query = await loadQueryFromFlags(flags)
  const check = await validateStyleQuery(query)
  printJson({ ok: check.ok, errors: check.errors, query })
  if (!check.ok) process.exitCode = 1
}

async function commandStyleSearch(flags) {
  const query = await loadQueryFromFlags(flags)
  const result = await runStyleSearch(query)
  printJson({
    ok: true,
    queryId: result.query.queryId,
    selected: result.selected.map((s) => ({
      assetId: s.candidate.assetId,
      assetType: s.candidate.assetType,
      score: s.score,
      themeDomain: s.candidate.themeDomain,
      userQuality: s.candidate.userQuality,
    })),
    explanations: result.explanations,
    eligibleCount: result.eligibleCount,
    candidateCount: result.candidateCount,
  })
}

async function commandStylePack(flags) {
  const query = await loadQueryFromFlags(flags)
  const { search, pack } = await runStylePack(query)
  if (flags.out) {
    await writeJsonSafe(repoPath(String(flags.out)), pack)
  }
  printJson({
    ok: true,
    packId: pack.packId,
    status: pack.status,
    selectedAssets: pack.selectedAssets,
    characterBudget: pack.characterBudget,
    explanations: search.explanations,
    renderedMarkdown: flags['include-markdown'] ? pack.renderedMarkdown : undefined,
    out: flags.out ?? null,
  })
}

async function commandStyleExplain(flags) {
  const query = await loadQueryFromFlags(flags)
  const search = await runStyleSearch(query)
  const policy = await loadStyleRagPolicy()
  printJson({
    ok: true,
    lines: explainSearchResult({
      query,
      selected: search.selected,
      rejected: search.rejected,
      policy,
    }),
  })
}

async function commandStyleFeedback(flags) {
  const record = await recordStyleFeedback({
    assetId: flags.asset,
    modelId: flags.model,
    humanScore: Number(flags.score),
    editRatio: flags['edit-ratio'] != null ? Number(flags['edit-ratio']) : null,
    queryId: flags.query ?? null,
    packId: flags.pack ?? null,
    notes: flags.notes ?? '',
    modelSelfScore: flags['model-self-score'],
  })
  printJson({ ok: true, record })
}

async function commandStyleSheetDraft(flags) {
  const result = await draftWritingSheet({
    principles: [].concat(flags.principle ?? []).flat(),
    preferredPatterns: [].concat(flags.prefer ?? []).flat(),
    avoidedPatterns: [].concat(flags.avoid ?? []).flat(),
    evidenceAssetIds: [].concat(flags.evidence ?? []).flat(),
    notes: flags.notes ?? undefined,
  })
  printJson({ ok: true, ...result })
}

async function commandStyleSheetApprove(flags) {
  const result = await approveWritingSheet({
    userApproved: flags['user-approved'] === true,
    draftPath: flags.draft,
  })
  printJson({ ok: true, ...result })
}

async function commandExternalInventory(flags) {
  const result = await scanExternalInventory({ dryRun: flags['dry-run'] === true })
  printJson({
    ok: true,
    dryRun: result.dryRun,
    counts: result.counts,
    articleCount: result.articleCount,
    authorCount: result.authorCount,
    duplicateGroups: result.duplicateGroups,
    missingRoots: result.missingRoots,
    articleRegistry: EXTERNAL_ARTICLE_REGISTRY_PATH,
    authorRegistry: EXTERNAL_AUTHOR_REGISTRY_PATH,
  })
}

async function commandExternalReviewExport(flags) {
  const result = await exportReviewBatch({
    unreviewedOnly: flags['unreviewed-only'] !== false,
    theme: flags.theme,
    author: flags.author,
    sourceId: flags.source,
    batchSize: flags['batch-size'] ?? 30,
    format: flags.format ?? 'markdown',
  })
  printJson({ ok: true, ...result })
}

async function commandExternalReviewImport(flags) {
  if (!flags.input) {
    printJson({ ok: false, error: '需要 --input' })
    process.exitCode = 1
    return
  }
  const result = await importReviewBatch(String(flags.input), {
    dryRun: flags['dry-run'] === true,
    strict: flags.strict !== false,
  })
  printJson({ ok: result.errors.length === 0, ...result })
  if (result.errors.length) process.exitCode = 1
}

async function commandExternalAuthors(flags) {
  const registry = await loadAuthorRegistry()
  if (flags.set && flags.weight != null) {
    applyAuthorPrior(registry, String(flags.set), Number(flags.weight), flags.notes ?? '')
    if (flags.commit === true) await saveAuthorRegistry(registry)
    printJson({ ok: true, authorId: flags.set, weight: Number(flags.weight), committed: flags.commit === true })
    return
  }
  const authors = listAuthors(registry, {
    unreviewedOnly: flags['unreviewed-only'] === true,
    excludeUnknown: flags['exclude-unknown'] === true,
  })
  printJson({
    ok: true,
    count: authors.length,
    authors: authors.slice(0, Number(flags.limit ?? 50)).map((a) => ({
      authorId: a.authorId,
      displayName: a.displayName,
      articleCount: a.articleIds.length,
      themeDomainCounts: a.derivedStatistics.themeDomainCounts,
      meanArticleWeight: a.derivedStatistics.meanArticleWeight,
      userPrior: a.userPrior,
    })),
  })
}

async function commandExternalValidate() {
  const result = await validateExternalRegistries()
  printJson(result)
  if (!result.ok) process.exitCode = 1
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]
  switch (command) {
    case 'validate':
      return commandValidate()
    case 'status':
      return commandStatus()
    case 'health':
      return commandHealth(args.flags)
    case 'draft':
      return commandDraft(args.flags)
    case 'compare':
      return commandCompare(args.flags)
    case 'assets-validate':
      return commandAssetsValidate()
    case 'assets-register':
      return commandAssetsRegister(args.flags)
    case 'calibration-create':
      return commandCalibrationCreate(args.flags)
    case 'pin':
      return commandPin(args.flags)
    case 'remind-gaps':
      return commandRemind(args.flags)
    case 'sync-golden':
      return commandSyncGolden(args.flags)
    case 'style-validate':
      return commandStyleValidate()
    case 'style-query':
      return commandStyleQuery(args.flags)
    case 'style-search':
      return commandStyleSearch(args.flags)
    case 'style-pack':
      return commandStylePack(args.flags)
    case 'style-explain':
      return commandStyleExplain(args.flags)
    case 'style-feedback':
      return commandStyleFeedback(args.flags)
    case 'style-sheet-draft':
      return commandStyleSheetDraft(args.flags)
    case 'style-sheet-approve':
      return commandStyleSheetApprove(args.flags)
    case 'external-inventory':
      return commandExternalInventory(args.flags)
    case 'external-review-export':
      return commandExternalReviewExport(args.flags)
    case 'external-review-import':
      return commandExternalReviewImport(args.flags)
    case 'external-authors':
      return commandExternalAuthors(args.flags)
    case 'external-validate':
      return commandExternalValidate()
    default:
      console.error(`未知命令：${command ?? '(empty)'}
用法: node scripts/writing-model/writing-model.mjs <validate|status|health|draft|compare|assets-*|calibration-create|pin|remind-gaps|sync-golden|style-*|external-*>`)
      process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(redactText(error.stack || error.message))
    process.exitCode = 1
  })
}

export {
  commandValidate,
  commandStatus,
  commandDraft,
  commandCompare,
  remindOpenGaps,
}
