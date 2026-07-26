import { access, copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const CATALOG_PATH = path.join(ROOT, 'scripts', 'project-context-pack', 'catalog.json')

const exists = (file) => access(file, constants.F_OK).then(() => true, () => false)
const toPosix = (value) => value.split(path.sep).join('/')
const nowIso = () => new Date().toISOString()

export async function loadCatalog(catalogPath = CATALOG_PATH) {
  return JSON.parse(await readFile(catalogPath, 'utf8'))
}

export async function saveCatalog(catalog, catalogPath = CATALOG_PATH) {
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
}

function linkStatePathFor(catalog, root = ROOT) {
  return path.join(root, catalog.output.dir, 'LINK-STATE.json')
}

export async function loadLinkState(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, links: {} }
    throw error
  }
}

export async function saveLinkState(filePath, state) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function isExcludedPath(relPosix, catalog) {
  const exclude = catalog.globalExclude ?? {}
  const parts = relPosix.split('/')
  if ((exclude.dirNames ?? []).some((name) => parts.includes(name))) return true
  if ((exclude.pathPrefixes ?? []).some((prefix) => relPosix === prefix.replace(/\/$/, '') || relPosix.startsWith(prefix))) return true
  const base = parts.at(-1) ?? ''
  if ((exclude.basenames ?? []).includes(base)) return true
  const ext = path.extname(base).toLowerCase()
  if ((exclude.extensions ?? []).includes(ext)) return true
  return false
}

function entryCovers(entryPath, candidatePath) {
  if (entryPath === candidatePath) return true
  return candidatePath.startsWith(`${entryPath}/`)
}

function isCoveredByEntries(relPosix, entries) {
  return (entries ?? []).some((entry) => entryCovers(entry.path, relPosix))
}

function hasMoreSpecificEntry(relPosix, entries) {
  return (entries ?? []).some((entry) => entry.path.startsWith(`${relPosix}/`))
}

function matchesAny(text, patterns = []) {
  const lower = text.toLowerCase()
  return patterns.some((pattern) => lower.includes(String(pattern).toLowerCase()))
}

async function listChildren(absDir) {
  if (!await exists(absDir)) return []
  const entries = await readdir(absDir, { withFileTypes: true })
  return entries.map((entry) => ({
    name: entry.name,
    isDirectory: entry.isDirectory(),
    isFile: entry.isFile(),
  }))
}

async function readHead(absPath, lines) {
  const text = await readFile(absPath, 'utf8')
  return text.split(/\r?\n/).slice(0, lines).join('\n')
}

async function collectSampleFiles(absDir, preferExtensions, limit) {
  const out = []
  const queue = [absDir]
  while (queue.length && out.length < limit) {
    const current = queue.shift()
    let children = []
    try {
      children = await readdir(current, { withFileTypes: true })
    } catch {
      continue
    }
    for (const child of children) {
      const childPath = path.join(current, child.name)
      if (child.isDirectory()) {
        if (['node_modules', 'dist', '.git', '.local'].includes(child.name)) continue
        queue.push(childPath)
        continue
      }
      if (!child.isFile()) continue
      const ext = path.extname(child.name).toLowerCase()
      if (preferExtensions.length && !preferExtensions.includes(ext)) continue
      out.push(childPath)
      if (out.length >= limit) break
    }
  }
  return out
}

