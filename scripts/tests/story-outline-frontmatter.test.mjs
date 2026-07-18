import assert from 'node:assert/strict';
import { applyStoryOutlineFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';

const outline = [
  {
    key: 'world-1-glimmering-glance',
    world: '1-浮光掠影',
    title: '浮光掠影（都市）',
    status: '分类',
    children: [
      {
        key: 'world-1-glimmering-glance-club',
        world: '1-浮光掠影',
        title: '加入紧缚社团',
        summary: 'JSON 摘要',
        detailLabel: 'JSON 按钮',
        storyTags: ['旧章节'],
        tags: ['旧标签'],
        specialGameplay: ['旧玩法'],
        characters: ['旧角色'],
        locations: ['旧地点'],
        foreshadowing: ['旧伏笔'],
        reference: '旧参考',
        branchLayout: 'side',
        children: []
      },
      {
        key: 'world-1-glimmering-glance-grudge-ancient-tree',
        world: '1-浮光掠影',
        title: '满怨古树',
        status: '灵感',
        children: []
      }
    ]
  }
];

const markdownModules = {
  './1-modern/2-紧缚社团.md': [
    '---',
    'world: 1-浮光掠影',
    'storyTags:',
    '  - 街景一隅',
    'status: 大纲草稿',
    'summary: YAML 摘要',
    'detailLabel: 灵感',
    'cgRefs:',
    '  - 都市DID-KTV服务员',
    '  - 都市DID-保洁员',
    'foreshadowing:',
    '  - YAML 伏笔',
    'tags:',
    '  - YAML 标签',
    'specialGameplay:',
    '  - YAML 玩法',
    'characters:',
    '  - YAML 角色',
    'locations:',
    '  - YAML 地点',
    'reference: YAML 参考',
    '---',
    '正文内容'
  ].join('\n'),
  './1-modern/4.7-满怨古树.md': [
    '---',
    'world: 1-浮光掠影',
    'storyTags:',
    '  - 诡影侵临',
    'status: 灵感',
    'detailLabel: 灵感',
    '---',
    ''
  ].join('\n')
};

const resolvedOutline = applyStoryOutlineFrontmatter(outline, markdownModules);
const node = resolvedOutline[0].children[0];
const emptyDetailNode = resolvedOutline[0].children[1];

assert.equal(node.summary, 'YAML 摘要');
assert.equal(node.detailLabel, '灵感');
assert.deepEqual(node.cgRefs, ['都市DID-KTV服务员', '都市DID-保洁员']);
assert.deepEqual(node.storyTags, ['街景一隅']);
assert.equal(node.status, '大纲草稿');
assert.deepEqual(node.foreshadowing, ['YAML 伏笔']);
assert.deepEqual(node.tags, ['YAML 标签']);
assert.deepEqual(node.specialGameplay, ['YAML 玩法']);
assert.deepEqual(node.characters, ['YAML 角色']);
assert.deepEqual(node.locations, ['YAML 地点']);
assert.equal(node.reference, 'YAML 参考');
assert.equal(node.branchLayout, 'side');
assert.deepEqual(node.children, []);
assert.equal(emptyDetailNode.detailLabel, '灵感');
assert.equal(emptyDetailNode.detailSourcePath, './1-modern/4.7-满怨古树.md');
assert.equal(Object.hasOwn(emptyDetailNode, 'detailMarkdown'), false);

console.log('story outline frontmatter mapping passed');
