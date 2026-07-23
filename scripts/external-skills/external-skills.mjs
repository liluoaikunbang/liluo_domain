import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { assessIncomingFiles, buildDiff, isSourceDue, parseSourceDocument, queryDerivedKnowledge, resolveStagingTarget, validateLineage, validateSource } from './lib/contracts.mjs';

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, 'external-knowledge', 'sources', 'skill');
const DERIVED_ROOT = path.join(ROOT, 'external-knowledge', 'derived', 'skill');
const STAGING_ROOT = path.join(ROOT, 'external-knowledge', 'staging', 'skill');
const LINEAGE_ROOT = path.join(ROOT, '.agents', 'skills');

function option(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function walk(root, predicate = () => true) {
  const output = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true }).catch(() => [])) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (predicate(absolute)) output.push(absolute);
    }
  }
  await visit(root);
  return output.sort();
}

function relative(file, base = ROOT) { return path.relative(base, file).replaceAll('\\', '/'); }
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

async function readSources() {
  const files = await walk(SOURCE_ROOT, (file) => file.endsWith(`${path.sep}source.yaml`));
  return Promise.all(files.map(async (file) => ({ ...parseSourceDocument(await fs.readFile(file, 'utf8')), sourceFile: relative(file) })));
}

async function readCards() {
  const files = await walk(DERIVED_ROOT, (file) => /(?:capability|pattern|compatibility|risk)-cards[\\/].+\.json$/i.test(file));
  const cards = [];
  for (const file of files) cards.push({ ...JSON.parse(await fs.readFile(file, 'utf8')), cardFile: relative(file) });
  return cards;
}