export async function probePath(relPosix, catalog, root = ROOT) {
  const probe = catalog.probe ?? {}
  const abs = path.join(root, relPosix)
  if (!await exists(abs)) return { include: false, score: 0, reason: 'missing' }
  if (isExcludedPath(relPosix, catalog)) return { include: false, score: 0, reason: 'global-exclude' }

  const name = path.basename(relPosix)
  if (matchesAny(name, probe.negativeNamePatterns)) return { include: false, score: 0, reason: 'negative-name' }

  let score = 0
  const reasons = []
  if (matchesAny(relPosix, probe.positiveNamePatterns) || matchesAny(name, probe.positiveNamePatterns)) {
    score += 3
    reasons.push('name-match')
  }

  const info = await stat(abs)
  if (info.isFile()) {
    const ext = path.extname(name).toLowerCase()
    if ((probe.preferExtensions ?? []).includes(ext)) {
      score += 2
      reasons.push('prefer-ext')
    }
    if (['.ts', '.vue', '.css', '.scss'].includes(ext)) {
      return { include: false, score: 0, reason: 'implementation-file' }
    }
    try {
      const head = await readHead(abs, probe.headLines ?? 16)
      if (matchesAny(head, probe.positiveContentPatterns)) {
        score += 3
        reasons.push('content-match')
      }
      if (/from ['"]|import\s+|export\s+(default\s+)?function|createApp\(/.test(head) && !/\.json$/.test(name)) {
        score -= 2
        reasons.push('looks-like-code')
      }
    } catch {
      return { include: false, score: 0, reason: 'unreadable' }
    }
    return { include: score >= 3, score, reason: reasons.join('+') || 'low-score', mode: 'file' }
  }

  const samples = await collectSampleFiles(abs, probe.preferExtensions ?? ['.md', '.json'], probe.maxSampleFiles ?? 3)
  if (!samples.length) {
    if (score >= 3) return { include: true, score, reason: reasons.join('+') || 'name-only-dir', mode: 'tree' }
    return { include: false, score, reason: 'no-descriptive-samples' }
  }
  let contentHits = 0
  for (const sample of samples) {
    try {
      const head = await readHead(sample, probe.headLines ?? 16)
      if (matchesAny(head, probe.positiveContentPatterns) || matchesAny(path.basename(sample), probe.positiveNamePatterns)) {
        contentHits += 1
      }
    } catch {
      // ignore
    }
  }
  score += contentHits >= 1 ? 3 : 0
  if (contentHits) reasons.push(`sample-hits:${contentHits}`)
  return {
    include: score >= 3,
    score,
    reason: reasons.join('+') || 'low-score',
    mode: 'tree',
  }
}

function passesEntryFilters(relPosix, entry) {
  const base = path.basename(relPosix)
  const ext = path.extname(base).toLowerCase()
  const include = entry.include ?? {}
  const exclude = entry.exclude ?? {}
  if ((exclude.basenames ?? []).includes(base)) return false
  if ((exclude.extensions ?? []).includes(ext)) return false
  if ((exclude.pathPrefixes ?? []).some((prefix) => relPosix === prefix.replace(/\/$/, '') || relPosix.startsWith(prefix))) return false
  const hasExtFilter = (include.extensions ?? []).length > 0
  const hasBaseFilter = (include.basenames ?? []).length > 0
  if (!hasExtFilter && !hasBaseFilter) return true
  const extOk = hasExtFilter && include.extensions.includes(ext)
  const baseOk = hasBaseFilter && (
    include.basenames.includes(base)
    || include.basenames.some((token) => relPosix.includes(`/${token}/`) || relPosix.endsWith(`/${token}`))
  )
  return extOk || baseOk
}

async function walkFiles(absDir, relDir, catalog, entry, out) {
  const children = await readdir(absDir, { withFileTypes: true })
  for (const child of children) {
    const relPosix = toPosix(path.join(relDir, child.name))
    if (isExcludedPath(relPosix, catalog)) continue
    const absChild = path.join(absDir, child.name)
    if (child.isDirectory()) {
      await walkFiles(absChild, relPosix, catalog, entry, out)
      continue
    }
    if (!child.isFile()) continue
    if (!passesEntryFilters(relPosix, entry)) continue
    out.add(relPosix)
  }
}

export async function resolvePackFiles(catalog, root = ROOT) {
  const files = new Set()
  for (const entry of catalog.entries ?? []) {
    const abs = path.join(root, entry.path)
    if (!await exists(abs)) {
      if (entry.optional) continue
      continue
    }
    const info = await stat(abs)
    if (entry.mode === 'file' || info.isFile()) {
      const rel = toPosix(entry.path)
      if (!isExcludedPath(rel, catalog) && passesEntryFilters(rel, entry)) files.add(rel)
      continue
    }
    await walkFiles(abs, toPosix(entry.path), catalog, entry, files)
  }
  return [...files].sort((a, b) => a.localeCompare(b, 'en'))
}

function nameAllowed(watch, name) {
  const allow = watch.nameAllow
  if (!allow?.length) return true
  return allow.some((token) => {
    if (token.includes('*')) {
      const re = new RegExp(`^${token.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`, 'i')
      return re.test(name)
    }
    return token === name
  })
}

/** Prefer curated over auto; drop path duplicates and entries already covered by a broader tree. */
export function dedupeCatalogEntries(entries = []) {
  const byPath = new Map()
  for (const entry of entries) {
    const prev = byPath.get(entry.path)
    if (!prev) {
      byPath.set(entry.path, entry)
      continue
    }
    const preferNew = Boolean(prev.auto) && !entry.auto
    if (preferNew) byPath.set(entry.path, entry)
  }

  let list = [...byPath.values()]
  const dropped = []

  // Drop auto parents that already have more-specific child entries.
  list = list.filter((entry) => {
    const hasChild = list.some((other) => other.path.startsWith(`${entry.path}/`))
    if (entry.auto && hasChild) {
      dropped.push(entry.path)
      return false
    }
    return true
  })

  // Drop entries fully covered by another tree entry (true duplicates of scope).
  list = list.filter((entry) => {
    const covered = list.some((other) => other.path !== entry.path && other.mode === 'tree' && entryCovers(other.path, entry.path))
    if (covered) {
      dropped.push(entry.path)
      return false
    }
    return true
  })

  list.sort((a, b) => a.path.localeCompare(b.path, 'en'))
  return { entries: list, dropped: [...new Set(dropped)] }
}

/**
 * Catalog maintenance only:
 * 1) remove missing paths
 * 2) dedupe redundant entries
 * 3) probe ONLY uncovered watchParents children for possible additions
 * Never re-scores already listed entries.
 */
export async function refreshCatalog(catalog, root = ROOT) {
  const added = []
  const removed = []
  const kept = []
  const surviving = []

  for (const entry of catalog.entries ?? []) {
    const abs = path.join(root, entry.path)
    if (!await exists(abs)) {
      if (entry.optional) {
        surviving.push(entry)
        kept.push(entry.path)
        continue
      }
      removed.push(entry.path)
      continue
    }
    surviving.push(entry)
    kept.push(entry.path)
  }

  const deduped = dedupeCatalogEntries(surviving)
  const nextEntries = [...deduped.entries]

  for (const watch of catalog.watchParents ?? []) {
    const parentAbs = path.join(root, watch.path === '.' ? '' : watch.path)
    const children = await listChildren(parentAbs)
    for (const child of children) {
      if (!nameAllowed(watch, child.name)) continue
      const relPosix = watch.path === '.' ? child.name : toPosix(path.join(watch.path, child.name))
      if (isExcludedPath(relPosix, catalog)) continue
      if (isCoveredByEntries(relPosix, nextEntries)) continue
      // Already have finer entries under this path — do not add a broad parent just to dedupe it away.
      if (hasMoreSpecificEntry(relPosix, nextEntries)) continue
      const result = await probePath(relPosix, catalog, root)
      if (!result.include) continue
      nextEntries.push({
        path: relPosix,
        mode: result.mode ?? (child.isDirectory ? 'tree' : 'file'),
        reason: `auto:${result.reason}`,
        discoveredAt: nowIso(),
        auto: true,
      })
      added.push(relPosix)
    }
  }

  // Dedupe again after additions (new auto parent vs existing child).
  const finalDeduped = dedupeCatalogEntries(nextEntries)
  const changed = added.length > 0 || removed.length > 0 || deduped.dropped.length > 0 || finalDeduped.dropped.length > 0
  return {
    catalog: {
      ...catalog,
      entries: finalDeduped.entries,
      lastRefreshedAt: nowIso(),
    },
    added,
    removed,
    deduped: [...new Set([...deduped.dropped, ...finalDeduped.dropped])],
    kept,
    changed,
  }
}

export async function syncLinkedStaging({
  catalog,
  files,
  root = ROOT,
  stagingDir,
  linkStateFile,
  dryRun = false,
}) {
  const previous = await loadLinkState(linkStateFile)
  const nextLinks = {}
  const copied = []
  const unchanged = []
  const removed = []

  for (const rel of files) {
    const sourceAbs = path.join(root, rel)
    const stagingAbs = path.join(stagingDir, rel)
    const info = await stat(sourceAbs)
    const signature = { mtimeMs: info.mtimeMs, size: info.size }
    const prev = previous.links?.[rel]
    const stagingExists = await exists(stagingAbs)
    const same = prev
      && stagingExists
      && prev.mtimeMs === signature.mtimeMs
      && prev.size === signature.size

    if (same) {
      nextLinks[rel] = { source: rel, staging: rel, ...signature }
      unchanged.push(rel)
      continue
    }

    if (!dryRun) {
      await mkdir(path.dirname(stagingAbs), { recursive: true })
      await copyFile(sourceAbs, stagingAbs)
    }
    nextLinks[rel] = {
      source: rel,
      staging: rel,
      ...signature,
      syncedAt: nowIso(),
    }
    copied.push(rel)
  }

  for (const rel of Object.keys(previous.links ?? {})) {
    if (nextLinks[rel]) continue
    if (rel === 'PACK-MANIFEST.json' || rel === 'LINK-STATE.json') continue
    removed.push(rel)
    if (!dryRun) {
      const stagingAbs = path.join(stagingDir, rel)
      if (await exists(stagingAbs)) await rm(stagingAbs, { force: true })
    }
  }

  const state = {
    schemaVersion: 1,
    updatedAt: nowIso(),
    fileCount: Object.keys(nextLinks).length,
    links: nextLinks,
  }

  if (!dryRun) await saveLinkState(linkStateFile, state)

  return { copied, unchanged, removed, state }
}

/** Remove staging files that are no longer linked (leftovers from older catalog versions). */
export async function pruneOrphanStagingFiles(stagingDir, linkedPaths, { dryRun = false } = {}) {
  if (!await exists(stagingDir)) return []
  const keep = new Set(linkedPaths)
  keep.add('PACK-MANIFEST.json')
  keep.add('FILE-LIST.txt')
  const removed = []

  async function walk(absDir, relDir) {
    for (const entry of await readdir(absDir, { withFileTypes: true })) {
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name
      const abs = path.join(absDir, entry.name)
      if (entry.isDirectory()) {
        await walk(abs, rel)
        // drop empty dirs after children pruned
        try {
          const left = await readdir(abs)
          if (!left.length && !dryRun) await rm(abs, { recursive: true, force: true })
        } catch {
          // ignore
        }
        continue
      }
      if (!entry.isFile()) continue
      if (keep.has(rel)) continue
      removed.push(rel)
      if (!dryRun) await rm(abs, { force: true })
    }
  }

  await walk(stagingDir, '')
  return removed
}

function runCommand(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolvePromise({ stdout, stderr })
      else reject(new Error(`${command} ${args.join(' ')} failed (${code}): ${stderr || stdout}`))
    })
  })
}

