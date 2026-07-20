import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(projectRoot, 'src/game/data/story_outline/sources/1-modern.json');
const detailPath = path.join(projectRoot, 'src/game/data/story_outline/1-modern/1.0.1-病房苏醒.md');

const outline = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function findFirstOrdinaryModule(nodes, parentKey = null) {
  for (const node of nodes.filter((item) => (item.parentKey ?? null) === parentKey)) {
    if (node.status !== '分类' && node.status !== '主线任务') return node;
    const descendant = findFirstOrdinaryModule(nodes, node.key);
    if (descendant) return descendant;
  }
  return null;
}

const firstModule = findFirstOrdinaryModule(outline.nodes);
assert.equal(firstModule?.key, 'world-1-glimmering-glance-hospital-awakening');
assert.equal(firstModule?.title, '病房苏醒');

const markdown = fs.readFileSync(detailPath, 'utf8');
const frontmatter = parseMarkdownFrontmatter(markdown);

assert.equal(frontmatter.isTemplated, 'true');
assert.deepEqual(frontmatter.gameplayRefs, ['gameplay-119']);
assert.deepEqual(frontmatter.cgRefs, [
  '精神病院-病房约束',
  '精神病院-放风时间',
  '精神病院-外出放风'
]);
assert.equal(frontmatter.cgSequence.length, 3);
for (const item of frontmatter.cgSequence) {
  assert.ok(frontmatter.cgRefs.includes(item.split('｜')[0]));
}
assert.ok(!frontmatter.cgSequence.some((item) => item.includes('梦境种子植入')));
assert.ok(frontmatter.missingItems.some((item) => item.includes('梦境种子植入')));

assert.match(markdown, /^## 主要玩法$/m);
assert.match(markdown, /^### 互动小说（gameplay-119）$/m);
assert.match(markdown, /^### CG 1：精神病院-病房约束$/m);
assert.match(markdown, /^### 待补充 CG：梦境种子植入$/m);

console.log('urban first module template passed');
