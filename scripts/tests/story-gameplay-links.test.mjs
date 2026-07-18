import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sourceNodes = JSON.parse(readFileSync(
  new URL('../../src/game/data/story_outline/sources/0-munika.json', import.meta.url),
  'utf8'
)).nodes;

test('only life simulator links to the life simulation gameplay', () => {
  const linkedNodes = sourceNodes.filter((node) => Array.isArray(node.gameplayRefs) && node.gameplayRefs.length > 0);

  assert.deepEqual(linkedNodes.map((node) => ({ title: node.title, gameplayRefs: node.gameplayRefs })), [
    { title: '人生模拟器', gameplayRefs: ['gameplay-118'] }
  ]);
});
