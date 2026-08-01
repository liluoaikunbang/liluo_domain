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
    if (parent === current) throw new Error('Unable to locate repository root from asset manager')
    current = parent
  }
}

const HERE = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = findRepoRoot(HERE)
export const ENV_LOCAL_FILE = '.env.assets.local'
export const ENV_EXAMPLE_FILE = '.env.assets.example'
export const DEFAULT_MANIFEST_FILE = 'docs/assets/registry/website-r2-manifest.json'
export const DEFAULT_STAGING_DIR = path.join(os.tmpdir(), 'liluo-asset-manager-staging')
export const ALLOWED_ENV_KEYS = Object.freeze([
  'LILUO_ASSET_R2_ACCOUNT_ID',
  'LILUO_ASSET_R2_ACCESS_KEY_ID',
  'LILUO_ASSET_R2_SECRET_ACCESS_KEY',
  'LILUO_ASSET_R2_BUCKET',
  'LILUO_ASSET_R2_REGION',
  'LILUO_ASSET_R2_ENDPOINT',
  'LILUO_ASSET_R2_PUBLIC_BASE_URL',
])

export function repoPath(...parts) {
  return path.join(ROOT, ...parts)
}

export function toPosixPath(targetPath) {
  return targetPath.split(path.sep).join('/')
}

export function toRepoRelative(targetPath) {
  const relative = path.relative(ROOT, targetPath)
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) return toPosixPath(relative)
  return toPosixPath(path.normalize(targetPath))
}

function isWithin(base, target) {
  const relative = path.relative(base, target)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

export function resolveRepoPath(targetPath, options = {}) {
  const absolute = path.isAbsolute(targetPath) ? path.normalize(targetPath) : repoPath(targetPath)
  if (isWithin(ROOT, absolute)) return absolute
  if (options.allowTmp !== false && isWithin(os.tmpdir(), absolute)) return absolute
  throw new Error(`Path must stay inside the repository or system temp directory: ${targetPath}`)
}
