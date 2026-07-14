import * as Phaser from 'phaser';

type TilePosition = {
  tileX: number;
  tileY: number;
};

type WorldPosition = {
  x: number;
  y: number;
};

function isSameDirection(
  previousPoint: WorldPosition,
  currentPoint: WorldPosition,
  nextPoint: WorldPosition
): boolean {
  const previousDeltaX = currentPoint.x - previousPoint.x;
  const previousDeltaY = currentPoint.y - previousPoint.y;
  const nextDeltaX = nextPoint.x - currentPoint.x;
  const nextDeltaY = nextPoint.y - currentPoint.y;

  return (
    Math.sign(previousDeltaX) === Math.sign(nextDeltaX) &&
    Math.sign(previousDeltaY) === Math.sign(nextDeltaY)
  );
}

function collapseStraightPathPoints(points: WorldPosition[]): WorldPosition[] {
  if (points.length <= 2) {
    return points;
  }

  const collapsedPoints: WorldPosition[] = [points[0]];

  for (let index = 1; index < points.length - 1; index++) {
    const previousPoint = points[index - 1];
    const currentPoint = points[index];
    const nextPoint = points[index + 1];

    if (isSameDirection(previousPoint, currentPoint, nextPoint)) {
      continue;
    }

    collapsedPoints.push(currentPoint);
  }

  collapsedPoints.push(points[points.length - 1]);
  return collapsedPoints;
}

function drawDashedPath(
  graphics: Phaser.GameObjects.Graphics,
  points: WorldPosition[]
): void {
  if (points.length < 2) {
    return;
  }

  const collapsedPoints = collapseStraightPathPoints(points);
  const dashLength = 28;
  const gapLength = 18;

  graphics.lineStyle(4, 0xb8b8b8, 0.72);

  for (let index = 0; index < collapsedPoints.length - 1; index++) {
    const startPoint = collapsedPoints[index];
    const endPoint = collapsedPoints[index + 1];
    const distance = Phaser.Math.Distance.Between(startPoint.x, startPoint.y, endPoint.x, endPoint.y);

    if (distance <= 0) {
      continue;
    }

    const angle = Phaser.Math.Angle.Between(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    let travelled = 0;

    while (travelled < distance) {
      const dashStart = travelled;
      const dashEnd = Math.min(travelled + dashLength, distance);
      const segmentStartX = startPoint.x + Math.cos(angle) * dashStart;
      const segmentStartY = startPoint.y + Math.sin(angle) * dashStart;
      const segmentEndX = startPoint.x + Math.cos(angle) * dashEnd;
      const segmentEndY = startPoint.y + Math.sin(angle) * dashEnd;

      graphics.beginPath();
      graphics.moveTo(segmentStartX, segmentStartY);
      graphics.lineTo(segmentEndX, segmentEndY);
      graphics.strokePath();

      travelled += dashLength + gapLength;
    }
  }
}

export function clearPlayerPathPreview(graphics?: Phaser.GameObjects.Graphics | null): void {
  graphics?.clear();
}

export function renderPlayerPathPreview(
  graphics: Phaser.GameObjects.Graphics | null | undefined,
  options: {
    playerPosition: WorldPosition;
    autoPath: TilePosition[];
    getTileCenterWorldPosition: (tileX: number, tileY: number) => WorldPosition;
  }
): void {
  if (!graphics) {
    return;
  }

  clearPlayerPathPreview(graphics);

  if (options.autoPath.length === 0) {
    return;
  }

  const points = [
    options.playerPosition,
    ...options.autoPath.map((tile) =>
      options.getTileCenterWorldPosition(tile.tileX, tile.tileY)
    )
  ];

  drawDashedPath(graphics, points);
}