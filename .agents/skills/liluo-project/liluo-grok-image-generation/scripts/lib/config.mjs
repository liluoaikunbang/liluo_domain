export const DEFAULT_ASPECT_RATIO = '1:1'
export const DEFAULT_RESOLUTION = 'auto'
export const DEFAULT_COUNT = 1
export const SUPPORTED_ASPECT_RATIOS = Object.freeze(new Set([
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
]))

export function normalizeBaseUrl(baseUrl, endpointPath = '/v1/images/generations') {
  if (!baseUrl || !String(baseUrl).trim()) throw new Error('Missing Grok image base URL')
  let raw = String(baseUrl).trim().replace(/\/+$/, '')
  if (raw.endsWith('/v1/images/generations')) raw = raw.slice(0, -'/v1/images/generations'.length)
  if (raw.endsWith('/images/generations')) raw = raw.slice(0, -'/images/generations'.length)
  if (!raw.endsWith('/v1')) raw = `${raw}/v1`
  const endpoint = endpointPath.startsWith('/v1/') ? endpointPath.slice(3) : endpointPath
  return {
    apiRoot: raw,
    imagesUrl: `${raw}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    modelsUrl: `${raw}/models`,
  }
}

export function assertUrlPolicy(urlString, protocolPolicy = { remoteHttpsRequired: true, localhostHttpAllowed: true }) {
  let url
  try {
    url = new URL(urlString)
  } catch {
    const error = new Error(`Invalid URL: ${urlString}`)
    error.code = 'INVALID_URL'
    throw error
  }
  const host = url.hostname.toLowerCase()
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1'
  if (url.protocol === 'https:') return { url, isLocal }
  if (url.protocol === 'http:' && isLocal && protocolPolicy.localhostHttpAllowed) return { url, isLocal }
  if (url.protocol === 'http:' && protocolPolicy.remoteHttpsRequired) {
    const error = new Error(`Remote endpoint must use HTTPS: ${url.protocol}//${url.host}`)
    error.code = 'INSECURE_REMOTE_URL'
    throw error
  }
  const error = new Error(`Unsupported URL protocol: ${url.protocol}`)
  error.code = 'UNSUPPORTED_URL_PROTOCOL'
  throw error
}

export function normalizeAspectRatio(value = DEFAULT_ASPECT_RATIO) {
  const normalized = String(value || DEFAULT_ASPECT_RATIO).trim()
  if (!SUPPORTED_ASPECT_RATIOS.has(normalized)) {
    throw new Error(`Unsupported aspect ratio: ${normalized}`)
  }
  return normalized
}

export function normalizeResolution(value = DEFAULT_RESOLUTION) {
  const normalized = String(value || DEFAULT_RESOLUTION).trim().toLowerCase()
  if (normalized === 'auto') return 'auto'
  if (!/^\d{3,5}x\d{3,5}$/u.test(normalized)) throw new Error(`Unsupported resolution: ${value}`)
  return normalized
}

export function normalizeCount(value = DEFAULT_COUNT) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_COUNT), 10)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 4) {
    throw new Error('Image count must be between 1 and 4')
  }
  return parsed
}

export function summarizeHost(urlString) {
  const url = new URL(urlString)
  return `${url.protocol}//${url.host}${url.pathname}`
}

export function sanitizeSlug(input, fallback = 'grok-image') {
  const normalized = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

export function deriveSlugFromPrompt(prompt) {
  const firstWords = String(prompt)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join('-')
  return sanitizeSlug(firstWords, 'grok-image')
}

export function timestampId(isoString = new Date().toISOString()) {
  return isoString.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z').replace('T', '-')
}
