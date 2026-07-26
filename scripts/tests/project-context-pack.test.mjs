import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  loadCatalog,
  probePath,
  refreshCatalog,
  resolvePackFiles,
  packProjectContext,
  dedupeCatalogEntries,
  syncLinkedStaging,
} from '../project-context-pack/project-context-pack.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

test('catalog loads and resolves descriptive files without map.json', async () => {
  const catalog = await loadCatalog()
  const files = await resolvePackFiles(catalog, ROOT)
  assert.ok(files.includes('AGENTS.md'))
  assert.ok(files.some((item) => item.startsWith('docs/')))
  assert.ok(files.some((item) => item.startsWith('project-index/')))
  assert.ok(files.some((item) => item.includes('plot_outline/catalog.json')))
  assert.ok(!files.some((item) => item.endsWith('/map.json') || item === 'map.json'))
  assert.ok(!files.some((item) => item.startsWith('src/game/core/')))
  assert.ok(!files.some((item) => item.endsWith('.png')))
})

test('dedupeCatalogEntries drops path duplicates and covered children', () => {
  const { entries, dropped } = dedupeCatalogEntries([
    { path: 'docs', mode: 'tree', reason: 'root' },
    { path: 'docs', mode: 'tree', reason: 'dup', auto: true },
    { path: 'docs/foo', mode: 'tree', reason: 'child' },
    { path: '.agents', mode: 'tree', reason: 'broad', auto: true },
    { path: '.agents/skills', mode: 'tree', reason: 'specific' },
  ])
  assert.ok(entries.some((entry) => entry.path === 'docs' && !entry.auto))
  assert.ok(!entries.some((entry) => entry.path === 'docs/foo'))
  assert.ok(!entries.some((entry) => entry.path === '.agents'))
  assert.ok(entries.some((entry) => entry.path === '.agents/skills'))
  assert.ok(dropped.includes('docs/foo'))
  assert.ok(dropped.includes('.agents'))
})

