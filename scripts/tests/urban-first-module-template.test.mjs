import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(projectRoot, 'src/game/data/story_outline/sources/1-modern.json');
const detailPath = path.join(projectRoot, 'src/game/data/story_outline/1-modern/1.0.1-病房苏醒.md');

const outline = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function findFirstOrdinaryModule(nodes, parentKey = null) {
  for (const node of nodes.filter((item) => (item.parentKey ?? null) === parentKey)) {
    if (node.status !== '分类' && node.status !== '主线任务') return node;
    const descendant = findFirstOrdinaryModule(nodes, node.key);
    if (descendant) return descendant;
  }
  return null;
}

const firstModule = findFirstOrdinaryModule(outline.nodes);
assert.equal(firstModule?.key, 'world-1-glimmering-glance-hospital-awakening');
assert.equal(firstModule?.title, '病房苏醒');
assert.ok(firstModule?.characters?.includes('无名女鬼'));

const markdown = fs.readFileSync(detailPath, 'utf8');
const frontmatter = parseMarkdownFrontmatter(markdown);

assert.equal(frontmatter.isTemplated, 'true');
assert.deepEqual(frontmatter.gameplayRefs, ['gameplay-119']);
assert.deepEqual(frontmatter.cgRefs, [
  '精神病院-病房约束',
  '精神病院-放风时间',
  '精神病院-外出放风'
]);
assert.equal(frontmatter.cgSequence.length, 3);
for (const item of frontmatter.cgSequence) {
  assert.ok(frontmatter.cgRefs.includes(item.split('｜')[0]));
}
assert.ok(!frontmatter.cgSequence.some((item) => item.split('｜')[0] === '梦境种子植入'));
assert.ok(frontmatter.missingItems.some((item) => item.includes('梦境种子植入')));
assert.ok(frontmatter.missingItems.some((item) => item.startsWith('可制作｜') && item.includes('霸凌系列 CG')));
assert.ok(!frontmatter.missingItems.some((item) => item.startsWith('动画｜')));
assert.ok(frontmatter.missingItems.some((item) => item.startsWith('场景图｜') && item.includes('单人病房') && item.includes('封闭活动区') && item.includes('室外庭院')));
assert.ok(!frontmatter.missingItems.some((item) => item.startsWith('CG｜') && item.includes('误伤')));
assert.deepEqual(frontmatter.storyTags, ['诡影侵临']);
assert.match(frontmatter.summary, /看见鬼魂/u);
assert.match(frontmatter.summary, /梦境种子植入后/u);
assert.ok(frontmatter.foreshadowing.some((item) => item.includes('看见鬼魂是梦境种子植入后的副作用')));
assert.ok(!frontmatter.foreshadowing.some((item) => item.includes('荆锁会实验改变了璃落对灵异现象的感知')));
assert.ok(frontmatter.foreshadowing.some((item) => item.includes('区分现实人物、记忆残影与真正鬼魂')));

assert.match(markdown, /^## 主要玩法$/m);
assert.match(markdown, /^### 互动小说（gameplay-119）$/m);
assert.match(markdown, /^### CG 1：精神病院-病房约束$/m);
assert.match(markdown, /^### 可制作闪回：梦境种子植入$/m);
assert.match(markdown, /^## 闪回演出组织规则$/m);
assert.match(markdown, /场景动画进入记忆层 → CG 定格关键瞬间 → 场景动画恢复操作/u);
assert.match(markdown, /^## 阶段二：植入前的封闭放风$/m);
assert.match(markdown, /^## 阶段三：梦境种子植入与女鬼惊现$/m);
assert.match(markdown, /^## 阶段四：惊慌误伤与约束升级$/m);
assert.match(markdown, /^## 阶段五：加强约束下的重新辨识$/m);
assert.match(markdown, /^## 阶段六：严密约束的室外放风$/m);
assert.match(markdown, /基础图不启用束手套与束脚套差分/u);
assert.match(markdown, /同时启用“束手套”与“束脚套”两层差分/u);
assert.match(markdown, /“脱鞋”差分不进入本条主线/u);
assert.match(markdown, /误伤只由文字带过/u);
assert.match(markdown, /不播放误伤 CG 或动作动画/u);
assert.match(markdown, /现实人物、记忆残影与真正鬼魂/u);
assert.match(markdown, /无可行走地图不等于无场景图/u);
assert.match(markdown, /每个剧情场景都必须有对应场景图/u);

console.log('urban first module template passed');
