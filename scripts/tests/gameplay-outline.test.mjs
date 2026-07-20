import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createGameplayExportPayload,
  createGameplayIndex,
  findGameplayEntries,
  gameplayOutline,
  resolveStoryGameplayLinks,
  resolveStoryGameplayTitles,
  updateOutlineNodeGameplayRefs,
  updateStoryGameplayRefs
} from '../../src/game/data/gameplay_outline/gameplayOutline.js';

test('creates a self-describing JSON export for the complete gameplay outline', () => {
  const payload = createGameplayExportPayload(gameplayOutline, new Date('2026-07-19T08:00:00.000Z'));

  assert.equal(payload.exportType, 'gameplay-outline');
  assert.equal(payload.exportVersion, 1);
  assert.equal(payload.exportedAt, '2026-07-19T08:00:00.000Z');
  assert.equal(payload.categoryCount, gameplayOutline.categories.length);
  assert.equal(payload.entryCount, gameplayOutline.entries.length);
  assert.deepEqual(payload.catalog, gameplayOutline);
  assert.notEqual(payload.catalog, gameplayOutline);
});

test('loads the 107 consolidated gameplay entries with valid references', () => {
  assert.equal(gameplayOutline.entries.length, 107);
  assert.equal(new Set(gameplayOutline.entries.map((entry) => entry.id)).size, 107);
  assert.deepEqual(
    gameplayOutline.entries.map((entry) => entry.number),
    Array.from({ length: 107 }, (_, index) => index + 1)
  );

  const categoryIds = new Set(gameplayOutline.categories.map((category) => category.id));
  const validPresentationModes = new Set(Object.keys(gameplayOutline.presentationModes));

  gameplayOutline.entries.forEach((entry) => {
    assert.equal(categoryIds.has(entry.categoryId), true, `${entry.id} category`);
    assert.equal(entry.title.length > 0, true, `${entry.id} title`);
    assert.equal(Array.isArray(entry.variants), true, `${entry.id} variants`);
    entry.presentationModes.forEach((mode) => {
      assert.equal(validPresentationModes.has(mode), true, `${entry.id} mode ${mode}`);
    });
  });

  const variantTitles = gameplayOutline.entries.flatMap((entry) => entry.variants.map((variant) => variant.title));
  assert.equal(new Set(variantTitles).size, variantTitles.length);

  assert.equal(gameplayOutline.categories.length, 15);
  assert.equal(gameplayOutline.schemaVersion, 4);
  assert.equal(Object.hasOwn(gameplayOutline, 'source'), false);
  assert.equal(gameplayOutline.entries.some((entry) => Object.hasOwn(entry, 'moduleRefs')), false);
  assert.equal(gameplayOutline.categories.some((category) => /PVP|PVE|MOBA|RTS|Raid|吃鸡|挂机/i.test(category.title)), false);
  assert.equal(gameplayOutline.entries.some((entry) => /PVP|PVE|MOBA|Raid|Boss Rush/i.test(entry.title)), false);
  assert.equal(
    gameplayOutline.entries.find((entry) => entry.title === '兵线推进战场')?.designReferences.includes('《Dota 2》'),
    true
  );
  assert.equal(
    gameplayOutline.entries.find((entry) => entry.title === '团队型大型副本')?.designReferences.includes('《魔兽世界》'),
    true
  );
  assert.deepEqual(
    gameplayOutline.entries.find((entry) => entry.title === '搜打撤远征')?.mergedFrom,
    ['gameplay-014', 'gameplay-015', 'gameplay-016', 'gameplay-017']
  );
  assert.equal(gameplayOutline.entries.some((entry) => entry.title === '任务型搜打撤'), false);
});

test('uses unified mechanism names instead of stitched category or gameplay labels', () => {
  const stitchedLabelPattern = /[、+＋]|(?:与|和)(?=.{1,12}(?:类)?$)/;

  assert.deepEqual(
    gameplayOutline.categories.filter(({ title }) => stitchedLabelPattern.test(title)),
    []
  );
  assert.deepEqual(
    gameplayOutline.entries.filter(({ title }) => stitchedLabelPattern.test(title)),
    []
  );
});

test('keeps top-level gameplay groups broad and balanced', () => {
  const entryCounts = gameplayOutline.categories.map(({ id }) =>
    gameplayOutline.entries.filter(({ categoryId }) => categoryId === id).length
  );

  assert.equal(gameplayOutline.categories.length, 15);
  assert.equal(Math.min(...entryCounts) >= 2, true);
  assert.equal(Math.max(...entryCounts) <= 13, true);
});

test('records concrete representative games for distinctive gameplay archetypes', () => {
  const referencesById = new Map(
    gameplayOutline.entries.map((entry) => [entry.id, entry.designReferences])
  );

  assert.deepEqual(referencesById.get('gameplay-018')?.slice(0, 2), [
    '《绝地求生》（PUBG: BATTLEGROUNDS）',
    '《堡垒之夜》（Fortnite）'
  ]);
  assert.equal(referencesById.get('gameplay-030')?.includes('《Dota 2》'), true);
  assert.equal(referencesById.get('gameplay-047')?.includes('《黎明杀机》（Dead by Daylight）'), true);
  assert.equal(referencesById.get('gameplay-101')?.length, 0);
});

test('includes life-path simulation as an independent gameplay entry', () => {
  const entry = gameplayOutline.entries.find(({ id }) => id === 'gameplay-118');

  assert.equal(entry?.title, '命运人生推演');
  assert.equal(entry?.categoryId, 'gameplay-group-12');
  assert.equal(entry?.designReferences.includes('《人生重开模拟器》'), true);
  assert.equal(entry?.variants.some(({ title }) => title === '异世界转生'), true);
});

