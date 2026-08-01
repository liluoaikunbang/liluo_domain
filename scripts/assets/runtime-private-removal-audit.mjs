import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, toPosixPath, toRepoRelative } from './lib/paths.mjs'
import { buildRuntimePrivateAssetStatus } from './runtime-private-asset-status.mjs'

const DEFAULT_REPORT_FILE = 'docs/assets/registry/runtime-private-removal-audit.json'
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.vue',
  '.json',
  '.md',
  '.txt',
  '.ps1',
  '.yaml',
  '.yml',
])

const SEARCH_RULES = Object.freeze({
  'runtime-cg-finals': {
    patterns: ['src/assets/game/cg', 'assets/game/cg/', 'assets\\game\\cg\\'],
    runtimeScopes: ['src/game'],
    contentScopes: ['src/game/data/story_outline'],
    authoringScopes: [],
    docsScopes: ['docs', 'README.md'],
    scriptScopes: ['scripts'],
  },
  'authoring-cg-standee-sources': {
    patterns: ['src/assets/game/sucai_cg_standee', 'sucai_cg_standee/', 'sucai_cg_standee\\'],
    runtimeScopes: ['src/game'],
    contentScopes: [],
    authoringScopes: ['src/assets'],
    docsScopes: ['docs', 'README.md'],
    scriptScopes: ['scripts'],
  },
  'authoring-scene-sources': {
    patterns: ['src/assets/game/sucai_scenes', 'sucai_scenes/', 'sucai_scenes\\'],
    runtimeScopes: ['src/game'],
    contentScopes: [],
    authoringScopes: ['src/assets'],
    docsScopes: ['docs', 'README.md'],
    scriptScopes: ['scripts'],
  },
  'pixel-map-sources': {
    patterns: ['src/assets/game/pixel_maps', 'pixel_maps/', 'pixel_maps\\'],
    runtimeScopes: ['src/game'],
    contentScopes: [],
    authoringScopes: ['src/assets'],
    docsScopes: ['docs', 'README.md'],
    scriptScopes: ['scripts'],
  },
  'map-and-layout-sources': {
    patterns: ['src/assets/game/raw_maps', 'raw_maps/', 'raw_maps\\'],
    runtimeScopes: ['src/game'],
    contentScopes: [],
    authoringScopes: ['src/assets'],
    docsScopes: ['docs', 'README.md'],
    scriptScopes: ['scripts'],
  },
  'candidate-reference-boards': {
    patterns: ['src/assets/game/mode', 'assets/game/mode/', 'assets\\game\\mode\\'],
    runtimeScopes: ['src/game'],
    contentScopes: [],
    authoringScopes: ['src/assets'],
    docsScopes: ['docs', 'README.md'],
    scriptScopes: ['scripts'],
  },
})

const NON_BLOCKING_DOC_PREFIXES = Object.freeze([
  'docs/assets/registry/',
  'docs/功能更新/',
])

const NON_BLOCKING_SCRIPT_PREFIXES = Object.freeze([
  'scripts/tests/',
])

const NON_BLOCKING_SCRIPT_FILES = Object.freeze([
  'scripts/assets/runtime-private-removal-audit.mjs',
])

function usage() {
  return [
    'Usage:',
    '  node scripts/assets/runtime-private-removal-audit.mjs',
    '  node scripts/assets/runtime-private-removal-audit.mjs --write-report',
    '  node scripts/assets/runtime-private-removal-audit.mjs --write-report <path>',
    '  node scripts/assets/runtime-private-removal-audit.mjs --env-file <path>',
    '  node scripts/assets/runtime-private-removal-audit.mjs --manifest <path>',
  ].join('\n')
}

function parseArgs(argv) {
  const options = {
    envFile: undefined,
    manifest: undefined,
    writeReport: false,
    reportFile: DEFAULT_REPORT_FILE,
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
    if (item === '--write-report') {
      const next = argv[index + 1]
      options.writeReport = true
      if (next && !next.startsWith('--')) {
        options.reportFile = next
        index += 1
      }
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

function resolveFromRoot(root, targetPath) {
  return path.isAbsolute(targetPath) ? path.normalize(targetPath) : path.join(root, targetPath)
}

function fileExists(targetPath) {
  return fs.existsSync(targetPath)
}

function toRootRelative(root, targetPath) {
  const relative = path.relative(root, targetPath)
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) return toPosixPath(relative)
  return toPosixPath(path.normalize(targetPath))
}

function walkFiles(targetPath) {
  if (!fileExists(targetPath)) return []
  const files = []
  const stack = [targetPath]
  while (stack.length > 0) {
    const current = stack.pop()
    const stat = fs.statSync(current)
    if (!stat.isDirectory()) {
      files.push(current)
      continue
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      stack.push(path.join(current, entry.name))
    }
  }
  return files.filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))
}

