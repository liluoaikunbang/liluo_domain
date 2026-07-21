import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const templatePath = new URL('../../docs/系统说明/故事大纲条目模板.md', import.meta.url);
const skillReferencePath = new URL('../../.agents/skills/liluo-project/liluo-story-outline-authoring/references/mainline-reference.md', import.meta.url);

const cases = [
  ['sources/3-ancient.json', 'world-3-mortal-dao-chaotic-world-ranger', '3-ancient/4-乱世游侠.md'],
  ['sources/2-apocalypse.json', 'world-2-silent-earth-dirge-solo-smart-rv-trader', '2-apocalypse/19-独行房车商旅.md']
];
const forbiddenSourceFields = [
  'missingItems',
  'scope',
  'moduleType',
  'storyTags',
  'plotTags',
  'bondageTags',
  'specialGameplay',
  'characters',
  'locations'
];

for (const [sourceName, key, markdownName] of cases) {
  test(`${key} follows the mainline-reference contract`, () => {
    const sourceUrl = new URL(`../../src/game/data/story_outline/${sourceName}`, import.meta.url);
    const markdownUrl = new URL(`../../src/game/data/story_outline/${markdownName}`, import.meta.url);
    assert.equal(existsSync(markdownUrl), true);

    const source = JSON.parse(readFileSync(sourceUrl, 'utf8'));
    const node = source.nodes.find((item) => item.key === key);
    const markdown = readFileSync(markdownUrl, 'utf8');

    assert.equal(node?.status, '主线任务');
    for (const field of forbiddenSourceFields) {
      assert.equal(Object.hasOwn(node, field), false, `mainline source should omit ${field}`);
    }
    assert.match(markdown, /^detailLabel: 主线备忘$/m);
    assert.match(markdown, /^# 主线定位$/m);
    assert.doesNotMatch(markdown, /^(?:isTemplated|missingItems|scope|moduleType|entryConditions|completionConditions|stateChanges):/m);
    assert.doesNotMatch(markdown, /^# (?:玩法设计|最小可玩版本)$/m);
  });
}

test('ordinary child authoring must inherit relevant mainline memo context', () => {
  const template = readFileSync(templatePath, 'utf8');
  const skillReference = readFileSync(skillReferencePath, 'utf8');

  assert.match(template, /^### 普通剧情节点必须参考所属主线备忘$/m);
  assert.match(template, /沿来源 JSON 的 `parentKey` 向上找到最近的相关主线任务/u);
  assert.match(template, /“已确认方向”及确认过的前后衔接是连续性约束/u);
  assert.match(template, /“推荐主线阶段”“推荐展开方式”和成长参考是后续设计素材/u);
  assert.match(skillReference, /^## 撰写下属普通节点时如何引用$/m);
  assert.match(skillReference, /不得把整份主线备忘重复粘贴到每个子节点/u);
});
