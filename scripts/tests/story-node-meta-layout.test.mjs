import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storyPanelSource = readFileSync(
  new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
  'utf8'
);
const menuStyles = readFileSync(
  new URL('../../src/game/views/components/base/gameMenuOverlay.css', import.meta.url),
  'utf8'
);

test('places story classification metadata in a dedicated bottom-left area', () => {
  assert.equal(storyPanelSource.includes("'story-node-card-with-bottom-meta': hasNodeMetaRow(node)"), true);
  assert.match(menuStyles, /\.story-node-meta-row\s*{[^}]*position:\s*absolute;[^}]*left:\s*8px;[^}]*bottom:\s*8px;/s);
  assert.match(menuStyles, /\.story-node-card-with-bottom-meta\s*{[^}]*padding-bottom:/s);
});

test('reserves a normal-flow row for story node actions above the title', () => {
  assert.equal(storyPanelSource.includes("'story-node-card-actions-without-meta'"), false);
  assert.match(menuStyles, /\.story-node-actions\s*{[^}]*position:\s*relative;[^}]*min-height:\s*22px;/s);
  assert.doesNotMatch(menuStyles, /\.story-node-actions\s*{[^}]*position:\s*absolute;/s);
});

test('uses content-aware node heights with fixed track gaps', () => {
  assert.equal(storyPanelSource.includes('function getLayoutNodeHeight(node)'), true);
  assert.equal(storyPanelSource.includes('function applyFixedTrackSpacing(nodes, isVertical)'), true);
  assert.equal(storyPanelSource.includes('const NODE_TRACK_GAP = 24;'), true);
  assert.equal(storyPanelSource.includes('height: `${node.layoutHeight}px`'), true);
});

test('does not expose gameplay linking on pure category nodes', () => {
  assert.equal(storyPanelSource.includes('canLinkGameplay(node)'), true);
  assert.equal(storyPanelSource.includes('v-if="canLinkGameplay(node)"'), true);
});
