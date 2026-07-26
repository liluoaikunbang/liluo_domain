import { readFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { ALLOWED_ENV_KEYS, ENV_LOCAL_FILE, repoPath } from './paths.mjs'

async function exists(file) {
  try {
    await access(file, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Load only the six allowed writing-model env vars.
 * Process env wins over .env.writing.local. No command substitution.
 */
export async function loadWritingEnv(options = {}) {
  const warnings = []
  const fromFile = {}
  const filePath = options.envFilePath ?? repoPath(ENV_LOCAL_FILE)

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
      values[key] = ''
    }
  }

  return { values, warnings, sourceFile: (await exists(filePath)) ? filePath : null }
}

export function getModelEnv(values, model) {
  return {
    baseUrl: values[model.env.baseUrl] ?? '',
    apiKey: values[model.env.apiKey] ?? '',
    servedModel: values[model.env.servedModel] || model.defaultServedModel,
  }
}

export function isModelConfigured(envTriplet) {
  return Boolean(envTriplet.baseUrl?.trim() && envTriplet.apiKey?.trim() && envTriplet.servedModel?.trim())
}
