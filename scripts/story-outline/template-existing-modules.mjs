import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownBody, parseMarkdownFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outlineRoot = path.join(projectRoot, 'src/game/data/story_outline');
const sourceRoot = path.join(outlineRoot, 'sources');
const sourceDirectories = new Map([
  ['0-munika.json', '0-munika'],
  ['1-modern.json', '1-modern'],
  ['2-apocalypse.json', '2-apocalypse'],
  ['3-ancient.json', '3-ancient'],
  ['4-fantasy.json', '4-fantasy'],
  ['5-science.json', '5-science']
]);
const containerStatuses = new Set(['分类', '主线任务', '收回']);
const outlineHeadings = [
  '模块定位与体验目标', '故事体量与核心差异', '玩家进入与离开', '游戏流程', '地图与探索设计',
  '角色与 NPC 安排', '事件与状态变化', '玩法设计', '对话与玩家选择', '前后章节与世界状态衔接', '最小可玩版本'
];

function normalizeTitle(filename) {
  return filename.replace(/\.md$/i, '').replace(/^\d+(?:\.\d+)*[-_\s]*/, '').trim();
}

function yamlScalar(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function splitDocument(markdown) {
  const lines = markdown.split(/\r?\n/);
  if (lines[0] !== '---') return { frontmatterLines: [], body: markdown.trim() };
  const endIndex = lines.indexOf('---', 1);
  return endIndex < 0
    ? { frontmatterLines: [], body: markdown.trim() }
    : { frontmatterLines: lines.slice(1, endIndex), body: lines.slice(endIndex + 1).join('\n').trim() };
}

function fieldRange(lines, field) {
  const start = lines.findIndex((line) => new RegExp(`^${field}:`).test(line));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !/^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[end])) end += 1;
  return { start, end };
}

function upsertScalar(lines, field, value, afterField) {
  const nextLine = `${field}: ${yamlScalar(value)}`;
  const range = fieldRange(lines, field);
  if (range) {
    lines.splice(range.start, range.end - range.start, nextLine);
    return;
  }
  const afterRange = afterField ? fieldRange(lines, afterField) : null;
  lines.splice(afterRange?.end ?? lines.length, 0, nextLine);
}

function appendMissingItems(lines, items) {
  if (items.length === 0) return;
  const range = fieldRange(lines, 'missingItems');
  if (!range) {
    const anchor = fieldRange(lines, 'isTemplated');
    const insertAt = anchor?.end ?? lines.length;
    lines.splice(insertAt, 0, 'missingItems:', ...items.map((item) => `  - ${item}`));
    return;
  }
  const existing = new Set(lines.slice(range.start + 1, range.end).map((line) => line.replace(/^\s+-\s*/, '').trim()));
  const additions = items.filter((item) => !existing.has(item)).map((item) => `  - ${item}`);
  lines.splice(range.end, 0, ...additions);
}

function hasAllOutlineHeadings(body) {
  return outlineHeadings.every((heading) => new RegExp(`^# ${heading}$`, 'm').test(body));
}