function findMatchesInFile(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/u)
  const matches = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!patterns.some((pattern) => line.includes(pattern))) continue
    matches.push({
      path: filePath,
      line: index + 1,
      preview: line.trim().slice(0, 160),
    })
  }
  return matches
}

function shouldIgnoreMatch(root, filePath, ignoredPrefixes = [], ignoredFiles = []) {
  const repoRelative = toRootRelative(root, filePath)
  if (ignoredFiles.includes(repoRelative)) return true
  return ignoredPrefixes.some((prefix) => repoRelative.startsWith(prefix))
}

function collectMatches(root, scopePaths, patterns, options = {}) {
  const ignoredPrefixes = options.ignoredPrefixes ?? []
  const ignoredFiles = options.ignoredFiles ?? []
  const matches = []
  for (const scopePath of scopePaths) {
    const absoluteScopePath = resolveFromRoot(root, scopePath)
    if (!fileExists(absoluteScopePath)) continue
    const files = walkFiles(absoluteScopePath)
    for (const file of files) {
      if (shouldIgnoreMatch(root, file, ignoredPrefixes, ignoredFiles)) continue
      matches.push(...findMatchesInFile(file, patterns))
    }
  }
  return matches
}

function summarizeMatches(root, matches) {
  return {
    count: matches.length,
    files: [...new Set(matches.map((match) => toRootRelative(root, match.path)))].sort(),
    examples: matches.slice(0, 12).map((match) => ({
      path: toRootRelative(root, match.path),
      line: match.line,
      preview: match.preview,
    })),
  }
}

function classifyRemovalStatus(groupAudit) {
  const runtimeBlockingCount = groupAudit.runtimeCodeRefs.count + groupAudit.runtimeContentRefs.count
  const metadataCount =
    groupAudit.authoringRefs.count +
    groupAudit.docsRefs.count +
    groupAudit.scriptRefs.count

  if (runtimeBlockingCount > 0) {
    return {
      removalStatus: 'blocked-by-runtime-references',
      proposedPhase2Action: 'keep-in-repo-for-now',
      rationale: 'Runtime code or packaged story content still points at this repo path.',
    }
  }

  if (metadataCount > 0) {
    return {
      removalStatus: 'ready-after-reference-cleanup',
      proposedPhase2Action: 'remove-after-cleaning-doc-and-authoring-references',
      rationale: 'No runtime blockers remain, but docs, authoring notes, or helper scripts still mention this repo path.',
    }
  }

  return {
    removalStatus: 'ready-to-remove',
    proposedPhase2Action: 'remove-from-main-repo-when-desired',
    rationale: 'No runtime, authoring, docs, or helper-script references were detected.',
  }
}

