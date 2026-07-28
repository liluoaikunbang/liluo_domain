/**
 * Shared detector for paths that feed the project knowledge index.
 * Keep check-project-index and pre-commit in sync via this module only.
 */

/**
 * @param {string} relativePosix path relative to repo root, forward slashes
 * @returns {boolean}
 */
export function isIndexedSourcePath(relativePosix) {
  const relative = String(relativePosix || '').replaceAll('\\', '/')
  if (!relative) return false
  return (
    (relative.startsWith('docs/') && relative.endsWith('.md')) ||
    relative.startsWith('src/assets/game/') ||
    (relative.startsWith('src/game/data/story_outline/sources/') && relative.endsWith('.json')) ||
    (relative.startsWith('src/game/data/story_outline/') && relative.endsWith('.md')) ||
    relative === 'src/game/data/gameplay_outline/catalog.json' ||
    (relative.startsWith('src/game/data/maps/') &&
      ['.json', '.js', '.ts'].some((extension) => relative.endsWith(extension))) ||
    (relative.startsWith('src/game/data/interactive_fictions/') &&
      ['.json', '.js', '.ts'].some((extension) => relative.endsWith(extension))) ||
    relative === 'src/game/data/registry.ts' ||
    (relative.startsWith('src/game/') &&
      ['.js', '.ts', '.vue'].some((extension) => relative.endsWith(extension)))
  )
}

/**
 * @param {string[]} paths
 * @returns {boolean}
 */
export function pathsIncludeIndexedSource(paths) {
  return (paths || []).some((item) => isIndexedSourcePath(item))
}
