import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import test from 'node:test';

const sourcePaths = globSync('src/game/data/story_outline/sources/*.json');
const markdownPaths = globSync('src/game/data/story_outline/**/*.md');
const storyPanelSource = readFileSync('src/game/views/components/base/StoryMenuPanel.vue', 'utf8');

test('story outline nodes keep story styles and split ordinary tags by purpose', () => {
  const allNodes = [];

  for (const sourcePath of sourcePaths) {
    const source = JSON.parse(readFileSync(sourcePath, 'utf8'));

    for (const node of source.nodes ?? []) {
      allNodes.push(node);
      assert.equal(Object.hasOwn(node, 'tags'), false, `${node.key} 仍使用 tags`);
      assert.ok(!node.storyTags || Array.isArray(node.storyTags), `${node.key} 的 storyTags 必须是数组`);
      assert.ok(!node.plotTags || Array.isArray(node.plotTags), `${node.key} 的 plotTags 必须是数组`);
      assert.ok(!node.bondageTags || Array.isArray(node.bondageTags), `${node.key} 的 bondageTags 必须是数组`);
    }
  }

  const abilitySchool = allNodes.find((node) => node.key === 'world-1-glimmering-glance-jingjiang-seventh-ability-adaptation-school');
  assert.deepEqual(abilitySchool?.storyTags, ['浮世奇人', '街景一隅']);
  assert.deepEqual(abilitySchool?.plotTags, ['异能者学校', '职业', '校园整蛊', '下克上']);
  assert.equal(Object.hasOwn(abilitySchool ?? {}, 'bondageTags'), false);
});

test('story outline markdown replaces only the ordinary tags field', () => {
  for (const markdownPath of markdownPaths) {
    const markdown = readFileSync(markdownPath, 'utf8');
    const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

    assert.doesNotMatch(frontmatter, /^tags:/mu, `${markdownPath} 仍使用 tags`);
  }
});

test('story cards render bondage tags and keep plot tags in metadata', () => {
  assert.match(storyPanelSource, /v-for="bondageTag in node\.bondageTags"/u);
  assert.doesNotMatch(storyPanelSource, /v-for="storyTag in node\.plotTags"/u);
  assert.match(storyPanelSource, /createMetaItem\('情节标签', node\.plotTags\)/u);
});
