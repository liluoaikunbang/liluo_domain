import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { assertUrlPolicy, normalizeAspectRatio, normalizeBaseUrl, normalizeCount, normalizeResolution, summarizeHost } from './config.mjs'

function classifyHttpError(status) {
  if (status === 401 || status === 403) return { retryable: false, code: 'AUTH_ERROR' }
  if (status === 404) return { retryable: false, code: 'NOT_FOUND' }
  if (status === 400) return { retryable: false, code: 'BAD_REQUEST' }
  if (status === 429 || status >= 500) return { retryable: true, code: status === 429 ? 'RATE_LIMIT' : 'SERVER_ERROR' }
  return { retryable: false, code: 'HTTP_ERROR' }
}

function describeNetworkCause(error) {
  const parts = [error?.cause?.code, error?.cause?.message].filter(Boolean)
  return parts.length ? ` (${parts.join(': ')})` : ''
}

function toNetworkError(error, hostSummary, requestMs = null) {
  if (error?.name === 'AbortError') {
    const timeout = new Error(requestMs
      ? `Grok image request timed out after ${requestMs}ms @ ${hostSummary}`
      : `Grok image request timed out after reaching ${hostSummary}`)
    timeout.code = 'TIMEOUT'
    return timeout
  }
  if (error?.message === 'fetch failed') {
    const network = new Error(`Grok image request could not reach ${hostSummary}${describeNetworkCause(error)}`)
    network.code = 'NETWORK_ERROR'
    return network
  }
  return error
}

export function detectImageExtension(bytes) {
  if (bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47) {
    return '.png'
  }
  if (bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff) {
    return '.jpg'
  }
  if (bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP') {
    return '.webp'
  }
  return '.bin'
}

export async function generateImages(options) {
  const {
    prompt,
    config,
    aspectRatio,
    resolution,
    count,
    fetchImpl = globalThis.fetch,
    requestMs = 120000,
    maxAttempts = 3,
    backoffMs = [500, 1500],
  } = options

  if (!prompt || !String(prompt).trim()) throw new Error('Prompt is required')
  if (!config?.apiKey?.trim()) {
    const error = new Error('Grok image API key is not configured')
    error.code = 'API_KEY_MISSING'
    throw error
  }
  if (typeof fetchImpl !== 'function') throw new Error('fetch is not available in this runtime')

  const normalizedUrls = normalizeBaseUrl(config.baseUrl)
  assertUrlPolicy(normalizedUrls.imagesUrl)
  const hostSummary = summarizeHost(normalizedUrls.imagesUrl)
  const body = {
    model: config.model,
    prompt: String(prompt).trim(),
    n: normalizeCount(count),
    response_format: 'b64_json',
    aspect_ratio: normalizeAspectRatio(aspectRatio),
  }
  const normalizedResolution = normalizeResolution(resolution)
  if (normalizedResolution !== 'auto') body.resolution = normalizedResolution

  let lastError = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), requestMs)
    try {
      const response = await fetchImpl(normalizedUrls.imagesUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: 'manual',
      })

      const text = await response.text()
      if (!response.ok) {
        const classified = classifyHttpError(response.status)
        const error = new Error(`Grok image request failed HTTP ${response.status} @ ${hostSummary}: ${text.slice(0, 200)}`)
        error.code = classified.code
        error.retryable = classified.retryable
        error.status = response.status
        lastError = error
        if (!classified.retryable || attempt >= maxAttempts) throw error
        await delay(backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 1000)
        continue
      }

      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        const error = new Error('Grok image endpoint returned non-JSON payload')
        error.code = 'INVALID_RESPONSE_JSON'
        throw error
      }

      const items = Array.isArray(payload.data) ? payload.data : []
      if (!items.length) {
        const error = new Error('Grok image endpoint returned no image data')
        error.code = 'EMPTY_IMAGE_DATA'
        throw error
      }

      const images = items.map((item, index) => {
        const encoded = item?.b64_json ?? item?.b64Json
        if (!encoded) {
          const error = new Error(`Image payload ${index + 1} is missing b64_json`)
          error.code = 'MISSING_B64_IMAGE'
          throw error
        }
        const bytes = Buffer.from(encoded, 'base64')
        return {
          index,
          bytes,
          extension: detectImageExtension(bytes),
          sha256: createHash('sha256').update(bytes).digest('hex'),
          revisedPrompt: item?.revised_prompt ?? item?.revisedPrompt ?? null,
        }
      })

      return {
        createdAt: new Date().toISOString(),
        provider: 'xai',
        endpointHostSummary: hostSummary,
        request: {
          model: config.model,
          prompt: String(prompt).trim(),
          aspectRatio: body.aspect_ratio,
          resolution: normalizedResolution,
          count: body.n,
        },
        revisedPrompt: images.find((item) => item.revisedPrompt)?.revisedPrompt ?? null,
        responseMetadata: {
          created: payload.created ?? null,
        },
        images,
        rawPayload: payload,
      }
    } catch (error) {
      if (error.name === 'AbortError' || error?.message === 'fetch failed') throw toNetworkError(error, hostSummary, requestMs)
      if (error.retryable && attempt < maxAttempts) {
        lastError = error
        await delay(backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 1000)
        continue
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error('Unknown Grok image request failure')
}

export async function probeApi(options) {
  const {
    config,
    fetchImpl = globalThis.fetch,
    requestMs = 10000,
  } = options

  if (typeof fetchImpl !== 'function') throw new Error('fetch is not available in this runtime')

  const normalizedUrls = normalizeBaseUrl(config.baseUrl)
  assertUrlPolicy(normalizedUrls.modelsUrl)
  const hostSummary = summarizeHost(normalizedUrls.modelsUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), requestMs)

  try {
    const headers = { accept: 'application/json' }
    if (config?.apiKey?.trim()) headers.authorization = `Bearer ${config.apiKey}`
    const response = await fetchImpl(normalizedUrls.modelsUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'manual',
    })
    const text = await response.text()

    return {
      createdAt: new Date().toISOString(),
      endpointHostSummary: hostSummary,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      bodyPreview: text.slice(0, 200),
      authenticated: Boolean(config?.apiKey?.trim()),
    }
  } catch (error) {
    throw toNetworkError(error, hostSummary, requestMs)
  } finally {
    clearTimeout(timer)
  }
}
