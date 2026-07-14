import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampWorldPointToVisionRadius,
  getTilePositionFromWorldPoint,
  isTileWithinVisionRadius
} from '../../src/game/systems/character/autoPathVision.ts';

test('keeps a clicked auto-path target unchanged when it is inside the vision radius', () => {
  const targetWorldPoint = clampWorldPointToVisionRadius({
    startWorldPosition: { x: 48, y: 48 },
    targetWorldPosition: { x: 80, y: 48 },
    tileSize: 32,
    visionLimit: { enabled: true, radiusInTiles: 2 }
  });

  assert.deepEqual(targetWorldPoint, { x: 80, y: 48 });
  assert.deepEqual(getTilePositionFromWorldPoint(targetWorldPoint, 32), { tileX: 2, tileY: 1 });
});

test('clamps a far clicked auto-path target to the edge of the visible radius', () => {
  const targetWorldPoint = clampWorldPointToVisionRadius({
    startWorldPosition: { x: 48, y: 48 },
    targetWorldPosition: { x: 400, y: 48 },
    tileSize: 32,
    visionLimit: { enabled: true, radiusInTiles: 2 }
  });

  assert.deepEqual(targetWorldPoint, { x: 112, y: 48 });
  assert.deepEqual(getTilePositionFromWorldPoint(targetWorldPoint, 32), { tileX: 3, tileY: 1 });
});

test('rejects auto-path tiles beyond the visible radius', () => {
  assert.equal(
    isTileWithinVisionRadius({
      tilePosition: { tileX: 3, tileY: 1 },
      startWorldPosition: { x: 48, y: 48 },
      tileSize: 32,
      visionLimit: { enabled: true, radiusInTiles: 2 }
    }),
    true
  );

  assert.equal(
    isTileWithinVisionRadius({
      tilePosition: { tileX: 4, tileY: 1 },
      startWorldPosition: { x: 48, y: 48 },
      tileSize: 32,
      visionLimit: { enabled: true, radiusInTiles: 2 }
    }),
    false
  );
});
