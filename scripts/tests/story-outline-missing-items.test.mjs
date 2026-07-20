import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const panelSource = fs.readFileSync(
  new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
  'utf8'
);
const panelStyles = fs.readFileSync(
  new URL('../../src/game/views/components/base/gameMenuOverlay.css', import.meta.url),
  'utf8'
);

test('story nodes expose confirmed missing items from a bottom-right button and accessible dialog', () => {
  assert.match(panelSource, /v-if="hasMissingItems\(node\)"/);
  assert.match(panelSource, /class="story-node-missing-button"/);
  assert.match(panelSource, /openMissingItems\(node\)/);
  assert.match(panelSource, /activeMissingNode/);
  assert.match(panelSource, /该条目仍需补充以下已确认内容/);
  assert.match(panelStyles, /\.story-node-missing-button\s*\{[\s\S]*position:\s*absolute;[\s\S]*right:\s*8px;[\s\S]*bottom:\s*8px;/);
});
