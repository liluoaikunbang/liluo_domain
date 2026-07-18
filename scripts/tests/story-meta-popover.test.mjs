import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldOpenMetaPopoverRight } from '../../src/game/views/components/base/storyMetaPopover.js';

test('opens metadata to the right when the left side cannot fit it', () => {
  assert.equal(shouldOpenMetaPopoverRight(
    { left: 120, right: 174 },
    { left: 80, right: 900 },
    280
  ), true);
});

test('keeps metadata opening to the left when enough room remains', () => {
  assert.equal(shouldOpenMetaPopoverRight(
    { left: 500, right: 554 },
    { left: 80, right: 900 },
    280
  ), false);
});

test('chooses the side with more room when neither side fully fits', () => {
  assert.equal(shouldOpenMetaPopoverRight(
    { left: 210, right: 264 },
    { left: 80, right: 470 },
    280
  ), true);
});
