/**
 * Redact secrets from strings and structured values before logging or archival.
 */

const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-+/=]+/gi
const KEY_VALUE_RE = /(LILUO_WRITER_(?:DSR1|QWEN3)_API_KEY\s*[=:]\s*)([^\s"',]+)/gi
const AUTHORIZATION_HEADER_RE = /("?authorization"?\s*[:=]\s*"?)Bearer\s+[^"'\s,}]+/gi

export function redactText(text) {
  if (typeof text !== 'string') return text
  return text
    .replace(BEARER_RE, 'Bearer ***REDACTED***')
    .replace(AUTHORIZATION_HEADER_RE, '$1Bearer ***REDACTED***')
    .replace(KEY_VALUE_RE, '$1***REDACTED***')
}

export function redactValue(value, depth = 0) {
  if (depth > 8) return '[truncated]'
  if (typeof value === 'string') return redactText(value)
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) {
      const lower = key.toLowerCase()
      if (lower.includes('apikey') || lower.includes('api_key') || lower === 'authorization' || lower === 'token') {
        out[key] = '***REDACTED***'
      } else {
        out[key] = redactValue(item, depth + 1)
      }
    }
    return out
  }
  return value
}

export function summarizeHost(baseUrl) {
  if (!baseUrl) return null
  try {
    const url = new URL(baseUrl)
    return `${url.protocol}//${url.host}`
  } catch {
    return '[invalid-url]'
  }
}
