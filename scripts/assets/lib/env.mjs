import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { ALLOWED_ENV_KEYS, ENV_LOCAL_FILE, repoPath } from './paths.mjs'

const DEFAULTS = Object.freeze({
  LILUO_ASSET_R2_ACCOUNT_ID: '',
  LILUO_ASSET_R2_ACCESS_KEY_ID: '',
  LILUO_ASSET_R2_SECRET_ACCESS_KEY: '',
  LILUO_ASSET_R2_BUCKET: 'liluo-universe-assets',
  LILUO_ASSET_R2_REGION: 'auto',
  LILUO_ASSET_R2_ENDPOINT: '',
  LILUO_ASSET_R2_PUBLIC_BASE_URL: '',
})

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function loadAssetEnv(options = {}) {
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
        warnings.push(`ignored malformed env line: ${line.slice(0, 60)}`)
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

function trimTrailingSlash(value) {
  return value.replace(/\/+$/u, '')
}

export function getR2Config(values) {
  const accountId = values.LILUO_ASSET_R2_ACCOUNT_ID || ''
  const endpoint = trimTrailingSlash(values.LILUO_ASSET_R2_ENDPOINT || '')
    || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
  const publicBaseUrl = trimTrailingSlash(values.LILUO_ASSET_R2_PUBLIC_BASE_URL || '')

  return {
    accountId,
    accessKeyId: values.LILUO_ASSET_R2_ACCESS_KEY_ID || '',
    secretAccessKey: values.LILUO_ASSET_R2_SECRET_ACCESS_KEY || '',
    bucket: values.LILUO_ASSET_R2_BUCKET || DEFAULTS.LILUO_ASSET_R2_BUCKET,
    region: values.LILUO_ASSET_R2_REGION || DEFAULTS.LILUO_ASSET_R2_REGION,
    endpoint,
    publicBaseUrl,
  }
}

export function isR2Configured(config) {
  return Boolean(
    config.accessKeyId?.trim()
    && config.secretAccessKey?.trim()
    && config.bucket?.trim()
    && config.endpoint?.trim(),
  )
}