export function buildRuntimePrivateRemovalAudit(options = {}) {
  const root = path.resolve(options.root ?? ROOT)
  const statusReport = buildRuntimePrivateAssetStatus({
    root,
    envFile: options.envFile,
    manifest: options.manifest,
    generatedAt: options.generatedAt,
  })

  const groups = statusReport.groups.map((group) => {
    const rules = SEARCH_RULES[group.id] ?? {
      patterns: group.repoRoots.map((repoRoot) => repoRoot.path),
      runtimeScopes: ['src/game'],
      contentScopes: [],
      authoringScopes: ['src/assets'],
      docsScopes: ['docs', 'README.md'],
      scriptScopes: ['scripts'],
    }

    const runtimeCodeRefs = summarizeMatches(
      root,
      collectMatches(root, rules.runtimeScopes, rules.patterns)
    )
    const runtimeContentRefs = summarizeMatches(
      root,
      collectMatches(root, rules.contentScopes, rules.patterns)
    )
    const authoringRefs = summarizeMatches(
      root,
      collectMatches(root, rules.authoringScopes, rules.patterns)
    )
    const docsRefs = summarizeMatches(
      root,
      collectMatches(root, rules.docsScopes, rules.patterns, {
        ignoredPrefixes: NON_BLOCKING_DOC_PREFIXES,
      })
    )
    const scriptRefs = summarizeMatches(
      root,
      collectMatches(root, rules.scriptScopes, rules.patterns, {
        ignoredPrefixes: NON_BLOCKING_SCRIPT_PREFIXES,
        ignoredFiles: NON_BLOCKING_SCRIPT_FILES,
      })
    )

    const repoTotalBytes = group.repoRoots.reduce((sum, item) => sum + item.totalBytes, 0)
    const classification = classifyRemovalStatus({
      runtimeCodeRefs,
      runtimeContentRefs,
      authoringRefs,
      docsRefs,
      scriptRefs,
    })

    return {
      id: group.id,
      title: group.title,
      visibility: group.visibility,
      syncTargetPath: group.syncTargetPath ? toRepoRelative(group.syncTargetPath) : '',
      repoRoots: group.repoRoots.map((repoRoot) => ({
        path: repoRoot.path,
        fileCount: repoRoot.fileCount,
        totalMb: repoRoot.totalMb,
      })),
      repoFileCount: group.repoRoots.reduce((sum, item) => sum + item.fileCount, 0),
      repoTotalMb: roundMb(repoTotalBytes),
      runtimeCodeRefs,
      runtimeContentRefs,
      authoringRefs,
      docsRefs,
      scriptRefs,
      ...classification,
    }
  })

  const readyNow = groups.filter((group) => group.removalStatus === 'ready-to-remove').map((group) => group.id)
  const readyAfterCleanup = groups.filter((group) => group.removalStatus === 'ready-after-reference-cleanup').map((group) => group.id)
  const blocked = groups.filter((group) => group.removalStatus === 'blocked-by-runtime-references').map((group) => group.id)

  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString().slice(0, 10),
    command: 'assets:runtime:private:audit',
    mode: statusReport.mode,
    provider: statusReport.provider,
    manifestPath: statusReport.env.manifestPath,
    syncRoot: statusReport.env.syncRoot,
    totals: {
      trackedGroupCount: groups.length,
      repoTotalMb: statusReport.totals.repoTotalMb,
      readyNowCount: readyNow.length,
      readyAfterCleanupCount: readyAfterCleanup.length,
      blockedCount: blocked.length,
    },
    groups,
    summary: {
      readyNow,
      readyAfterCleanup,
      blocked,
    },
    nextStep: blocked.length > 0
      ? 'Do not remove blocked groups from the main repo until runtime/code references are replaced.'
      : 'No runtime blockers were detected; clean remaining docs/authoring references before removing repo copies.',
  }
}

export function formatRuntimePrivateRemovalAuditSummary(report) {
  return {
    command: report.command,
    mode: report.mode,
    provider: report.provider,
    manifestPath: report.manifestPath,
    repoTotalMb: report.totals.repoTotalMb,
    readyNowCount: report.totals.readyNowCount,
    readyAfterCleanupCount: report.totals.readyAfterCleanupCount,
    blockedCount: report.totals.blockedCount,
    groups: report.groups.map((group) => ({
      id: group.id,
      repoTotalMb: group.repoTotalMb,
      removalStatus: group.removalStatus,
      proposedPhase2Action: group.proposedPhase2Action,
      runtimeRefCount: group.runtimeCodeRefs.count + group.runtimeContentRefs.count,
      metadataRefCount: group.authoringRefs.count + group.docsRefs.count + group.scriptRefs.count,
    })),
    nextStep: report.nextStep,
  }
}

function writeReport(root, reportFile, report) {
  const absoluteReportPath = resolveFromRoot(root, reportFile)
  fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true })
  fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return toRepoRelative(absoluteReportPath)
}

const currentModulePath = fileURLToPath(import.meta.url)
const isCliMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentModulePath)

if (isCliMain) {
  try {
    const options = parseArgs(process.argv.slice(2))
    const report = buildRuntimePrivateRemovalAudit(options)
    if (options.writeReport) {
      const writtenPath = writeReport(path.resolve(options.root ?? ROOT), options.reportFile, report)
      console.log(JSON.stringify({
        ...formatRuntimePrivateRemovalAuditSummary(report),
        writtenReport: writtenPath,
      }, null, 2))
    } else {
      console.log(JSON.stringify(formatRuntimePrivateRemovalAuditSummary(report), null, 2))
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
