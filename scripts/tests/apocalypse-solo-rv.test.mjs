import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildStoryOutlineTree } from '../../src/game/data/story_outline/storyOutlineTreeBuilder.js';

const sourcePath = new URL('../../src/game/data/story_outline/sources/2-apocalypse.json', import.meta.url);
const markdownPath = new URL('../../src/game/data/story_outline/2-apocalypse/19-独行房车商旅.md', import.meta.url);
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));

function findNode(nodes, key) {
  for (const node of nodes) {
    if (node.key === key) return node;
    const nested = findNode(node.children ?? [], key);
    if (nested) return nested;
  }
  return null;
}

test('places the solo smart-RV trader after the apocalypse finale', () => {
  const tree = buildStoryOutlineTree(source);
  const riftDisaster = findNode(tree, 'world-2-silent-earth-dirge-rift-disaster');
  const soloRvTrader = findNode(tree, 'world-2-silent-earth-dirge-solo-smart-rv-trader');

  assert.equal(riftDisaster?.children?.length, 1);
  assert.equal(riftDisaster?.children?.[0]?.key, soloRvTrader?.key);
  assert.equal(soloRvTrader?.status, '主线任务');
});

test('keeps the solo-RV idea as a mainline reference instead of a module outline', () => {
  const node = source.nodes.find((item) => item.key === 'world-2-silent-earth-dirge-solo-smart-rv-trader');
  const markdown = readFileSync(markdownPath, 'utf8');

  assert.match(markdown, new RegExp(`^key: ${node.key}$`, 'm'));
  assert.match(markdown, new RegExp(`^world: ${node.world}$`, 'm'));
  assert.match(markdown, new RegExp(`^status: ${node.status}$`, 'm'));
  assert.match(markdown, /^detailLabel: 主线备忘$/m);
  assert.match(markdown, /璃落作为车上唯一的人类/u);
  assert.match(markdown, /打开房车后门卖货/u);
  assert.match(markdown, /《紧缚环游世界》/u);
  for (const field of ['missingItems', 'scope', 'moduleType', 'storyTags', 'plotTags', 'specialGameplay', 'characters', 'locations']) {
    assert.equal(Object.hasOwn(node, field), false, `mainline source should omit ${field}`);
  }
  assert.doesNotMatch(markdown, /^(?:isTemplated|missingItems|entryConditions|completionConditions|stateChanges):/m);
  assert.doesNotMatch(markdown, /^# (?:玩法设计|最小可玩版本)$/m);
});
