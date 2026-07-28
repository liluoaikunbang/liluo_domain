import fs from 'node:fs'
import path from 'node:path'
import {
  PLOT_CATALOG_PATH,
  RESTRAINT_CARDS_DIR,
  STORY_MARKDOWN_DIR,
  STORY_SOURCES_DIR
} from './paths.mjs'
import { listJsonFiles, readJson } from './io.mjs'

export function loadPlotCatalog() {
  return readJson(PLOT_CATALOG_PATH)
}

export function loadStoryNodes() {
  const files = listJsonFiles(STORY_SOURCES_DIR)
  const nodes = []
  for (const filePath of files) {
    const doc = readJson(filePath, { nodes: [] })
    const relative = path.relative(process.cwd(), filePath).replaceAll('\\', '/')
    for (const node of doc.nodes ?? []) {
      nodes.push({
        ...node,
        sourceFile: relative
      })
    }
  }
  return nodes
}

export function loadRestraintCards() {
  const files = listJsonFiles(RESTRAINT_CARDS_DIR)
  return files.map((filePath) => {
    const card = readJson(filePath)
    return {
      ...card,
      filePath: path.relative(process.cwd(), filePath).replaceAll('\\', '/')
    }
  })
}

export function findStoryMarkdownPaths(storyKey) {
  const hits = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.md')) {
        const text = fs.readFileSync(full, 'utf8')
        if (text.includes(storyKey) || text.includes(`key: ${storyKey}`)) {
          hits.push(path.relative(process.cwd(), full).replaceAll('\\', '/'))
        }
      }
    }
  }
  walk(STORY_MARKDOWN_DIR)
  return hits
}

export function collectPlotStoryLinks(plotId, storyNodes = loadStoryNodes()) {
  return storyNodes
    .filter((node) => (node.plotRefs ?? []).includes(plotId))
    .map((node) => ({
      key: node.key,
      title: node.title ?? node.name ?? node.key,
      sourceFile: node.sourceFile,
      markdownFiles: findStoryMarkdownPaths(node.key),
      ragRefs: node.ragRefs ?? [],
      plotRefs: node.plotRefs ?? [],
      gameplayRefs: node.gameplayRefs ?? []
    }))
}

export function buildBaselineStats({
  catalog = loadPlotCatalog(),
  storyNodes = loadStoryNodes(),
  ragCards = loadRestraintCards()
} = {}) {
  const formalPlots = catalog.entries ?? []
  const groups = catalog.groups ?? []
  return {
    catalogVersion: catalog.version ?? null,
    formalStoryNodeCount: storyNodes.length,
    formalPlotEntryCount: formalPlots.length,
    plotGroupCount: groups.length,
    realPlotCountExcludingGroups: formalPlots.length,
    ragCardCount: ragCards.length,
    storiesWithPlotRefs: storyNodes.filter((n) => (n.plotRefs ?? []).length > 0).length,
    storiesWithRagRefs: storyNodes.filter((n) => (n.ragRefs ?? []).length > 0).length,
    plotsReferencedByStories: new Set(
      storyNodes.flatMap((n) => n.plotRefs ?? [])
    ).size
  }
}
