import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const viewSource = readFileSync(
  new URL('../../src/game/views/modes/direction-pad/GameDirectionPadView.vue', import.meta.url),
  'utf8'
);

test('direction pad view uses a single keydown listener path', () => {
  assert.equal(viewSource.includes('@keydown="handleKeyDown"'), false);
  assert.equal(viewSource.match(/addEventListener\('keydown', handleKeyDown\)/g)?.length, 1);
  assert.equal(viewSource.match(/removeEventListener\('keydown', handleKeyDown\)/g)?.length, 1);
});
