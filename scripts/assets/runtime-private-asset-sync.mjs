import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildRuntimePrivateAssetStatus } from './runtime-private-asset-status.mjs'

function usage() {
  return [
    'Usage:',
    '  node scripts/assets/runtime-private-asset-sync.mjs --group <group-id>',
    '  node scripts/assets/runtime-private-asset-sync.mjs --group <group-a> --group <group-b> --live',
    '  node scripts/assets/runtime-private-asset-sync.mjs --all',
    '  node scripts/assets/runtime-private-asset-sync.mjs --all --live',
  ].join('\n')
}

function parseArgs(argv) {
  const options = {
    groups: [],
    all: false,
    live: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--group') {
      options.groups.push(argv[index + 1])
      index += 1
      continue
    }
    if (item === '--all') {
      options.all = true
      continue
    }
    if (item === '--live') {
      options.live = true
      continue
    }
    if (item === '--help') throw new Error(usage())
    throw new Error(`Unknown argument: ${item}`)
  }

  if (!options.all && options.groups.length === 0) {
    throw new Error('Provide at least one --group or use --all.')
  }

  return options
}

function roundMb(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2))
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return []
  const files = []
  const stack = [directory]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else {
        files.push(fullPath)
      }
    }
  }
  return files
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true })
}

function copyRoot(sourceRoot, targetRoot, live) {
  const files = walkFiles(sourceRoot)
  let totalBytes = 0

  for (const sourceFile of files) {
    const relativePath = path.relative(sourceRoot, sourceFile)
    const targetFile = path.join(targetRoot, relativePath)
    const stat = fs.statSync(sourceFile)
    totalBytes += stat.size
    if (!live) continue
    ensureDirectory(path.dirname(targetFile))
    fs.copyFileSync(sourceFile, targetFile)
  }

  return {
    fileCount: files.length,
    totalBytes,
    totalMb: roundMb(totalBytes),
  }
}

export function syncRuntimePrivateAssets(options = {}) {
  const report = buildRuntimePrivateAssetStatus(options)
  if (!report.env.syncRootConfigured) {
    throw new Error('LILUO_RUNTIME_ASSET_SYNC_ROOT is not configured.')
  }

  const selectedIds = options.all
    ? new Set(report.groups.map((group) => group.id))
    : new Set(options.groups || [])

  const selectedGroups = report.groups.filter((group) => selectedIds.has(group.id))
  if (selectedGroups.length === 0) {
    throw new Error(`No matching groups found for: ${[...selectedIds].join(', ')}`)
  }

  const live = options.live === true
  const groups = selectedGroups.map((group) => {
    const rootSummaries = group.repoRoots.map((repoRoot) => {
      const sourceRoot = repoRoot.absolutePath
      const targetRoot = group.syncTargetPath
      const result = copyRoot(sourceRoot, targetRoot, live)
      return {
        sourceRoot: repoRoot.path,
        targetRoot,
        fileCount: result.fileCount,
        totalMb: result.totalMb,
      }
    })

    return {
      id: group.id,
      visibility: group.visibility,
      syncTargetPath: group.syncTargetPath,
      rootSummaries,
      fileCount: rootSummaries.reduce((sum, item) => sum + item.fileCount, 0),
      totalMb: roundMb(rootSummaries.reduce((sum, item) => sum + (item.totalMb * 1024 * 1024), 0)),
    }
  })

  return {
    command: 'assets:runtime:private:sync',
    mode: live ? 'live' : 'dry-run',
    syncRoot: report.env.syncRoot,
    selectedGroupCount: groups.length,
    groups,
    nextStep: live
      ? 'Repo originals are still untouched. Verify the copied files in 私有素材库 before planning any repo-side removal.'
      : 'Re-run with --live to copy files into the private sync root.',
  }
}

const currentModulePath = fileURLToPath(import.meta.url)
const isCliMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentModulePath)

if (isCliMain) {
  try {
    const options = parseArgs(process.argv.slice(2))
    const result = syncRuntimePrivateAssets(options)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
