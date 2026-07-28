export type WorldBounds = { x: number; y: number; width: number; height: number };
export type WorldPosition = { x: number; y: number };

type WalkableTileRuntime = {
  isTileInBounds: (tileX: number, tileY: number) => boolean;
  isTileWalkable: (tileX: number, tileY: number) => boolean;
  getTileCenterWorldPosition: (tileX: number, tileY: number) => WorldPosition;
};

export function getFallbackPlayerSpawnPosition(options: {
  mapContentBounds: WorldBounds;
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
}): WorldPosition {
  const { mapContentBounds, mapWidth, mapHeight, tileSize } = options;
  const displayBounds = mapContentBounds.width > 0 && mapContentBounds.height > 0
    ? mapContentBounds
    : { x: 0, y: 0, width: mapWidth * tileSize, height: mapHeight * tileSize };

  return {
    x: displayBounds.x + displayBounds.width / 2,
    y: displayBounds.y + displayBounds.height / 2
  };
}

export function findNearestWalkableSpawnPosition(options: {
  mapWidth: number;
  mapHeight: number;
  collisionRuntime: WalkableTileRuntime;
}): WorldPosition | null {
  const { mapWidth, mapHeight, collisionRuntime } = options;

  if (mapWidth <= 0 || mapHeight <= 0) {
    return null;
  }

  const startTileX = Math.floor(mapWidth / 2);
  const startTileY = Math.floor(mapHeight / 2);

  if (collisionRuntime.isTileWalkable(startTileX, startTileY)) {
    return collisionRuntime.getTileCenterWorldPosition(startTileX, startTileY);
  }

  const queue: Array<{ tileX: number; tileY: number }> = [{ tileX: startTileX, tileY: startTileY }];
  const visited = new Set<string>([`${startTileX},${startTileY}`]);
  const directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const direction of directions) {
      const nextTileX = current.tileX + direction.x;
      const nextTileY = current.tileY + direction.y;
      const nextKey = `${nextTileX},${nextTileY}`;

      if (!collisionRuntime.isTileInBounds(nextTileX, nextTileY) || visited.has(nextKey)) {
        continue;
      }

      if (collisionRuntime.isTileWalkable(nextTileX, nextTileY)) {
        return collisionRuntime.getTileCenterWorldPosition(nextTileX, nextTileY);
      }

      visited.add(nextKey);
      queue.push({ tileX: nextTileX, tileY: nextTileY });
    }
  }

  return null;
}
