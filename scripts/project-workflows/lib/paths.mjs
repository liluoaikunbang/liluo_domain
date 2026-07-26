import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = path.resolve(HERE, '../../..')
export const WORKFLOWS_DIR = path.join(ROOT, 'project-workflows')
export const DEFINITIONS_DIR = path.join(WORKFLOWS_DIR, 'definitions')
export const REGISTRY_PATH = path.join(WORKFLOWS_DIR, 'registry.json')
export const GENERATED_DIR = path.join(WORKFLOWS_DIR, 'generated')
export const RUNS_DIR = path.join(WORKFLOWS_DIR, 'runs')
export const EXAMPLE_RUNS_DIR = path.join(RUNS_DIR, 'examples')
export const TEMPLATES_DIR = path.join(WORKFLOWS_DIR, 'templates')
export const DEFINITION_SCHEMA = path.join(ROOT, 'schemas/workflows/workflow-definition.schema.json')
export const RUN_SCHEMA = path.join(ROOT, 'schemas/workflows/workflow-run.schema.json')

export function toPosix(value) {
  return String(value).replaceAll('\\', '/')
}

export function resolveRepoPath(repoRelative) {
  const resolved = path.resolve(ROOT, repoRelative)
  const relative = path.relative(ROOT, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repository root: ${repoRelative}`)
  }
  return resolved
}
