import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
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
const inspirationHeadings = ['模块定位与体验目标', '故事体量与核心差异', '游戏流程', '地图与探索设计', '玩法设计'];
const outlineHeadings = [
  '模块定位与体验目标',
  '故事体量与核心差异',
  '玩家进入与离开',
  '游戏流程',
  '地图与探索设计',
  '角色与 NPC 安排',
  '事件与状态变化',
  '玩法设计',
  '对话与玩家选择',
  '前后章节与世界状态衔接',
  '最小可玩版本'
];

function resolveRequiredHeadings(frontmatter) {
  const headings = frontmatter.detailLabel === '灵感' ? inspirationHeadings : outlineHeadings;
  const moduleTypes = frontmatter.moduleType ?? [];

  if (moduleTypes.length === 1 && moduleTypes[0] === '互动小说') {
    return headings.map((heading) => heading === '地图与探索设计' ? '场景呈现' : heading);
  }

  return headings;
}

function normalizeTitle(filename) {
  return filename.replace(/\.md$/i, '').replace(/^\d+(?:\.\d+)*[-_\s]*/, '').trim();
}

function collectMappedModules() {
  const modules = [];
  for (const [sourceFilename, directory] of sourceDirectories) {
    const source = JSON.parse(fs.readFileSync(path.join(sourceRoot, sourceFilename), 'utf8'));
    const markdownFiles = fs.readdirSync(path.join(outlineRoot, directory)).filter((name) => name.endsWith('.md'));
    for (const node of source.nodes.filter((item) => !containerStatuses.has(item.status))) {
      const matches = markdownFiles.filter((name) => normalizeTitle(name) === node.title);
      if (matches.length === 1) modules.push({ node, path: path.join(outlineRoot, directory, matches[0]) });
    }
  }
  return modules;
}

test('all existing ordinary story modules use the current maturity-aware template', () => {
  const failures = [];
  const modules = collectMappedModules();
  assert.equal(modules.length, 71);

  for (const module of modules) {
    const markdown = fs.readFileSync(module.path, 'utf8');
    const frontmatter = parseMarkdownFrontmatter(markdown);
    const body = parseMarkdownBody(markdown);
    const label = path.basename(module.path);
    const requiredHeadings = resolveRequiredHeadings(frontmatter);

    if (frontmatter.isTemplated !== 'true') failures.push(`${label}: isTemplated`);
    for (const field of ['key', 'world', 'summary', 'detailLabel']) {
      if (!frontmatter[field] || (Array.isArray(frontmatter[field]) && frontmatter[field].length === 0)) {
        failures.push(`${label}: ${field}`);
      }
    }
    if (frontmatter.key !== module.node.key) failures.push(`${label}: key mismatch`);
    if (frontmatter.world !== module.node.world) failures.push(`${label}: world mismatch`);
    if (module.node.status != null && frontmatter.status !== String(module.node.status)) failures.push(`${label}: status mismatch`);
    if (!frontmatter.scope && !(frontmatter.missingItems ?? []).some((item) => item.startsWith('设计｜') && item.includes('故事体量'))) {
      failures.push(`${label}: scope or matching missing item`);
    }
    if (!frontmatter.moduleType && !(frontmatter.missingItems ?? []).some((item) => item.startsWith('玩法｜') && item.includes('主要活动'))) {
      failures.push(`${label}: moduleType or matching missing item`);
    }
    for (const heading of requiredHeadings) {
      if (!new RegExp(`^# ${heading}$`, 'm').test(body)) failures.push(`${label}: # ${heading}`);
    }
    for (const item of frontmatter.missingItems ?? []) {
      if (item.split('｜').length < 3) failures.push(`${label}: malformed missingItems`);
    }
    for (const [index, item] of (frontmatter.cgSequence ?? []).entries()) {
      const [title, timing, content] = item.split('｜');
      if (!title || !timing || !content || !(frontmatter.cgRefs ?? []).includes(title)) {
        failures.push(`${label}: invalid cgSequence`);
      }
      if (!body.includes(`### CG ${index + 1}：${title}`)) failures.push(`${label}: missing CG body entry ${index + 1}`);
    }
  }

  assert.deepEqual(failures, []);
});
