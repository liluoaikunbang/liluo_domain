import {
  collaborationTracks,
  developmentStatuses,
  devlogEntries,
  evidenceLevels,
  footerNavigation,
  liluoProfile,
  navigation,
  planCounts,
  productionPhases,
  publishedAssets,
  publishedAssetsById,
  roadmapItems,
  routeMatrix,
  screenshotBriefs,
  series,
  siteStats,
  siteConfig,
  spotlightGroups,
  visualRegistry,
  worldSummaries,
  worlds,
} from './sitePlanRuntime'

export {
  collaborationTracks,
  developmentStatuses,
  devlogEntries,
  evidenceLevels,
  footerNavigation,
  liluoProfile,
  navigation,
  planCounts,
  productionPhases,
  publishedAssets,
  publishedAssetsById,
  roadmapItems,
  routeMatrix,
  screenshotBriefs,
  series,
  siteConfig,
  siteStats,
  spotlightGroups,
  visualRegistry,
  worldSummaries,
  worlds,
}
export { batchSummaries, layerCounts, evidenceItems } from './sitePlanRuntime'

export function getPublishedAsset(assetId) {
  return publishedAssetsById.get(assetId) || null
}

export function getWorld(worldId) {
  return worlds.find((world) => world.id === worldId) || null
}

export function getSeries(seriesId) {
  return series.find((item) => item.id === seriesId) || null
}

export function getWorldSummary(worldId) {
  return worldSummaries.find((world) => world.id === worldId) || null
}

export function getSeriesForWorld(worldId) {
  return series.filter((item) => item.worldId === worldId)
}

export function getWorldPublishedAssets(worldId) {
  return publishedAssets.filter((item) => item.worldId === worldId)
}

export function getSpotlights(name) {
  return spotlightGroups[name] || []
}
