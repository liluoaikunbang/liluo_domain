import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import { buildStoryOutlineTree } from '../../src/game/data/story_outline/storyOutlineTreeBuilder.js';
import { storyOutlineSource } from '../../src/game/data/story_outline/storyOutlineSource.js';

test('builds an ordered story tree from flat nodes', () => {
  const source = {
    rootKeys: ['world-fantasy'],
    nodes: [
      {
        key: 'world-fantasy',
        world: '6-咒缚回响',
        title: '咒缚回响（魔幻）',
        status: '分类',
        order: 0
      },
      {
        key: 'chapter-2',
        parentKey: 'chapter-1',
        world: '6-咒缚回响',
        title: '秘纹学院',
        status: '主线任务',
        order: 20
      },
      {
        key: 'chapter-1',
        parentKey: 'world-fantasy',
        world: '6-咒缚回响',
        title: '逐梦大陆',
        status: '主线任务',
        order: 10
      }
    ]
  };

  const tree = buildStoryOutlineTree(source);

  assert.deepEqual(
    tree.map((node) => node.title),
    ['咒缚回响（魔幻）']
  );
  assert.deepEqual(tree[0].children.map((node) => node.title), ['逐梦大陆']);
  assert.deepEqual(tree[0].children[0].children.map((node) => node.title), ['秘纹学院']);
  assert.equal(Object.hasOwn(tree[0], 'parentKey'), false);
  assert.equal(Object.hasOwn(tree[0], 'order'), false);
});

test('does not mutate flat source nodes', () => {
  const source = {
    rootKeys: ['root'],
    nodes: [
      {
        key: 'root',
        title: '根节点',
        order: 0
      },
      {
        key: 'child',
        parentKey: 'root',
        title: '子节点',
        order: 0
      }
    ]
  };

  const before = JSON.stringify(source);
  buildStoryOutlineTree(source);

  assert.equal(JSON.stringify(source), before);
  assert.equal(Object.hasOwn(source.nodes[0], 'children'), false);
});

test('rejects duplicate keys and missing parents', () => {
  assert.throws(
    () => buildStoryOutlineTree({
      rootKeys: ['root'],
      nodes: [
        { key: 'root', title: '根节点' },
        { key: 'root', title: '重复节点' }
      ]
    }),
    /重复/
  );

  assert.throws(
    () => buildStoryOutlineTree({
      rootKeys: ['root'],
      nodes: [
        { key: 'root', title: '根节点' },
        { key: 'orphan', parentKey: 'missing-parent', title: '孤儿节点' }
      ]
    }),
    /父节点/
  );
});

test('project story outline source is valid and keeps the fantasy main line unbranched', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const keys = storyOutlineSource.nodes.map((node) => node.key);
  const fantasyRoot = tree.find((node) => node.key === 'world-6-cursebound-echoes');
  const fantasyChain = [];
  const expectedTitles = [
    '逐梦大陆',
    '银冠王都',
    '缄礼宫廷',
    '秘纹学院',
    '圣印群岛',
    '逐潮孤海',
    '熔辉机城',
    '森誓妖境',
    '暗月古堡',
    '骸骨王座',
    '龙眠山脉',
    '秘塔长歌',
    '锁角荒原',
    '幽暗城池',
    '晶沙王庭',
    '北境霜冠',
    '盗影城邦',
    '女巫沼泽',
    '星界裂门',
    '深渊契约'
  ];
  let currentNode = fantasyRoot?.children?.[0] ?? null;

  while (currentNode) {
    fantasyChain.push(currentNode.title);
    const children = Array.isArray(currentNode.children) ? currentNode.children : [];

    if (currentNode.title === '缄礼宫廷') {
      assert.equal(currentNode.status, '大纲草稿');
      assert.equal(currentNode.summary, '王都上流社会把拘束发展成了礼仪。');
      assert.deepEqual(currentNode.bondageTags, ['束腰', '拘束衣']);
    } else {
      assert.equal(currentNode.status, '主线任务');
      assert.equal(Object.hasOwn(currentNode, 'storyTags'), false, `${currentNode.title} 不应额外显示故事线标签`);
      assert.equal(Object.hasOwn(currentNode, 'plotTags'), false, `${currentNode.title} 不应额外显示情节标签`);
      assert.equal(Object.hasOwn(currentNode, 'bondageTags'), false, `${currentNode.title} 不应额外显示紧缚标签`);
    }

    assert.ok(children.length <= 1, `${currentNode.title} 不应产生主线分叉`);
    currentNode = children[0] ?? null;
  }

  assert.equal(keys.length, 127);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(fantasyChain, expectedTitles);

  expectedTitles.filter((title) => title !== '缄礼宫廷').forEach((title, index) => {
    const markdownPath = `src/game/data/story_outline/4-fantasy/${index + 1}-${title}.md`;

    assert.equal(existsSync(markdownPath), true, `${title} 应有关联的灵感 Markdown`);

    const markdown = readFileSync(markdownPath, 'utf8');

    assert.match(markdown, /world: 6-咒缚回响/);
    assert.match(markdown, /status: 主线任务/);
    assert.match(markdown, /detailLabel: 灵感/);
    assert.ok(markdown.split('---').at(-1)?.trim(), `${title} 应有灵感正文`);
  });

  assert.equal(
    existsSync('src/game/data/story_outline/4-fantasy/2.1-缄礼宫廷.md'),
    true,
    '缄礼宫廷应有关联的单元格 Markdown'
  );
});

