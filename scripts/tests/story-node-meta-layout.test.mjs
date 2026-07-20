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

test('only reserves the template status label for legacy untemplated entries', () => {
  assert.equal(storyPanelSource.includes('function shouldDisplayTemplateStatus(node)'), true);
  assert.equal(storyPanelSource.includes('v-if="shouldDisplayTemplateStatus(node)"'), true);
  assert.equal(storyPanelSource.includes("node.isTemplated ? '已模板化' : '旧版未模板化'"), false);
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

test('only shows linked gameplay labels and does not expose a per-node picker', () => {
  assert.equal(storyPanelSource.includes('hasLinkedGameplay(node)'), true);
  assert.equal(storyPanelSource.includes('v-if="hasLinkedGameplay(node)"'), true);
  assert.equal(storyPanelSource.includes('StoryGameplayLinkDialog'), true);
  assert.equal(storyPanelSource.includes('openGameplayLinks(node)'), true);
});
