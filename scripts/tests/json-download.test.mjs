import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { downloadJsonPayload } from '../../src/game/views/components/base/jsonDownload.js';

test('keeps the object URL alive until the browser has accepted the JSON download', () => {
  const calls = [];
  const link = {
    click() { calls.push('click'); },
    remove() { calls.push('remove'); }
  };
  const browser = {
    Blob: class FakeBlob {},
    URL: {
      createObjectURL() {
        calls.push('create');
        return 'blob:story-export';
      },
      revokeObjectURL() {
        calls.push('revoke');
      }
    },
    document: {
      body: {
        appendChild() { calls.push('append'); }
      },
      createElement() { return link; }
    },
    setTimeout(callback) {
      calls.push('schedule-cleanup');
      callback();
    }
  };

  downloadJsonPayload({ title: '浮光掠影（都市）' }, '浮光掠影（都市）.json', browser);

  assert.deepEqual(calls, ['create', 'append', 'click', 'schedule-cleanup', 'remove', 'revoke']);
  assert.equal(link.download, '浮光掠影（都市）.json');
  assert.equal(link.href, 'blob:story-export');
});

test('story category export imports the outline node lookup it calls', () => {
  const componentSource = readFileSync(
    new URL('../../src/game/views/components/base/StoryMenuPanel.vue', import.meta.url),
    'utf8'
  );
  const exportImport = componentSource.match(
    /import\s*\{([\s\S]*?)\}\s*from ['\"]\.\.\/\.\.\/\.\.\/data\/story_outline\/storyOutlineExport['\"];/
  );

  assert.match(componentSource, /findOutlineNodeByKey\(props\.outline, layoutNode\.key\)/);
  assert.match(exportImport?.[1] ?? '', /\bfindOutlineNodeByKey\b/);
});