import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { getModelById, normalizeBaseUrl, assertUrlPolicy, validateGenerationOverrides } from './config.mjs'
import { getModelEnv, isModelConfigured, loadWritingEnv } from './env.mjs'
import { normalizeChatCompletionResponse } from './response-normalizer.mjs'
import { createRunId } from './run-manifest.mjs'
import { redactText, summarizeHost } from './redaction.mjs'
import { repoPath } from './paths.mjs'

function classifyHttpError(status) {
  if (status === 401 || status === 403) return { retryable: false, code: 'AUTH_ERROR' }
  if (status === 404) return { retryable: false, code: 'NOT_FOUND' }
  if (status === 400) return { retryable: false, code: 'BAD_REQUEST' }
  if (status === 429 || status >= 500) return { retryable: true, code: status === 429 ? 'RATE_LIMIT' : 'SERVER_ERROR' }
  return { retryable: false, code: 'HTTP_ERROR' }
}

export async function loadMockResponse(modelId) {
  const file =
    modelId === 'zhi-create-qwen3-32b'
      ? 'scripts/writing-model/fixtures/mock-qwen3-response.json'
      : 'scripts/writing-model/fixtures/mock-dsr1-response.json'
  return JSON.parse(await readFile(repoPath(file), 'utf8'))
}

export async function chatCompletion(options) {
  const {
    registry,
    modelId,
    messages,
    mode = 'mock',
    overrides = {},
    requestContractId = null,
    styleReferenceIds = [],
    inputSources = [],
    extraBody = {},
    fetchImpl = globalThis.fetch,
  } = options

  const model = getModelById(registry, modelId)
  if (!model) {
    const error = new Error(`未知模型：${modelId}`)
    error.code = 'UNKNOWN_MODEL'
    throw error
  }

  const generation = {
    ...model.generation,
    ...validateGenerationOverrides(overrides),
  }
  const runId = createRunId()
  const createdAt = new Date().toISOString()
  const parameters = {
    temperature: generation.temperature,
    topP: generation.topP,
    maxTokens: generation.maxTokens,
    thinkingMode: model.thinking.mode,
  }

  if (mode !== 'live') {
    const payload = await loadMockResponse(model.id)
    const normalized = normalizeChatCompletionResponse(payload)
    return {
      runId,
      modelProfile: model.id,
      servedModel: model.defaultServedModel,
      provider: 'openai-compatible',
      createdAt,
      requestContractId,
      parameters,
      mode: 'mock',
      endpointHostSummary: 'mock://local',
      styleReferenceIds,
      inputSources,
      draft: normalized.draft,
      usage: normalized.usage,
      reasoningStored: false,
      warnings: [...normalized.warnings, '使用 mock 响应，未访问网络'],
      responseMetadata: normalized.responseMetadata,
      rawPayload: payload,
    }
  }

  const env = await loadWritingEnv(options)
  const triplet = getModelEnv(env.values, model)
  if (!isModelConfigured(triplet)) {
    const error = new Error(`${model.displayName} 未配置完整凭据（baseUrl/apiKey/servedModel）`)
    error.code = 'MODEL_UNCONFIGURED'
    throw error
  }

  const normalizedUrls = normalizeBaseUrl(triplet.baseUrl, registry.protocol.endpoint)
  assertUrlPolicy(normalizedUrls.chatCompletionsUrl, registry.protocol)
  const hostSummary = summarizeHost(normalizedUrls.chatCompletionsUrl)

  const allow = new Set(model.extraBodyAllowlist ?? [])
  const safeExtra = {}
  for (const [key, value] of Object.entries(extraBody ?? {})) {
    if (allow.has(key)) safeExtra[key] = value
  }

  const body = {
    model: triplet.servedModel,
    messages,
    temperature: generation.temperature,
    top_p: generation.topP,
    max_tokens: generation.maxTokens,
    stream: false,
    ...safeExtra,
  }

  const maxAttempts = (registry.retry?.maxAttempts ?? 2) + 1
  const backoff = registry.retry?.backoffMs ?? [500, 1500]
  const retryCodes = new Set(registry.retry?.retryStatusCodes ?? [429, 500, 502, 503, 504])
  const requestMs = registry.timeouts?.requestMs ?? 120000

  let lastError = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), requestMs)
    try {
      const response = await fetchImpl(normalizedUrls.chatCompletionsUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${triplet.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: 'manual',
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) assertUrlPolicy(new URL(location, normalizedUrls.chatCompletionsUrl).toString(), registry.protocol)
      }

      const text = await response.text()
      if (!response.ok) {
        const classified = classifyHttpError(response.status)
        const error = new Error(
          redactText(`${model.id} 调用失败 HTTP ${response.status} @ ${hostSummary}：${text.slice(0, 200)}`),
        )
        error.code = classified.code
        error.status = response.status
        error.retryable = classified.retryable && retryCodes.has(response.status)
        lastError = error
        if (!error.retryable || attempt >= maxAttempts) throw error
        await delay(backoff[Math.min(attempt - 1, backoff.length - 1)] ?? 1000)
        continue
      }

      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        const error = new Error(`${model.id} 返回非 JSON`)
        error.code = 'INVALID_RESPONSE_JSON'
        throw error
      }

      const normalized = normalizeChatCompletionResponse(payload)
      return {
        runId,
        modelProfile: model.id,
        servedModel: triplet.servedModel,
        provider: 'openai-compatible',
        createdAt,
        requestContractId,
        parameters,
        mode: 'live',
        endpointHostSummary: hostSummary,
        styleReferenceIds,
        inputSources,
        draft: normalized.draft,
        usage: normalized.usage,
        reasoningStored: false,
        warnings: normalized.warnings,
        responseMetadata: normalized.responseMetadata,
        rawPayload: payload,
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`${model.id} 请求超时（${requestMs}ms）@ ${hostSummary}`)
        timeoutError.code = 'TIMEOUT'
        throw timeoutError
      }
      if (error.retryable && attempt < maxAttempts) {
        lastError = error
        await delay(backoff[Math.min(attempt - 1, backoff.length - 1)] ?? 1000)
        continue
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new Error('未知调用失败')
}

export async function healthCheckModel(registry, modelId, options = {}) {
  const model = getModelById(registry, modelId)
  const env = await loadWritingEnv(options)
  const triplet = getModelEnv(env.values, model)
  if (!isModelConfigured(triplet)) {
    return { id: modelId, status: 'unconfigured', ok: false, detail: '缺少凭据' }
  }
  try {
    const result = await chatCompletion({
      registry,
      modelId,
      mode: 'live',
      messages: [
        { role: 'user', content: '请只回复两个字：健康' },
      ],
      fetchImpl: options.fetchImpl,
    })
    return {
      id: modelId,
      status: 'healthy',
      ok: true,
      detail: `收到正文 ${result.draft.length} 字`,
      hostSummary: result.endpointHostSummary,
      servedModel: result.servedModel,
    }
  } catch (error) {
    return {
      id: modelId,
      status: 'failed',
      ok: false,
      detail: redactText(error.message),
      code: error.code ?? null,
    }
  }
}
