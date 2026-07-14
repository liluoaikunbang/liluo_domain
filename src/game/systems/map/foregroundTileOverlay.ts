import * as Phaser from 'phaser';
import {
  getTilesetForTileGid,
  isKnownTransparentTileGid
} from './runtimeMapNormalizer';
import {
  addMapTileImage,
  getRenderableTileLayers
} from './renderers/tileLayerRenderer';
import {
  getForegroundLayerIndices,
  shouldRenderForegroundTileOverlay
} from './foregroundTileOverlayRules';

const FOREGROUND_OVERLAY_ALPHA = 0.5;

export function createForegroundTileOverlay(options: {
  scene: Phaser.Scene;
  mapData: any;
  tileSize: number;
  player: Phaser.GameObjects.Sprite;
  playerDepth: number;
  collisionMap: number[][];
  shouldSkipLayer?: (layer: any) => boolean;
  shouldSkipTile?: (options: {
    layer: any;
    tileGid: number;
    tileX: number;
    tileY: number;
    tileset: any;
  }) => boolean;
}): { update: () => void; destroy: () => void } {
  const { scene, mapData, tileSize, player, playerDepth, collisionMap, shouldSkipLayer, shouldSkipTile } = options;
  const layers = getRenderableTileLayers(mapData).filter((layer) => !shouldSkipLayer?.(layer));
  const foregroundLayerIndices = new Set(
    getForegroundLayerIndices(layers.map((_layer, depth) => ({ depth })), playerDepth)
  );

  if (foregroundLayerIndices.size === 0) {
    return { update: () => {}, destroy: () => {} };
  }

  const overlayContainer = scene.add.container(0, 0).setDepth(playerDepth + 1);
  const maskGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  overlayContainer.setMask(maskGraphics.createGeometryMask());
  const mapWidth = mapData.width ?? 0;
  const mapHeight = mapData.height ?? 0;

  layers.forEach((layer, layerIndex) => {
    if (!foregroundLayerIndices.has(layerIndex)) return;

    const layerData: number[] = layer.data ?? [];

    for (let tileY = 0; tileY < mapHeight; tileY++) {
      for (let tileX = 0; tileX < mapWidth; tileX++) {
        const tileGid = layerData[tileY * mapWidth + tileX] ?? 0;
        const isBlocked = collisionMap[tileY]?.[tileX] === 1;

        const tileset = getTilesetForTileGid(mapData, tileGid);

        if (
          !shouldRenderForegroundTileOverlay({ tileGid, isBlocked }) ||
          isKnownTransparentTileGid(mapData, tileGid) ||
          !tileset ||
          shouldSkipTile?.({ layer, tileGid, tileX, tileY, tileset })
        ) {
          continue;
        }

        const image = addMapTileImage(scene, mapData, {
          tileGid,
          tileX,
          tileY,
          tileSize,
          alpha: FOREGROUND_OVERLAY_ALPHA
        });

        if (image) overlayContainer.add(image);
      }
    }
  });

  const update = (): void => {
    const playerBounds = player.getBounds();
    maskGraphics.clear();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);
  };

  update();

  return {
    update,
    destroy: () => {
      overlayContainer.clearMask(true);
      overlayContainer.destroy(true);
      maskGraphics.destroy();
    }
  };
}
