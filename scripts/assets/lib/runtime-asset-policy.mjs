import path from 'node:path'

const RUNTIME_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])
const SOURCE_ONLY_EXTENSIONS = new Set(['.psd', '.jsx'])
const NON_IMAGE_SUPPORT_EXTENSIONS = new Set(['.md', '.tmx', '.mp3'])
const REBUILDABLE_SPRITE_DIRS = new Set([
  'LiLuo_body_down',
  'LiLuo_body_up',
  'LiLuo_head',
  'bondage_body_up',
  'bondage_body_down',
])

function toPosix(value) {
  return String(value || '').replace(/\\/gu, '/')
}

function startsWithAny(value, prefixes) {
  return prefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`))
}

export function isRuntimeAssetImage(relativePath) {
  return RUNTIME_IMAGE_EXTENSIONS.has(path.extname(relativePath).toLowerCase())
}

export function classifyRuntimeAsset(relativePath) {
  const normalized = toPosix(relativePath).replace(/^\/+/gu, '')
  const extension = path.extname(normalized).toLowerCase()
  const parts = normalized.split('/').filter(Boolean)
  const topLevel = parts[0] || '<root>'
  const secondLevel = parts[1] || ''
  const isImage = RUNTIME_IMAGE_EXTENSIONS.has(extension)

  const base = {
    normalizedPath: normalized,
    topLevel,
    secondLevel,
    extension,
    isImage,
    keepInRuntimeBuild: false,
    rebuildable: false,
    canMoveOriginalsOutOfGit: false,
    publicR2Eligible: false,
    category: 'uncategorized',
    gitPolicy: 'review',
    phase1Action: 'review',
    reason: 'Needs manual classification.',
  }

  if (SOURCE_ONLY_EXTENSIONS.has(extension)) {
    return {
      ...base,
      category: 'authoring-source',
      gitPolicy: 'move-source-out-of-git-first',
      phase1Action: 'externalize-authoring-source',
      canMoveOriginalsOutOfGit: true,
      reason: 'Authoring source files should not be the long-term weight inside the runtime repository.',
    }
  }

  if (NON_IMAGE_SUPPORT_EXTENSIONS.has(extension)) {
    return {
      ...base,
      category: extension === '.tmx' ? 'map-source' : 'support-file',
      gitPolicy: extension === '.tmx' ? 'move-source-out-of-git-first' : 'keep-in-git',
      phase1Action: extension === '.tmx' ? 'externalize-map-source' : 'keep-support-file',
      keepInRuntimeBuild: extension === '.mp3',
      canMoveOriginalsOutOfGit: extension === '.tmx',
      reason: extension === '.tmx'
        ? 'Raw map source belongs to authoring assets, not the optimized runtime bundle.'
        : 'Non-image support files are not part of the public image-hosting pipeline.',
    }
  }

  if (startsWithAny(normalized, ['raw_maps'])) {
    return {
      ...base,
      category: 'map-source',
      gitPolicy: 'move-source-out-of-git-first',
      phase1Action: 'externalize-map-source',
      canMoveOriginalsOutOfGit: true,
      reason: 'Raw map source files can be externalized before any runtime CDN work.',
    }
  }

  if (startsWithAny(normalized, ['pixel_maps', 'mode', 'sucai_cg_standee', 'sucai_scenes'])) {
    return {
      ...base,
      category: topLevel === 'mode' ? 'candidate-reference' : 'authoring-source',
      gitPolicy: 'move-source-out-of-git-first',
      phase1Action: topLevel === 'mode' ? 'externalize-candidate-reference' : 'externalize-authoring-source',
      canMoveOriginalsOutOfGit: true,
      reason: 'This directory stores references, candidates, or production sources rather than optimized runtime finals.',
    }
  }

  if (topLevel === 'sprite' && REBUILDABLE_SPRITE_DIRS.has(secondLevel)) {
    return {
      ...base,
      category: 'runtime-generated-final',
      gitPolicy: 'keep-with-regeneration-contract',
      phase1Action: 'keep-and-regenerate',
      keepInRuntimeBuild: true,
      rebuildable: true,
      reason: 'These frame slices are required by the current runtime loader, but they can be regenerated deterministically from committed masters.',
    }
  }

  if (topLevel === 'sprite') {
    return {
      ...base,
      category: 'runtime-master',
      gitPolicy: 'keep-in-git',
      phase1Action: 'keep-runtime-master',
      keepInRuntimeBuild: true,
      reason: 'Sprite master files are small enough and directly tied to runtime composition or regeneration.',
    }
  }

  if (topLevel === 'standee' && secondLevel === 'partial') {
    return {
      ...base,
      category: 'runtime-layer',
      gitPolicy: 'keep-in-git',
      phase1Action: 'keep-runtime-layer',
      keepInRuntimeBuild: true,
      reason: 'Partial standee layers are consumed by runtime composition and must stay path-stable.',
    }
  }

  if (startsWithAny(normalized, ['backgrounds', 'bondage_items', 'cg', 'outlines', 'scenes', 'standee', 'states', 'sucai'])) {
    return {
      ...base,
      category: topLevel === 'cg' ? 'runtime-final-large' : 'runtime-final',
      gitPolicy: 'keep-in-git',
      phase1Action: topLevel === 'cg' ? 'keep-now-plan-private-sync-later' : 'keep-runtime-final',
      keepInRuntimeBuild: true,
      reason: topLevel === 'cg'
        ? 'CG finals are runtime-visible and heavy; Phase 1 keeps them stable in git, but the long-term direction is private offline sync rather than public R2 hosting.'
        : 'This directory contains runtime-facing optimized assets that the current game expects locally.',
    }
  }

  return base
}
