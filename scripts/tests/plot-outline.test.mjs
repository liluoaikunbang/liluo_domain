import test from 'node:test';
import assert from 'node:assert/strict';
import { plotOutline, findPlotEntries } from '../../src/game/data/plot_outline/plotOutline.js';

test('plot catalog uses unique stable ids and consistent usage state', () => {
  const ids = plotOutline.entries.map((entry) => entry.id);
  const groupIds = new Set(plotOutline.groups.map((group) => group.id));

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(groupIds.size, plotOutline.groups.length);
  plotOutline.groups.forEach((group) => assert.ok(plotOutline.entries.some((entry) => entry.groupId === group.id)));
  plotOutline.entries.forEach((entry) => {
    assert.match(entry.id, /^plot-\d{3}$/u);
    assert.match(entry.number, /^\d{3}$/u);
    assert.equal(entry.number, entry.id.slice(-3));
    assert.equal(entry.isUsed, entry.usedBy.length > 0);
    assert.ok(Array.isArray(entry.worldBiases));
    assert.ok(Array.isArray(entry.tags));
    assert.ok(Array.isArray(entry.characters));
    assert.equal(typeof entry.isBondagePlot, 'boolean');
    assert.ok(Array.isArray(entry.bondageTags));
    assert.equal(entry.usedByLabels.length, entry.usedBy.length);
    assert.ok(groupIds.has(entry.groupId));
  });
});

test('excludes world-setting concepts that are not reusable plots', () => {
  assert.ok(!plotOutline.groups.some((group) => ['异境留困', '灾域与能力继承'].includes(group.title)));
  assert.deepEqual(
    plotOutline.entries.filter((entry) => ['plot-008', 'plot-012', 'plot-016'].includes(entry.id)),
    []
  );
});

test('groups institutional and amusement plots without mixing indoor venues', () => {
  const institutionalGroup = plotOutline.groups.find((group) => group.title === '封闭规训机构');
  const outdoorGroup = plotOutline.groups.find((group) => group.title === '室外游乐场');
  const indoorGroup = plotOutline.groups.find((group) => group.title === '室内游乐场');
  const entriesIn = (group) => plotOutline.entries.filter((entry) => entry.groupId === group?.id);

  assert.deepEqual(entriesIn(institutionalGroup).map((entry) => entry.title), [
    '沈芷-病房保护与辨灵',
    '伪证收治',
    '黑蔷薇监护'
  ]);
  assert.ok(entriesIn(outdoorGroup).some((entry) => entry.title === '林雨薇等-邮轮观光'));
  assert.ok(entriesIn(indoorGroup).some((entry) => entry.title === '林雨薇等-充气城堡'));
  assert.ok(entriesIn(indoorGroup).some((entry) => entry.title === '林雨薇等-温泉竞赛'));
  assert.ok(!entriesIn(outdoorGroup).some((entry) => entry.title.includes('充气城堡')));
});

test('groups urban kidnappings under DID while keeping thumb-maid raids in the little-people plot', () => {
  const urbanDidGroup = plotOutline.groups.find((group) => group.title === '都市DID');
  const littlePeopleGroup = plotOutline.groups.find((group) => group.title === '小人国');
  const entriesIn = (group) => plotOutline.entries.filter((entry) => entry.groupId === group?.id);

  assert.deepEqual(entriesIn(urbanDidGroup).map((entry) => entry.id), ['plot-006', 'plot-007', 'plot-021', 'plot-024', 'plot-025']);
  assert.deepEqual(entriesIn(littlePeopleGroup).map((entry) => entry.title), ['苏婉儿等-拇指夜袭']);
});

test('groups ancient, modern and science-fiction hunting games together', () => {
  const huntingGroup = plotOutline.groups.find((group) => group.title === '狩猎游戏');
  const huntingEntries = plotOutline.entries.filter((entry) => entry.groupId === huntingGroup?.id);

  assert.deepEqual(huntingEntries.map((entry) => entry.id), ['plot-015', 'plot-022', 'plot-032']);
  assert.deepEqual(huntingEntries.map((entry) => entry.worldBiases[0]), ['3-尘寰问道', '5-星宇织梦', '1-浮光掠影']);
});

test('finds child entries when searching by a large plot title', () => {
  assert.deepEqual(
    findPlotEntries(plotOutline, { query: '封闭规训机构' }).map((entry) => entry.title),
    ['沈芷-病房保护与辨灵', '伪证收治', '黑蔷薇监护']
  );
});

test('keeps the protection-fee meeting and later rescue in one linked plot', () => {
  const receiptPlot = plotOutline.entries.find((entry) => entry.id === 'plot-001');

  assert.equal(receiptPlot?.usageStatus, 'partial');
  assert.match(receiptPlot?.summary ?? '', /保护费/u);
  assert.match(receiptPlot?.summary ?? '', /水泥鞋/u);
  assert.equal(receiptPlot?.title, '黄毛女孩-保护费与救援');
  assert.deepEqual(receiptPlot?.usedByLabels, ['浮光掠影-荆锁会事件-宿舍旧楼']);
  assert.deepEqual(receiptPlot?.characters, ['璃落', '黄毛女孩']);
  assert.equal(receiptPlot?.isBondagePlot, false);
  assert.deepEqual(receiptPlot?.bondageTags, []);
});

test('finds unused plot entries by world bias and keyword', () => {
  const matches = findPlotEntries(plotOutline, {
    usage: 'unused',
    worldBias: '1-浮光掠影',
    query: '水泥鞋'
  });

  assert.deepEqual(matches.map((entry) => entry.id), ['plot-001']);
});

test('keeps used plot entries linked to real story nodes', () => {
  const receiptPlot = plotOutline.entries.find((entry) => entry.id === 'plot-001');

  assert.equal(receiptPlot?.isUsed, true);
  assert.deepEqual(receiptPlot?.usedBy, ['world-1-glimmering-glance-old-dormitory']);
});

test('filters entries by bondage classification', () => {
  assert.ok(findPlotEntries(plotOutline, { bondage: 'no' }).some((entry) => entry.id === 'plot-001'));
  assert.ok(findPlotEntries(plotOutline, { bondage: 'yes' }).length > 0);
});