test('science story outline keeps the requested main line unbranched with inspiration details', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const scienceRoot = tree.find((node) => node.key === 'world-5-star-weaving-dream');
  const scienceChain = [];
  const expectedTitles = [
    '星门港区',
    '环锁群星',
    '律序乐园',
    '紧缚学校',
    '拘束具店铺',
    '反向移民监狱',
    '仿生迷途',
    '镜域沉沦',
    '基序蛊城',
    '逐星远航',
    '冷眠方舟',
    '轨道庭院',
    '熔铠战星',
    '边境殖民星',
    '荒矿小行星',
    '深蓝海卫',
    '星际黑市',
    '监狱行星',
    '克隆回廊',
    '群心蜂巢',
    '异星初触',
    '先驱遗迹',
    '量子迷城'
  ];
  let currentNode = scienceRoot?.children?.[0] ?? null;

  while (currentNode) {
    const children = Array.isArray(currentNode.children) ? currentNode.children : [];

    scienceChain.push(currentNode);
    const expectedStatus = currentNode.title === '紧缚学校'
      ? '大纲'
      : currentNode.title === '反向移民监狱'
        ? '大纲'
      : currentNode.title === '拘束具店铺'
        ? '大纲草稿'
        : '主线任务';
    assert.equal(currentNode.status, expectedStatus);
    assert.equal(Object.hasOwn(currentNode, 'storyTags'), false, `${currentNode.title} 不应额外显示故事线标签`);
    assert.equal(Object.hasOwn(currentNode, 'plotTags'), false, `${currentNode.title} 不应额外显示情节标签`);
    assert.equal(Object.hasOwn(currentNode, 'bondageTags'), false, `${currentNode.title} 不应额外显示紧缚标签`);
    assert.ok(children.length <= 1, `${currentNode.title} 不应产生主线分叉`);
    currentNode = children[0] ?? null;
  }

  assert.deepEqual(scienceChain.map((node) => node.title), expectedTitles);

  const expectedMarkdownPaths = new Map([
    ['星门港区', 'src/game/data/story_outline/5-science/1-星门港区.md'],
    ['环锁群星', 'src/game/data/story_outline/5-science/2-环锁群星.md'],
    ['律序乐园', 'src/game/data/story_outline/5-science/3-律序乐园.md'],
    ['仿生迷途', 'src/game/data/story_outline/5-science/4-仿生迷途.md'],
    ['镜域沉沦', 'src/game/data/story_outline/5-science/5-镜域沉沦.md'],
    ['基序蛊城', 'src/game/data/story_outline/5-science/6-基序蛊城.md'],
    ['逐星远航', 'src/game/data/story_outline/5-science/7-逐星远航.md'],
    ['冷眠方舟', 'src/game/data/story_outline/5-science/8-冷眠方舟.md'],
    ['轨道庭院', 'src/game/data/story_outline/5-science/9-轨道庭院.md'],
    ['熔铠战星', 'src/game/data/story_outline/5-science/10-熔铠战星.md'],
    ['边境殖民星', 'src/game/data/story_outline/5-science/11-边境殖民星.md'],
    ['荒矿小行星', 'src/game/data/story_outline/5-science/12-荒矿小行星.md'],
    ['深蓝海卫', 'src/game/data/story_outline/5-science/13-深蓝海卫.md'],
    ['星际黑市', 'src/game/data/story_outline/5-science/14-星际黑市.md'],
    ['监狱行星', 'src/game/data/story_outline/5-science/15-监狱行星.md'],
    ['克隆回廊', 'src/game/data/story_outline/5-science/16-克隆回廊.md'],
    ['群心蜂巢', 'src/game/data/story_outline/5-science/17-群心蜂巢.md'],
    ['异星初触', 'src/game/data/story_outline/5-science/18-异星初触.md'],
    ['先驱遗迹', 'src/game/data/story_outline/5-science/19-先驱遗迹.md'],
    ['量子迷城', 'src/game/data/story_outline/5-science/20-量子迷城.md']
  ]);

  expectedMarkdownPaths.forEach((markdownPath, title) => {

    assert.equal(existsSync(markdownPath), true, `${title} 应有关联的灵感 Markdown`);

    const markdown = readFileSync(markdownPath, 'utf8');

    assert.match(markdown, /world: 5-星宇织梦/);
    assert.match(markdown, /status: 主线任务/);
    assert.match(markdown, /detailLabel: (?:灵感|主线备忘)/);
    assert.ok(markdown.split('---').at(-1)?.trim(), `${title} 应有灵感正文`);
  });

  assert.equal(
    existsSync('src/game/data/story_outline/5-science/3.1-紧缚学校.md'),
    true,
    '紧缚学校应作为律序乐园下的第一个普通模块'
  );
  assert.equal(
    existsSync('src/game/data/story_outline/5-science/3.2-拘束具店铺.md'),
    true,
    '拘束具店铺应顺延为律序乐园下的后续模块'
  );
  assert.equal(
    existsSync('src/game/data/story_outline/5-science/3.3-反向移民监狱.md'),
    true,
    '反向移民监狱应位于拘束具店铺之后'
  );
});

