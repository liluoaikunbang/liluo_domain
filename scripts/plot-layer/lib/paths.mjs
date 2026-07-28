import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = path.resolve(__dirname, '../../..')
export const PLOT_CATALOG_PATH = path.join(REPO_ROOT, 'src/game/data/plot_outline/catalog.json')
export const STORY_SOURCES_DIR = path.join(REPO_ROOT, 'src/game/data/story_outline/sources')
export const STORY_MARKDOWN_DIR = path.join(REPO_ROOT, 'src/game/data/story_outline')
export const RESTRAINT_CARDS_DIR = path.join(REPO_ROOT, 'external-knowledge/cards/restraint')
export const REVIEW_ROOT = path.join(REPO_ROOT, 'docs/情节层级核对')
export const REGISTRY_PATH = path.join(REVIEW_ROOT, 'registry.json')
export const SNAPSHOTS_DIR = path.join(REVIEW_ROOT, 'snapshots')
export const PROPOSALS_DIR = path.join(REVIEW_ROOT, 'proposals')
export const QUEUE_PATH = path.join(REVIEW_ROOT, 'review-queue.json')
export const CONFIRMATIONS_DIR = path.join(REVIEW_ROOT, 'confirmations')
export const MIGRATIONS_DIR = path.join(REVIEW_ROOT, 'migrations')
export const UI_QUEUE_EXPORT_PATH = path.join(
  REPO_ROOT,
  'src/game/data/plot_outline/layerReviewQueue.json'
)

export const RECOMMENDATION_PRIORITY = {
  'move-to-rag': 1,
  'merge-into-existing-rag': 1,
  'split-plot-and-rag': 2,
  'promote-to-story': 3,
  uncertain: 4,
  'merge-into-existing-plot': 5,
  archive: 5,
  'keep-as-plot': 6
}
