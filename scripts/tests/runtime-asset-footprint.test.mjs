import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { classifyRuntimeAsset } from '../assets/lib/runtime-asset-policy.mjs'
import { buildRuntimeAssetFootprint } from '../assets/runtime-asset-footprint.mjs'

test('runtime asset policy separates runtime finals, sources, and rebuildable frames', () => {
  assert.equal(classifyRuntimeAsset('cg/example.png').phase1Action, 'keep-now-plan-private-sync-later')
  assert.equal(classifyRuntimeAsset('raw_maps/example.tmx').phase1Action, 'externalize-map-source')
  assert.equal(classifyRuntimeAsset('mode/example.jpg').phase1Action, 'externalize-candidate-reference')
  assert.equal(classifyRuntimeAsset('sprite/LiLuo_body_down/down_walk_1.png').phase1Action, 'keep-and-regenerate')
  assert.equal(classifyRuntimeAsset('standee/partial/头.png').phase1Action, 'keep-runtime-layer')
  assert.equal(classifyRuntimeAsset('cg/example.psd').phase1Action, 'externalize-authoring-source')
})

test('runtime asset footprint report summarizes categories and duplicates', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'runtime-asset-footprint-'))
  const assetRoot = path.join(dir, 'src/assets/game')
  await mkdir(path.join(assetRoot, 'cg'), { recursive: true })
  await mkdir(path.join(assetRoot, 'mode'), { recursive: true })
  await mkdir(path.join(assetRoot, 'sprite/LiLuo_body_down'), { recursive: true })
  await mkdir(path.join(assetRoot, 'standee/partial'), { recursive: true })
  await mkdir(path.join(assetRoot, 'raw_maps'), { recursive: true })

  await writeFile(path.join(assetRoot, 'cg/example.png'), 'same-bytes', 'utf8')
  await writeFile(path.join(assetRoot, 'mode/example.jpg'), 'ref-bytes', 'utf8')
  await writeFile(path.join(assetRoot, 'sprite/LiLuo_body_down/down_walk_1.png'), 'cache-bytes', 'utf8')
  await writeFile(path.join(assetRoot, 'standee/partial/头.png'), 'same-bytes', 'utf8')
  await writeFile(path.join(assetRoot, 'raw_maps/example.tmx'), '<map/>', 'utf8')

  const report = buildRuntimeAssetFootprint({
    root: dir,
    generatedAt: '2026-08-01',
  })

  assert.equal(report.totals.fileCount, 5)
  assert.equal(report.totals.imageFileCount, 4)
  assert.equal(report.highlights.mapSourceMb >= 0, true)
  assert.equal(report.summaries.byTopLevel.some((item) => item.name === 'cg'), true)
  assert.equal(report.summaries.byPhase1Action.some((item) => item.name === 'externalize-candidate-reference'), true)
  assert.equal(report.summaries.byPhase1Action.some((item) => item.name === 'keep-and-regenerate'), true)
  assert.equal(report.duplicates.length, 1)
  assert.deepEqual(report.duplicates[0].paths.sort(), [
    'src/assets/game/cg/example.png',
    'src/assets/game/standee/partial/头.png',
  ])

  await rm(dir, { recursive: true, force: true })
})