test('ancient main quest nodes have inspiration markdown without moving existing modules', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const ancientRoot = tree.find((node) => node.key === 'world-3-mortal-dao');
  const ancientChain = [];
  const expectedTitles = [
    '丫鬟难为',
    '平民公主',
    '塞外和亲',
    '乱世游侠',
    '问道起点',
    '缚身反杀',
    '无人收徒',
    '陷害，入魔宗',
    '魔宗历险',
    '重新修炼',
    '误入灵蛛谷',
    '尾声',
    '永世束缚'
  ];
  let currentNode = ancientRoot?.children?.[0] ?? null;

  while (currentNode) {
    const children = Array.isArray(currentNode.children) ? currentNode.children : [];

    ancientChain.push(currentNode);
    assert.ok(children.length <= 1, `${currentNode.title} 不应产生主线分叉`);
    currentNode = children[0] ?? null;
  }

  assert.deepEqual(ancientChain.map((node) => node.title), expectedTitles);

  [
    '丫鬟难为',
    '平民公主',
    '塞外和亲',
    '乱世游侠',
    '问道起点',
    '魔宗历险',
    '尾声'
  ].forEach((title, index) => {
    const markdownPath = `src/game/data/story_outline/3-ancient/${index + 1}-${title}.md`;

    assert.equal(existsSync(markdownPath), true, `${title} 应有关联的灵感 Markdown`);

    const markdown = readFileSync(markdownPath, 'utf8');

    assert.match(markdown, /world: 3-尘寰问道/);
    assert.match(markdown, /status: 主线任务/);
    assert.match(markdown, /detailLabel: 灵感/);
    assert.ok(markdown.split('---').at(-1)?.trim(), `${title} 应有灵感正文`);
  });
});

