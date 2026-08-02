import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  footerNavigation,
  navigation,
  planCounts,
  publishedAssets,
  publishedAssetsById,
  routeMatrix,
  screenshotBriefs,
  series,
  visualRegistry,
  worlds,
} from '../../src/content/site/sitePlanRuntime.js'

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

function assertRepoFile(relativePath, label) {
  if (!relativePath || /^https?:\/\//u.test(relativePath)) return
  const normalized = relativePath.replaceAll('\\', '/')
  const absolute = path.join(repoRoot, normalized)
  if (!fs.existsSync(absolute)) fail(`${label} missing file: ${normalized}`)
}

assertUnique(publishedAssets, 'publishedAssets')
assertUnique(visualRegistry, 'visualRegistry')
assertUnique(screenshotBriefs, 'screenshotBriefs')
assertUnique(worlds, 'worlds')
assertUnique(series, 'series')

if (planCounts.plannedVisuals !== 1248) fail(`Expected 1248 planned visuals, got ${planCounts.plannedVisuals}`)
if (planCounts.screenshotPlan !== 96) fail(`Expected 96 screenshot briefs, got ${planCounts.screenshotPlan}`)

for (const asset of publishedAssets) {
  assertRepoFile(asset.sourcePath, `published asset ${asset.id}`)
}

for (const entry of visualRegistry) {
  if (!entry.prompt || entry.prompt.length < 140) fail(`Prompt too short: ${entry.id}`)
  if (entry.previewAssetId && !publishedAssetsById.has(entry.previewAssetId)) fail(`Missing preview asset for ${entry.id}: ${entry.previewAssetId}`)
}

for (const world of worlds) {
  if (!routeMatrix.includes(`/worlds/${world.id}`)) fail(`Missing world route: ${world.id}`)
}

for (const item of series) {
  const route = `/worlds/${item.worldId}/series/${item.id}`
  if (!routeMatrix.includes(route)) fail(`Missing series route: ${route}`)
}

for (const item of [...navigation, ...footerNavigation]) {
  if (!routeMatrix.includes(item.path)) fail(`Navigation path missing from route matrix: ${item.path}`)
}

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        counts: planCounts,
        publishedAssets: publishedAssets.length,
        worlds: worlds.length,
        series: series.length,
      },
      null,
      2,
    ),
  )
}
