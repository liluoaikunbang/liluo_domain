import fs from 'node:fs';
import path from 'node:path';

export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
export const KNOWLEDGE_ROOT = path.join(REPO_ROOT, 'external-knowledge');
const configPath = path.join(KNOWLEDGE_ROOT, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\\uFEFF/u, ''));
export const SOURCE_ROOTS = (config.sourceRoots ?? ['external-knowledge/sources/fiction-bondage'])
  .map((item) => path.resolve(REPO_ROOT, item));
export const SOURCE_ROOT = SOURCE_ROOTS[0];
export const TEXT_EXTENSIONS = new Set(config.supportedTextExtensions ?? ['.md', '.txt', '.markdown']);
export const SCOPE = 'external-fiction-reference';
export const repoRelative = (filePath) => path.relative(REPO_ROOT, filePath).replaceAll('\\', '/');
