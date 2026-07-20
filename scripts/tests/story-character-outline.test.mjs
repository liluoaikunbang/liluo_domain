import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import {
  buildStoryCharacterOutline,
  filterStoryCharacters
} from '../../src/game/data/story_outline/storyCharacterOutline.js';

test('groups story characters by world and merges appearances', () => {
  const catalog = buildStoryCharacterOutline({
    rootKeys: ['world-modern', 'world-ancient'],
    nodes: [
      { key: 'world-modern', world: '1-浮光掠影', title: '浮光掠影（现代）' },
      { key: 'hospital', world: '1-浮光掠影', title: '病房苏醒', summary: '在医院醒来。', characters: ['沈芷', '许知遥'], locations: ['市医院'], tags: ['医院'], foreshadowing: ['沈芷隐瞒内幕'] },
      { key: 'dance', world: '1-浮光掠影', title: '舞蹈教室', summary: '全班被绑架事件。', characters: ['沈芷'] },
      { key: 'world-ancient', world: '3-尘寰问道', title: '尘寰问道（古代）' }
    ]
  });

  assert.deepEqual(catalog.worlds.map((world) => world.id), ['1-浮光掠影', '3-尘寰问道']);
  assert.equal(catalog.worlds[0].label, '浮光掠影（现代）');
  assert.deepEqual(catalog.worlds[0].characters.map((character) => character.name), ['沈芷', '许知遥']);
  assert.deepEqual(catalog.worlds[0].characters[0].appearances.map((entry) => entry.title), ['病房苏醒', '舞蹈教室']);
  assert.deepEqual(catalog.worlds[0].characters[0].locations, ['市医院']);
  assert.deepEqual(catalog.worlds[0].characters[0].tags, ['医院']);
  assert.deepEqual(catalog.worlds[0].characters[0].relatedNotes, ['沈芷隐瞒内幕']);
  assert.deepEqual(catalog.worlds[1].characters, []);
});

test('keeps organization references and marks them separately', () => {
  const catalog = buildStoryCharacterOutline({ nodes: [
    { key: 'world-modern', world: '1-浮光掠影', title: '浮光掠影（现代）' },
    { key: 'rust-salt', world: '1-浮光掠影', title: '锈盐', characters: ['Rin', '盐坞帮', '夜栈', '缄枷会'] }
  ], rootKeys: ['world-modern'] });
  const entries = new Map(catalog.worlds[0].characters.map((entry) => [entry.name, entry]));

  assert.equal(entries.get('Rin').kind, 'person');
  assert.equal(entries.get('盐坞帮').kind, 'organization');
  assert.equal(entries.get('夜栈').kind, 'organization');
  assert.equal(entries.get('缄枷会').kind, 'organization');
});

test('project catalog includes every current character reference once per world', async () => {
  const { storyCharacterOutline } = await import('../../src/game/data/story_outline/storyCharacterOutline.js');
  const modern = storyCharacterOutline.worlds.find((world) => world.id === '1-浮光掠影');
  const apocalypse = storyCharacterOutline.worlds.find((world) => world.id === '2-寂土挽歌');
  const ancient = storyCharacterOutline.worlds.find((world) => world.id === '3-尘寰问道');

  assert.ok(modern && apocalypse && ancient);
  assert.equal(new Set(modern.characters.map((entry) => entry.name)).size, modern.characters.length);
  assert.deepEqual(apocalypse.characters.map((entry) => entry.name), ['娜芙', '老陆']);
  assert.deepEqual(ancient.characters.map((entry) => entry.name), ['妙桐', '顾文若', '茯丝']);
  assert.equal(modern.characters.find((entry) => entry.name === '林雨薇')?.appearances.length, 6);
});

test('outline menu exposes character alongside story and gameplay', async () => {
  const source = await readFile(
    new URL('../../src/game/views/components/base/OutlineMenuPanel.vue', import.meta.url),
    'utf8'
  );

  assert.match(source, /\{ key: 'character', label: '人物\/组织' \}/u);
  assert.match(source, /CharacterOutlinePanel/u);
  assert.match(source, /:catalog="storyCharacterOutline"/u);
});

test('filters people and organizations independently while retaining search', () => {
  const characters = [
    { name: '沈芷', kind: 'person', locations: ['荆江市'], tags: [], relatedNotes: [], appearances: [] },
    { name: '缄枷会', kind: 'organization', locations: ['荆江市'], tags: [], relatedNotes: [], appearances: [] }
  ];

  assert.deepEqual(filterStoryCharacters(characters, { kind: 'person' }).map((entry) => entry.name), ['沈芷']);
  assert.deepEqual(filterStoryCharacters(characters, { kind: 'organization' }).map((entry) => entry.name), ['缄枷会']);
  assert.deepEqual(filterStoryCharacters(characters, { query: '荆江' }).map((entry) => entry.name), ['沈芷', '缄枷会']);
  assert.deepEqual(filterStoryCharacters(characters, { kind: 'person', query: '缄枷' }), []);
});
