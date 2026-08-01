import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { ROOT, repoPath } from './lib/paths.mjs'
import { classifyRuntimeAsset, isRuntimeAssetImage } from './lib/runtime-asset-policy.mjs'

const DEFAULT_OUTPUT_FILE = 'docs/assets/registry/runtime-asset-footprint.json'

function usage() {
  return [
    'Usage:',
    '  node scripts/assets/runtime-asset-footprint.mjs',
    '  node scripts/assets/runtime-asset-footprint.mjs --output <path>',
  ].join('\n')
}

function parseArgs(argv) {
  const options = {
    output: DEFAULT_OUTPUT_FILE,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--output') {
      options.output = argv[index + 1]
      index += 1
      continue
    }
    if (item === '--help') throw new Error(usage())
    throw new Error(`Unknown argument: ${item}`)
  }
  return options
}

function walkFiles(directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

function sha256File(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function roundMb(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2))
}

function toRootRelative(root, targetPath) {
  return path.relative(root, targetPath).split(path.sep).join('/')
}

function pushCount(map, key, sizeBytes) {
  const current = map.get(key) ?? { count: 0, bytes: 0 }
  current.count += 1
  current.bytes += sizeBytes
  map.set(key, current)
}

export function buildRuntimeAssetFootprint(options = {}) {
  const root = path.resolve(options.root ?? ROOT)
  const assetRoot = path.join(root, 'src/assets/game')
  const files = walkFiles(assetRoot)
  const generatedAt = options.generatedAt ?? new Date().toISOString().slice(0, 10)
  const duplicateHashes = new Map()
  const byTopLevel = new Map()
  const byCategory = new Map()
  const byPhase1Action = new Map()
  const records = []

  let totalBytes = 0
  let imageBytes = 0
  let imageCount = 0

  for (const filePath of files) {
    const repoRelativePath = toRootRelative(root, filePath)
    const relativePath = repoRelativePath.replace(/^src\/assets\/game\//u, '')
    const stat = fs.statSync(filePath)
    const classification = classifyRuntimeAsset(relativePath)
    const sha256 = sha256File(filePath)
    totalBytes += stat.size
    if (classification.isImage || isRuntimeAssetImage(relativePath)) {
      imageCount += 1
      imageBytes += stat.size
    }
    pushCount(byTopLevel, classification.topLevel, stat.size)
    pushCount(byCategory, classification.category, stat.size)
    pushCount(byPhase1Action, classification.phase1Action, stat.size)
    duplicateHashes.set(sha256, [...(duplicateHashes.get(sha256) ?? []), filePath])

    records.push({
      path: repoRelativePath,
      sizeBytes: stat.size,
      sizeMb: roundMb(stat.size),
      sha256,
      ...classification,
    })
  }

  const topDirectories = [...byTopLevel.entries()]
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      bytes: stats.bytes,
      mb: roundMb(stats.bytes),
    }))
    .sort((left, right) => right.bytes - left.bytes)

  const categorySummary = [...byCategory.entries()]
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      bytes: stats.bytes,
      mb: roundMb(stats.bytes),
    }))
    .sort((left, right) => right.bytes - left.bytes)

  const actionSummary = [...byPhase1Action.entries()]
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      bytes: stats.bytes,
      mb: roundMb(stats.bytes),
    }))
    .sort((left, right) => right.bytes - left.bytes)

  const duplicates = [...duplicateHashes.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([sha256, paths]) => ({
      sha256,
      count: paths.length,
      paths: paths.map((filePath) => toRootRelative(root, filePath)).sort(),
    }))
    .sort((left, right) => right.count - left.count || left.sha256.localeCompare(right.sha256))

  const topFiles = [...records]
    .sort((left, right) => right.sizeBytes - left.sizeBytes)
    .slice(0, 25)
    .map((item) => ({
      path: item.path,
      sizeMb: item.sizeMb,
      category: item.category,
      phase1Action: item.phase1Action,
    }))

  const runtimeHeavyDirectories = topDirectories
    .filter((item) => item.mb >= 10)
    .map((item) => item.name)

  return {
    schemaVersion: 1,
    generatedAt,
    root: toRootRelative(root, root) || '.',
    assetRoot: toRootRelative(root, assetRoot),
    totals: {
      fileCount: records.length,
      totalBytes,
      totalMb: roundMb(totalBytes),
      imageFileCount: imageCount,
      imageBytes,
      imageMb: roundMb(imageBytes),
    },
    summaries: {
      byTopLevel: topDirectories,
      byCategory: categorySummary,
      byPhase1Action: actionSummary,
    },
    highlights: {
      runtimeHeavyDirectories,
      authoringSourceMb: roundMb(records.filter((item) => item.phase1Action === 'externalize-authoring-source').reduce((sum, item) => sum + item.sizeBytes, 0)),
      mapSourceMb: roundMb(records.filter((item) => item.phase1Action === 'externalize-map-source').reduce((sum, item) => sum + item.sizeBytes, 0)),
      rebuildableCacheMb: roundMb(records.filter((item) => item.phase1Action === 'keep-and-regenerate').reduce((sum, item) => sum + item.sizeBytes, 0)),
      psdMb: roundMb(records.filter((item) => item.extension === '.psd').reduce((sum, item) => sum + item.sizeBytes, 0)),
    },
    duplicates,
    topFiles,
    records,
  }
}

export function writeRuntimeAssetFootprint(report, outputPath = DEFAULT_OUTPUT_FILE) {
  const absoluteOutput = path.isAbsolute(outputPath) ? outputPath : repoPath(outputPath)
  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true })
  fs.writeFileSync(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return absoluteOutput
}

export function formatRuntimeAssetFootprintSummary(report, outputPath = DEFAULT_OUTPUT_FILE) {
  return {
    command: 'assets:runtime:report',
    outputPath,
    totalMb: report.totals.totalMb,
    imageMb: report.totals.imageMb,
    fileCount: report.totals.fileCount,
    imageFileCount: report.totals.imageFileCount,
    topDirectories: report.summaries.byTopLevel.slice(0, 8),
    topActions: report.summaries.byPhase1Action,
    duplicateGroupCount: report.duplicates.length,
  }
}

const currentModulePath = fileURLToPath(import.meta.url)
const isCliMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentModulePath)

if (isCliMain) {
  try {
    const options = parseArgs(process.argv.slice(2))
    const report = buildRuntimeAssetFootprint()
    writeRuntimeAssetFootprint(report, options.output)
    console.log(JSON.stringify(formatRuntimeAssetFootprintSummary(report, options.output), null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