test('refreshCatalog removes missing entries and can auto-add probed dirs', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'liluo-context-pack-'))
  try {
    await mkdir(path.join(temp, 'docs'), { recursive: true })
    await writeFile(path.join(temp, 'docs', 'README.md'), '# docs\n', 'utf8')
    await mkdir(path.join(temp, 'src', 'game', 'data', 'new_outline_pack'), { recursive: true })
    await writeFile(
      path.join(temp, 'src', 'game', 'data', 'new_outline_pack', 'catalog.json'),
      `${JSON.stringify({ schemaVersion: 1, entries: [] }, null, 2)}\n`,
      'utf8',
    )
    await writeFile(path.join(temp, 'AGENTS.md'), '# agents\n', 'utf8')
    await writeFile(path.join(temp, 'package.json'), '{}\n', 'utf8')

    const catalog = {
      schemaVersion: 1,
      purpose: 'test',
      output: {
        dir: '.local/project-context-pack',
        stagingDir: '.local/project-context-pack/staging',
        archiveNamePrefix: 'liluo-project-context',
      },
      watchParents: [
        { path: 'src/game/data', depth: 1, reason: 'data' },
      ],
      entries: [
        { path: 'AGENTS.md', mode: 'file', reason: 'root' },
        { path: 'missing-should-go.md', mode: 'file', reason: 'gone' },
        { path: 'docs', mode: 'tree', reason: 'docs' },
      ],
      globalExclude: {
        dirNames: ['node_modules', '.git', '.local'],
        extensions: ['.png'],
        basenames: ['map.json'],
        pathPrefixes: ['src/game/core/'],
      },
      probe: {
        headLines: 16,
        maxSampleFiles: 3,
        positiveNamePatterns: ['outline', 'catalog'],
        positiveContentPatterns: ['schemaVersion', 'entries'],
        negativeNamePatterns: ['node_modules'],
        preferExtensions: ['.md', '.json'],
      },
    }

    const refreshed = await refreshCatalog(catalog, temp)
    assert.ok(refreshed.removed.includes('missing-should-go.md'))
    assert.ok(refreshed.added.includes('src/game/data/new_outline_pack'))
    assert.ok(refreshed.catalog.entries.some((entry) => entry.path === 'src/game/data/new_outline_pack'))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('probe rejects implementation-looking vue/ts files', async () => {
  const catalog = await loadCatalog()
  const temp = await mkdtemp(path.join(os.tmpdir(), 'liluo-probe-'))
  try {
    const rel = 'SampleView.vue'
    await writeFile(path.join(temp, rel), '<script setup>\nimport { ref } from "vue"\n</script>\n', 'utf8')
    const result = await probePath(rel, catalog, temp)
    assert.equal(result.include, false)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('syncLinkedStaging only copies changed files and drops deleted links', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'liluo-link-sync-'))
  try {
    const root = path.join(temp, 'repo')
    const staging = path.join(temp, 'staging')
    const linkStateFile = path.join(temp, 'LINK-STATE.json')
    await mkdir(path.join(root, 'docs'), { recursive: true })
    await writeFile(path.join(root, 'docs', 'a.md'), 'one\n', 'utf8')
    await writeFile(path.join(root, 'docs', 'b.md'), 'two\n', 'utf8')

    const catalog = { output: { dir: temp, stagingDir: staging } }
    const first = await syncLinkedStaging({
      catalog,
      files: ['docs/a.md', 'docs/b.md'],
      root,
      stagingDir: staging,
      linkStateFile,
    })
    assert.equal(first.copied.length, 2)
    assert.equal(first.unchanged.length, 0)

    const second = await syncLinkedStaging({
      catalog,
      files: ['docs/a.md', 'docs/b.md'],
      root,
      stagingDir: staging,
      linkStateFile,
    })
    assert.equal(second.copied.length, 0)
    assert.equal(second.unchanged.length, 2)

    await writeFile(path.join(root, 'docs', 'a.md'), 'one-changed\n', 'utf8')
    await rm(path.join(root, 'docs', 'b.md'), { force: true })
    const third = await syncLinkedStaging({
      catalog,
      files: ['docs/a.md'],
      root,
      stagingDir: staging,
      linkStateFile,
    })
    assert.deepEqual(third.copied, ['docs/a.md'])
    assert.deepEqual(third.removed, ['docs/b.md'])
    const state = JSON.parse(await readFile(linkStateFile, 'utf8'))
    assert.ok(state.links['docs/a.md'])
    assert.equal(state.links['docs/b.md'], undefined)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('pruneOldArchives deletes previous zips but keeps latest', async () => {
  const { pruneOldArchives } = await import('../project-context-pack/project-context-pack.mjs')
  const temp = await mkdtemp(path.join(os.tmpdir(), 'liluo-prune-zips-'))
  try {
    const latest = path.join(temp, 'liluo-project-context-latest.zip')
    const old = path.join(temp, 'liluo-project-context-2026-07-26T11-12-16-750Z.zip')
    await writeFile(latest, 'latest\n', 'utf8')
    await writeFile(old, 'old\n', 'utf8')
    const removed = await pruneOldArchives(temp, latest, { root: temp })
    assert.equal(removed.length, 1)
    assert.match(removed[0], /2026-07-26/)
    assert.equal(await readFile(latest, 'utf8'), 'latest\n')
    await assert.rejects(() => readFile(old, 'utf8'))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('pruneOrphanStagingFiles removes leftover unlinked files', async () => {
  const { pruneOrphanStagingFiles } = await import('../project-context-pack/project-context-pack.mjs')
  const temp = await mkdtemp(path.join(os.tmpdir(), 'liluo-orphan-'))
  try {
    const staging = path.join(temp, 'staging')
    await mkdir(path.join(staging, 'external-knowledge', 'sources'), { recursive: true })
    await writeFile(path.join(staging, 'keep.md'), 'k\n', 'utf8')
    await writeFile(path.join(staging, 'external-knowledge', 'sources', 'big.md'), 'x\n', 'utf8')
    const removed = await pruneOrphanStagingFiles(staging, ['keep.md'])
    assert.ok(removed.some((item) => item.includes('sources')))
    assert.equal(await readFile(path.join(staging, 'keep.md'), 'utf8'), 'k\n')
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('packProjectContext dry-run reports latest zip and incremental mode', async () => {
  const result = await packProjectContext({ root: ROOT, dryRun: true })
  assert.equal(result.dryRun, true)
  assert.ok(result.manifest.fileCount > 50)
  assert.equal(result.archivePath, '.local/project-context-pack/liluo-project-context-latest.zip')
  assert.equal(result.manifest.mode, 'incremental-link-sync')
  assert.equal(result.manifest.files, undefined)
})
