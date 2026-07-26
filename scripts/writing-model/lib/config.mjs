import { readFile } from 'node:fs/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { WRITING_MODELS_PATH, repoPath } from './paths.mjs'
import { getModelEnv, isModelConfigured, loadWritingEnv } from './env.mjs'
import { summarizeHost } from './redaction.mjs'

export async function loadWritingModelsRegistry() {
  const file = repoPath(WRITING_MODELS_PATH)
  return JSON.parse(await readFile(file, 'utf8'))
}

export function resolveModelAlias(registry, selector) {
  if (!selector) return null
  const key = String(selector).trim().toLowerCase()
  if (key === 'both') return 'both'
  for (const model of registry.models) {
    if (model.id === key) return model.id
    if ((model.aliases ?? []).map((item) => item.toLowerCase()).includes(key)) return model.id
  }
  return null
}

export function getModelById(registry, id) {
  return registry.models.find((model) => model.id === id) ?? null
}

export function normalizeBaseUrl(baseUrl, chatPath = '/v1/chat/completions') {
  if (!baseUrl || !String(baseUrl).trim()) {
    const error = new Error('缺少 base URL')
    error.code = 'MISSING_BASE_URL'
    throw error
  }
  let raw = String(baseUrl).trim().replace(/\/+$/, '')
  if (raw.endsWith('/v1/chat/completions')) raw = raw.slice(0, -'/v1/chat/completions'.length)
  if (raw.endsWith('/chat/completions')) raw = raw.slice(0, -'/chat/completions'.length)
  if (!raw.endsWith('/v1')) {
    if (raw.endsWith('/v1/')) raw = raw.slice(0, -1)
    else raw = `${raw}/v1`
  }
  const root = raw.replace(/\/v1$/, '')
  const chat = `${raw}${chatPath.startsWith('/') ? chatPath.replace(/^\/v1/, '') : `/${chatPath}`}`
  // chatPath is /v1/chat/completions → with raw ending in /v1 → /v1/chat/completions
  const chatCompletionsUrl = `${raw}/chat/completions`
  const modelsUrl = `${raw}/models`
  return { apiRoot: raw, originRoot: root, chatCompletionsUrl, modelsUrl }
}

export function assertUrlPolicy(urlString, protocolPolicy) {
  let url
  try {
    url = new URL(urlString)
  } catch {
    const error = new Error(`无效 URL：${urlString}`)
    error.code = 'INVALID_URL'
    throw error
  }
  const host = url.hostname.toLowerCase()
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]'
  if (url.protocol === 'https:') return { url, isLocal }
  if (url.protocol === 'http:' && isLocal && protocolPolicy.localhostHttpAllowed) return { url, isLocal }
  if (url.protocol === 'http:' && protocolPolicy.remoteHttpsRequired) {
    const error = new Error(`远程 endpoint 必须使用 HTTPS：${url.protocol}//${url.host}`)
    error.code = 'INSECURE_REMOTE_URL'
    throw error
  }
  const error = new Error(`不支持的 URL 协议：${url.protocol}`)
  error.code = 'UNSUPPORTED_URL_PROTOCOL'
  throw error
}

export function validateGenerationOverrides(overrides = {}) {
  const out = {}
  if (overrides.temperature !== undefined) {
    const value = Number(overrides.temperature)
    if (!Number.isFinite(value) || value < 0 || value > 2) throw new Error('temperature 必须在 0–2')
    out.temperature = value
  }
  if (overrides.topP !== undefined) {
    const value = Number(overrides.topP)
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('topP 必须在 0–1')
    out.topP = value
  }
  if (overrides.maxTokens !== undefined) {
    const value = Number.parseInt(String(overrides.maxTokens), 10)
    if (!Number.isFinite(value) || value < 1 || value > 32768) throw new Error('maxTokens 必须在 1–32768')
    out.maxTokens = value
  }
  return out
}

export async function computeRuntimeStatus(options = {}) {
  const registry = options.registry ?? await loadWritingModelsRegistry()
  const env = options.env ?? await loadWritingEnv(options)
  const models = registry.models.map((model) => {
    const triplet = getModelEnv(env.values, model)
    const configured = isModelConfigured(triplet)
    let hostSummary = null
    let urlError = null
    if (triplet.baseUrl) {
      try {
        const normalized = normalizeBaseUrl(triplet.baseUrl, registry.protocol.endpoint)
        assertUrlPolicy(normalized.chatCompletionsUrl, registry.protocol)
        hostSummary = summarizeHost(normalized.chatCompletionsUrl)
      } catch (error) {
        urlError = error.message
      }
    }
    return {
      id: model.id,
      displayName: model.displayName,
      repository: model.repository,
      configured,
      servedModel: triplet.servedModel || model.defaultServedModel,
      hostSummary,
      urlError,
      hasApiKey: Boolean(triplet.apiKey?.trim()),
      emptyApiKey: configured ? false : Boolean(triplet.baseUrl?.trim()) && !triplet.apiKey?.trim(),
    }
  })
  const configuredCount = models.filter((item) => item.configured && !item.urlError).length
  let status = 'unconfigured'
  if (configuredCount === 0) status = 'unconfigured'
  else if (configuredCount === 1) status = 'degraded'
  else status = 'configured'
  return {
    status,
    models,
    warnings: env.warnings,
    defaults: registry.defaults,
    protocol: registry.protocol,
  }
}

export function validateRegistryShape(registry) {
  const errors = []
  if (registry.policyId !== 'liluo-open-weight-writing-models') errors.push('policyId 不正确')
  if (!Array.isArray(registry.models) || registry.models.length !== 2) errors.push('必须恰好两个正式模型')
  const ids = new Set()
  const repos = new Set()
  for (const model of registry.models ?? []) {
    if (ids.has(model.id)) errors.push(`重复模型 id：${model.id}`)
    ids.add(model.id)
    if (repos.has(model.repository)) errors.push(`重复仓库：${model.repository}`)
    repos.add(model.repository)
    if (model.license !== 'apache-2.0') errors.push(`${model.id} license 必须为 apache-2.0`)
  }
  const expected = ['Zhihu-ai/Zhi-Create-DSR1-14B', 'Zhihu-ai/Zhi-Create-Qwen3-32B']
  for (const repo of expected) {
    if (![...repos].includes(repo)) errors.push(`缺少固定仓库 ${repo}`)
  }
  if (registry.models?.length > 2) errors.push('不得登记第三个正式候选模型')
  return errors
}

export async function validateAgainstSchema(data, schemaRelativePath) {
  const schema = JSON.parse(await readFile(repoPath(schemaRelativePath), 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  const ok = validate(data)
  return { ok, errors: ok ? [] : (validate.errors ?? []).map((item) => `${item.instancePath || '/'} ${item.message}`) }
}
