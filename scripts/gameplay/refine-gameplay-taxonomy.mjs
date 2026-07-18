import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalogPath = resolve(process.argv[2] ?? 'src/game/data/gameplay_outline/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

if (catalog.schemaVersion > 3) {
  console.log(`Gameplay catalog schema ${catalog.schemaVersion} already has unified taxonomy names.`);
  process.exit(0);
}

const categoryTitles = [
  '地图探索结构', '即时动作玩法', '随机远征', '高风险撤离', '生存竞赛',
  '灾变生存', '战术目标争夺', '战线攻防', '阵地攻防', '即时战场指挥',
  '小队战术', '隐蔽追逃', '救援行动', '强敌挑战', '机关解谜',
  '调查推理', '异常恐怖', '时序改写', '角色扮演战斗', '随机构筑',
  '自动编队战斗', '荒野生存', '资源装备循环', '据点发展', '生活经营',
  '生产物流', '机动行动', '节奏操作', '竞技活动', '生活技艺',
  '社会关系系统', '系统驱动玩法', '探索收藏', '后台发展', '重复挑战'
];

catalog.categories.forEach((category, index) => {
  category.title = categoryTitles[index];
});

const entryTitles = {
  'gameplay-001': '房间式地牢探索', 'gameplay-004': '能力门控探索',
  'gameplay-008': '自动火力生存',
  'gameplay-009': '横版平台动作', 'gameplay-012': '层级远征',
  'gameplay-023': '疫情防控', 'gameplay-024': '区域争夺',
  'gameplay-022': '感染度管理',
  'gameplay-025': '爆破攻防', 'gameplay-026': '移动目标护卫',
  'gameplay-027': '目标物争夺', 'gameplay-028': '金库突袭',
  'gameplay-029': '通信任务', 'gameplay-032': '中立资源争夺',
  'gameplay-033': '核心保卫', 'gameplay-034': '路径塔防',
  'gameplay-039': '昼夜基地攻防', 'gameplay-043': '室内突击',
  'gameplay-046': '社会潜行', 'gameplay-047': '追猎逃生',
  'gameplay-049': '人员撤离', 'gameplay-058': '时序分身解谜',
  'gameplay-052': '多阶段首领战',
  'gameplay-061': '证词审查', 'gameplay-063': '司法裁决',
  'gameplay-067': '精神侵蚀', 'gameplay-070': '周目因果演化',
  'gameplay-066': '异常辨识',
  'gameplay-073': '伙伴捕育', 'gameplay-076': '概率构筑',
  'gameplay-077': '干预式自走棋', 'gameplay-079': '荒野生存管理',
  'gameplay-084': '装备构筑', 'gameplay-085': '基地发展',
  'gameplay-083': '物品制作',
  'gameplay-089': '农场经营', 'gameplay-090': '冒险组织经营',
  'gameplay-091': '专业设施管理', 'gameplay-093': '自动化生产',
  'gameplay-096': '载具攻防', 'gameplay-102': '地下采掘',
  'gameplay-098': '时机判定', 'gameplay-100': '节庆竞赛',
  'gameplay-101': '垂钓',
  'gameplay-103': '配方调制', 'gameplay-105': '阵营声望',
  'gameplay-106': '伙伴羁绊', 'gameplay-109': '动态世界日程',
  'gameplay-111': '现场记录', 'gameplay-112': '系列收藏',
  'gameplay-114': '计时发展', 'gameplay-117': '周期挑战'
};

for (const entry of catalog.entries) {
  entry.title = entryTitles[entry.id] ?? entry.title;
}

const abilityGatedExploration = catalog.entries.find((entry) => entry.id === 'gameplay-004');
if (abilityGatedExploration && !abilityGatedExploration.designReferences.includes('Metroidvania')) {
  abilityGatedExploration.designReferences.push('Metroidvania');
}

const dayNightDefense = catalog.entries.find((entry) => entry.id === 'gameplay-039');
if (dayNightDefense) dayNightDefense.categoryId = 'gameplay-category-09';

const representativeGames = {
  'gameplay-004': ['《空洞骑士》（Hollow Knight）', '《密特罗德：生存恐惧》（Metroid Dread）'],
  'gameplay-008': ['《吸血鬼幸存者》（Vampire Survivors）', '《土豆兄弟》（Brotato）'],
  'gameplay-010': ['《以撒的结合：重生》', '《挺进地牢》（Enter the Gungeon）'],
  'gameplay-011': ['《哈迪斯》（Hades）', '《死亡细胞》（Dead Cells）'],
  'gameplay-014': ['《逃离塔科夫》（Escape from Tarkov）', '《猎杀：对决1896》（Hunt: Showdown 1896）', '《Dark and Darker》'],
  'gameplay-018': ['《绝地求生》（PUBG: BATTLEGROUNDS）', '《堡垒之夜》（Fortnite）', '《Apex英雄》（Apex Legends）'],
  'gameplay-021': ['《求生之路2》（Left 4 Dead 2）', '《战锤：末世鼠疫2》'],
  'gameplay-024': ['《守望先锋2》（Overwatch 2）', '《战地》系列'],
  'gameplay-025': ['《反恐精英2》（Counter-Strike 2）', '《彩虹六号：围攻》'],
  'gameplay-026': ['《守望先锋2》（Overwatch 2）', '《军团要塞2》（Team Fortress 2）'],
  'gameplay-027': ['《光环：无限》（Halo Infinite）', '《魔兽世界》战场'],
  'gameplay-028': ['《收获日2》（PAYDAY 2）'],
  'gameplay-030': ['《Dota 2》', '《英雄联盟》（League of Legends）'],
  'gameplay-032': ['《Dota 2》', '《英雄联盟》（League of Legends）'],
  'gameplay-033': ['《Dota 2》', '《风暴英雄》（Heroes of the Storm）'],
  'gameplay-034': ['《王国保卫战》（Kingdom Rush）', '《气球塔防6》（Bloons TD 6）', '《明日方舟》'],
  'gameplay-036': ['《地下城守护者2》（Dungeon Keeper 2）', '《Dungeons 3》'],
  'gameplay-037': ['《异形：地球战区》（Anomaly: Warzone Earth）'],
  'gameplay-038': ['《星际争霸II》（StarCraft II）', '《帝国时代IV》'],
  'gameplay-041': ['《龙腾世纪：起源》', '《永恒之柱II：死亡之火》'],
  'gameplay-042': ['《火焰之纹章：风花雪月》', '《XCOM 2》', '《陷阵之志》（Into the Breach）'],
  'gameplay-043': ['《破门而入2》（Door Kickers 2）', '《彩虹六号：围攻》'],
  'gameplay-046': ['《杀手：暗杀世界》（HITMAN World of Assassination）'],
  'gameplay-047': ['《黎明杀机》（Dead by Daylight）', '《第五人格》'],
  'gameplay-052': ['《怪物猎人：世界》', '《最终幻想XIV》'],
  'gameplay-054': ['《魔兽世界》', '《最终幻想XIV》'],
  'gameplay-055': ['《Furi》', '《茶杯头》（Cuphead）'],
  'gameplay-056': ['《塞尔达传说：王国之泪》', '《传送门2》（Portal 2）'],
  'gameplay-057': ['《密室逃脱模拟器》（Escape Simulator）', '《未上锁的房间》（The Room）'],
  'gameplay-060': ['《奥伯拉丁的回归》', '《黑色洛城》（L.A. Noire）'],
  'gameplay-061': ['《逆转裁判》系列', '《黑色洛城》（L.A. Noire）'],
  'gameplay-062': ['《Among Us》', '《GNOSIA》'],
  'gameplay-064': ['《生化危机2：重制版》', '《异形：隔离》（Alien: Isolation）'],
  'gameplay-066': ['《8号出口》', "《I'm on Observation Duty》系列"],
  'gameplay-068': ['《星际拓荒》（Outer Wilds）', '《塞尔达传说：姆吉拉的假面》'],
  'gameplay-069': ['《波斯王子：时之砂》', '《时空幻境》（Braid）'],
  'gameplay-070': ['《尼尔：自动人形》', '《极限脱出：九人游戏》'],
  'gameplay-071': ['《暗黑破坏神IV》', '《CrossCode》'],
  'gameplay-072': ['《勇者斗恶龙XI S》', '《女神异闻录5 皇家版》'],
  'gameplay-074': ['《杀戮尖塔》（Slay the Spire）', '《怪物火车》（Monster Train）'],
  'gameplay-075': ['《命运之手2》（Hand of Fate 2）'],
  'gameplay-076': ['《骰子地下城》（Dicey Dungeons）', '《骰子浪游者》（Astrea）'],
  'gameplay-077': ['《刀塔霸业》（Dota Underlords）', '《云顶之弈》（Teamfight Tactics）', '《多多自走棋》'],
  'gameplay-097': ['《Hi-Fi RUSH》', '《节奏地牢》（Crypt of the NecroDancer）'],
  'gameplay-107': ['《杀出重围：人类分裂》', '《耻辱2》（Dishonored 2）'],
  'gameplay-108': ['《塞尔达传说：王国之泪》', '《神界：原罪2》'],
  'gameplay-109': ['《星露谷物语》', '《塞尔达传说：姆吉拉的假面》'],
  'gameplay-115': ['《鬼泣5》（Devil May Cry 5）', '《猎天使魔女》'],
  'gameplay-116': ['《哈迪斯》（Hades）的惩罚契约', '《光环》系列的骷髅头规则'],
  'gameplay-117': ['《洞穴探险2》（Spelunky 2）', '《杀戮尖塔》（Slay the Spire）每日挑战']
};

for (const [entryId, games] of Object.entries(representativeGames)) {
  const entry = catalog.entries.find((candidate) => candidate.id === entryId);
  if (entry) entry.designReferences = [...new Set([...games, ...entry.designReferences])];
}

if (!catalog.entries.some((entry) => entry.id === 'gameplay-118')) {
  catalog.entries.push({
    id: 'gameplay-118',
    number: 118,
    title: '命运人生推演',
    categoryId: 'gameplay-category-32',
    summary: '通过初始条件、随机事件和连续数值变化快速推演角色的一生，并以不同命运结局推动再次尝试。',
    designReferences: ['《人生重开模拟器》', '《BitLife》', '《中国式家长》'],
    presentationModes: ['interface-gameplay', 'cg-friendly'],
    variants: [
      { id: 'gameplay-118-variant-01', title: '初始天赋选择', description: '从随机或固定天赋中选择角色一生的初始特质。' },
      { id: 'gameplay-118-variant-02', title: '属性分配', description: '在体质、智力、家境、魅力等初始属性之间分配有限点数。' },
      { id: 'gameplay-118-variant-03', title: '逐年事件推进', description: '按年龄或人生阶段抽取事件，并持续改变属性和身份状态。' },
      { id: 'gameplay-118-variant-04', title: '条件事件链', description: '此前的天赋、属性和经历决定后续事件能否出现。' },
      { id: 'gameplay-118-variant-05', title: '异世界转生', description: '随机进入不同世界、时代或种族，体验独立的人生规则。' },
      { id: 'gameplay-118-variant-06', title: '前世继承', description: '重开时保留少量记忆、能力或命运资源。' },
      { id: 'gameplay-118-variant-07', title: '多代家族传承', description: '上一代的选择会改变后代的初始条件和可触发事件。' },
      { id: 'gameplay-118-variant-08', title: '角色命运推演', description: '选择已有角色，模拟其在另一组条件下可能经历的人生。' },
      { id: 'gameplay-118-variant-09', title: '世界线推演', description: '从故事关键节点出发，模拟另一种选择形成的平行人生。' },
      { id: 'gameplay-118-variant-10', title: '人生轨迹结算', description: '根据寿命、成就、关系和关键事件生成结局与人生评价。' }
    ]
  });
}

if (catalog.schemaVersion < 3) splitMergedEntry('gameplay-034', [
  {
    id: 'gameplay-037', title: '防线突破', summary: '组织进攻单位、选择突破路线并摧毁敌方防御设施。',
    variantPrefixes: ['gameplay-037-'], presentationModes: ['main-map', 'light-extension'], designReferences: ['Reverse tower defense']
  }
]);

if (catalog.schemaVersion < 3) splitMergedEntry('gameplay-085', [
  {
    id: 'gameplay-086', title: '区域重建', summary: '修复废墟的建筑、生产、人口与公共秩序，使区域状态持续改善。',
    variantPrefixes: ['gameplay-086-'], presentationModes: ['main-map', 'interface-gameplay', 'cg-friendly'], designReferences: []
  },
  {
    id: 'gameplay-087', title: '移动据点运营', summary: '经营列车、船只、飞船等移动据点，并处理航线、模块与旅途风险。',
    variantPrefixes: ['gameplay-087-'], presentationModes: ['main-map', 'interface-gameplay'], designReferences: []
  }
]);

catalog.schemaVersion = 3;
catalog.description = '面向璃落宇宙像素冒险RPG的专业化玩法目录；分类与玩法均以统一核心机制命名，相近玩法保留为变体，机制不同的玩法独立列项。';
catalog.entries = catalog.entries
  .sort((left, right) => left.number - right.number || left.id.localeCompare(right.id))
  .map((entry, index) => ({ ...entry, number: index + 1 }));

writeFileSync(catalogPath, JSON.stringify(catalog), 'utf8');
console.log(`Refined gameplay taxonomy to ${catalog.entries.length} entries.`);

function splitMergedEntry(targetId, newEntries) {
  const target = catalog.entries.find((entry) => entry.id === targetId);
  if (!target) throw new Error(`Missing merged gameplay entry: ${targetId}`);

  for (const newEntry of newEntries) {
    const variants = target.variants.filter((variant) =>
      newEntry.variantPrefixes.some((prefix) => variant.id.startsWith(prefix))
    );
    target.variants = target.variants.filter((variant) =>
      !newEntry.variantPrefixes.some((prefix) => variant.id.startsWith(prefix))
      && variant.id !== `${targetId}-merged-${newEntry.id}`
    );
    catalog.entries.push({
      id: newEntry.id,
      number: target.number + 0.1,
      title: newEntry.title,
      categoryId: target.categoryId,
      summary: newEntry.summary,
      designReferences: newEntry.designReferences,
      presentationModes: newEntry.presentationModes,
      variants
    });
  }

  target.mergedFrom = target.mergedFrom?.filter((id) => !newEntries.some((entry) => entry.id === id));
  target.sourceNumbers = target.sourceNumbers?.slice(0, target.mergedFrom?.length ?? 1);
}
