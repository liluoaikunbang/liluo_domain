import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getForegroundLayerIndices,
  shouldRenderForegroundTileOverlay
} from '../../src/game/systems/map/foregroundTileOverlayRules.js';

test('only layers above the player render depth are foreground layers', () => {
  assert.deepEqual(
    getForegroundLayerIndices([
      { depth: 19 },
      { depth: 20 },
      { depth: 21 },
      { depth: 22 }
    ], 20),
    [2, 3]
  );
});

test('only non-empty, non-collision foreground tiles receive the transparent overlay', () => {
  assert.equal(shouldRenderForegroundTileOverlay({ tileGid: 42, isBlocked: false }), true);
  assert.equal(shouldRenderForegroundTileOverlay({ tileGid: 0, isBlocked: false }), false);
  assert.equal(shouldRenderForegroundTileOverlay({ tileGid: 42, isBlocked: true }), false);
});
