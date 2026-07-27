import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(HERE, '..', '..', '..')
export const AUDIT_ROOT = 'docs/知识检索校准'
export const AUDIT_REGISTRY_PATH = `${AUDIT_ROOT}/registry.json`
export const AUDIT_POLICY_PATH = 'project-navigation/rag-audit-policy.json'
export const AUDIT_CATEGORIES_PATH = 'project-navigation/rag-audit-categories.json'
export const AUDIT_RECORDS_RAG = `${AUDIT_ROOT}/records/rag`
export const AUDIT_RECORDS_STYLE = `${AUDIT_ROOT}/records/style-rag`
export const AUDIT_RECORDS_CONCEPT = `${AUDIT_ROOT}/records/concept`
export const AUDIT_RECORDS_PLOT = `${AUDIT_ROOT}/records/plot`
export const AUDIT_BATCHES = `${AUDIT_ROOT}/batches`
export const AUDIT_REBUILD_LOGS = `${AUDIT_ROOT}/rebuild-logs`
export const ARTICLE_REGISTRY_PATH = 'docs/写作资产/外部风格研究/article-registry.json'
export const PLOT_CATALOG_PATH = 'src/game/data/plot_outline/catalog.json'
export const HIT_STATS_PATH = `${AUDIT_ROOT}/hit-stats.json`
export const RAG_CARDS_DIR = 'external-knowledge/cards'
export const CONCEPT_REGISTRY_MODULE = 'src/game/data/outline_relation_graph/conceptRegistry.js'

export function repoPath(...parts) {
  return path.join(ROOT, ...parts)
}

export function toPosix(relativeOrAbs) {
  const rel = path.isAbsolute(relativeOrAbs) ? path.relative(ROOT, relativeOrAbs) : relativeOrAbs
  return rel.split(path.sep).join('/')
}
