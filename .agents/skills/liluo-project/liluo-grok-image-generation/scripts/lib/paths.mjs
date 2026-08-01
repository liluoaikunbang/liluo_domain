import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function findRepoRoot(start) {
  let current = start
  while (true) {
    if (fs.existsSync(path.join(current, 'package.json')) && fs.existsSync(path.join(current, '.agents'))) {
      return current
    }
    const parent = path.dirname(current)
    if (parent === current) throw new Error('Unable to locate repository root from Grok image skill')
    current = parent
  }
}

const HERE = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = findRepoRoot(HERE)
export const ENV_LOCAL_FILE = '.env.grok-image.local'
export const ENV_EXAMPLE_FILE = '.env.grok-image.example'
export const DEFAULT_OUTPUT_DIR = path.join(os.tmpdir(), 'liluo-grok-images')
export const ALLOWED_ENV_KEYS = Object.freeze([
  'LILUO_GROK_IMAGE_BASE_URL',
  'LILUO_GROK_IMAGE_API_KEY',
  'LILUO_GROK_IMAGE_MODEL',
  'LILUO_GROK_IMAGE_LOCAL_PROXY_URL',
  'LILUO_GROK_IMAGE_DNS_RESULT_ORDER',
])

export function repoPath(...parts) {
  return path.join(ROOT, ...parts)
}

export function toPosixRelative(targetPath) {
  const relative = path.relative(ROOT, targetPath)
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative.split(path.sep).join('/')
  }
  return path.normalize(targetPath).split(path.sep).join('/')
}

function isWithin(base, target) {
  const relative = path.relative(base, target)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

export function resolveUserPath(targetPath, options = {}) {
  const absolute = path.isAbsolute(targetPath) ? path.normalize(targetPath) : repoPath(targetPath)
  if (isWithin(ROOT, absolute)) return absolute
  if (options.allowTmp !== false && isWithin(os.tmpdir(), absolute)) return absolute
  throw new Error(`Path must stay inside the repository or system temp directory: ${targetPath}`)
}
