import * as Phaser from 'phaser';
import {
  getTilesetForTileGid,
  isKnownTransparentTileGid,
  shouldHideRuntimeTileLayer
} from '../runtimeMapNormalizer';
import { getForegroundLayerIndices } from '../foregroundTileOverlayRules';

type RenderTileLayersOptions = {
  tileSize: number;
  shouldSkipLayer?: (layer: any) => boolean;
  shouldSkipTile?: (options: {
    layer: any;
    tileGid: number;
    tileX: number;
    tileY: number;
    tileset: any;
  }) => boolean;
  playerDepth?: number;
  collisionMap?: number[][];
};

export function getRenderableTileLayers(mapData: any): any[] {
  return (mapData.layers ?? []).filter(
    (layer: any) => layer.type === 'tilelayer' && layer.visible !== false && !shouldHideRuntimeTileLayer(layer)
  );
}

export function getTilesetTextureKey(tileset: any): string {
  return String(tileset?.textureKey ?? tileset?.name ?? `tileset_${tileset?.firstgid ?? 'unknown'}`);
}

export function addMapTileImage(
  scene: Phaser.Scene,
  mapData: any,
  options: {
    tileGid: number;
    tileX: number;
    tileY: number;
    tileSize: number;
    depth?: number;
    alpha?: number;
  }
): Phaser.GameObjects.Image | null {
  const { tileGid, tileX, tileY, tileSize, depth, alpha } = options;
  const tileset = getTilesetForTileGid(mapData, tileGid);

  if (!tileset || !scene.textures.exists(getTilesetTextureKey(tileset))) {
    return null;
  }

  const image = scene.add.image(
    tileX * tileSize + tileSize / 2,
    tileY * tileSize + tileSize / 2,
    getTilesetTextureKey(tileset),
    tileGid - tileset.firstgid
  );
  image.setScale(tileSize / (tileset.tilewidth ?? 16));

  if (depth !== undefined) image.setDepth(depth);
  if (alpha !== undefined) image.setAlpha(alpha);

  return image;
}

export function renderTileLayers(
  scene: Phaser.Scene,
  mapData: any,
  options: RenderTileLayersOptions
): void {
  const { tileSize } = options;
  const mapWidth = mapData.width ?? 0;
  const mapHeight = mapData.height ?? 0;
  const renderableLayers = getRenderableTileLayers(mapData).filter(
    (layer: any) => !options.shouldSkipLayer?.(layer)
  );
  const foregroundLayerIndices = new Set(
    options.playerDepth === undefined
      ? []
      : getForegroundLayerIndices(
          renderableLayers.map((_layer: any, depth: number) => ({ depth })),
          options.playerDepth
        )
  );

  renderableLayers.forEach((layer: any, layerIndex: number) => {
    const layerData: number[] = layer?.data ?? [];

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileGid = layerData[y * mapWidth + x] ?? 0;

        if (isKnownTransparentTileGid(mapData, tileGid)) continue;

        const tileset = getTilesetForTileGid(mapData, tileGid);

        if (!tileset) {
          console.error(`[WorldScene] 图块 ${tileGid} 缺少可用图块集，图层 ${layer.name ?? 'unknown'} 已跳过该图块。`);
          continue;
        }

        if (options.shouldSkipTile?.({ layer, tileGid, tileX: x, tileY: y, tileset })) {
          continue;
        }

        if (!scene.textures.exists(getTilesetTextureKey(tileset))) {
          console.error(`[WorldScene] 图块 ${tileGid} 缺少可用纹理，图层 ${layer.name ?? 'unknown'} 已跳过该图块。`);
          continue;
        }

        addMapTileImage(scene, mapData, {
          tileGid,
          tileX: x,
          tileY: y,
          tileSize,
          depth:
            foregroundLayerIndices.has(layerIndex) && options.collisionMap?.[y]?.[x] !== 1
              ? options.playerDepth! - 0.5
              : layerIndex
        });
      }
    }
  });
}
