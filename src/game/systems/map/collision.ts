import * as Phaser from 'phaser';
import { getTileLayer } from './runtimeMapNormalizer';

function buildCollisionMap(mapData: any, mapWidth: number, mapHeight: number): number[][] {
  const collisionLayer = getTileLayer(mapData, 'collision');
  const collisionTileData: number[] = collisionLayer?.data ?? [];
  const collisionMap: number[][] = [];

  for (let y = 0; y < mapHeight; y++) {
    collisionMap[y] = [];

    for (let x = 0; x < mapWidth; x++) {
      const tileIndex = collisionTileData[y * mapWidth + x] ?? 0;
      collisionMap[y][x] = tileIndex > 0 ? 1 : 0;
    }
  }

  return collisionMap;
}

function buildBlockingRects(mapData: any, collisionMap: number[][], tileSize: number): Phaser.Geom.Rectangle[] {
  const blockingRects: Phaser.Geom.Rectangle[] = [];
  const blockingObjects = (mapData.objects ?? []).filter((object: any) => object.blocksMovement);

  blockingObjects.forEach((object: any) => {
    if (object.collisionWidth && object.collisionHeight) {
      blockingRects.push(
        new Phaser.Geom.Rectangle(
          object.x - object.collisionWidth / 2 + (object.collisionOffsetX ?? 0),
          object.y - object.collisionHeight + (object.collisionOffsetY ?? 0),
          object.collisionWidth,
          object.collisionHeight
        )
      );
      return;
    }

    const tileX = Math.floor(object.x / tileSize);
    const tileY = Math.floor(object.y / tileSize);

    if (tileY >= 0 && tileY < collisionMap.length && tileX >= 0 && tileX < (collisionMap[0]?.length ?? 0)) {
      collisionMap[tileY][tileX] = 1;
    }
  });

  return blockingRects;
}

export function createCollisionRuntime(
  mapData: any,
  options: {
    mapWidth: number;
    mapHeight: number;
    tileSize: number;
    playerCollisionBox: {
      width: number;
      height: number;
      offsetY: number;
    };
  }
): {
  collisionMap: number[][];
  blockingRects: Phaser.Geom.Rectangle[];
  isTileInBounds: (tileX: number, tileY: number) => boolean;
  getTileCenterWorldPosition: (tileX: number, tileY: number) => { x: number; y: number };
  checkCollision: (x: number, y: number) => boolean;
  isTileWalkable: (tileX: number, tileY: number) => boolean;
} {
  const { mapWidth, mapHeight, tileSize, playerCollisionBox } = options;
  const collisionMap = buildCollisionMap(mapData, mapWidth, mapHeight);
  const blockingRects = buildBlockingRects(mapData, collisionMap, tileSize);

  const isTileInBounds = (tileX: number, tileY: number): boolean => {
    return tileX >= 0 && tileY >= 0 && tileX < mapWidth && tileY < mapHeight;
  };

  const getTileCenterWorldPosition = (tileX: number, tileY: number): { x: number; y: number } => {
    return {
      x: tileX * tileSize + tileSize / 2,
      y: tileY * tileSize + tileSize / 2
    };
  };

  const getPlayerCollisionBounds = (x: number, y: number): Phaser.Geom.Rectangle => {
    return new Phaser.Geom.Rectangle(
      x - playerCollisionBox.width / 2,
      y - playerCollisionBox.height / 2 + playerCollisionBox.offsetY,
      playerCollisionBox.width,
      playerCollisionBox.height
    );
  };

  const checkCollision = (x: number, y: number): boolean => {
    const playerBounds = getPlayerCollisionBounds(x, y);
    const corners = [
      { x: playerBounds.left, y: playerBounds.top },
      { x: playerBounds.right, y: playerBounds.top },
      { x: playerBounds.left, y: playerBounds.bottom },
      { x: playerBounds.right, y: playerBounds.bottom }
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x / tileSize);
      const tileY = Math.floor(corner.y / tileSize);

      if (tileY < 0 || tileY >= collisionMap.length || tileX < 0 || tileX >= (collisionMap[0]?.length ?? 0)) {
        return true;
      }

      if (collisionMap[tileY][tileX] === 1) {
        return true;
      }
    }

    return blockingRects.some((rect) => Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, rect));
  };

  const isTileWalkable = (tileX: number, tileY: number): boolean => {
    if (!isTileInBounds(tileX, tileY)) {
      return false;
    }

    const worldPosition = getTileCenterWorldPosition(tileX, tileY);
    return !checkCollision(worldPosition.x, worldPosition.y);
  };

  return {
    collisionMap,
    blockingRects,
    isTileInBounds,
    getTileCenterWorldPosition,
    checkCollision,
    isTileWalkable
  };
}
