import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const panelSource = readFileSync(
  new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
  'utf8'
);

test('story summary uses plot, RAG and gameplay references instead of retired Tag columns', () => {
  assert.match(panelSource, /情节引用/u);
  assert.match(panelSource, /RAG 引用/u);
  assert.match(panelSource, /玩法引用/u);
  assert.match(panelSource, /plotRefs/u);
  assert.match(panelSource, /ragRefs/u);
  assert.match(panelSource, /gameplayRefs/u);
  assert.doesNotMatch(panelSource, /情节标签|紧缚标签|specialGameplay|plotTags|bondageTags/u);
});
