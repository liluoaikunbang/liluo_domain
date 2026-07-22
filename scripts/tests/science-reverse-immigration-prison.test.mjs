import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sourcePath = new URL('../../src/game/data/story_outline/sources/5-science.json', import.meta.url);
const markdownPath = new URL('../../src/game/data/story_outline/5-science/3.3-反向移民监狱.md', import.meta.url);
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const nodeByKey = new Map(source.nodes.map((node) => [node.key, node]));
const prison = nodeByKey.get('world-5-star-weaving-dream-reverse-immigration-prison');
const markdown = readFileSync(markdownPath, 'utf8');

test('inserts the reverse-immigration prison between the shop and bionic maze', () => {
  assert.equal(prison?.parentKey, 'world-5-star-weaving-dream-restraint-paradise-shop');
  assert.equal(nodeByKey.get('world-5-star-weaving-dream-bionic-maze')?.parentKey, prison?.key);
  assert.equal(prison?.status, '大纲');
});

test('keeps the compliant offworld capture and no-payment exception', () => {
  assert.match(markdown, /持有由律序乐园正式核发的跨星抓捕手续/u);
  assert.match(markdown, /严禁任何人干涉/u);
  assert.match(markdown, /不能像本地行政违规那样缴费免除处罚/u);
  assert.match(markdown, /实际输出中占绝大多数的是奴隶/u);
});

test('reveals the prison as an adult slave-training and body-modification system', () => {
  assert.match(markdown, /完整的奴隶训练场/u);
  assert.match(markdown, /所有涉及性器化或动物化训练的囚犯均作为成年角色处理/u);
  assert.match(markdown, /性器化改造/u);
  assert.match(markdown, /动物化改造/u);
  assert.match(markdown, /几乎看不到真正变老的女性/u);
  assert.match(markdown, /泰德堡（用户指定灵感；项目内暂无独立设定资料）/u);
});