test('modern snow train merges train card game and attendant scenes', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const keys = storyOutlineSource.nodes.map((node) => node.key);
  const modernRoot = tree.find((node) => node.key === 'world-1-glimmering-glance');
  const snowTrain = storyOutlineSource.nodes.find((node) => node.key === 'world-1-glimmering-glance-snow-train');

  assert.equal(keys.includes('world-1-glimmering-glance-card-game'), false);
  assert.equal(keys.includes('world-1-glimmering-glance-guest-train-attendant'), false);
  assert.equal(snowTrain?.summary, '去往雪城的火车卧铺玩法，包含火车牌局与客串乘务员场景。');
  assert.deepEqual(snowTrain?.plotTags, ['职业']);
  assert.deepEqual(snowTrain?.bondageTags, ['挠痒', '气味系', '游戏']);
  assert.deepEqual(snowTrain?.specialGameplay, ['气味系-踩踩', '游戏-紧缚斗地主', '职业-火车乘务员']);

  const foundTitles = [];
  const visit = (node) => {
    foundTitles.push(node.title);
    (node.children ?? []).forEach(visit);
  };

  modernRoot?.children?.forEach(visit);
  assert.equal(foundTitles.includes('雪城列车'), true);
  assert.equal(foundTitles.includes('火车上的牌局'), false);
  assert.equal(foundTitles.includes('客串乘务员'), false);
});

test('modern grudge ancient tree sits between old dormitory and urban rumors', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const modernRoot = tree.find((node) => node.key === 'world-1-glimmering-glance');
  const oldDormitory = findTreeNodeByKey(modernRoot, 'world-1-glimmering-glance-old-dormitory');
  const grudgeAncientTree = oldDormitory?.children?.[0];
  const children = grudgeAncientTree?.children ?? [];
  const urbanRumors = children.find((node) => node.key === 'world-1-glimmering-glance-urban-rumors');
  const nightSchoolGhostStories = children.find((node) => node.key === 'world-1-glimmering-glance-night-school-ghost-stories');

  assert.equal(grudgeAncientTree?.key, 'world-1-glimmering-glance-grudge-ancient-tree');
  assert.equal(grudgeAncientTree?.title, '满怨古树');
  assert.equal(grudgeAncientTree?.status, '灵感');
  assert.deepEqual(grudgeAncientTree?.storyTags, ['诡影侵临']);
  assert.equal(urbanRumors?.key, 'world-1-glimmering-glance-urban-rumors');
  assert.equal(nightSchoolGhostStories?.title, '夜校怪谈');
  assert.deepEqual(nightSchoolGhostStories?.storyTags, ['诡影侵临']);
  assert.equal(nightSchoolGhostStories?.branchLayout, 'side');
  assert.equal(nightSchoolGhostStories?.status, '灵感');
});

test('modern midnight city exploration is a side story under urban rumors', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const modernRoot = tree.find((node) => node.key === 'world-1-glimmering-glance');
  const urbanRumors = findTreeNodeByKey(modernRoot, 'world-1-glimmering-glance-urban-rumors');
  const children = urbanRumors?.children ?? [];
  const mainChild = children.find((node) => node.key === 'world-1-glimmering-glance-little-prisoner');
  const sideChild = children.find((node) => node.key === 'world-1-glimmering-glance-midnight-city-exploration');

  assert.equal(mainChild?.title, '小囚犯出圈记');
  assert.equal(sideChild?.title, '深夜城市探险');
  assert.equal(sideChild?.branchLayout, 'side');
  assert.equal(sideChild?.status, '灵感');
  assert.deepEqual(sideChild?.storyTags, ['街景一隅']);
  assert.deepEqual(sideChild?.bondageTags, ['DID']);
});

test('modern night bus investigation unlocks one long-term city investigator branch', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const modernRoot = tree.find((node) => node.key === 'world-1-glimmering-glance');
  const littleMaidTeam = findTreeNodeByKey(modernRoot, 'world-1-glimmering-glance-little-maid-team');
  const abilityAdaptationSchool = littleMaidTeam?.children?.[0];
  const missingNightBus = abilityAdaptationSchool?.children?.[0];
  const luxuryTheater = missingNightBus?.children?.find((node) => node.key === 'world-1-glimmering-glance-luxury-theater');
  const cityInvestigator = missingNightBus?.children?.find((node) => node.key === 'world-1-glimmering-glance-city-investigator');

  assert.equal(abilityAdaptationSchool?.key, 'world-1-glimmering-glance-jingjiang-seventh-ability-adaptation-school');
  assert.equal(abilityAdaptationSchool?.title, '\u8346\u6c5f\u7b2c\u4e03\u5f02\u80fd\u9002\u5e94\u5b66\u6821');
  assert.equal(abilityAdaptationSchool?.status, '\u5927\u7eb2');
  assert.deepEqual(abilityAdaptationSchool?.storyTags, ['\u6d6e\u4e16\u5947\u4eba', '\u8857\u666f\u4e00\u9685']);
  assert.equal(Object.hasOwn(abilityAdaptationSchool ?? {}, 'branchLayout'), false);
  assert.equal(missingNightBus?.key, 'world-1-glimmering-glance-missing-night-bus');
  assert.equal(missingNightBus?.title, '消失的夜班车');
  assert.equal(missingNightBus?.status, '大纲');
  assert.equal(luxuryTheater?.key, 'world-1-glimmering-glance-luxury-theater');
  assert.equal(luxuryTheater?.title, '浮华剧场');
  assert.deepEqual(luxuryTheater?.storyTags, ['幻域回声']);
  assert.equal(Object.hasOwn(luxuryTheater ?? {}, 'branchLayout'), false);
  assert.equal(cityInvestigator?.title, '城市调查员');
  assert.equal(cityInvestigator?.branchLayout, 'side');
  assert.equal(Array.isArray(cityInvestigator?.children), false);
});

