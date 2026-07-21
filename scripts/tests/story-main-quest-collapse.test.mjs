import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storyPanelSource = readFileSync(
  new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
  'utf8'
);

test('main quest containers can collapse only their own story block', () => {
  assert.match(
    storyPanelSource,
    /function isCollapsibleStatus\(status\)\s*\{\s*return \['分类', '主线任务', '支线任务'\]\.includes\(status\);\s*\}/u
  );
  assert.match(
    storyPanelSource,
    /const nextMainQuestNode = isCollapsed && isMainQuestNode\(node\) \? findNextMainQuestNode\(node\) : null;/u
  );
  assert.match(
    storyPanelSource,
    /const visibleChildren = isCollapsed \? \[\] : children;/u
  );
});