function demoteHeadings(body) {
  return body.replace(/^(#{1,5})\s/gm, '#$1 ');
}

function listSentence(values, fallback) {
  return Array.isArray(values) && values.length > 0 ? values.join('、') : fallback;
}

function createInspirationBody(node, frontmatter, legacyBody) {
  const summary = yamlScalar(node.summary || frontmatter.summary || `${node.title}的现有构想。`);
  const scopeText = frontmatter.scope
    ? `原稿已记录体量为“${frontmatter.scope}”。`
    : '原稿尚未确认故事体量、主要区域数量及与相似模块的机制差异，本次不代为选择。';
  const locations = listSentence(frontmatter.locations, '原稿尚未记录可确认的地点');
  const gameplay = listSentence(frontmatter.specialGameplay, '原稿尚未记录可确认的操作循环');
  const preserved = legacyBody
    ? `## 原稿已确认内容\n\n${demoteHeadings(legacyBody)}`
    : '原稿目前只保留节点摘要，尚未拆分玩家进入、操作、完成与返回过程。';

  return [
    '# 模块定位与体验目标',
    '',
    summary,
    '',
    '本次模板化只收纳现有资料，不追加人物动机、事件结果或制作方案。',
    '',
    '# 故事体量与核心差异',
    '',
    `${scopeText}现有资料确认的内容方向为：${summary}`,
    '',
    '# 游戏流程',
    '',
    preserved,
    '',
    '# 地图与探索设计',
    '',
    `现有资料涉及：${locations}。尚未在原稿中说明的出生点、区域连接、道路限制与返回变化不在本次整理中外推。`,
    '',
    '# 玩法设计',
    '',
    `现有资料记录的玩法方向：${gameplay}。在玩家操作循环、成功失败条件和退出方式明确前，不创建或猜测玩法引用。`,
    ''
  ].join('\n');
}

let migratedCount = 0;
for (const [sourceFilename, directory] of sourceDirectories) {
  const source = JSON.parse(fs.readFileSync(path.join(sourceRoot, sourceFilename), 'utf8'));
  const directoryPath = path.join(outlineRoot, directory);
  const markdownFiles = fs.readdirSync(directoryPath).filter((name) => name.endsWith('.md'));

  for (const node of source.nodes.filter((item) => !containerStatuses.has(item.status))) {
    const matches = markdownFiles.filter((name) => normalizeTitle(name) === node.title);
    if (matches.length !== 1) continue;

    const filePath = path.join(directoryPath, matches[0]);
    const markdown = fs.readFileSync(filePath, 'utf8');
    const parsed = parseMarkdownFrontmatter(markdown);
    if (parsed.isTemplated === 'true') continue;

    const { frontmatterLines, body: splitBody } = splitDocument(markdown);
    const legacyBody = parseMarkdownBody(markdown) || splitBody;
    const keepsOutlineMaturity = hasAllOutlineHeadings(legacyBody);
    const detailLabel = keepsOutlineMaturity ? (parsed.detailLabel || '大纲') : '灵感';
    const summary = node.summary || parsed.summary || `${node.title}的现有构想。`;

    upsertScalar(frontmatterLines, 'key', node.key);
    upsertScalar(frontmatterLines, 'world', node.world, 'key');
    if (node.status != null) upsertScalar(frontmatterLines, 'status', node.status, 'storyTags');
    upsertScalar(frontmatterLines, 'summary', summary, 'status');
    upsertScalar(frontmatterLines, 'detailLabel', detailLabel, 'summary');
    upsertScalar(frontmatterLines, 'isTemplated', 'true', 'detailLabel');

    const missingItems = [];
    if (!parsed.scope) missingItems.push(`设计｜${node.title}·故事体量｜缺少故事体量、主要区域数量与核心机制差异说明`);
    if (!parsed.moduleType) missingItems.push(`玩法｜${node.title}·主要活动｜缺少主要游戏活动类型与可执行操作循环`);
    if (!keepsOutlineMaturity) missingItems.push(`流程｜${node.title}·玩家流程｜缺少进入、阶段目标、完成条件、失败恢复与离开方式的游戏化拆解`);
    if (!parsed.locations) missingItems.push(`地图｜${node.title}·场景结构｜缺少实际地点、区域连接、道路限制与返回变化`);
    if (parsed.cgRefs && !parsed.cgSequence) missingItems.push(`CG｜${node.title}·现有图鉴资源使用｜缺少已引用 CG 的出现时机、具体画面内容与播放顺序`);
    appendMissingItems(frontmatterLines, missingItems);

    const nextBody = keepsOutlineMaturity ? legacyBody : createInspirationBody(node, parsed, legacyBody);
    const nextMarkdown = `---\n${frontmatterLines.join('\n').replace(/\n{3,}/g, '\n\n')}\n---\n\n${nextBody.trim()}\n`;
    fs.writeFileSync(filePath, nextMarkdown, 'utf8');
    migratedCount += 1;
  }
}

console.log(`templated ${migratedCount} existing story modules`);
