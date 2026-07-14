import test from 'node:test';
import assert from 'node:assert/strict';

import { findTilePath } from '../../src/game/systems/map/pathfinding.ts';

function createCollisionRuntime({ mapWidth, mapHeight, blockedTiles = [] }) {
  const blockedTileKeys = new Set(blockedTiles.map(([tileX, tileY]) => `${tileX},${tileY}`));

  return {
    isTileInBounds(tileX, tileY) {
      return tileX >= 0 && tileY >= 0 && tileX < mapWidth && tileY < mapHeight;
    },
    isTileWalkable(tileX, tileY) {
      return this.isTileInBounds(tileX, tileY) && !blockedTileKeys.has(`${tileX},${tileY}`);
    }
  };
}

test('routes to the nearest reachable tile when the clicked target tile is blocked', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3,
    blockedTiles: [[4, 1]]
  });

  const path = findTilePath(0, 1, 4, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime
  });

  assert.deepEqual(path, [
    { tileX: 1, tileY: 1 },
    { tileX: 2, tileY: 1 },
    { tileX: 3, tileY: 1 }
  ]);
});

test('routes to the nearest reachable map edge when the clicked target tile is outside the map', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3
  });

  const path = findTilePath(0, 1, 8, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime
  });

  assert.deepEqual(path, [
    { tileX: 1, tileY: 1 },
    { tileX: 2, tileY: 1 },
    { tileX: 3, tileY: 1 },
    { tileX: 4, tileY: 1 }
  ]);
});

test('routes to the nearest reachable map edge when the clicked target tile is before the map origin', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3
  });

  const path = findTilePath(4, 1, -3, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime
  });

  assert.deepEqual(path, [
    { tileX: 3, tileY: 1 },
    { tileX: 2, tileY: 1 },
    { tileX: 1, tileY: 1 },
    { tileX: 0, tileY: 1 }
  ]);
});

test('routes through empty tiles when collision does not block them', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3
  });

  const path = findTilePath(0, 1, 4, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime
  });

  assert.deepEqual(path, [
    { tileX: 1, tileY: 1 },
    { tileX: 2, tileY: 1 },
    { tileX: 3, tileY: 1 },
    { tileX: 4, tileY: 1 }
  ]);
});

test('routes to the nearest reachable tile when the clicked target tile is walkable but unreachable', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 5,
    blockedTiles: [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [2, 4]
    ]
  });

  const path = findTilePath(0, 0, 4, 4, {
    mapWidth: 5,
    mapHeight: 5,
    collisionRuntime
  });

  assert.deepEqual(path.at(-1), { tileX: 1, tileY: 4 });
});

test('routes onto a manual event tile when the clicked target is walkable', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3
  });

  const path = findTilePath(0, 1, 2, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime,
    eventTileKeys: new Set(['2,1'])
  });

  assert.deepEqual(path, [
    { tileX: 1, tileY: 1 },
    { tileX: 2, tileY: 1 }
  ]);
});

test('does not detour around manual event tiles when they are walkable', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3
  });

  const path = findTilePath(0, 1, 4, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime,
    eventTileKeys: new Set(['1,1', '2,1', '3,1'])
  });

  assert.deepEqual(path, [
    { tileX: 1, tileY: 1 },
    { tileX: 2, tileY: 1 },
    { tileX: 3, tileY: 1 },
    { tileX: 4, tileY: 1 }
  ]);
});

test('returns an empty path when the blocked target has no reachable fallback tile', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 3,
    mapHeight: 3,
    blockedTiles: [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2]
    ]
  });

  const path = findTilePath(0, 0, 1, 1, {
    mapWidth: 3,
    mapHeight: 3,
    collisionRuntime
  });

  assert.deepEqual(path, []);
});

test('does not route to a fallback tile outside an explicit tile allowance', () => {
  const collisionRuntime = createCollisionRuntime({
    mapWidth: 5,
    mapHeight: 3,
    blockedTiles: [[2, 1]]
  });

  const path = findTilePath(0, 1, 2, 1, {
    mapWidth: 5,
    mapHeight: 3,
    collisionRuntime,
    isTileAllowed: (tileX) => tileX <= 2
  });

  assert.deepEqual(path, [
    { tileX: 1, tileY: 1 }
  ]);
});
