import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalogPath = resolve(process.argv[2] ?? 'src/game/data/gameplay_outline/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

if (catalog.schemaVersion >= 2) {
  console.log(`Gameplay catalog schema ${catalog.schemaVersion} is already refined.`);
  process.exit(0);
}

const mergeGroups = [
  {
    ids: ['gameplay-014', 'gameplay-015', 'gameplay-016', 'gameplay-017'],
    title: '搜打撤远征',
    summary: '进入危险区域搜索物资、完成任务，并在负重、风险、深入探索与及时撤离之间作出取舍。'
  },
  {
    ids: ['gameplay-018', 'gameplay-020'],
    title: '收缩安全区生存',
    summary: '安全区域会持续收缩、迁移或改变形态，玩家必须随环境压力调整路线并生存到目标阶段。'
  },
  {
    ids: ['gameplay-030', 'gameplay-031'],
    title: '兵线推进战场',
    summary: '围绕单路或多路兵线、防御建筑、中立区域与核心据点展开持续推进和攻防。'
  },
  {
    ids: ['gameplay-034', 'gameplay-035', 'gameplay-037'],
    title: '塔防与路径防御',
    summary: '通过布置防御单位、调整敌人路径或组织进攻部队，完成阵地防守与防线突破。'
  },
  {
    ids: ['gameplay-047', 'gameplay-048'],
    title: '强敌追猎与目标逃生',
    summary: '在无法正面对抗的强敌追猎下潜行、协作并完成设备修复或出口开启等逃生目标。'
  },
  {
    ids: ['gameplay-049', 'gameplay-050', 'gameplay-051'],
    title: '护送、救援与撤离',
    summary: '寻找受困目标，处理不同NPC的行动与生存需求，并护送个人或群体安全撤离。'
  },
  {
    ids: ['gameplay-077', 'gameplay-078'],
    title: '自走棋编队与英雄干预',
    summary: '玩家负责招募、编队和站位，单位自动战斗，璃落可通过技能或行动在关键时刻干预战局。'
  },
  {
    ids: ['gameplay-079', 'gameplay-080', 'gameplay-081'],
    title: '环境生存与远征管理',
    summary: '在荒野、海洋、沙漠或极地远征中管理生存需求、环境威胁、露营休息和持续补给。'
  },
  {
    ids: ['gameplay-085', 'gameplay-086', 'gameplay-087'],
    title: '基地建设、重建与移动据点',
    summary: '使用远征资源建设长期据点、修复废墟，或经营列车、船只、飞船等可移动基地。'
  }
];

const entryById = new Map(catalog.entries.map((entry) => [entry.id, entry]));
const removedIds = new Set();

for (const group of mergeGroups) {
  const sourceEntries = group.ids.map((id) => entryById.get(id));
  if (sourceEntries.some((entry) => !entry)) {
    throw new Error(`Cannot refine gameplay group with missing ids: ${group.ids.join(', ')}`);
  }

  const targetEntry = sourceEntries[0];
  const mergedVariants = [...targetEntry.variants];

  for (const sourceEntry of sourceEntries.slice(1)) {
    mergedVariants.push({
      id: `${targetEntry.id}-merged-${sourceEntry.id}`,
      title: sourceEntry.title,
      description: sourceEntry.summary
    });
    mergedVariants.push(...sourceEntry.variants);
    removedIds.add(sourceEntry.id);
  }

  Object.assign(targetEntry, {
    title: group.title,
    summary: group.summary,
    designReferences: unique(sourceEntries.flatMap((entry) => entry.designReferences)),
    presentationModes: unique(sourceEntries.flatMap((entry) => entry.presentationModes)),
    variants: mergedVariants,
    mergedFrom: [...group.ids],
    sourceNumbers: sourceEntries.map((entry) => entry.number)
  });
}

catalog.schemaVersion = 2;
catalog.description = '面向璃落宇宙像素冒险RPG的专业化玩法目录；相近玩法按核心循环合并，来源类型保留为设计参考。';
catalog.entries = catalog.entries
  .filter((entry) => !removedIds.has(entry.id))
  .sort((left, right) => left.number - right.number)
  .map((entry, index) => ({ ...entry, number: index + 1 }));

writeFileSync(catalogPath, JSON.stringify(catalog), 'utf8');
console.log(`Refined gameplay catalog to ${catalog.entries.length} entries.`);

function unique(values) {
  return [...new Set(values)];
}
