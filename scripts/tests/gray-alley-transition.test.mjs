import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = JSON.parse(fs.readFileSync(
  path.join(projectRoot, 'src/game/data/story_outline/sources/1-modern.json'),
  'utf8'
));
const missingNode = source.nodes.find((node) => node.key === 'world-1-glimmering-glance-missing');
const rustSaltNode = source.nodes.find((node) => node.key === 'world-1-glimmering-glance-rust-salt');
const missingMarkdown = fs.readFileSync(
  path.join(projectRoot, 'src/game/data/story_outline/1-modern/3.2-失联.md'),
  'utf8'
);
const rustSaltMarkdown = fs.readFileSync(
  path.join(projectRoot, 'src/game/data/story_outline/1-modern/3.3-锈盐.md'),
  'utf8'
);
const missingFrontmatter = parseMarkdownFrontmatter(missingMarkdown);
const rustSaltFrontmatter = parseMarkdownFrontmatter(rustSaltMarkdown);

assert.equal(rustSaltNode?.parentKey, missingNode?.key);
assert.ok(missingNode?.characters?.includes('欣雨'));
assert.ok(rustSaltNode?.characters?.includes('欣雨'));
assert.deepEqual(missingFrontmatter.missingItems, missingNode?.missingItems);
assert.deepEqual(rustSaltFrontmatter.missingItems, rustSaltNode?.missingItems);
assert.match(missingMarkdown, /已经取得了独自逃生的机会/u);
assert.match(missingMarkdown, /主动放弃独自离开的窗口/u);
assert.match(missingMarkdown, /被抓回不是能力不足/u);
assert.match(rustSaltMarkdown, /唯一被捆绑的人/u);
assert.match(rustSaltMarkdown, /从自己的份额里分出一点给受伤的璃落吃/u);
assert.match(rustSaltMarkdown, /轮流喂她、替她调整姿势/u);

console.log('gray alley transition passed');
