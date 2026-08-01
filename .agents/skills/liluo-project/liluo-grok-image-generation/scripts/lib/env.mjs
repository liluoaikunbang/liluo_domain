import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { ALLOWED_ENV_KEYS, ENV_LOCAL_FILE, repoPath } from './paths.mjs'

const DEFAULTS = Object.freeze({
  LILUO_GROK_IMAGE_BASE_URL: 'https://api.x.ai/v1',
  LILUO_GROK_IMAGE_API_KEY: '',
  LILUO_GROK_IMAGE_MODEL: 'grok-imagine-image-quality',
  LILUO_GROK_IMAGE_LOCAL_PROXY_URL: '',
  LILUO_GROK_IMAGE_DNS_RESULT_ORDER: '',
})

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function loadGrokEnv(options = {}) {
  const filePath = options.envFilePath ?? repoPath(ENV_LOCAL_FILE)
  const warnings = []
  const fromFile = {}

  if (await exists(filePath)) {
    const text = await readFile(filePath, 'utf8')
    const seen = new Set()
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq <= 0) {
        warnings.push(`ignored malformed env line: ${line.slice(0, 40)}`)
        continue
      }
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!ALLOWED_ENV_KEYS.includes(key)) {
        warnings.push(`ignored disallowed env key: ${key}`)
        continue
      }
      if (seen.has(key)) warnings.push(`duplicate env key in file: ${key}`)
      seen.add(key)
      fromFile[key] = value
    }
  }

  const values = {}
  for (const key of ALLOWED_ENV_KEYS) {
    if (Object.prototype.hasOwnProperty.call(process.env, key) && process.env[key] !== undefined) {
      values[key] = String(process.env[key])
    } else if (Object.prototype.hasOwnProperty.call(fromFile, key)) {
      values[key] = fromFile[key]
    } else {
      values[key] = DEFAULTS[key]
    }
  }

  return {
    values,
    warnings,
    sourceFile: (await exists(filePath)) ? filePath : null,
  }
}

export function getGrokConfig(values) {
  return {
    baseUrl: values.LILUO_GROK_IMAGE_BASE_URL || DEFAULTS.LILUO_GROK_IMAGE_BASE_URL,
    apiKey: values.LILUO_GROK_IMAGE_API_KEY || '',
    model: values.LILUO_GROK_IMAGE_MODEL || DEFAULTS.LILUO_GROK_IMAGE_MODEL,
    localProxyUrl: values.LILUO_GROK_IMAGE_LOCAL_PROXY_URL || '',
    dnsResultOrder: values.LILUO_GROK_IMAGE_DNS_RESULT_ORDER || '',
  }
}

export function isGrokConfigured(config) {
  return Boolean(config.apiKey?.trim())
}
