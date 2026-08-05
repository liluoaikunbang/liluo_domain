import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

function usage() {
  return [
    'Usage:',
    '  node scripts/site/promote-site-asset.mjs \\',
    '    --source <path> \\',
    '    --target <path> \\',
    '    --manifest-id <id> \\',
    '    [--title <text>] \\',
    '    [--source-type <text>] \\',
    '    [--status <text>] \\',
    '    [--maturity-label <text>] \\',
    '    [--alt <text>] \\',
    '    [--caption <text>] \\',
    '    [--prompt-file <path>] \\',
    '    [--reference-asset <path>]... \\',
    '    [--created-at <yyyy-mm-dd>] \\',
    '    [--batch-record <path>] \\',
    '    [--batch-note <text>] \\',
    '    [--dry-run]',
  ].join('\n')
}

function parseArgs(argv) {
  const options = {
    source: '',
    target: '',
    manifestId: '',
    title: '',
    sourceType: '',
    status: '',
    maturityLabel: '',
    alt: '',
    caption: '',
    promptFile: '',
    referenceAssets: [],
    createdAt: '',
    batchRecord: '',
    batchNote: '',
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--source') {
      options.source = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--target') {
      options.target = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--manifest-id') {
      options.manifestId = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--title') {
      options.title = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--source-type') {
      options.sourceType = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--status') {
      options.status = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--maturity-label') {
      options.maturityLabel = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--alt') {
      options.alt = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--caption') {
      options.caption = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--prompt-file') {
      options.promptFile = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--reference-asset') {
      options.referenceAssets.push(argv[index + 1] ?? '')
      index += 1
      continue
    }
    if (item === '--created-at') {
      options.createdAt = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--batch-record') {
      options.batchRecord = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--batch-note') {
      options.batchNote = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (item === '--dry-run') {
      options.dryRun = true
      continue
    }
    if (item === '--help') {
      throw new Error(usage())
    }
    throw new Error(`Unknown argument: ${item}`)
  }

  if (!options.source || !options.target || !options.manifestId) {
    throw new Error(`Missing required arguments.\n\n${usage()}`)
  }

  return options
}

function repoPath(targetPath) {
  return path.isAbsolute(targetPath) ? path.normalize(targetPath) : path.join(repoRoot, targetPath)
}

function toRepoRelative(targetPath) {
  const absolutePath = repoPath(targetPath)
  return path.relative(repoRoot, absolutePath).replaceAll('\\', '/')
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), 'utf8'))
}

function writeJson(relativePath, value) {
  fs.writeFileSync(repoPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function normalizeBatchNote(note) {
  return note.trim().replace(/^-+\s*/u, '')
}

function canonicalizeTextForComparison(text) {
  return text.replaceAll('`', '').replace(/\s+/gu, ' ').trim()
}

function upsertBatchNote(relativePath, note, dryRun) {
  const filePath = repoPath(relativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Batch record not found: ${relativePath}`)
  }

  const normalizedNote = normalizeBatchNote(note)
  let text = fs.readFileSync(filePath, 'utf8')
  if (canonicalizeTextForComparison(text).includes(canonicalizeTextForComparison(normalizedNote))) {
    return false
  }

  const sectionHeading = '## 归档补记'
  if (text.includes(sectionHeading)) {
    const sectionIndex = text.indexOf(sectionHeading)
    const nextHeadingIndex = text.indexOf('\n## ', sectionIndex + sectionHeading.length)
    const insertAt = nextHeadingIndex === -1 ? text.length : nextHeadingIndex
    const before = text.slice(0, insertAt).replace(/\s*$/u, '')
    const after = text.slice(insertAt)
    text = `${before}\n- ${normalizedNote}\n${after.startsWith('\n') ? '' : '\n'}${after}`
  } else {
    text = `${text.replace(/\s*$/u, '')}\n\n## 归档补记\n\n- ${normalizedNote}\n`
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, text, 'utf8')
  }
  return true
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const manifestPath = 'docs/assets/readme/art-manifest.json'
  const sourcePath = repoPath(options.source)
  const targetPath = repoPath(options.target)

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source asset not found: ${options.source}`)
  }

  const manifest = readJson(manifestPath)
  const entry = manifest.assets.find((asset) => asset.id === options.manifestId)
  if (!entry) {
    throw new Error(`Manifest asset id not found: ${options.manifestId}`)
  }

  const sourceSha256 = sha256File(sourcePath)
  const targetExists = fs.existsSync(targetPath)
  const existingTargetSha256 = targetExists ? sha256File(targetPath) : ''
  let copied = false

  if (sourcePath !== targetPath && sourceSha256 !== existingTargetSha256) {
    if (!options.dryRun) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.copyFileSync(sourcePath, targetPath)
    }
    copied = true
  }

  const targetSha256 = copied && options.dryRun
    ? sourceSha256
    : sha256File(targetPath)
  if (targetSha256 !== sourceSha256) {
    throw new Error('Target asset hash does not match source asset hash after promotion')
  }

  const nextEntry = {
    ...entry,
    path: toRepoRelative(options.target),
  }

  if (options.title) nextEntry.title = options.title
  if (options.sourceType) nextEntry.sourceType = options.sourceType
  if (options.status) nextEntry.status = options.status
  if (options.maturityLabel) nextEntry.maturityLabel = options.maturityLabel
  if (options.alt) nextEntry.alt = options.alt
  if (options.caption) nextEntry.caption = options.caption
  if (options.promptFile) nextEntry.promptFile = toRepoRelative(options.promptFile)
  if (options.referenceAssets.length > 0) {
    nextEntry.referenceAssets = options.referenceAssets.map((assetPath) => toRepoRelative(assetPath))
  }
  if (options.createdAt) nextEntry.createdAt = options.createdAt

  const changedFields = Object.keys(nextEntry).filter((key) => JSON.stringify(nextEntry[key]) !== JSON.stringify(entry[key]))
  if (changedFields.length > 0 && !options.dryRun) {
    manifest.assets = manifest.assets.map((asset) => (asset.id === options.manifestId ? nextEntry : asset))
    writeJson(manifestPath, manifest)
  }

  let batchRecordUpdated = false
  if (options.batchRecord && options.batchNote) {
    batchRecordUpdated = upsertBatchNote(options.batchRecord, options.batchNote, options.dryRun)
  }

  const result = {
    ok: true,
    dryRun: options.dryRun,
    copied,
    manifestUpdated: changedFields.length > 0,
    batchRecordUpdated,
    manifestId: options.manifestId,
    source: toRepoRelative(options.source),
    target: toRepoRelative(options.target),
    sourceSha256,
    targetSha256,
    changedFields,
  }

  console.log(JSON.stringify(result, null, 2))
}

main()