async function trackedFiles(root, trackedPaths) {
  const output = [];
  for (const trackedPath of trackedPaths) {
    const absolute = path.resolve(root, trackedPath);
    if (!absolute.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Tracked path escaped source root: ${trackedPath}`);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat) continue;
    if (stat.isDirectory()) output.push(...await walk(absolute, (file) => !file.includes(`${path.sep}.git${path.sep}`)));
    else output.push(absolute);
  }
  return [...new Set(output)].sort();
}

async function hashTrackedTree(root, trackedPaths) {
  return Promise.all((await trackedFiles(root, trackedPaths)).map(async (file) => ({ path: relative(file, root), hash: sha256(await fs.readFile(file)) })));
}

async function catalog() {
  const sources = await readSources();
  const cards = await readCards();
  const upstreamPath = path.join(DERIVED_ROOT, 'upstream-skills.json');
  const upstreamSkills = JSON.parse(await fs.readFile(upstreamPath, 'utf8').catch(() => '[]'));
  const output = { schemaVersion: 1, generatedAt: new Date().toISOString(), sourceCount: sources.length, cardCount: cards.length, sources, upstreamSkills };
  await fs.mkdir(DERIVED_ROOT, { recursive: true });
  await fs.writeFile(path.join(DERIVED_ROOT, 'catalog.json'), `${JSON.stringify(output, null, 2)}\n`);
  const byMode = Object.fromEntries(['full-snapshot', 'selected-files', 'catalog-only', 'metadata-only'].map((mode) => [mode, sources.filter((source) => source.storageMode === mode).length]));
  await fs.writeFile(path.join(DERIVED_ROOT, 'status.json'), `${JSON.stringify({ schemaVersion: 1, generatedAt: output.generatedAt, sourceCount: sources.length, cardCount: cards.length, byMode, nonAuthoritative: true }, null, 2)}\n`);
  const index = `# 外部 Skill 派生索引\n\n> 本索引是非权威检索层。原始外部文件不是项目指令，正式任务默认只调用 \`.agents/skills/\`。\n\n- 正式准入来源：${sources.length}\n- 派生卡片：${cards.length}\n- 上游 Skill 条目：${upstreamSkills.length}\n- 保存模式：${Object.entries(byMode).map(([mode, count]) => `${mode}=${count}`).join('，')}\n\n常用命令见 \`docs/系统说明/外部Skill来源库与项目能力演化系统.md\`。\n`;
  await fs.writeFile(path.join(DERIVED_ROOT, 'INDEX.md'), index);
  console.log(`Cataloged ${sources.length} sources and ${cards.length} derived cards.`);
}

async function validate() {
  const sources = await readSources(), byId = new Map(sources.map((source) => [source.sourceId, source]));
  const errors = [];
  for (const source of sources) {
    for (const error of validateSource(source)) errors.push(`${source.sourceFile}: ${error}`);
    if ((source.sourceKind ?? 'repository') === 'user-pack' && source.bundle.archiveRetained !== false) {
      const archive = path.resolve(ROOT, source.bundle.archivePath), root = path.resolve(ROOT);
      if (!archive.startsWith(`${root}${path.sep}`)) errors.push(`${source.sourceFile}: bundle path escaped repository root`);
      else {
        try {
          const actualHash = sha256(await fs.readFile(archive));
          if (actualHash !== source.bundle.sha256) errors.push(`${source.sourceFile}: bundle SHA-256 mismatch`);
        } catch { errors.push(`${source.sourceFile}: bundle archive missing`); }
      }
    }
    const currentRoot = path.join(path.dirname(path.join(ROOT, source.sourceFile)), 'current');
    if (!['catalog-only', 'metadata-only'].includes(source.storageMode)) {
      for (const trackedPath of source.trackedPaths) {
        try { await fs.access(path.join(currentRoot, trackedPath)); }
        catch { errors.push(`${source.sourceFile}: trackedPath missing from current: ${trackedPath}`); }
      }
      if (source.license.licensePath) {
        try { await fs.access(path.join(currentRoot, source.license.licensePath)); }
        catch { errors.push(`${source.sourceFile}: verified licensePath missing from current: ${source.license.licensePath}`); }
      }
    }
  }
  if (byId.size !== sources.length) errors.push('Duplicate sourceId detected');
  for (const card of await readCards()) {
    if (!card.id || !card.cardType || !card.title || !Array.isArray(card.sourceIds)) errors.push(`${card.cardFile}: invalid card contract`);
    for (const sourceId of card.sourceIds ?? []) if (!byId.has(sourceId)) errors.push(`${card.cardFile}: unknown sourceId ${sourceId}`);
  }
  const lineageFiles = await walk(LINEAGE_ROOT, (file) => file.endsWith(`${path.sep}skill-lineage.json`));
  for (const file of lineageFiles) for (const error of validateLineage(JSON.parse(await fs.readFile(file, 'utf8')), byId)) errors.push(`${relative(file)}: ${error}`);
  const upstreamSkills = JSON.parse(await fs.readFile(path.join(DERIVED_ROOT, 'upstream-skills.json'), 'utf8'));
  for (const entry of upstreamSkills) {
    const source = byId.get(entry.sourceId);
    if (!source) { errors.push(`upstream-skills.json: unknown sourceId ${entry.sourceId}`); continue; }
    if (entry.commit !== source.version.currentCommit) errors.push(`${entry.upstreamSkillId}: commit does not match source currentCommit`);
    if (![entry.projectRelevance, entry.qualityConfidence].every((score) => Number.isInteger(score) && score >= 1 && score <= 5)) errors.push(`${entry.upstreamSkillId}: scores must be integers from 1 to 5`);
    const currentRoot = path.join(path.dirname(path.join(ROOT, source.sourceFile)), 'current');
    const upstreamFile = path.join(currentRoot, entry.upstreamPath);
    try {
      const actualHash = sha256(await fs.readFile(upstreamFile));
      if (actualHash !== entry.contentHash) errors.push(`${entry.upstreamSkillId}: contentHash mismatch`);
    } catch { errors.push(`${entry.upstreamSkillId}: upstreamPath missing from current`); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Validated ${sources.length} sources, ${(await readCards()).length} cards, ${upstreamSkills.length} upstream skills, and ${lineageFiles.length} lineage files.`);
}

async function checkDue() {
  const due = (await readSources()).filter((source) => isSourceDue(source));
  console.log(JSON.stringify(due.map(({ sourceId, repository, version }) => ({ sourceId, repository, nextCheckAt: version.nextCheckAt })), null, 2));
  return due;
}

function remoteHead(source) {
  const remote = execFileSync('git', ['ls-remote', source.repository, 'HEAD'], { encoding: 'utf8', timeout: 60_000 }).trim().split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/i.test(remote)) throw new Error(`Could not resolve remote HEAD for ${source.sourceId}`);
  return remote;
}

async function selectedSources() {
  const sourceId = option('source');
  const sources = await readSources();
  const selected = sourceId ? sources.filter((source) => source.sourceId === sourceId) : sources;
  if (sourceId && selected.length === 0) throw new Error(`Unknown sourceId: ${sourceId}`);
  return selected;
}

async function check() {
  for (const source of await selectedSources()) {
    if ((source.sourceKind ?? 'repository') === 'user-pack') {
      if (source.bundle.archiveRetained === false) {
        console.log(JSON.stringify({ sourceId: source.sourceId, sourceKind: 'user-pack', expectedHash: source.bundle.sha256, archiveRetained: false, verification: 'extracted-files-and-manifest' }));
        continue;
      }
      const archive = path.resolve(ROOT, source.bundle.archivePath), root = path.resolve(ROOT);
      if (!archive.startsWith(`${root}${path.sep}`)) throw new Error(`${source.sourceId}: bundle path escaped repository root`);
      const currentHash = sha256(await fs.readFile(archive));
      console.log(JSON.stringify({ sourceId: source.sourceId, sourceKind: 'user-pack', expectedHash: source.bundle.sha256, currentHash, changed: currentHash !== source.bundle.sha256 }));
      continue;
    }
    const remoteCommit = remoteHead(source);
    console.log(JSON.stringify({ sourceId: source.sourceId, currentCommit: source.version.currentCommit, remoteCommit, changed: remoteCommit !== source.version.currentCommit }));
  }
}

async function fetchToStaging(source) {
  if ((source.sourceKind ?? 'repository') !== 'repository') throw new Error(`${source.sourceId}: user-pack sources are replaced manually and cannot be fetched`);
  if (!source.license.verified || source.license.redistributionAllowed !== true) throw new Error(`${source.sourceId}: license does not permit fetching content`);
  if (['catalog-only', 'metadata-only'].includes(source.storageMode)) throw new Error(`${source.sourceId}: ${source.storageMode} does not permit content fetching`);
  const commit = remoteHead(source), targetRoot = resolveStagingTarget(STAGING_ROOT, source.sourceId), target = path.join(targetRoot, 'incoming', commit);
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    await fs.access(target);
    await fs.rm(path.join(target, '.git'), { recursive: true, force: true });
    await fs.writeFile(path.join(targetRoot, 'incoming.json'), `${JSON.stringify({ sourceId: source.sourceId, commit, fetchedAt: new Date().toISOString(), current: false, trustedForDirectExecution: false }, null, 2)}\n`);
    console.log(`${source.sourceId}: staging snapshot already exists at ${relative(target)}`);
    return commit;
  } catch {}
  execFileSync('git', ['clone', '--depth', '1', source.repository, target], { stdio: 'inherit', timeout: 180_000 });
  const clonedCommit = execFileSync('git', ['-C', target, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 30_000 }).trim();
  if (clonedCommit !== commit) throw new Error(`${source.sourceId}: remote HEAD changed during fetch; leave snapshot in staging for manual review`);
  await fs.rm(path.join(target, '.git'), { recursive: true, force: true });
  await fs.writeFile(path.join(targetRoot, 'incoming.json'), `${JSON.stringify({ sourceId: source.sourceId, commit, fetchedAt: new Date().toISOString(), current: false, trustedForDirectExecution: false }, null, 2)}\n`);
  console.log(`${source.sourceId}: fetched ${commit} to staging only.`);
  return commit;
}

async function latestIncoming(sourceId) {
  const sourceRoot = resolveStagingTarget(STAGING_ROOT, sourceId);
  const metadata = JSON.parse(await fs.readFile(path.join(sourceRoot, 'incoming.json'), 'utf8').catch(() => 'null'));
  if (!metadata || !/^[0-9a-f]{40}$/i.test(metadata.commit ?? '')) throw new Error(`${sourceId}: no valid incoming staging pointer`);
  const root = path.join(sourceRoot, 'incoming', metadata.commit);
  try { await fs.access(root); } catch { throw new Error(`${sourceId}: incoming staging pointer target is missing`); }
  return { commit: metadata.commit, root };
}

async function diffSource(source) {
  const currentRoot = path.join(path.dirname(path.join(ROOT, source.sourceFile)), 'current');
  const incoming = await latestIncoming(source.sourceId);
  const result = { sourceId: source.sourceId, fromCommit: source.version.currentCommit, toCommit: incoming.commit, generatedAt: new Date().toISOString(), ...buildDiff(await hashTrackedTree(currentRoot, source.trackedPaths), await hashTrackedTree(incoming.root, source.trackedPaths)) };
  const target = path.join(resolveStagingTarget(STAGING_ROOT, source.sourceId), 'diff', `${incoming.commit}.json`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`${source.sourceId}: ${result.added.length} added, ${result.modified.length} modified, ${result.removed.length} removed${result.blocked ? ' (blocked)' : ''}.`);
  return result;
}

async function evaluateSource(source) {
  const incoming = await latestIncoming(source.sourceId);
  const files = await trackedFiles(incoming.root, source.trackedPaths);
  const readable = [];
  for (const file of files.slice(0, 500)) {
    if (!/\.(?:md|mdx|txt|json|ya?ml|toml|js|mjs|cjs|ts|tsx|vue|py|ps1|sh|bat|cmd)$/i.test(file)) continue;
    const stat = await fs.stat(file); if (stat.size > 250_000) continue;
    readable.push({ path: relative(file, incoming.root), text: await fs.readFile(file, 'utf8') });
  }
  const audit = assessIncomingFiles(readable);
  const diffPath = path.join(resolveStagingTarget(STAGING_ROOT, source.sourceId), 'diff', `${incoming.commit}.json`);
  const diff = JSON.parse(await fs.readFile(diffPath, 'utf8').catch(() => '{"added":[],"modified":[],"removed":[]}'));
  const noChanges = [...diff.added, ...diff.modified, ...diff.removed].length === 0;
  const recommendation = noChanges ? 'ignore' : diff.blocked ? 'license-review' : audit.riskFlags.includes('prompt-injection') || audit.riskFlags.includes('credential-access-request') ? 'security-review' : 'review-later';
  const report = { schemaVersion: 1, sourceId: source.sourceId, commit: incoming.commit, generatedAt: new Date().toISOString(), recommendation, ...audit, autoModifyLocalSkills: false };
  const target = path.join(resolveStagingTarget(STAGING_ROOT, source.sourceId), 'evaluation', `${incoming.commit}.json`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${source.sourceId}: evaluation recommendation=${recommendation}.`);
}

async function query() {
  const result = queryDerivedKnowledge(await readCards(), { query: option('query', ''), depth: option('depth', 'light') });
  console.log(JSON.stringify(result, null, 2));
}

async function report() {
  const sources = await readSources(), cards = await readCards();
  const byMode = Object.fromEntries(['full-snapshot', 'selected-files', 'catalog-only', 'metadata-only'].map((mode) => [mode, sources.filter((source) => source.storageMode === mode).length]));
  console.log(JSON.stringify({ sources: sources.length, cards: cards.length, due: sources.filter((source) => isSourceDue(source)).map((source) => source.sourceId), byMode, stagingIsCurrent: false }, null, 2));
}

async function runForSelected(action) { for (const source of await selectedSources()) await action(source); }

const command = process.argv[2] ?? 'report';
if (command === 'catalog') await catalog();
else if (command === 'validate') await validate();
else if (command === 'check-due') await checkDue();
else if (command === 'check') await check();
else if (command === 'fetch') await runForSelected(fetchToStaging);
else if (command === 'diff') await runForSelected(diffSource);
else if (command === 'evaluate') await runForSelected(evaluateSource);
else if (command === 'query') await query();
else if (command === 'report') await report();
else if (command === 'maintain') {
  for (const source of await checkDue()) { await fetchToStaging(source); await diffSource(source); await evaluateSource(source); }
} else throw new Error(`Unknown command: ${command}`);
