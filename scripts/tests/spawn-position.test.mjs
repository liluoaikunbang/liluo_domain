import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findNearestWalkableSpawnPosition,
  getFallbackPlayerSpawnPosition
} from '../../src/game/systems/map/spawnPositionRules.ts';

test('falls back to content center and finds the nearest walkable tile from map center', () => {
  assert.deepEqual(
    getFallbackPlayerSpawnPosition({
      mapContentBounds: { x: 64, y: 32, width: 192, height: 128 },
      mapWidth: 20,
      mapHeight: 10,
      tileSize: 32
    }),
    { x: 160, y: 96 }
  );

  const blockedTileKeys = new Set(['1,1', '1,0']);
  assert.deepEqual(
    findNearestWalkableSpawnPosition({
      mapWidth: 3,
      mapHeight: 3,
      collisionRuntime: {
        isTileInBounds: (x, y) => x >= 0 && y >= 0 && x < 3 && y < 3,
        isTileWalkable: (x, y) => !blockedTileKeys.has(`${x},${y}`),
        getTileCenterWorldPosition: (x, y) => ({ x: x * 32 + 16, y: y * 32 + 16 })
      }
    }),
    { x: 80, y: 48 }
  );
});
