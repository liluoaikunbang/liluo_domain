import { isKnownTransparentTileGid, shouldHideRuntimeTileLayer } from './runtimeMapNormalizer';
export { computeCameraLayout } from './cameraLayoutRules';
export type { MapViewportConfig, WorldBounds } from './cameraLayoutRules';

type WorldBounds = { x: number; y: number; width: number; height: number };

function getRenderableTileLayers(mapData: any): any[] {
  return (mapData.layers ?? []).filter(
    (layer: any) => layer.type === 'tilelayer' && layer.visible !== false && !shouldHideRuntimeTileLayer(layer)
  );
}

export function computeMapContentBounds(
  mapData: any,
  options: {
    mapWidth: number;
    mapHeight: number;
    tileSize: number;
  }
): WorldBounds {
  const { mapWidth, mapHeight, tileSize } = options;
  let minWorldX = Number.POSITIVE_INFINITY;
  let minWorldY = Number.POSITIVE_INFINITY;
  let maxWorldX = Number.NEGATIVE_INFINITY;
  let maxWorldY = Number.NEGATIVE_INFINITY;
  const mapWorldWidth = mapWidth * tileSize;
  const mapWorldHeight = mapHeight * tileSize;

  const includeWorldRect = (left: number, top: number, right: number, bottom: number): void => {
    minWorldX = Math.min(minWorldX, left);
    minWorldY = Math.min(minWorldY, top);
    maxWorldX = Math.max(maxWorldX, right);
    maxWorldY = Math.max(maxWorldY, bottom);
  };

  getRenderableTileLayers(mapData).forEach((layer: any) => {
    const layerData: number[] = layer?.data ?? [];

    layerData.forEach((tileGid, index) => {
      if (isKnownTransparentTileGid(mapData, tileGid)) {
        return;
      }

      const tileX = index % mapWidth;
      const tileY = Math.floor(index / mapWidth);
      includeWorldRect(tileX * tileSize, tileY * tileSize, (tileX + 1) * tileSize, (tileY + 1) * tileSize);
    });
  });

  (mapData.objects ?? []).forEach((object: any) => {
    const objectWidth = object.width ?? tileSize;
    const objectHeight = object.height ?? tileSize;
    const originX = object.originX ?? 0.5;
    const originY = object.originY ?? 0.5;
    const left = object.x - objectWidth * originX;
    const top = object.y - objectHeight * originY;

    includeWorldRect(left, top, left + objectWidth, top + objectHeight);
  });

  if (
    !Number.isFinite(minWorldX) ||
    !Number.isFinite(minWorldY) ||
    !Number.isFinite(maxWorldX) ||
    !Number.isFinite(maxWorldY)
  ) {
    return {
      x: 0,
      y: 0,
      width: mapWorldWidth,
      height: mapWorldHeight
    };
  }

  const paddedLeft = Math.max(0, minWorldX);
  const paddedTop = Math.max(0, minWorldY);
  const paddedRight = Math.min(mapWorldWidth, maxWorldX);
  const paddedBottom = Math.min(mapWorldHeight, maxWorldY);

  return {
    x: paddedLeft,
    y: paddedTop,
    width: Math.max(tileSize, paddedRight - paddedLeft),
    height: Math.max(tileSize, paddedBottom - paddedTop)
  };
}