export async function createZipArchive(stagingAbs, archiveAbs) {
  await mkdir(path.dirname(archiveAbs), { recursive: true })
  if (await exists(archiveAbs)) await rm(archiveAbs, { force: true })
  await runCommand('tar', ['-a', '-c', '-f', archiveAbs, '-C', stagingAbs, '.'], ROOT)
  const info = await stat(archiveAbs)
  if (!info.size) throw new Error(`压缩包为空：${archiveAbs}`)
  return info.size
}

/**
 * Keep only the current archive. Previous versioned zips are deleted by default.
 * Pass keepPreviousArchives=true (CLI --keep-previous) to retain old zips.
 */
export async function pruneOldArchives(outDir, keepArchiveAbs, {
  root = ROOT,
  keepPreviousArchives = false,
  dryRun = false,
} = {}) {
  if (keepPreviousArchives) return []
  if (!await exists(outDir)) return []
  const keepName = path.basename(keepArchiveAbs)
  const removed = []
  for (const entry of await readdir(outDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.toLowerCase().endsWith('.zip')) continue
    if (entry.name === keepName) continue
    const abs = path.join(outDir, entry.name)
    const rel = toPosix(path.relative(root, abs))
    removed.push(rel.startsWith('..') ? entry.name : rel)
    if (!dryRun) await rm(abs, { force: true })
  }
  return removed
}