test('modern old capital echo sits between prison storm and return to jingjiang', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const modernRoot = tree.find((node) => node.key === 'world-1-glimmering-glance');
  const prisonStorm = findTreeNodeByKey(modernRoot, 'world-1-glimmering-glance-prison-storm');
  const oldCapitalEcho = prisonStorm?.children?.[0];
  const returnToJingjiang = oldCapitalEcho?.children?.[0];

  assert.equal(oldCapitalEcho?.key, 'world-1-glimmering-glance-old-capital-echo');
  assert.equal(oldCapitalEcho?.title, '旧都回声');
  assert.equal(oldCapitalEcho?.status, '主线任务');
  assert.equal(returnToJingjiang?.key, 'world-1-glimmering-glance-return-to-jingjiang');
  assert.equal(prisonStorm?.children?.length, 1);
  assert.equal(oldCapitalEcho?.children?.length, 1);
  assert.equal(existsSync('src/game/data/story_outline/1-modern/3.5-旧都回声.md'), true);
});

test('apocalypse story outline keeps the requested main line unbranched and preserves existing modules', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const apocalypseRoot = tree.find((node) => node.key === 'world-2-silent-earth-dirge');
  const apocalypseChain = [];
  const expectedTitles = [
    '尸潮噬世',
    '红线鬼域',
    'Ω级禁忌束缚套装',
    '异诡临界',
    '诡雾迷城',
    '天灾异像',
    '疫病残城',
    '生态吞城',
    '异兽踏陆',
    '虫巢边境',
    '深海漂陆',
    '永冬白境',
    '沙海孤途',
    '机械余晖',
    '方舟幽笼',
    '废土王庭',
    '末日圣裁',
    '梦城沉眠',
    '循时终日',
    '忘川灰世',
    '裂界灾临',
    '独行房车商旅'
  ];
  let currentNode = apocalypseRoot?.children?.[0] ?? null;

  while (currentNode) {
    const children = Array.isArray(currentNode.children) ? currentNode.children : [];

    apocalypseChain.push(currentNode);
    assert.ok(children.length <= 1, `${currentNode.title} 不应产生主线分叉`);
    currentNode = children[0] ?? null;
  }

  const zombieMain = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-zombie-apocalypse');
  const redLine = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-red-line');
  const omega = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-omega');
  const eerieMain = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-eerie-apocalypse');
  const fogCity = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-fog-city');
  const riftDisaster = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-rift-disaster');
  const soloRvTrader = findTreeNodeByKey(apocalypseRoot, 'world-2-silent-earth-dirge-solo-smart-rv-trader');
  const sourceNodeByKey = new Map(storyOutlineSource.nodes.map((node) => [node.key, node]));

  assert.deepEqual(apocalypseChain.map((node) => node.title), expectedTitles);
  assert.equal(zombieMain?.title, '尸潮噬世');
  assert.equal(sourceNodeByKey.get(redLine?.key)?.parentKey, zombieMain?.key);
  assert.equal(sourceNodeByKey.get(omega?.key)?.parentKey, redLine?.key);
  assert.equal(sourceNodeByKey.get(eerieMain?.key)?.parentKey, omega?.key);
  assert.equal(sourceNodeByKey.get(fogCity?.key)?.parentKey, eerieMain?.key);
  assert.deepEqual(redLine?.storyTags, ['废城求生']);
  assert.deepEqual(omega?.storyTags, ['废城求生']);
  assert.equal(eerieMain?.title, '异诡临界');
  assert.equal(fogCity?.title, '诡雾迷城');
  assert.equal(sourceNodeByKey.get(soloRvTrader?.key)?.parentKey, riftDisaster?.key);
  assert.equal(soloRvTrader?.status, '主线任务');
  assert.equal(existsSync('src/game/data/story_outline/2-apocalypse/19-独行房车商旅.md'), true);

  [
    '尸潮噬世',
    '异诡临界',
    '天灾异像',
    '疫病残城',
    '生态吞城',
    '异兽踏陆',
    '虫巢边境',
    '深海漂陆',
    '永冬白境',
    '沙海孤途',
    '机械余晖',
    '方舟幽笼',
    '废土王庭',
    '末日圣裁',
    '梦城沉眠',
    '循时终日',
    '忘川灰世',
    '裂界灾临'
  ].forEach((title, index) => {
    const markdownPath = `src/game/data/story_outline/2-apocalypse/${index + 1}-${title}.md`;

    assert.equal(existsSync(markdownPath), true, `${title} 应有关联的灵感 Markdown`);

    const markdown = readFileSync(markdownPath, 'utf8');

    assert.match(markdown, /world: 2-寂土挽歌/);
    assert.match(markdown, /status: 主线任务/);
    assert.match(markdown, /detailLabel: 灵感/);
    assert.ok(markdown.split('---').at(-1)?.trim(), `${title} 应有灵感正文`);
  });
});

