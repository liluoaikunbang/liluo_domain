import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panelSource = readFileSync(
  new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
  'utf8'
);
const menuStyles = readFileSync(
  new URL('../../src/game/views/components/base/gameMenuOverlay.css', import.meta.url),
  'utf8'
);

test('summary category column fits its labels without wrapping or reserving excess width', () => {
  assert.equal(panelSource.includes('<th scope="col" class="story-summary-category-heading">类别</th>'), true);
  assert.match(menuStyles, /\.story-summary-category-heading,\s*\.story-summary-category\s*{[^}]*width:\s*1%;[^}]*white-space:\s*nowrap;/s);
  assert.doesNotMatch(menuStyles, /\.story-summary-category-heading,\s*\.story-summary-category\s*{[^}]*(?:min-width|max-width):\s*180px;/s);
  assert.match(menuStyles, /\.story-summary-category\s*{[^}]*position:\s*sticky;[^}]*left:\s*0;/s);
  assert.match(menuStyles, /\.story-summary-table\s*{[^}]*min-width:\s*1720px;/s);
});