export async function packProjectContext({
  root = ROOT,
  catalogPath = CATALOG_PATH,
  dryRun = false,
  keepPreviousArchives = false,
} = {}) {
  const original = await loadCatalog(catalogPath)
  const refreshed = await refreshCatalog(original, root)
  if (!dryRun && refreshed.changed) await saveCatalog(refreshed.catalog, catalogPath)

  const catalog = refreshed.catalog
  const files = await resolvePackFiles(catalog, root)
  const outDir = path.join(root, catalog.output.dir)
  const stagingDir = path.join(root, catalog.output.stagingDir)
  const linkStateFile = linkStatePathFor(catalog, root)
  const archiveName = `${catalog.output.archiveNamePrefix}-latest.zip`
  const archiveAbs = path.join(outDir, archiveName)
  const archiveRel = toPosix(path.relative(root, archiveAbs))
  const stagingRel = toPosix(path.relative(root, stagingDir))

  const sync = await syncLinkedStaging({
    catalog,
    files,
    root,
    stagingDir,
    linkStateFile,
    dryRun,
  })

  const orphanRemoved = dryRun
    ? []
    : await pruneOrphanStagingFiles(stagingDir, Object.keys(sync.state.links ?? {}))

  const manifest = {
    schemaVersion: 1,
    createdAt: nowIso(),
    purpose: catalog.purpose,
    mode: 'incremental-link-sync',
    fileCount: files.length,
    catalogAdded: refreshed.added,
    catalogRemoved: refreshed.removed,
    catalogDeduped: refreshed.deduped,
    filesCopied: sync.copied.length,
    filesUnchanged: sync.unchanged.length,
    filesRemovedFromStaging: sync.removed.length + orphanRemoved.length,
    orphanRemoved: orphanRemoved.length,
    archivePath: archiveRel,
    stagingPath: stagingRel,
    linkStatePath: toPosix(path.relative(root, linkStateFile)),
    // Full path list lives in FILE-LIST.txt — keep manifest small for tools/agents.
  }

  if (dryRun) {
    return {
      dryRun: true,
      manifest,
      catalogChanged: refreshed.changed,
      archivePath: archiveRel,
      stagingPath: stagingRel,
      sync,
      added: refreshed.added,
      removed: refreshed.removed,
      deduped: refreshed.deduped,
    }
  }

  await mkdir(outDir, { recursive: true })
  await mkdir(stagingDir, { recursive: true })

  const contentUnchanged = sync.copied.length === 0
    && sync.removed.length === 0
    && orphanRemoved.length === 0
    && !refreshed.changed
  let bytes = 0
  let zipRebuilt = true

  if (contentUnchanged && await exists(archiveAbs)) {
    bytes = (await stat(archiveAbs)).size
    zipRebuilt = false
  } else {
    await writeFile(path.join(stagingDir, 'PACK-MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    await writeFile(path.join(stagingDir, 'FILE-LIST.txt'), `${files.join('\n')}\n`, 'utf8')
    // Never ship LINK-STATE inside the zip — it is local sync metadata only.
    const stagedLink = path.join(stagingDir, 'LINK-STATE.json')
    if (await exists(stagedLink)) await rm(stagedLink, { force: true })
    bytes = await createZipArchive(stagingDir, archiveAbs)
  }

  const prunedArchives = await pruneOldArchives(outDir, archiveAbs, {
    root,
    keepPreviousArchives,
    dryRun: false,
  })

  await writeFile(path.join(outDir, 'LATEST.json'), `${JSON.stringify({
    createdAt: manifest.createdAt,
    archivePath: archiveRel,
    stagingPath: stagingRel,
    linkStatePath: manifest.linkStatePath,
    fileCount: files.length,
    bytes,
    zipRebuilt,
    prunedArchives,
    keepPreviousArchives,
    filesCopied: sync.copied.length,
    filesUnchanged: sync.unchanged.length,
    filesRemovedFromStaging: sync.removed.length + orphanRemoved.length,
    orphanRemoved: orphanRemoved.length,
    catalogAdded: refreshed.added,
    catalogRemoved: refreshed.removed,
    catalogDeduped: refreshed.deduped,
  }, null, 2)}\n`, 'utf8')

  return {
    dryRun: false,
    manifest: { ...manifest, zipRebuilt, prunedArchives },
    catalogChanged: refreshed.changed,
    archivePath: archiveRel,
    stagingPath: stagingRel,
    bytes,
    zipRebuilt,
    prunedArchives,
    orphanRemoved,
    sync,
    added: refreshed.added,
    removed: refreshed.removed,
    deduped: refreshed.deduped,
  }
}

function printReport(result) {
  const mb = result.bytes != null ? `${(result.bytes / (1024 * 1024)).toFixed(2)} MB` : 'n/a'
  console.log(JSON.stringify({
    ok: true,
    mode: 'incremental-link-sync',
    archivePath: result.archivePath,
    stagingPath: result.stagingPath,
    linkStatePath: result.manifest.linkStatePath,
    fileCount: result.manifest.fileCount,
    bytes: result.bytes ?? null,
    size: mb,
    catalogChanged: result.catalogChanged,
    catalogAdded: result.added ?? [],
    catalogRemoved: result.removed ?? [],
    catalogDeduped: result.deduped ?? [],
    filesCopied: result.sync?.copied?.length ?? result.manifest.filesCopied,
    filesUnchanged: result.sync?.unchanged?.length ?? result.manifest.filesUnchanged,
    filesRemovedFromStaging: result.sync?.removed?.length ?? result.manifest.filesRemovedFromStaging,
    orphanRemoved: result.orphanRemoved?.length ?? result.manifest.orphanRemoved ?? 0,
    zipRebuilt: result.zipRebuilt ?? result.manifest.zipRebuilt ?? true,
    prunedArchives: result.prunedArchives ?? result.manifest.prunedArchives ?? [],
    hint: '只跑 npm 命令并读本 JSON；勿打开 LINK-STATE / staging / FILE-LIST。',
  }, null, 2))
}

async function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes('--dry-run')
  const keepPreviousArchives = argv.includes('--keep-previous')
  const result = await packProjectContext({ dryRun, keepPreviousArchives })
  printReport(result)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
