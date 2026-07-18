import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalogPath = resolve(process.argv[2] ?? 'src/game/data/gameplay_outline/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

if (catalog.schemaVersion >= 4) {
  console.log(`Gameplay catalog schema ${catalog.schemaVersion} already uses consolidated categories.`);
  process.exit(0);
}

const groups = [
  { title: '地图探索', sourceOrders: [1] },
  { title: '即时战斗', sourceOrders: [2, 14] },
  { title: '随机远征', sourceOrders: [3, 4] },
  { title: '生存挑战', sourceOrders: [5, 6, 22] },
  { title: '战场攻防', sourceOrders: [7, 8, 9] },
  { title: '战术行动', sourceOrders: [10, 11, 12, 13] },
  { title: '机关调查', sourceOrders: [15, 16] },
  { title: '异常时序', sourceOrders: [17, 18] },
  { title: '角色构筑', sourceOrders: [19, 20, 21] },
  { title: '世界建设', sourceOrders: [23, 24, 25, 26] },
  { title: '专项活动', sourceOrders: [27, 28, 29, 30] },
  { title: '叙事模拟', sourceOrders: [31, 32] },
  { title: '探索收藏', sourceOrders: [33] },
  { title: '后台发展', sourceOrders: [34] },
  { title: '重复挑战', sourceOrders: [35] }
];

const sourceCategoryByOrder = new Map(catalog.categories.map((category) => [category.order, category.id]));
const targetGroupBySourceId = new Map();

catalog.categories = groups.map((group, index) => {
  const id = `gameplay-group-${String(index + 1).padStart(2, '0')}`;
  for (const sourceOrder of group.sourceOrders) {
    const sourceId = sourceCategoryByOrder.get(sourceOrder);
    if (!sourceId) throw new Error(`Missing source gameplay category order ${sourceOrder}`);
    targetGroupBySourceId.set(sourceId, id);
  }
  return { id, order: index + 1, title: group.title };
});

for (const entry of catalog.entries) {
  const targetGroupId = targetGroupBySourceId.get(entry.categoryId);
  if (!targetGroupId) throw new Error(`No consolidated category for ${entry.id}: ${entry.categoryId}`);
  entry.categoryId = targetGroupId;
}

catalog.schemaVersion = 4;
catalog.description = '面向璃落宇宙像素冒险RPG的专业化玩法目录；顶层大类用于稳定导航，玩法条目描述核心机制，具体差异保留为玩法变体。';

writeFileSync(catalogPath, JSON.stringify(catalog), 'utf8');
console.log(`Consolidated ${catalog.entries.length} gameplay entries into ${catalog.categories.length} categories.`);
