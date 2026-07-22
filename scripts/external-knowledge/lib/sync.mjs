import fs from 'node:fs/promises';
import path from 'node:path';

import { KNOWLEDGE_ROOT, SOURCE_ROOT } from './config.mjs';
import { sha256 } from './hashing.mjs';
import { listFiles, readJson, writeJson } from './store.mjs';

const LOCAL_CONFIG_PATH = path.join(KNOWLEDGE_ROOT, 'source-sync.local.json');
const SYNC_MANIFEST_PATH = path.join(KNOWLEDGE_ROOT, 'sync-manifest.json');
const SYNC_STATUS_PATH = path.join(KNOWLEDGE_ROOT, 'sync-status.json');

function normalizedRelativePath(value) {
  const normalized = value.replaceAll('\\', '/');
  if (!normalized || path.isAbsolute(normalized) || normalized.split('/').includes('..')) throw new Error(`Unsafe relative path: ${value}`);
  return normalized;
}

function containedPath(root, relativePath) {
  const resolvedRoot = path.resolve(root), resolved = path.resolve(resolvedRoot, normalizedRelativePath(relativePath));
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error(`Path escapes root: ${relativePath}`);
  return resolved;
}

export function createSyncPlan(authoritative, mirror, { deleteThreshold = 0.2, managedPaths } = {}) {
  const sourceByPath = new Map(authoritative.map((item) => [normalizedRelativePath(item.relativePath), item]));
  const mirrorByPath = new Map(mirror.map((item) => [normalizedRelativePath(item.relativePath), item]));
  const managed = new Set((managedPaths ?? mirror.map((item) => item.relativePath)).map(normalizedRelativePath));
  const unmatchedSource = authoritative.filter((item) => !mirrorByPath.has(item.relativePath));
  const unmatchedMirror = mirror.filter((item) => managed.has(item.relativePath) && !sourceByPath.has(item.relativePath));
  const renamed = [], usedMirrorPaths = new Set();
  for (const source of unmatchedSource) {
    const match = unmatchedMirror.find((item) => !usedMirrorPaths.has(item.relativePath) && item.contentHash === source.contentHash);
    if (match) { renamed.push({ from: match.relativePath, to: source.relativePath }); usedMirrorPaths.add(match.relativePath); }
  }
  const renamedTargets = new Set(renamed.map((item) => item.to));
  const added = unmatchedSource.filter((item) => !renamedTargets.has(item.relativePath)).map((item) => item.relativePath).sort();
  const modified = authoritative.filter((item) => mirrorByPath.has(item.relativePath) && mirrorByPath.get(item.relativePath).contentHash !== item.contentHash).map((item) => item.relativePath).sort();
  const deleted = unmatchedMirror.filter((item) => !usedMirrorPaths.has(item.relativePath)).map((item) => item.relativePath).sort();
  const deletionRatio = managed.size ? deleted.length / managed.size : 0;
  const blocked = managed.size > 0 && deletionRatio > deleteThreshold;
  return { added, modified, renamed, deleted, unchanged: authoritative.length - added.length - modified.length - renamed.length, deletionRatio, blocked, blockReason: blocked ? `Automatic deletion blocked: ${(deletionRatio * 100).toFixed(1)}% exceeds the ${(deleteThreshold * 100).toFixed(0)}% safety threshold.` : null };
}

async function inventory(root) {
  const files = await listFiles(root), result = [];
  for (const filePath of files) result.push({ relativePath: path.relative(root, filePath).replaceAll('\\', '/'), contentHash: sha256(await fs.readFile(filePath)), sizeBytes: (await fs.stat(filePath)).size });
  return result;
}

async function copyAtomically(sourceRoot, mirrorRoot, relativePath) {
  const source = containedPath(sourceRoot, relativePath), destination = containedPath(mirrorRoot, relativePath), temporary = `${destination}.syncing`;
  await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.copyFile(source, temporary); await fs.rm(destination, { force: true }); await fs.rename(temporary, destination);
}

export async function syncAuthoritativeSource({ configPath = LOCAL_CONFIG_PATH, mirrorRoot = SOURCE_ROOT, manifestPath = SYNC_MANIFEST_PATH, statusPath = SYNC_STATUS_PATH } = {}) {
  const config = await readJson(configPath);
  if (!config?.authoritativeSourcePath) throw new Error(`Missing authoritativeSourcePath in ${configPath}`);
  const authoritativeRoot = path.resolve(config.authoritativeSourcePath), resolvedMirrorRoot = path.resolve(mirrorRoot), deleteThreshold = Number(config.deleteThreshold ?? 0.2);
  const authoritativeStat = await fs.stat(authoritativeRoot).catch(() => null);
  if (!authoritativeStat?.isDirectory()) throw new Error(`Authoritative source directory is unavailable: ${authoritativeRoot}`);
  const [authoritative, mirror, previousManifest] = await Promise.all([inventory(authoritativeRoot), inventory(resolvedMirrorRoot), readJson(manifestPath, null)]);
  if (authoritative.length === 0 && mirror.length > 0) throw new Error('Authoritative source is empty while the mirror is not; refusing to synchronize deletions.');
  const managedPaths = previousManifest?.files?.map((item) => item.relativePath) ?? mirror.map((item) => item.relativePath);
  const plan = createSyncPlan(authoritative, mirror, { deleteThreshold, managedPaths });
  const portableMirrorPath = resolvedMirrorRoot === path.resolve(SOURCE_ROOT) ? 'external-knowledge/sources/fiction-bondage' : 'test-or-custom-mirror';
  if (plan.blocked) { await writeJson(statusPath, { status: 'blocked', checkedAt: new Date().toISOString(), authoritativeSource: 'machine-local-config', mirrorPath: portableMirrorPath, plan }); throw new Error(plan.blockReason); }
  for (const item of plan.renamed) await copyAtomically(authoritativeRoot, resolvedMirrorRoot, item.to);
  for (const relativePath of [...plan.added, ...plan.modified]) await copyAtomically(authoritativeRoot, resolvedMirrorRoot, relativePath);
  for (const item of plan.renamed) await fs.rm(containedPath(resolvedMirrorRoot, item.from), { force: true });
  for (const relativePath of plan.deleted) await fs.rm(containedPath(resolvedMirrorRoot, relativePath), { force: true });
  const stamp = new Date().toISOString(), manifest = { schemaVersion: 1, authoritativeSource: 'machine-local-config', mirrorPath: portableMirrorPath, synchronizedAt: stamp, files: authoritative };
  await writeJson(manifestPath, manifest); await writeJson(statusPath, { status: 'current', checkedAt: stamp, authoritativeSource: 'machine-local-config', mirrorPath: manifest.mirrorPath, plan });
  return { authoritativeSourcePath: authoritativeRoot, mirrorPath: manifest.mirrorPath, sourceFiles: authoritative.length, ...plan };
}
