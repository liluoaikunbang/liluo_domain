import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const outlinePanelSource = readFileSync(
  new URL('../../src/game/views/components/base/OutlineMenuPanel.vue', import.meta.url),
  'utf8'
);
const plotPanelSource = readFileSync(
  new URL('../../src/game/views/components/base/PlotOutlinePanel.vue', import.meta.url),
  'utf8'
);

test('places plot entries between story and gameplay', () => {
  assert.match(
    outlinePanelSource,
    /\{ key: 'story', label: '故事' \},\s*\{ key: 'plot', label: '情节' \},\s*\{ key: 'gameplay', label: '玩法' \}/u
  );
  assert.match(outlinePanelSource, /activeSection === 'plot'/u);
  assert.match(outlinePanelSource, /PlotOutlinePanel/u);
});

test('plot panel exposes search, usage, world-bias and tag filters', () => {
  assert.match(plotPanelSource, /搜索情节/u);
  assert.match(plotPanelSource, /使用状态/u);
  assert.match(plotPanelSource, /偏向世界/u);
  assert.match(plotPanelSource, /普通标签/u);
  assert.match(plotPanelSource, /紧缚标签/u);
  assert.match(plotPanelSource, /getPlotTagOptions/u);
  assert.match(plotPanelSource, /getPlotBondageTagOptions/u);
  assert.doesNotMatch(plotPanelSource, /<span>紧缚情节<\/span>/u);
  assert.match(plotPanelSource, /usedByLabels/u);
  assert.match(plotPanelSource, /出现人物/u);
  assert.match(plotPanelSource, /bondageTags/u);
  assert.match(plotPanelSource, /未使用/u);
  assert.match(plotPanelSource, /已使用/u);
});

test('plot panel presents groups, entries and details in three columns', () => {
  assert.match(plotPanelSource, /大情节/u);
  assert.match(plotPanelSource, /小情节/u);
  assert.match(plotPanelSource, /class="group-list"/u);
  assert.match(plotPanelSource, /class="entry-list"/u);
  assert.match(plotPanelSource, /class="detail"/u);
  assert.match(plotPanelSource, /selectedGroupId/u);
  assert.match(plotPanelSource, /groupId/u);
});
