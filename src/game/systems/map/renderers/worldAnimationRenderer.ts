import * as Phaser from 'phaser';
import { type GameAnimationDefinition } from '../../../data/animations';
import { getMapRegistryEntry } from '../../../data/registry';
import { getMapObject, getTileLayer, getTilesetForTileGid } from '../runtimeMapNormalizer';

type WorldAnimationPlacement = {
  x: number;
  y: number;
  scale: number;
  depth: number;
  originX: number;
  originY: number;
};

function getCurrentMapAnimationDefinitions(mapId: string): GameAnimationDefinition[] {
  return getMapRegistryEntry(mapId)?.animations ?? [];
}

function getTilesetTextureKey(tileset: any): string {
  return String(tileset?.textureKey ?? tileset?.name ?? `tileset_${tileset?.firstgid ?? 'unknown'}`);
}

function getAnimationPlacementFromLayer(
  mapData: any,
  definition: GameAnimationDefinition,
  tileSize: number
): WorldAnimationPlacement | undefined {
  const layerName = definition.worldObject?.layerName;

  if (!layerName) {
    return undefined;
  }

  const targetLayer = getTileLayer(mapData, layerName);

  if (!targetLayer) {
    return undefined;
  }

  const layerData: number[] = targetLayer.data ?? [];
  const layerWidth = targetLayer.width ?? mapData.width ?? 0;
  let minTileX = Number.POSITIVE_INFINITY;
  let minTileY = Number.POSITIVE_INFINITY;
  let maxTileX = Number.NEGATIVE_INFINITY;
  let maxTileY = Number.NEGATIVE_INFINITY;
  let sampleGid: number | undefined;

  layerData.forEach((gid, index) => {
    if (gid <= 0) {
      return;
    }

    const tileset = getTilesetForTileGid(mapData, gid);

    if (!tileset || getTilesetTextureKey(tileset) !== definition.textureKey) {
      return;
    }

    const tileX = index % layerWidth;
    const tileY = Math.floor(index / layerWidth);
    minTileX = Math.min(minTileX, tileX);
    minTileY = Math.min(minTileY, tileY);
    maxTileX = Math.max(maxTileX, tileX);
    maxTileY = Math.max(maxTileY, tileY);
    sampleGid ??= gid;
  });

  if (
    !Number.isFinite(minTileX) ||
    !Number.isFinite(minTileY) ||
    !Number.isFinite(maxTileX) ||
    !Number.isFinite(maxTileY)
  ) {
    return undefined;
  }

  const tileset = sampleGid ? getTilesetForTileGid(mapData, sampleGid) : undefined;
  const tileSpanWidth = maxTileX - minTileX + 1;
  const tileSpanHeight = maxTileY - minTileY + 1;
  const scaleFromTileset = tileSize / (tileset?.tilewidth ?? 16);

  return {
    x: (minTileX + tileSpanWidth / 2) * tileSize,
    y: (minTileY + tileSpanHeight / 2) * tileSize,
    scale: definition.worldObject?.scale ?? scaleFromTileset,
    depth: definition.worldObject?.depth ?? 8,
    originX: definition.worldObject?.originX ?? 0.5,
    originY: definition.worldObject?.originY ?? 0.5
  };
}

function getAnimationWorldPlacement(
  mapData: any,
  definition: GameAnimationDefinition,
  tileSize: number
): WorldAnimationPlacement | undefined {
  const objectName = definition.worldObject?.objectName;

  if (objectName) {
    const worldObject = getMapObject(mapData, objectName);

    if (worldObject) {
      return {
        x: worldObject.x,
        y: worldObject.y,
        scale: worldObject.scale ?? definition.worldObject?.scale ?? 1,
        depth: worldObject.depth ?? definition.worldObject?.depth ?? 8,
        originX: worldObject.originX ?? definition.worldObject?.originX ?? 0.5,
        originY: worldObject.originY ?? definition.worldObject?.originY ?? 0.5
      };
    }
  }

  return getAnimationPlacementFromLayer(mapData, definition, tileSize);
}

export function shouldHideAnimatedSourceLayer(
  scene: Phaser.Scene,
  layer: any,
  mapId: string
): boolean {
  const normalizedLayerName = String(layer?.name ?? '').trim().toLowerCase();

  return getCurrentMapAnimationDefinitions(mapId).some((definition) => {
    const worldObject = definition.worldObject;

    return Boolean(
      worldObject?.hideSourceLayer &&
        worldObject.layerName &&
        scene.anims.exists(definition.key) &&
        worldObject.layerName.trim().toLowerCase() === normalizedLayerName
    );
  });
}

export function renderWorldAnimations(scene: Phaser.Scene, mapData: any, mapId: string): void {
  const tileSize = mapData.tilewidth ?? mapData.tileheight ?? 32;

  getCurrentMapAnimationDefinitions(mapId).forEach((definition) => {
    if (!definition.worldObject || !scene.anims.exists(definition.key)) {
      return;
    }

    const placement = getAnimationWorldPlacement(mapData, definition, tileSize);

    if (!placement) {
      return;
    }

    const sprite = scene.add
      .sprite(placement.x, placement.y, definition.textureKey)
      .setOrigin(placement.originX, placement.originY)
      .setDepth(placement.depth)
      .setScale(placement.scale);

    sprite.play(definition.key);
  });
}