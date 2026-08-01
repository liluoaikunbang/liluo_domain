import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildRuntimePrivateAssetStatus } from '../assets/runtime-private-asset-status.mjs'

test('runtime private asset status reports repo groups and sync readiness', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'runtime-private-asset-status-'))
  const repoCg = path.join(dir, 'src/assets/game/cg')
  const repoMode = path.join(dir, 'src/assets/game/mode')
  const syncRoot = path.join(dir, 'Nutstore')

  await mkdir(repoCg, { recursive: true })
  await mkdir(repoMode, { recursive: true })
  await mkdir(path.join(syncRoot, 'game/runtime/cg-finals'), { recursive: true })
  await writeFile(path.join(repoCg, 'scene.png'), 'cg-bytes', 'utf8')
  await writeFile(path.join(repoMode, 'board.jpg'), 'ref-bytes', 'utf8')
  await writeFile(path.join(syncRoot, 'game/runtime/cg-finals', 'scene.png'), 'cg-bytes', 'utf8')
  await writeFile(path.join(dir, '.env.runtime-assets.local'), [
    'LILUO_RUNTIME_ASSET_PROVIDER=nutstore',
    `LILUO_RUNTIME_ASSET_SYNC_ROOT=${syncRoot}`,
  ].join('\n'), 'utf8')
  await mkdir(path.join(dir, 'docs/assets/registry'), { recursive: true })
  await writeFile(path.join(dir, 'docs/assets/registry/runtime-private-asset-manifest.json'), JSON.stringify({
    schemaVersion: 1,
    mode: 'offline-first-private-sync',
    groups: [
      {
        id: 'runtime-cg-finals',
        title: 'CG',
        repoRoots: ['src/assets/game/cg'],
        syncSubdir: 'game/runtime/cg-finals',
        visibility: 'private-offline-only',
        publicR2Allowed: false,
      },
      {
        id: 'candidate-reference-boards',
        title: 'Mode',
        repoRoots: ['src/assets/game/mode'],
        syncSubdir: 'game/reference/mode-boards',
        visibility: 'private-reference-only',
        publicR2Allowed: false,
      },
    ],
  }, null, 2), 'utf8')

  const report = buildRuntimePrivateAssetStatus({
    root: dir,
    generatedAt: '2026-08-01',
  })

  assert.equal(report.provider, 'nutstore')
  assert.equal(report.env.syncRootConfigured, true)
  assert.equal(report.totals.trackedGroupCount, 2)
  assert.equal(report.totals.groupsReadyInSync, 1)
  assert.equal(report.groups[0].syncTargetExists, true)
  assert.equal(report.groups[1].syncTargetExists, false)
  assert.equal(report.groups[0].repoRoots[0].exists, true)
  assert.equal(report.groups[0].publicR2Allowed, false)

  await rm(dir, { recursive: true, force: true })
})
