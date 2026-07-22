import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const sourcePath = new URL('../../src/game/data/story_outline/sources/5-science.json', import.meta.url);
const schoolPath = new URL('../../src/game/data/story_outline/5-science/3.1-紧缚学校.md', import.meta.url);
const shopPath = new URL('../../src/game/data/story_outline/5-science/3.2-拘束具店铺.md', import.meta.url);
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const nodeByKey = new Map(source.nodes.map((node) => [node.key, node]));
const school = nodeByKey.get('world-5-star-weaving-dream-restraint-school');
const shop = nodeByKey.get('world-5-star-weaving-dream-restraint-paradise-shop');
const prison = nodeByKey.get('world-5-star-weaving-dream-reverse-immigration-prison');
const markdown = readFileSync(schoolPath, 'utf8');

test('inserts restraint school before the restraint shop without losing the existing chain', () => {
  assert.equal(source.nodes.length, 25);
  assert.equal(school?.parentKey, 'world-5-star-weaving-dream-order-paradise');
  assert.equal(shop?.parentKey, school?.key);
  assert.equal(prison?.parentKey, shop?.key);
  assert.equal(nodeByKey.get('world-5-star-weaving-dream-bionic-maze')?.parentKey, prison?.key);
  assert.equal(existsSync(shopPath), true);
});

test('keeps immigration screening, paid exemption and aesthetic law in the first module', () => {
  assert.match(markdown, /游客还是定居/u);
  assert.match(markdown, /预计停留超过一年的外来者/u);
  assert.match(markdown, /为期一年的紧缚学校/u);
  assert.match(markdown, /付费豁免/u);
  assert.match(markdown, /貌美程度/u);
  assert.match(markdown, /并不真正欢迎不愿被同化的移民/u);
});

test('keeps all five requested constrained writing exercises', () => {
  assert.match(markdown, /用袜子包住双手写字/u);
  assert.match(markdown, /用胶带把双手包裹后写字/u);
  assert.match(markdown, /改为赤脚夹笔写字/u);
  assert.match(markdown, /穿着袜子后用脚写字/u);
  assert.match(markdown, /双脚被进一步包裹后写字/u);
});
