import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sourcePath = new URL('../../src/game/data/story_outline/sources/3-ancient.json', import.meta.url);
const markdownPath = new URL('../../src/game/data/story_outline/3-ancient/4-乱世游侠.md', import.meta.url);
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const node = source.nodes.find((item) => item.key === 'world-3-mortal-dao-chaotic-world-ranger');
const markdown = readFileSync(markdownPath, 'utf8');

test('keeps lockpicking and theft as Liluo core martial-arts specialties', () => {
  assert.ok(node);
  assert.equal(node.parentKey, 'world-3-mortal-dao-frontier-marriage');
  assert.match(markdown, /开锁技术和偷窃技术共同构成她的主线特长/u);
  assert.match(markdown, /调包与原位归还/u);
  assert.match(markdown, /凡俗技术无法破解的灵力禁制/u);
});

test('keeps the ranger node as a mainline reference instead of a module outline', () => {
  assert.match(markdown, new RegExp(`^key: ${node.key}$`, 'm'));
  assert.match(markdown, new RegExp(`^status: ${node.status}$`, 'm'));
  assert.match(markdown, /^detailLabel: 主线备忘$/m);
  assert.match(markdown, /^# 推荐主线阶段$/m);
  assert.equal(node.summary.length > 0, true);
  for (const field of ['missingItems', 'scope', 'moduleType', 'plotTags', 'specialGameplay', 'characters', 'locations']) {
    assert.equal(Object.hasOwn(node, field), false, `mainline source should omit ${field}`);
  }
  assert.doesNotMatch(markdown, /^(?:isTemplated|missingItems|entryConditions|completionConditions|stateChanges):/m);
  assert.doesNotMatch(markdown, /^# (?:玩法设计|最小可玩版本)$/m);
});
