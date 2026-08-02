import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assets,
  characters,
  evidenceItems,
  footerNavigation,
  navigation,
  series,
  worlds,
} from '../../src/content/site/siteData.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const failures = []

function fail(message) {
  failures.push(message)
}

function assertUnique(items, label) {
  const seen = new Set()
  for (const item of items) {
    if (!item.id) fail(`${label} has an item without id`)
    if (seen.has(item.id)) fail(`${label} has duplicate id: ${item.id}`)
    seen.add(item.id)
  }
}

function isLocalAbsolute(value) {
  return /^[a-zA-Z]:[\\/]/u.test(value) || value.startsWith('file:')
}

function assertRepoFile(relativePath, label) {
  if (!relativePath || /^https?:\/\//u.test(relativePath)) return
  if (isLocalAbsolute(relativePath)) {
    fail(`${label} uses local absolute path: ${relativePath}`)
    return
  }
  const absolute = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolute)) fail(`${label} missing file: ${relativePath}`)
}

assertUnique(assets, 'assets')
assertUnique(worlds, 'worlds')
assertUnique(series, 'series')
assertUnique(characters, 'characters')
assertUnique(evidenceItems, 'evidenceItems')

const assetIds = new Set(assets.map((item) => item.id))
const worldIds = new Set(worlds.map((item) => item.id))
const seriesIds = new Set(series.map((item) => item.id))
const characterIds = new Set(characters.map((item) => item.id))

for (const asset of assets) {
  assertRepoFile(asset.objectKey, `asset ${asset.id}`)
  if (!asset.alt) fail(`asset ${asset.id} is missing alt`)
  if (asset.evidenceLevel === 'runtime-capture' && asset.sourceType !== 'game-capture' && asset.sourceType !== 'composite') {
    fail(`asset ${asset.id} is runtime-capture but sourceType is ${asset.sourceType}`)
  }
  if (asset.sourceType === 'gpt-image-2' && asset.evidenceLevel === 'runtime-capture') {
    fail(`asset ${asset.id} is gpt-image-2 but marked runtime-capture`)
  }
}

for (const world of worlds) {
  if (!assetIds.has(world.heroAssetId)) fail(`world ${world.id} has missing hero asset ${world.heroAssetId}`)
  for (const assetId of world.galleryAssetIds) {
    if (!assetIds.has(assetId)) fail(`world ${world.id} has missing gallery asset ${assetId}`)
  }
  for (const id of world.seriesIds) {
    if (!seriesIds.has(id)) fail(`world ${world.id} has missing series ${id}`)
  }
}

for (const item of series) {
  if (!worldIds.has(item.worldId)) fail(`series ${item.id} has missing world ${item.worldId}`)
  if (!assetIds.has(item.coverAssetId)) fail(`series ${item.id} has missing cover asset ${item.coverAssetId}`)
}

for (const character of characters) {
  for (const assetId of [...character.worldVariantAssetIds, ...character.expressionAssetIds]) {
    if (!assetIds.has(assetId)) fail(`character ${character.id} has missing asset ${assetId}`)
  }
  for (const worldId of character.relatedWorldIds) {
    if (!worldIds.has(worldId)) fail(`character ${character.id} has missing related world ${worldId}`)
  }
}

for (const evidence of evidenceItems) {
  if (!assetIds.has(evidence.assetId)) fail(`evidence ${evidence.id} has missing asset ${evidence.assetId}`)
  for (const sourceFile of evidence.sourceFiles) assertRepoFile(sourceFile, `evidence ${evidence.id}`)
}

const requiredRoutes = new Set([
  '/',
  '/worlds',
  ...worlds.map((world) => `/worlds/${world.id}`),
  ...series.map((item) => `/worlds/${item.worldId}/series/${item.id}`),
  '/characters',
  '/characters/liluo',
  '/gallery',
  '/evidence',
  '/production',
  '/roadmap',
  '/devlog',
  '/collab',
  '/game',
])

for (const route of [...navigation, ...footerNavigation]) {
  if (!requiredRoutes.has(route.path)) fail(`navigation route is not registered in required route set: ${route.path}`)
}

if (!characterIds.has('liluo')) fail('missing required character: liluo')

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        assetCount: assets.length,
        worldCount: worlds.length,
        seriesCount: series.length,
        evidenceCount: evidenceItems.length,
        requiredRouteCount: requiredRoutes.size,
      },
      null,
      2,
    ),
  )
}