test('indexes and filters gameplay by category, mode and text', () => {
  const index = createGameplayIndex(gameplayOutline);
  assert.equal(index.entryById.get('gameplay-001')?.title, '房间式地牢探索');

  const results = findGameplayEntries(gameplayOutline, {
    categoryId: 'gameplay-group-03',
    presentationMode: 'main-map',
    query: '撤离'
  });

  assert.equal(results.length > 0, true);
  assert.equal(results.every((entry) => entry.categoryId === 'gameplay-group-03'), true);
  assert.equal(results.every((entry) => entry.presentationModes.includes('main-map')), true);

  assert.equal(
    findGameplayEntries(gameplayOutline, { query: 'Dota 2' }).some(({ id }) => id === 'gameplay-030'),
    true
  );
  assert.equal(
    findGameplayEntries(gameplayOutline, { query: '绝地求生' }).some(({ id }) => id === 'gameplay-018'),
    true
  );
  assert.equal(
    findGameplayEntries(gameplayOutline, { query: 'MOBA' }).some(({ id }) => id === 'gameplay-032'),
    true
  );
});

test('resolves story gameplay links and updates refs without mutating the story node', () => {
  const storyNode = {
    key: 'story-node',
    gameplayRefs: ['gameplay-001', 'missing-gameplay']
  };

  const links = resolveStoryGameplayLinks(storyNode, gameplayOutline);
  assert.deepEqual(links.map((entry) => entry.id), ['gameplay-001']);
  assert.deepEqual(resolveStoryGameplayTitles(storyNode, gameplayOutline), ['房间式地牢探索']);

  const updatedNode = updateStoryGameplayRefs(storyNode, ['gameplay-014', 'gameplay-001', 'gameplay-014']);
  assert.deepEqual(updatedNode.gameplayRefs, ['gameplay-014', 'gameplay-001']);
  assert.deepEqual(storyNode.gameplayRefs, ['gameplay-001', 'missing-gameplay']);
});

test('keeps linear interactive fiction separate from outcome-changing branch dialogue', () => {
  const interactiveFiction = gameplayOutline.entries.find(({ id }) => id === 'gameplay-119');
  assert.equal(interactiveFiction?.title, '互动小说');
  assert.equal(interactiveFiction?.categoryId, 'gameplay-group-12');
  assert.equal(interactiveFiction?.presentationModes.includes('cg-friendly'), true);
  assert.notEqual(interactiveFiction?.summary, gameplayOutline.entries.find(({ id }) => id === 'gameplay-104')?.summary);
});

test('story summary includes a searchable primary gameplay column backed by catalog titles', () => {
  const panelSource = readFileSync(
    new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
    'utf8'
  );

  assert.equal(panelSource.includes("key: 'primaryGameplay'"), true);
  assert.equal(panelSource.includes("label: '主要玩法'"), true);
  assert.equal(panelSource.includes('resolveStoryGameplayTitles(node'), true);
});

test('updates a nested outline node while preserving unrelated branches', () => {
  const outline = [
    {
      key: 'root',
      children: [
        { key: 'target', title: '目标节点' },
        { key: 'sibling', title: '相邻节点' }
      ]
    }
  ];

  const updatedOutline = updateOutlineNodeGameplayRefs(outline, 'target', ['gameplay-001']);

  assert.deepEqual(updatedOutline[0].children[0].gameplayRefs, ['gameplay-001']);
  assert.equal(updatedOutline[0].children[1], outline[0].children[1]);
  assert.equal(Object.hasOwn(outline[0].children[0], 'gameplayRefs'), false);
});

test('gameplay browser only exposes linkable gameplay and uses project scroll areas', () => {
  const componentSource = readFileSync(
    new URL('../../src/game/views/components/base/GameplayMenuPanel.vue', import.meta.url),
    'utf8'
  );

  assert.equal(componentSource.includes('混合模板'), false);
  assert.equal(componentSource.includes('底层模块'), false);
  assert.equal((componentSource.match(/<GameScrollArea/g) ?? []).length, 3);
  assert.equal(componentSource.includes('overflow: auto'), false);
  assert.equal(componentSource.includes('名称、说明、细分玩法或设计参考'), true);
  assert.equal(componentSource.includes('getHighlightedSegments'), true);
  assert.equal(componentSource.includes('gameplay-search-match'), true);
  assert.equal(componentSource.includes('v-html'), false);
  assert.equal(componentSource.includes('ref="gameplayDetailScrollArea"'), true);
  assert.equal(componentSource.includes('gameplayDetailScrollArea.value?.scrollToTop()'), true);
  assert.equal(componentSource.includes('ref="gameplayCategoryScrollArea"'), false);

  const linkDialogSource = readFileSync(
    new URL('../../src/game/views/components/base/StoryGameplayLinkDialog.vue', import.meta.url),
    'utf8'
  );
  assert.equal(linkDialogSource.includes('<GameScrollArea class="gameplay-link-list"'), true);
  assert.equal(linkDialogSource.includes('overflow: auto'), false);
});

test('story gameplay dialog is read-only and lists only existing links', () => {
  const dialogSource = readFileSync(
    new URL('../../src/game/views/components/base/StoryGameplayLinkDialog.vue', import.meta.url),
    'utf8'
  );

  assert.equal(dialogSource.includes('resolveStoryGameplayLinks'), true);
  assert.equal(dialogSource.includes('type="checkbox"'), false);
  assert.equal(dialogSource.includes("$emit('save'"), false);
  assert.equal(dialogSource.includes('搜索玩法'), false);
});