test('monica empire keeps free exploration regions in one display chain', () => {
  const tree = buildStoryOutlineTree(storyOutlineSource);
  const monicaRoot = tree.find((node) => node.key === 'world-4-monica-empire');
  const displayChain = [];
  let currentNode = monicaRoot?.children?.[0] ?? null;

  while (currentNode) {
    const children = Array.isArray(currentNode.children) ? currentNode.children : [];

    displayChain.push(currentNode);
    assert.ok(children.length <= 1, `${currentNode.title} 不应产生区域分叉`);
    currentNode = children[0] ?? null;
  }

  const fourSeasonsGarden = displayChain.find((node) => node.title === '四季花园');
  const cityDesire = displayChain.find((node) => node.title === '醉欲之城');

  assert.deepEqual(
    displayChain.map((node) => node.title),
    ['缚神领地', '四季花园', '帝国核心区', '醉欲之城', '同盟城池', '边境与异域']
  );
  assert.deepEqual(
    displayChain.map((node) => node.status),
    ['区域组', '区域', '区域组', '区域', '区域组', '区域组']
  );
  assert.equal(monicaRoot.children?.length, 1);
  assert.equal(fourSeasonsGarden?.status, '区域');
  assert.equal(fourSeasonsGarden?.mapId, 'liluo_estate');
  assert.equal(Object.hasOwn(fourSeasonsGarden, 'branchLayout'), false);
  assert.equal(cityDesire?.status, '区域');
  assert.equal(cityDesire?.mapId, 'city_desire');
  assert.equal(Object.hasOwn(cityDesire, 'branchLayout'), false);
});

test('modern story starts with hospital awakening before returning to campus', () => {
  const sourceNodeByKey = new Map(storyOutlineSource.nodes.map((node) => [node.key, node]));
  const mainQuest = sourceNodeByKey.get('world-1-glimmering-glance-jingsuo-event');
  const hospitalAwakening = sourceNodeByKey.get('world-1-glimmering-glance-hospital-awakening');
  const campusArrival = sourceNodeByKey.get('world-1-glimmering-glance-campus-arrival');
  const club = sourceNodeByKey.get('world-1-glimmering-glance-club');

  assert.equal(hospitalAwakening?.parentKey, mainQuest?.key);
  assert.equal(campusArrival?.parentKey, hospitalAwakening?.key);
  assert.equal(club?.parentKey, campusArrival?.key);
  assert.equal(hospitalAwakening?.title, '病房苏醒');
  assert.equal(hospitalAwakening?.status, '大纲');
});

function findTreeNodeByKey(node, key) {
  if (!node) {
    return null;
  }

  if (node.key === key) {
    return node;
  }

  for (const child of node.children ?? []) {
    const matchedNode = findTreeNodeByKey(child, key);

    if (matchedNode) {
      return matchedNode;
    }
  }

  return null;
}
