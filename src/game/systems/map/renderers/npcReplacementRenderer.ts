import type * as Phaser from 'phaser';
import {
  getPlayerCharacterDefinition,
  getPlayerCharacterFrameTextureKey
} from '../../../data/playerCharacter.ts';
import type { GameMapNpcReplacementConfig } from '../../../data/registry.ts';
import { getLayeredCharacterTextureAnchor } from '../../animation/character/layeredCharacterTexture.ts';

interface TilePosition {
  tileX: number;
  tileY: number;
}

export interface NpcReplacementPlacement {
  x: number;
  y: number;
  minTileX: number;
  minTileY: number;
  maxTileX: number;
  maxTileY: number;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function getTilesetTextureKey(tileset: any): string {
  return String(tileset?.textureKey ?? tileset?.name ?? `tileset_${tileset?.firstgid ?? 'unknown'}`);
}

function getTileLayer(mapData: any, layerName: string): any | undefined {
  const normalizedLayerName = normalizeName(layerName);

  return mapData.layers?.find(
    (layer: any) =>
      layer.type === 'tilelayer' &&
      normalizeName(String(layer.name ?? '')) === normalizedLayerName
  );
}

function getTilesetForTileGid(mapData: any, gid: number): any | undefined {
  if (gid <= 0) {
    return undefined;
  }

  const tilesets = [...(mapData.tilesets ?? [])].sort((a: any, b: any) => b.firstgid - a.firstgid);
  return tilesets.find((tileset: any) => gid >= tileset.firstgid);
}

function isTileMatchedByNpcReplacement(
  npcReplacements: readonly GameMapNpcReplacementConfig[],
  layer: any,
  tileset: any
): boolean {
  const normalizedLayerName = normalizeName(String(layer?.name ?? ''));
  const textureKey = getTilesetTextureKey(tileset);

  return npcReplacements.some((rule) => {
    if (normalizeName(rule.layerName) !== normalizedLayerName) {
      return false;
    }

    return !rule.sourceTextureKey || rule.sourceTextureKey === textureKey;
  });
}

export function shouldSkipNpcReplacementSourceTile(options: {
  npcReplacements: readonly GameMapNpcReplacementConfig[];
  layer: any;
  tileset: any;
}): boolean {
  return isTileMatchedByNpcReplacement(options.npcReplacements, options.layer, options.tileset);
}

function findConnectedTileGroups(tiles: readonly TilePosition[]): TilePosition[][] {
  const remainingTiles = new Set(tiles.map((tile) => `${tile.tileX},${tile.tileY}`));
  const tileByKey = new Map(tiles.map((tile) => [`${tile.tileX},${tile.tileY}`, tile]));
  const groups: TilePosition[][] = [];

  tiles.forEach((startTile) => {
    const startKey = `${startTile.tileX},${startTile.tileY}`;

    if (!remainingTiles.has(startKey)) {
      return;
    }

    const group: TilePosition[] = [];
    const queue = [startTile];
    remainingTiles.delete(startKey);

    while (queue.length > 0) {
      const currentTile = queue.shift()!;
      group.push(currentTile);

      [
        { tileX: currentTile.tileX + 1, tileY: currentTile.tileY },
        { tileX: currentTile.tileX - 1, tileY: currentTile.tileY },
        { tileX: currentTile.tileX, tileY: currentTile.tileY + 1 },
        { tileX: currentTile.tileX, tileY: currentTile.tileY - 1 }
      ].forEach((nextTile) => {
        const nextKey = `${nextTile.tileX},${nextTile.tileY}`;

        if (!remainingTiles.has(nextKey)) {
          return;
        }

        remainingTiles.delete(nextKey);
        queue.push(tileByKey.get(nextKey)!);
      });
    }

    groups.push(group);
  });

  return groups;
}

export function resolveNpcReplacementPlacements(
  mapData: any,
  rule: GameMapNpcReplacementConfig,
  tileSize: number
): NpcReplacementPlacement[] {
  const layer = getTileLayer(mapData, rule.layerName);
  const layerData: number[] = layer?.data ?? [];
  const layerWidth = layer?.width ?? mapData.width ?? 0;

  if (!layer || layerWidth <= 0 || layerData.length === 0) {
    return [];
  }

  const matchedTiles = layerData.flatMap((tileGid, index) => {
    if ((tileGid ?? 0) <= 0) {
      return [];
    }

    const tileset = getTilesetForTileGid(mapData, tileGid);

    if (!tileset) {
      return [];
    }

    const textureKey = getTilesetTextureKey(tileset);

    if (rule.sourceTextureKey && rule.sourceTextureKey !== textureKey) {
      return [];
    }

    return {
      tileX: index % layerWidth,
      tileY: Math.floor(index / layerWidth)
    };
  });

  return findConnectedTileGroups(matchedTiles).map((group) => {
    const minTileX = Math.min(...group.map((tile) => tile.tileX));
    const minTileY = Math.min(...group.map((tile) => tile.tileY));
    const maxTileX = Math.max(...group.map((tile) => tile.tileX));
    const maxTileY = Math.max(...group.map((tile) => tile.tileY));

    return {
      x: (minTileX + maxTileX + 1) * tileSize / 2,
      y: (maxTileY + 1) * tileSize,
      minTileX,
      minTileY,
      maxTileX,
      maxTileY
    };
  });
}

export function resolveNpcReplacementScale(options: {
  characterScale: number;
  mapCharacterScale?: number;
  ruleScale?: number;
}): number {
  return options.characterScale * (options.mapCharacterScale ?? 1) * (options.ruleScale ?? 1);
}

export function renderNpcReplacements(
  scene: Phaser.Scene,
  mapData: any,
  npcReplacements: readonly GameMapNpcReplacementConfig[],
  options: {
    mapCharacterScale?: number;
  } = {}
): void {
  const tileSize = mapData.tilewidth ?? mapData.tileheight ?? 32;

  npcReplacements.forEach((rule) => {
    const characterDefinition = getPlayerCharacterDefinition(rule.appearanceId);
    const textureKey = getPlayerCharacterFrameTextureKey(rule.appearanceId, rule.direction, rule.state ?? 'idle');

    if (!characterDefinition || !textureKey) {
      console.error(`[NpcReplacementRenderer] 未找到 NPC 替换外观 ${rule.appearanceId}。`);
      return;
    }

    if (!scene.textures.exists(textureKey)) {
      console.error(`[NpcReplacementRenderer] NPC 替换纹理 ${textureKey} 尚未加载。`);
      return;
    }

    resolveNpcReplacementPlacements(mapData, rule, tileSize).forEach((placement) => {
      const image = scene.add.image(placement.x, placement.y, textureKey);
      const anchor = getLayeredCharacterTextureAnchor(textureKey);

      if (anchor) {
        image.setDisplayOrigin(anchor.x, anchor.y);
      } else if (characterDefinition.displayOriginY !== undefined) {
        image.setDisplayOrigin(image.displayOriginX, characterDefinition.displayOriginY);
      } else {
        image.setOrigin(0.5, 1);
      }

      image
        .setScale(resolveNpcReplacementScale({
          characterScale: characterDefinition.scale,
          mapCharacterScale: options.mapCharacterScale,
          ruleScale: rule.scale
        }))
        .setDepth(rule.depth ?? 12);
    });
  });
}
