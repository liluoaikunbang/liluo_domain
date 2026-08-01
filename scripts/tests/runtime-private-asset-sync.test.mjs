import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { syncRuntimePrivateAssets } from '../assets/runtime-private-asset-sync.mjs'

test('runtime private asset sync supports dry-run and live copy', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'runtime-private-asset-sync-'))
  const repoCgSources = path.join(dir, 'src/assets/game/sucai_cg_standee')
  const syncRoot = path.join(dir, 'Nutstore')
  const targetDir = path.join(syncRoot, 'game/visual/cg/standee-sources')

  await mkdir(repoCgSources, { recursive: true })
  await mkdir(path.join(dir, 'docs/assets/registry'), { recursive: true })
  await writeFile(path.join(repoCgSources, 'example.jpg'), 'cg-standee', 'utf8')
  await writeFile(path.join(dir, '.env.runtime-assets.local'), [
    'LILUO_RUNTIME_ASSET_PROVIDER=nutstore',
    `LILUO_RUNTIME_ASSET_SYNC_ROOT=${syncRoot}`,
  ].join('\n'), 'utf8')
  await writeFile(path.join(dir, 'docs/assets/registry/runtime-private-asset-manifest.json'), JSON.stringify({
    schemaVersion: 1,
    mode: 'offline-first-private-sync',
    groups: [
      {
        id: 'authoring-cg-standee-sources',
        title: 'CG Sources',
        repoRoots: ['src/assets/game/sucai_cg_standee'],
        syncSubdir: 'game/visual/cg/standee-sources',
        visibility: 'private-authoring-only',
        publicR2Allowed: false,
      },
    ],
  }, null, 2), 'utf8')

  const dryRun = syncRuntimePrivateAssets({
    root: dir,
    groups: ['authoring-cg-standee-sources'],
    live: false,
  })
  assert.equal(dryRun.mode, 'dry-run')
  assert.equal(dryRun.groups[0].fileCount, 1)

  const liveRun = syncRuntimePrivateAssets({
    root: dir,
    groups: ['authoring-cg-standee-sources'],
    live: true,
  })
  assert.equal(liveRun.mode, 'live')
  assert.equal(liveRun.groups[0].fileCount, 1)
  assert.equal(await readFile(path.join(targetDir, 'example.jpg'), 'utf8'), 'cg-standee')

  await rm(dir, { recursive: true, force: true })
})
