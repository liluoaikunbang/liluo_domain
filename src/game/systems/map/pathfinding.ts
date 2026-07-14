import type { createCollisionRuntime } from './collision';

type TilePosition = {
  tileX: number;
  tileY: number;
};

type TilePathNode = TilePosition & {
  steps: number;
};

type TilePathCost = {
  steps: number;
};

type TileTargetCandidate = TilePosition &
  TilePathCost & {
    distanceScore: number;
  };

type TileCollisionRuntime = ReturnType<typeof createCollisionRuntime>;

export function getTileKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

function rebuildPath(
  previous: Array<Array<TilePosition | null>>,
  targetTileX: number,
  targetTileY: number,
  startTileX: number,
  startTileY: number
): TilePosition[] {
  const path: TilePosition[] = [];
  let currentTileX = targetTileX;
  let currentTileY = targetTileY;

  while (!(currentTileX === startTileX && currentTileY === startTileY)) {
    path.push({ tileX: currentTileX, tileY: currentTileY });

    const previousTile = previous[currentTileY][currentTileX];

    if (!previousTile) {
      return [];
    }

    currentTileX = previousTile.tileX;
    currentTileY = previousTile.tileY;
  }

  path.reverse();
  return path;
}

function getTargetDistanceScore(
  tileX: number,
  tileY: number,
  targetTileX: number,
  targetTileY: number
): number {
  const deltaX = tileX - targetTileX;
  const deltaY = tileY - targetTileY;

  return deltaX * deltaX + deltaY * deltaY;
}

function isBetterFallbackTarget(
  candidate: TileTargetCandidate,
  currentBest: TileTargetCandidate | null
): boolean {
  if (!currentBest) {
    return true;
  }

  if (candidate.distanceScore !== currentBest.distanceScore) {
    return candidate.distanceScore < currentBest.distanceScore;
  }

  return candidate.steps < currentBest.steps;
}

function isValidFinalStop(
  tileX: number,
  tileY: number,
  options: {
    collisionRuntime: Pick<TileCollisionRuntime, 'isTileInBounds' | 'isTileWalkable'>;
    isTileAllowed: (tileX: number, tileY: number) => boolean;
  }
): boolean {
  const { collisionRuntime, isTileAllowed } = options;

  return (
    collisionRuntime.isTileInBounds(tileX, tileY) &&
    collisionRuntime.isTileWalkable(tileX, tileY) &&
    isTileAllowed(tileX, tileY)
  );
}

export function findTilePath(
  startTileX: number,
  startTileY: number,
  targetTileX: number,
  targetTileY: number,
  options: {
    mapWidth: number;
    mapHeight: number;
    collisionRuntime: Pick<TileCollisionRuntime, 'isTileInBounds' | 'isTileWalkable'>;
    eventTileKeys?: ReadonlySet<string>;
    isTileAllowed?: (tileX: number, tileY: number) => boolean;
  }
): TilePosition[] {
  const {
    mapWidth,
    mapHeight,
    collisionRuntime,
    isTileAllowed = () => true
  } = options;

  if (!collisionRuntime.isTileInBounds(startTileX, startTileY)) {
    return [];
  }

  if (startTileX === targetTileX && startTileY === targetTileY) {
    return [];
  }

  const canUseTargetAsFinalStop = isValidFinalStop(targetTileX, targetTileY, {
    collisionRuntime,
    isTileAllowed
  });

  const bestCost = Array.from({ length: mapHeight }, () =>
    Array.from({ length: mapWidth }, () => ({
      steps: Number.POSITIVE_INFINITY
    }))
  );
  const previous = Array.from({ length: mapHeight }, () =>
    Array.from({ length: mapWidth }, () => null as TilePosition | null)
  );
  const openList: TilePathNode[] = [
    {
      tileX: startTileX,
      tileY: startTileY,
      steps: 0
    }
  ];

  bestCost[startTileY][startTileX] = { steps: 0 };

  const directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];
  let fallbackTarget: TileTargetCandidate | null = null;

  while (openList.length > 0) {
    openList.sort((left, right) => {
      return left.steps - right.steps;
    });

    const current = openList.shift()!;
    const recordedCost: TilePathCost = bestCost[current.tileY][current.tileX];

    if (current.steps > recordedCost.steps) {
      continue;
    }

    if (
      canUseTargetAsFinalStop &&
      current.tileX === targetTileX &&
      current.tileY === targetTileY
    ) {
      return rebuildPath(previous, targetTileX, targetTileY, startTileX, startTileY);
    }

    if (
      !(current.tileX === startTileX && current.tileY === startTileY) &&
      isValidFinalStop(current.tileX, current.tileY, {
        collisionRuntime,
        isTileAllowed
      })
    ) {
      const candidate: TileTargetCandidate = {
        tileX: current.tileX,
        tileY: current.tileY,
        steps: current.steps,
        distanceScore: getTargetDistanceScore(current.tileX, current.tileY, targetTileX, targetTileY)
      };

      if (isBetterFallbackTarget(candidate, fallbackTarget)) {
        fallbackTarget = candidate;
      }
    }

    directions.forEach(({ x, y }) => {
      const nextTileX = current.tileX + x;
      const nextTileY = current.tileY + y;

      if (!collisionRuntime.isTileWalkable(nextTileX, nextTileY) || !isTileAllowed(nextTileX, nextTileY)) {
        return;
      }

      const nextSteps = current.steps + 1;
      const nextCost = bestCost[nextTileY][nextTileX];
      const isBetterPath = nextSteps < nextCost.steps;

      if (!isBetterPath) {
        return;
      }

      bestCost[nextTileY][nextTileX] = {
        steps: nextSteps
      };
      previous[nextTileY][nextTileX] = {
        tileX: current.tileX,
        tileY: current.tileY
      };
      openList.push({
        tileX: nextTileX,
        tileY: nextTileY,
        steps: nextSteps
      });
    });
  }

  if (fallbackTarget) {
    return rebuildPath(
      previous,
      fallbackTarget.tileX,
      fallbackTarget.tileY,
      startTileX,
      startTileY
    );
  }

  return [];
}
