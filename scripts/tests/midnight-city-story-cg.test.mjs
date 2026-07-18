import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  parseMarkdownBody,
  parseMarkdownFrontmatter
} from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';

const storyPath = 'src/game/data/story_outline/1-modern/2.1-深夜城市探险.md';
const markdown = readFileSync(storyPath, 'utf8');
const frontmatter = parseMarkdownFrontmatter(markdown);
const body = parseMarkdownBody(markdown);
const cgImageMatches = [...body.matchAll(/^!\[关联CG：([^\]]+)\]\((src\/assets\/game\/cg\/[^)]+)\)$/gm)];
const episodeHeadings = [...body.matchAll(/^## (\d+)\. /gm)];

assert.equal(frontmatter.summary, '都市夜间职业背景下的普通绑架小支线合集。');
assert.equal(frontmatter.cgRefs.length, 11);
assert.equal(new Set(frontmatter.cgRefs).size, 11);
assert.equal(episodeHeadings.length, 12);
assert.equal(cgImageMatches.length, 11);
assert.ok(body.includes('当前没有明确对应的 CG，不使用其他职业素材代替。'));

cgImageMatches.forEach(([, , imagePath]) => {
  assert.equal(existsSync(imagePath), true, `关联 CG 路径应存在：${imagePath}`);
});

console.log('midnight city story CG mapping passed');
