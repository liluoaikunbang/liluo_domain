import { readFile } from 'node:fs/promises'
import {
  STYLE_RAG_POLICY_PATH,
  STYLE_TAXONOMY_PATH,
  repoPath,
} from './paths.mjs'

export async function loadStyleRagPolicy() {
  return JSON.parse(await readFile(repoPath(STYLE_RAG_POLICY_PATH), 'utf8'))
}

export async function loadStyleTaxonomy() {
  return JSON.parse(await readFile(repoPath(STYLE_TAXONOMY_PATH), 'utf8'))
}

export function validateScoringWeights(policy) {
  const values = Object.values(policy.scoring ?? {})
  const sum = values.reduce((a, b) => a + b, 0)
  const ok = Math.abs(sum - 1) < 1e-9
  return { ok, sum, errors: ok ? [] : [`scoring 权重总和应为 1，实际为 ${sum}`] }
}

export function assertNoCanonLeakage(query) {
  const forbiddenKeys = [
    'characterNames',
    'locationNames',
    'organizationNames',
    'itemNames',
    'abilityNames',
    'plotBeats',
    'worldRulesText',
    'dialogueQuotes',
    'apiKeys',
    'absolutePaths',
    'characters',
    'locations',
    'canonFacts',
    'sceneFacts',
  ]
  const leaks = forbiddenKeys.filter((key) => query[key] !== undefined)
  const textBlob = JSON.stringify(query)
  if (/[A-Za-z]:\\/.test(textBlob) || /\/Users\//.test(textBlob)) {
    leaks.push('absolutePaths-in-values')
  }
  return { ok: leaks.length === 0, leaks }
}

export async function validateStyleQuery(query, taxonomy = null) {
  const tax = taxonomy ?? (await loadStyleTaxonomy())
  const errors = []
  if (!query || query.schemaVersion !== 1) errors.push('schemaVersion 必须为 1')
  if (!String(query.queryId ?? '').startsWith('sq-')) errors.push('queryId 必须以 sq- 开头')
  if (!['explicit', 'metadata', 'hybrid-explicit'].includes(query.mode)) {
    errors.push(`mode 非法：${query.mode}`)
  }
  if (!tax.sceneFunctions.includes(query.primarySceneFunction)) {
    errors.push(`primarySceneFunction 不在受控枚举：${query.primarySceneFunction}`)
  }
  if (!tax.themeDomains.includes(query.themeDomain)) {
    errors.push(`themeDomain 不在受控枚举：${query.themeDomain}`)
  }
  const leak = assertNoCanonLeakage(query)
  if (!leak.ok) errors.push(`Style Query 含 Canon 字段：${leak.leaks.join(', ')}`)
  return { ok: errors.length === 0, errors }
}

export function createStyleQueryFromContract(contract, options = {}) {
  const expression = contract.expression ?? {}
  const scene = contract.scene ?? {}
  const query = {
    schemaVersion: 1,
    queryId: options.queryId ?? `sq-${Date.now().toString(36)}`,
    requestContractId: contract.requestId ?? null,
    targetModel: options.targetModel ?? null,
    mode: options.mode ?? (expression.styleReferenceIds?.length ? 'hybrid-explicit' : 'metadata'),
    primarySceneFunction: expression.primarySceneFunction ?? scene.sceneFunction ?? 'daily-interaction',
    sceneFunctions: expression.sceneFunctions ?? [expression.primarySceneFunction ?? scene.sceneFunction].filter(Boolean),
    worldType: expression.worldType ?? 'generic',
    themeDomain: expression.themeDomain ?? 'general-prose',
    restraintFunctions: expression.restraintFunctions ?? [],
    pov: expression.pov ?? 'third-person-limited',
    narrativeDistance: expression.narrativeDistance ?? 'close',
    tensionLevel: expression.tensionLevel ?? 'medium',
    actionDensity: expression.actionDensity ?? 'medium',
    dialogueDensity: expression.dialogueDensity ?? 'medium',
    psychologicalDensity: expression.psychologicalDensity ?? 'medium',
    descriptionDensity: expression.descriptionDensity ?? 'medium',
    informationRelease: expression.informationRelease ?? 'progressive',
    sentenceRhythm: expression.sentenceRhythm ?? 'varied',
    emotionExpression: expression.emotionExpression ?? 'observable-reaction',
    sensoryPriority: expression.sensoryPriority ?? [],
    languageIntensity: expression.languageIntensity ?? 'restrained',
    endingMode: expression.endingMode ?? 'unknown',
    explicitReferenceIds: expression.styleReferenceIds ?? [],
    excludedAssetIds: expression.excludedAssetIds ?? [],
    hardRules: expression.hardRules ?? [],
    modelKnownFailureModes: expression.modelKnownFailureModes ?? [],
  }
  // Strip any accidental canon keys if present on expression
  for (const key of Object.keys(query)) {
    if (['characterNames', 'locations', 'canonFacts'].includes(key)) delete query[key]
  }
  return query
}
