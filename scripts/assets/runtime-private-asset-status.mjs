import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, repoPath, toRepoRelative } from './lib/paths.mjs'

const DEFAULT_ENV_LOCAL_FILE = '.env.runtime-assets.local'
const DEFAULT_MANIFEST_FILE = 'docs/assets/registry/runtime-private-asset-manifest.json'
const ALLOWED_ENV_KEYS = new Set([
  'LILUO_RUNTIME_ASSET_PROVIDER',
  'LILUO_RUNTIME_ASSET_SYNC_ROOT',
  'LILUO_RUNTIME_ASSET_MANIFEST',
])

function usage() {
  return [
    'Usage:',
    '  node scripts/assets/runtime-private-asset-status.mjs',
    '  node scripts/assets/runtime-private-asset-status.mjs --env-file <path>',
    '  node scripts/assets/runtime-private-asset-status.mjs --manifest <path>',
  ].join('\n')
}

function parseArgs(argv) {
  const options = {
    envFile: DEFAULT_ENV_LOCAL_FILE,
    manifest: DEFAULT_MANIFEST_FILE,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--env-file') {
      options.envFile = argv[index + 1]
      index += 1
      continue
    }
    if (item === '--manifest') {
      options.manifest = argv[index + 1]
      index += 1
      continue
    }
    if (item === '--help') throw new Error(usage())
    throw new Error(`Unknown argument: ${item}`)
  }
  return options
}

function roundMb(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2))
}

function fileExists(targetPath) {
  return fs.existsSync(targetPath)
}

function resolveFromRoot(root, targetPath) {
  return path.isAbsolute(targetPath) ? path.normalize(targetPath) : path.join(root, targetPath)
}

function loadEnvFile(filePath) {
  const values = {
    LILUO_RUNTIME_ASSET_PROVIDER: 'nutstore',
    LILUO_RUNTIME_ASSET_SYNC_ROOT: '',
    LILUO_RUNTIME_ASSET_MANIFEST: '',
  }
  const warnings = []

  if (!fileExists(filePath)) {
    return {
      values,
      warnings,
      sourceFile: null,
    }
  }

  const text = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/u)) {
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
    if (!ALLOWED_ENV_KEYS.has(key)) {
      warnings.push(`ignored disallowed env key: ${key}`)
      continue
    }
    values[key] = value
  }

  return {
    values,
    warnings,
    sourceFile: filePath,
  }
}

function walkDirectory(directory) {
  let fileCount = 0
  let totalBytes = 0

  if (!fileExists(directory)) {
    return {
      exists: false,
      fileCount,
      totalBytes,
      totalMb: 0,
    }
  }

  const stack = [directory]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }
      const stat = fs.statSync(fullPath)
      fileCount += 1
      totalBytes += stat.size
    }
  }

  return {
    exists: true,
    fileCount,
    totalBytes,
    totalMb: roundMb(totalBytes),
  }
}

function loadManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

export function buildRuntimePrivateAssetStatus(options = {}) {
  const root = path.resolve(options.root ?? ROOT)
  const envFilePath = resolveFromRoot(root, options.envFile ?? DEFAULT_ENV_LOCAL_FILE)
  const env = loadEnvFile(envFilePath)
  const manifestSetting = env.values.LILUO_RUNTIME_ASSET_MANIFEST || options.manifest || DEFAULT_MANIFEST_FILE
  const manifestPath = resolveFromRoot(root, manifestSetting)
  const manifest = loadManifest(manifestPath)
  const provider = env.values.LILUO_RUNTIME_ASSET_PROVIDER || manifest.provider?.type || 'nutstore'
  const syncRoot = env.values.LILUO_RUNTIME_ASSET_SYNC_ROOT
    ? path.normalize(env.values.LILUO_RUNTIME_ASSET_SYNC_ROOT)
    : ''

  let repoFileCount = 0
  let repoTotalBytes = 0
  let groupsReadyInSync = 0

  const groups = (manifest.groups || []).map((group) => {
    const repoRoots = (group.repoRoots || []).map((repoRoot) => {
      const absolutePath = resolveFromRoot(root, repoRoot)
      const stats = walkDirectory(absolutePath)
      repoFileCount += stats.fileCount
      repoTotalBytes += stats.totalBytes
      return {
        path: repoRoot,
        absolutePath,
        exists: stats.exists,
        fileCount: stats.fileCount,
        totalBytes: stats.totalBytes,
        totalMb: stats.totalMb,
      }
    })

    const syncTargetPath = syncRoot ? path.join(syncRoot, group.syncSubdir || group.id) : ''
    const syncStats = syncTargetPath ? walkDirectory(syncTargetPath) : {
      exists: false,
      fileCount: 0,
      totalBytes: 0,
      totalMb: 0,
    }

    if (syncStats.exists) groupsReadyInSync += 1

    return {
      id: group.id,
      title: group.title,
      visibility: group.visibility,
      repoPolicy: group.repoPolicy,
      packagingPolicy: group.packagingPolicy,
      publicR2Allowed: group.publicR2Allowed === true,
      syncSubdir: group.syncSubdir || group.id,
      syncTargetPath,
      syncTargetExists: syncStats.exists,
      syncTargetFileCount: syncStats.fileCount,
      syncTargetTotalMb: syncStats.totalMb,
      repoRoots,
      notes: group.notes || '',
    }
  })

  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString().slice(0, 10),
    command: 'assets:runtime:private:status',
    mode: manifest.mode || 'offline-first-private-sync',
    provider,
    env: {
      sourceFile: env.sourceFile ? toRepoRelative(env.sourceFile) : null,
      warnings: env.warnings,
      syncRootConfigured: Boolean(syncRoot),
      syncRoot,
      manifestPath: toRepoRelative(manifestPath),
    },
    publicBoundary: manifest.publicBoundary || {},
    totals: {
      trackedGroupCount: groups.length,
      groupsReadyInSync,
      repoFileCount,
      repoTotalBytes,
      repoTotalMb: roundMb(repoTotalBytes),
    },
    groups,
    nextStep: syncRoot
      ? 'Check that every private group has appeared inside the synced Nutstore root before removing any repo copy.'
      : 'Set LILUO_RUNTIME_ASSET_SYNC_ROOT in .env.runtime-assets.local before starting any private-asset migration.',
  }
}

export function formatRuntimePrivateAssetStatusSummary(report) {
  return {
    command: report.command,
    mode: report.mode,
    provider: report.provider,
    syncRootConfigured: report.env.syncRootConfigured,
    manifestPath: report.env.manifestPath,
    trackedGroupCount: report.totals.trackedGroupCount,
    groupsReadyInSync: report.totals.groupsReadyInSync,
    repoTotalMb: report.totals.repoTotalMb,
    groups: report.groups.map((group) => ({
      id: group.id,
      visibility: group.visibility,
      syncTargetExists: group.syncTargetExists,
      repoTotalMb: roundMb(group.repoRoots.reduce((sum, item) => sum + item.totalBytes, 0)),
    })),
    nextStep: report.nextStep,
  }
}

const currentModulePath = fileURLToPath(import.meta.url)
const isCliMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentModulePath)

if (isCliMain) {
  try {
    const options = parseArgs(process.argv.slice(2))
    const report = buildRuntimePrivateAssetStatus(options)
    console.log(JSON.stringify(formatRuntimePrivateAssetStatusSummary(report), null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
