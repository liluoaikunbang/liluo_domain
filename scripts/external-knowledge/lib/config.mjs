import path from 'node:path';
export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
export const KNOWLEDGE_ROOT = path.join(REPO_ROOT, 'external-knowledge');
export const SOURCE_ROOT = path.join(KNOWLEDGE_ROOT, 'sources', 'fiction-bondage');
export const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.markdown']);
export const SCOPE = 'external-fiction-reference';
export const repoRelative = (filePath) => path.relative(REPO_ROOT, filePath).replaceAll('\\', '/');
