import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = path.resolve(HERE, '..', '..', '..')
export const WRITING_MODELS_PATH = 'project-navigation/writing-models.json'
export const ASSET_ROOT = 'docs/写作资产'
export const ASSET_REGISTRY_PATH = 'docs/写作资产/registry.json'
export const WORKSPACE_ROOT = 'docs/写作资产/工作区'
export const MODEL_LOCK_PATH = 'docs/写作资产/模型归档/model-lock.json'
export const STYLE_RAG_POLICY_PATH = 'project-navigation/style-rag-policy.json'
export const STYLE_TAXONOMY_PATH = 'project-navigation/style-taxonomy.json'
export const EXTERNAL_STYLE_SOURCES_PATH = 'project-navigation/external-style-sources.json'
export const EXTERNAL_ARTICLE_REGISTRY_PATH = 'docs/写作资产/外部风格研究/article-registry.json'
export const EXTERNAL_AUTHOR_REGISTRY_PATH = 'docs/写作资产/外部风格研究/author-registry.json'
export const EXTERNAL_DUPLICATE_GROUPS_PATH = 'docs/写作资产/外部风格研究/duplicate-groups.json'
export const STYLE_FEEDBACK_PATH = 'docs/写作资产/外部风格研究/style-feedback.json'
export const WRITING_SHEET_CURRENT_PATH = 'docs/写作资产/璃落写作表/current.json'
export const STYLE_REVIEW_EXPORT_DIR = 'docs/写作资产/工作区/external-review'
export const ENV_LOCAL_FILE = '.env.writing.local'
export const ENV_EXAMPLE_FILE = '.env.writing.example'
export const ALLOWED_ENV_KEYS = Object.freeze([
  'LILUO_WRITER_DSR1_BASE_URL',
  'LILUO_WRITER_DSR1_API_KEY',
  'LILUO_WRITER_DSR1_MODEL',
  'LILUO_WRITER_QWEN3_BASE_URL',
  'LILUO_WRITER_QWEN3_API_KEY',
  'LILUO_WRITER_QWEN3_MODEL',
])

export function repoPath(...parts) {
  return path.join(ROOT, ...parts)
}

export function toPosixRelative(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join('/')
}
