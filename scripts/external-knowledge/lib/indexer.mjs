import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, SOURCE_ROOT, SCOPE, TEXT_EXTENSIONS, repoRelative } from './config.mjs';
import { normalizeText, sha256 } from './hashing.mjs';
import { segmentText } from './segmenter.mjs';
import { listFiles, publishDirectory, readJson, writeJson } from './store.mjs';

const TAG_RULES = [
  ['环境:古堡', /古堡|城堡/g], ['环境:校园', /学校|学院|校园/g], ['环境:地牢', /地牢|地下室|牢房/g], ['环境:都市', /城市|都市|公寓/g],
  ['叙事:逃脱', /逃脱|逃亡|脱困/g], ['叙事:仪式', /仪式|祭典|典礼/g], ['叙事:调查', /调查|侦探|谜案/g], ['氛围:悬疑', /秘密|阴谋|谜|诡异/g],
  ['世界:奇幻', /魔法|女巫|骑士|精灵/g], ['世界:科幻', /星际|机械|克隆|未来/g], ['视觉:展示', /舞台|展览|橱窗|陈列/g], ['状态:受限', /拘束|束缚|捆绑|囚禁/g],
];
const tokenize = (text) => [...new Set((text.toLocaleLowerCase().match(/[\p{Script=Han}]{2,8}|[a-z0-9]{3,}/gu) ?? []).slice(0, 80))];
const inferTags = (text) => TAG_RULES.filter(([, pattern]) => { pattern.lastIndex = 0; return pattern.test(text); }).map(([tag]) => tag);
const sourceTitle = (filePath) => path.basename(filePath, path.extname(filePath));
const sourceAuthor = (filePath) => { const parent = path.basename(path.dirname(filePath)); return /不知道作者|其他未分类|精品单章片段|堕落方舟/.test(parent) ? null : parent.replace(/（.*?）|\(.*?\)/g, '').trim() || null; };

