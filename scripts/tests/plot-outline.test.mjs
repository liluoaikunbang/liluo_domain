import test from 'node:test';
import assert from 'node:assert/strict';
import {
  plotOutline,
  findPlotEntries,
  getPlotTagOptions,
  getPlotBondageTagOptions
} from '../../src/game/data/plot_outline/plotOutline.js';

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

test('filters entries independently by ordinary and bondage tags', () => {
  assert.deepEqual(
    findPlotEntries(plotOutline, { tag: '末日' }).map((entry) => entry.id),
    ['plot-033', 'plot-034', 'plot-039', 'plot-040', 'plot-041', 'plot-044']
  );
  assert.ok(findPlotEntries(plotOutline, { bondageTag: '监禁' }).some((entry) => entry.id === 'plot-039'));
  assert.ok(
    findPlotEntries(plotOutline, { tag: '末日', bondageTag: '监禁' }).every(
      (entry) => entry.tags.includes('末日') && entry.bondageTags.includes('监禁')
    )
  );
});

test('keeps Liluo sustained resistance under the bondage-struggle group', () => {
  const struggleGroup = plotOutline.groups.find((group) => group.title === '紧缚挣扎');
  const strugglePlot = plotOutline.entries.find((entry) => entry.id === 'plot-041');

  assert.ok(struggleGroup);
  assert.equal(strugglePlot?.groupId, struggleGroup.id);
  assert.deepEqual(strugglePlot?.worldBiases, ['2-寂土挽歌']);
  assert.ok(strugglePlot?.tags.includes('他人安全'));
  assert.ok(strugglePlot?.summary.includes('大母脚趾'));
  assert.ok(strugglePlot?.summary.includes('倒吊'));
});

test('keeps the virtual-reality body abduction under the technology-consumption trap group', () => {
  const technologyGroup = plotOutline.groups.find((group) => group.title === '科技消费陷阱');
  const virtualAbduction = plotOutline.entries.find((entry) => entry.id === 'plot-042');

  assert.equal(virtualAbduction?.groupId, technologyGroup?.id);
  assert.deepEqual(virtualAbduction?.worldBiases, ['5-星宇织梦']);
  assert.ok(virtualAbduction?.summary.includes('现实身体'));
  assert.ok(virtualAbduction?.summary.includes('几个小时'));
  assert.ok(virtualAbduction?.tags.includes('虚实错位'));
});

test('keeps tendon severing under extreme restraint and torture while preserving the cultivation transition', () => {
  const tortureGroup = plotOutline.groups.find((group) => group.title === '极限拘束与折磨');
  const transitionPlot = plotOutline.entries.find((entry) => entry.id === 'plot-043');

  assert.equal(transitionPlot?.groupId, tortureGroup?.id);
  assert.deepEqual(transitionPlot?.worldBiases, ['3-尘寰问道']);
  assert.ok(transitionPlot?.summary.includes('挑断筋腱'));
  assert.ok(transitionPlot?.summary.includes('刺青'));
  assert.ok(transitionPlot?.tags.includes('武侠转仙侠'));
});

test('keeps hot-melt glue and dripping-wax ear sealing under apocalyptic extreme torture', () => {
  const tortureGroup = plotOutline.groups.find((group) => group.title === '极限拘束与折磨');
  const earSealingPlot = plotOutline.entries.find((entry) => entry.id === 'plot-044');

  assert.equal(earSealingPlot?.groupId, tortureGroup?.id);
  assert.deepEqual(earSealingPlot?.worldBiases, ['2-寂土挽歌']);
  assert.ok(earSealingPlot?.summary.includes('热熔胶'));
  assert.ok(earSealingPlot?.summary.includes('滴蜡'));
  assert.ok(earSealingPlot?.tags.includes('听觉封闭'));
});

test('keeps the drilled metal mouth seal combined with the existing sewn-eye and sewn-mouth imprisonment', () => {
  const sensorySealingPlot = plotOutline.entries.find((entry) => entry.id === 'plot-039');

  assert.ok(sensorySealingPlot?.summary.includes('电钻'));
  assert.ok(sensorySealingPlot?.summary.includes('螺丝'));
  assert.ok(sensorySealingPlot?.summary.includes('铁片'));
  assert.ok(sensorySealingPlot?.summary.includes('牙齿'));
  assert.ok(sensorySealingPlot?.tags.includes('金属封嘴'));
});

test('keeps forced alcohol through a medical mouth opener under teasing and bullying', () => {
  const bullyingGroup = plotOutline.groups.find((group) => group.title === '戏弄与霸凌');
  const forcedAlcoholPlot = plotOutline.entries.find((entry) => entry.id === 'plot-045');

  assert.equal(forcedAlcoholPlot?.groupId, bullyingGroup?.id);
  assert.deepEqual(forcedAlcoholPlot?.worldBiases, []);
  assert.ok(forcedAlcoholPlot?.summary.includes('医用开口器'));
  assert.ok(forcedAlcoholPlot?.summary.includes('灌酒'));
  assert.ok(forcedAlcoholPlot?.tags.includes('剥夺拒绝权'));
});

test('keeps wrapped-hands rock-paper-scissors under teasing and bullying', () => {
  const bullyingGroup = plotOutline.groups.find((group) => group.title === '戏弄与霸凌');
  const wrappedHandsPlot = plotOutline.entries.find((entry) => entry.id === 'plot-046');

  assert.equal(wrappedHandsPlot?.groupId, bullyingGroup?.id);
  assert.ok(wrappedHandsPlot?.summary.includes('圆球状'));
  assert.ok(wrappedHandsPlot?.summary.includes('猜拳'));
  assert.ok(wrappedHandsPlot?.tags.includes('不公平游戏'));
  assert.deepEqual(wrappedHandsPlot?.bondageTags, ['游戏']);
});

test('exposes unique sorted ordinary and bondage tag options', () => {
  const ordinaryTags = getPlotTagOptions(plotOutline);
  const bondageTags = getPlotBondageTagOptions(plotOutline);

  assert.equal(new Set(ordinaryTags).size, ordinaryTags.length);
  assert.equal(new Set(bondageTags).size, bondageTags.length);
  assert.deepEqual(ordinaryTags, [...ordinaryTags].sort((left, right) => left.localeCompare(right, 'zh-CN')));
  assert.deepEqual(bondageTags, [...bondageTags].sort((left, right) => left.localeCompare(right, 'zh-CN')));
  assert.ok(ordinaryTags.includes('末日'));
  assert.ok(bondageTags.includes('监禁'));
});
