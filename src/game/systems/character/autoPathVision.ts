type WorldPosition = {
  x: number;
  y: number;
};

type TilePosition = {
  tileX: number;
  tileY: number;
};

export type AutoPathVisionLimit = {
  enabled: boolean;
  radiusInTiles: number;
};

const VISION_DISTANCE_EPSILON = 0.001;

function getVisionRadiusInPixels(visionLimit: AutoPathVisionLimit, tileSize: number): number {
  if (!visionLimit.enabled || !Number.isFinite(visionLimit.radiusInTiles) || visionLimit.radiusInTiles <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return visionLimit.radiusInTiles * tileSize;
}

export function clampWorldPointToVisionRadius(options: {
  startWorldPosition: WorldPosition;
  targetWorldPosition: WorldPosition;
  tileSize: number;
  visionLimit: AutoPathVisionLimit;
}): WorldPosition {
  const { startWorldPosition, targetWorldPosition, tileSize, visionLimit } = options;
  const radiusInPixels = getVisionRadiusInPixels(visionLimit, tileSize);

  if (!Number.isFinite(radiusInPixels)) {
    return targetWorldPosition;
  }

  const deltaX = targetWorldPosition.x - startWorldPosition.x;
  const deltaY = targetWorldPosition.y - startWorldPosition.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance <= radiusInPixels || distance <= 0) {
    return targetWorldPosition;
  }

  const scale = radiusInPixels / distance;

  return {
    x: startWorldPosition.x + deltaX * scale,
    y: startWorldPosition.y + deltaY * scale
  };
}

export function getTilePositionFromWorldPoint(worldPoint: WorldPosition, tileSize: number): TilePosition {
  return {
    tileX: Math.floor(worldPoint.x / tileSize),
    tileY: Math.floor(worldPoint.y / tileSize)
  };
}

export function isTileWithinVisionRadius(options: {
  tilePosition: TilePosition;
  startWorldPosition: WorldPosition;
  tileSize: number;
  visionLimit: AutoPathVisionLimit;
}): boolean {
  const { tilePosition, startWorldPosition, tileSize, visionLimit } = options;
  const radiusInPixels = getVisionRadiusInPixels(visionLimit, tileSize);

  if (!Number.isFinite(radiusInPixels)) {
    return true;
  }

  const tileCenterX = tilePosition.tileX * tileSize + tileSize / 2;
  const tileCenterY = tilePosition.tileY * tileSize + tileSize / 2;
  const deltaX = tileCenterX - startWorldPosition.x;
  const deltaY = tileCenterY - startWorldPosition.y;

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY) <= radiusInPixels + VISION_DISTANCE_EPSILON;
}