async function loadExistingSegments() {
  const directory = path.join(KNOWLEDGE_ROOT, 'index', 'segments');
  try { const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.json')); const values = await Promise.all(files.map((name) => readJson(path.join(directory, name), []))); return values.flat(); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
function assignSourceIds(records, oldRecords) {
  const byPath = new Map(oldRecords.map((item) => [item.relativePath, item]));
  const byHash = new Map(oldRecords.map((item) => [item.contentHash, item]));
  let next = Math.max(0, ...oldRecords.map((item) => Number(item.sourceId?.match(/\d+$/)?.[0] ?? 0))) + 1;
  return records.map((record) => ({ ...record, sourceId: byPath.get(record.relativePath)?.sourceId ?? byHash.get(record.contentHash)?.sourceId ?? `fb-src-${String(next++).padStart(6, '0')}` }));
}
function duplicateGroups(sources) {
  const groups = new Map(); for (const source of sources) { const key = source.normalizedContentHash || source.contentHash; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(source); }
  return [...groups.values()].filter((group) => group.length > 1).map((group) => ({ type: group.every((item) => item.contentHash === group[0].contentHash) ? 'exact' : 'normalized', sourceIds: group.map((item) => item.sourceId), paths: group.map((item) => item.relativePath) }));
}
function versionGroups(sources) {
  const groups = new Map();
  for (const source of sources.filter((item) => item.indexStatus === 'indexed')) { const key = source.title.normalize('NFKC').replace(/[\s（(【[].*?[）)】\]]/g, '').toLocaleLowerCase(); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(source); }
  return [...groups.values()].filter((group) => group.length > 1 && new Set(group.map((item) => item.normalizedContentHash)).size > 1).map((group) => ({ type: 'possible-version', titleKey: group[0].title, sourceIds: group.map((item) => item.sourceId), paths: group.map((item) => item.relativePath) }));
}
const sourceRef = ({ sourceId, segmentId, sourcePath, startLine, endLine }) => ({ sourceId, segmentId, sourcePath, startLine, endLine });
const evidenceText = (segment) => `${segment.evidenceText ?? segment.preview ?? ''} ${segment.headingPath?.join(' ') ?? ''} ${(segment.tags ?? []).join(' ')}`.toLocaleLowerCase();

function ruleCard(rule, cardType, segments) {
  const selected = [];
  const allTerms = (rule.evidenceGroups ?? []).flat().map((term) => term.toLocaleLowerCase());
  for (const group of rule.evidenceGroups ?? []) {
    const terms = group.map((term) => term.toLocaleLowerCase());
    const match = segments.find((segment) => terms.some((term) => evidenceText(segment).includes(term)));
    if (!match) return null;
    if (!selected.some((segment) => segment.segmentId === match.segmentId)) selected.push(match);
  }
  const minimumSources = Math.max(1, rule.minimumSources ?? 1);
  for (const segment of segments) {
    if (new Set(selected.map((item) => item.sourceId)).size >= minimumSources) break;
    if (!allTerms.some((term) => evidenceText(segment).includes(term))) continue;
    if (selected.some((item) => item.sourceId === segment.sourceId)) continue;
    selected.push(segment);
  }
  if (new Set(selected.map((item) => item.sourceId)).size < minimumSources) return null;
  return {
    cardId: `fb-${cardType}-${rule.id}`,
    cardType,
    title: rule.title,
    aliases: rule.aliases ?? [],
    definition: rule.definition,
    distinctions: rule.distinctions ?? [],
    prerequisites: rule.prerequisites ?? [],
    progression: rule.progression ?? [],
    reversals: rule.reversals ?? [],
    outcomes: rule.outcomes ?? [],
    concepts: [...new Set([...(rule.aliases ?? []), ...(rule.progression ?? [])])],
    abstractPatterns: rule.progression ?? [],
    tags: [...new Set(selected.flatMap((segment) => segment.tags ?? []))],
    sourceRefs: selected.map(sourceRef),
    reviewStatus: 'candidate',
    directQuoteIncluded: false,
    knowledgeScope: SCOPE,
    canonical: false,
  };
}

export function createCandidateCards(segments, rules = {}) {
  const definitions = [
    ['expression', '环境压力与角色感知的交替表达', ['环境细节', '角色感知', '节奏递进']],
    ['visual-structure', '封闭空间中的人物与出口关系', ['人物轮廓', '空间边界', '出口视觉重心']],
    ['scene-pattern', '封闭场景的探索与转场', ['环境线索', '空间阻隔', '转场触发']],
    ['fictional-state', '叙事受限状态与行动选择', ['行动边界', '视觉反馈', '剧情选择']],
    ['trope', '调查—受阻—发现新路径的推进模式', ['调查起点', '阻力升级', '原创转折']],
  ];
  return definitions.map(([cardType, title, abstractPatterns], index) => {
    const selected = [], seenSources = new Set(); for (const segment of segments.filter((item) => item.tags.length).slice(index)) { if (seenSources.has(segment.sourceId)) continue; selected.push(segment); seenSources.add(segment.sourceId); if (selected.length === 3) break; }
    const refs = selected.map(sourceRef);
    return { cardId: `fb-${cardType}-${String(index + 1).padStart(6, '0')}`, cardType, title, concepts: abstractPatterns, abstractPatterns, tags: [...new Set(refs.flatMap((ref) => segments.find((item) => item.segmentId === ref.segmentId)?.tags ?? []))], sourceRefs: refs, reviewStatus: 'candidate', directQuoteIncluded: false, knowledgeScope: SCOPE, canonical: false };
  }).concat(
    (rules.terms ?? []).map((rule) => ruleCard(rule, 'term', segments)).filter(Boolean),
    (rules.plotPatterns ?? []).map((rule) => ruleCard(rule, 'plot-pattern', segments)).filter(Boolean),
  );
}

async function hydrateCardEvidence(segments) {
  const linesBySource = new Map();
  return Promise.all(segments.map(async (segment) => {
    if (!linesBySource.has(segment.sourcePath)) {
      linesBySource.set(segment.sourcePath, fs.readFile(path.join(path.resolve(KNOWLEDGE_ROOT, '..'), segment.sourcePath), 'utf8').then((text) => text.split(/\r?\n/)));
    }
    const lines = await linesBySource.get(segment.sourcePath);
    return { ...segment, evidenceText: lines.slice(segment.startLine - 1, segment.endLine).join(' ') };
  }));
}

export async function buildKnowledge({ changedOnly = false } = {}) {
  const oldSources = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []);
  const oldSegments = changedOnly ? await loadExistingSegments() : [];
  const oldSegmentsBySource = new Map(); for (const segment of oldSegments) { if (!oldSegmentsBySource.has(segment.sourceId)) oldSegmentsBySource.set(segment.sourceId, []); oldSegmentsBySource.get(segment.sourceId).push(segment); }
  const files = await listFiles(SOURCE_ROOT), records = [];
  for (const filePath of files) {
    const bytes = await fs.readFile(filePath), extension = path.extname(filePath).toLocaleLowerCase(), relativePath = repoRelative(filePath), contentHash = sha256(bytes);
    const text = TEXT_EXTENSIONS.has(extension) ? bytes.toString('utf8') : null;
    records.push({ knowledgeScope: SCOPE, canonical: false, title: sourceTitle(filePath), author: sourceAuthor(filePath), sourceType: TEXT_EXTENSIONS.has(extension) ? 'fiction' : 'binary-asset', relativePath, extension, encoding: text === null ? null : 'utf-8', sizeBytes: bytes.length, contentHash, normalizedContentHash: text === null ? null : sha256(normalizeText(text)), lineCount: text === null ? 0 : text.split(/\r?\n/).length, characterCount: text?.length ?? 0, chapterCount: text === null ? 0 : (text.match(/^#{1,6}\s+|^第.+[章节卷部回幕]/gm) ?? []).length, metadataSource: 'filename-and-path', tags: inferTags(`${relativePath} ${text?.slice(0, 10000) ?? ''}`), indexStatus: text === null ? 'cataloged-not-indexed' : 'indexed' });
  }
  const sources = assignSourceIds(records, oldSources).sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN'));
  const oldById = new Map(oldSources.map((item) => [item.sourceId, item])), segments = [];
  for (const source of sources) {
    if (source.indexStatus !== 'indexed') continue;
    const previous = oldById.get(source.sourceId), unchanged = changedOnly && previous?.contentHash === source.contentHash && oldSegmentsBySource.has(source.sourceId);
    if (unchanged) { segments.push(...oldSegmentsBySource.get(source.sourceId)); continue; }
    const text = await fs.readFile(path.join(path.resolve(KNOWLEDGE_ROOT, '..'), source.relativePath), 'utf8');
    for (const segment of segmentText(text, { sourceId: source.sourceId, sourcePath: source.relativePath })) { const searchable = `${source.title} ${segment.headingPath.join(' ')} ${text.split(/\r?\n/).slice(segment.startLine - 1, segment.endLine).join(' ')}`; segment.tags = [...new Set([...source.tags, ...inferTags(searchable)])]; segment.keywords = tokenize(`${source.title} ${segment.headingPath.join(' ')} ${segment.tags.join(' ')}`); segments.push(segment); }
  }
  segments.sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.startLine - b.startLine);
  const changed = { added: sources.filter((item) => !oldSources.some((old) => old.sourceId === item.sourceId)).map((item) => item.relativePath), modified: sources.filter((item) => oldById.has(item.sourceId) && oldById.get(item.sourceId).contentHash !== item.contentHash).map((item) => item.relativePath), deleted: oldSources.filter((old) => !sources.some((item) => item.sourceId === old.sourceId)).map((item) => old.relativePath), renamed: sources.filter((item) => oldById.has(item.sourceId) && oldById.get(item.sourceId).relativePath !== item.relativePath).map((item) => ({ from: oldById.get(item.sourceId).relativePath, to: item.relativePath })) };
  const duplicates = duplicateGroups(sources), versions = versionGroups(sources);
  const cardRules = await readJson(path.join(KNOWLEDGE_ROOT, 'card-rules.json'), {});
  const cards = createCandidateCards(await hydrateCardEvidence(segments), cardRules), stamp = new Date().toISOString();
  const temp = path.join(KNOWLEDGE_ROOT, `.build-${process.pid}-${Date.now()}`); await fs.mkdir(temp, { recursive: true });
  await writeJson(path.join(temp, 'catalog', 'sources.json'), sources); await writeJson(path.join(temp, 'catalog', 'duplicates.json'), duplicates);
  const shards = []; for (let index = 0; index < segments.length; index += 500) { const name = `segments-${String(shards.length + 1).padStart(3, '0')}.json`; const shard = segments.slice(index, index + 500); await writeJson(path.join(temp, 'index', 'segments', name), shard); shards.push({ path: `index/segments/${name}`, count: shard.length }); }
  const termPostings = new Map(), tagPostings = new Map();
  for (const segment of segments) {
    for (const term of segment.keywords) { if (!termPostings.has(term)) termPostings.set(term, []); if (termPostings.get(term).length < 200) termPostings.get(term).push(segment.segmentId); }
    for (const tag of segment.tags) { if (!tagPostings.has(tag)) tagPostings.set(tag, []); tagPostings.get(tag).push(segment.segmentId); }
  }
  await writeJson(path.join(temp, 'index', 'keywords', 'terms.json'), Object.fromEntries([...termPostings].sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))));
  await writeJson(path.join(temp, 'index', 'tags', 'tag-index.json'), Object.fromEntries([...tagPostings].sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))));
  await writeJson(path.join(temp, 'index', 'references', 'source-locations.json'), Object.fromEntries(segments.map((item) => [item.segmentId, { sourceId: item.sourceId, sourcePath: item.sourcePath, startLine: item.startLine, endLine: item.endLine }])));
  for (const card of cards) await writeJson(path.join(temp, 'cards', card.cardType, `${card.cardId}.json`), card);
  const unsupported = sources.filter((item) => item.indexStatus !== 'indexed'), indexOutputFiles = await listFiles(path.join(temp, 'index')), indexSizes = await Promise.all(indexOutputFiles.map(async (file) => (await fs.stat(file)).size));
  const metrics = { sourceFiles: sources.length, indexedFiles: sources.length - unsupported.length, unsupportedFiles: unsupported.length, parseFailures: 0, totalCharacters: sources.reduce((sum, item) => sum + item.characterCount, 0), totalSegments: segments.length, duplicateFiles: duplicates.reduce((sum, group) => sum + group.sourceIds.length - 1, 0), possibleVersions: versions.length, indexFiles: indexOutputFiles.length, indexSizeBytes: indexSizes.reduce((sum, size) => sum + size, 0), largestShardBytes: Math.max(0, ...indexSizes), largestShardRecords: Math.max(0, ...shards.map((item) => item.count)), status: 'current' };
  await writeJson(path.join(temp, 'reports', 'source-quality.json'), { unsupported: unsupported.map((item) => ({ sourceId: item.sourceId, path: item.relativePath, reason: 'unsupported-binary' })), parseFailures: [] });
  await writeJson(path.join(temp, 'reports', 'duplicate-report.json'), { groups: duplicates, possibleVersions: versions }); await writeJson(path.join(temp, 'reports', 'missing-metadata.json'), { missingAuthor: sources.filter((item) => item.author === null).map((item) => item.sourceId) }); await writeJson(path.join(temp, 'reports', 'direct-copy-risk.json'), { note: 'Generated on demand by external:knowledge:copy-check; no source text is stored here.', checks: [] });
  await writeJson(path.join(temp, 'manifest.json'), { schemaVersion: 2, knowledgeScope: SCOPE, canonical: false, generatedAt: stamp, mode: changedOnly ? 'source-level-incremental-with-global-index-rebuild' : 'full', shards, changes: changed });
  await writeJson(path.join(temp, 'status.json'), { status: 'current', checkedAt: stamp, metrics });
  for (const directory of ['catalog', 'index', 'cards', 'reports']) await publishDirectory(path.join(temp, directory), path.join(KNOWLEDGE_ROOT, directory));
  for (const file of ['manifest.json', 'status.json']) { const destination = path.join(KNOWLEDGE_ROOT, file), temporary = `${destination}.publishing`; await fs.copyFile(path.join(temp, file), temporary); await fs.rm(destination, { force: true }); await fs.rename(temporary, destination); }
  await fs.rm(temp, { recursive: true, force: true }); return { metrics, changes: changed };
}

export async function freshness() {
  const indexed = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []), indexedByPath = new Map(indexed.map((item) => [item.relativePath, item]));
  const files = await listFiles(SOURCE_ROOT), current = [];
  for (const file of files) { const relativePath = repoRelative(file), contentHash = sha256(await fs.readFile(file)); current.push({ relativePath, contentHash }); }
  const added = current.filter((item) => !indexedByPath.has(item.relativePath)), modified = current.filter((item) => indexedByPath.has(item.relativePath) && indexedByPath.get(item.relativePath).contentHash !== item.contentHash), deleted = indexed.filter((item) => !current.some((value) => value.relativePath === item.relativePath));
  return { status: !indexed.length ? 'not-indexed' : added.length || modified.length || deleted.length ? 'stale' : 'current', added: added.map((item) => item.relativePath), modified: modified.map((item) => item.relativePath), deleted: deleted.map((item) => item.relativePath) };
}
