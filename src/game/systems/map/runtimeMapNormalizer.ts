import { getMapRegistryEntry, type GameMapTilesetRenderConfig } from '../../data/registry';

function normalizeLayerName(layerName: string): string {
  return layerName.trim().toLowerCase();
}

export function isEventMarkerLayerName(layerName: string): boolean {
  return normalizeLayerName(layerName).endsWith('_event');
}

export function shouldHideRuntimeTileLayer(layer: any): boolean {
  if (layer?.type !== 'tilelayer') {
    return false;
  }

  const normalizedLayerName = normalizeLayerName(String(layer?.name ?? ''));
  return normalizedLayerName === 'collision';
}

function getChunkedMapBounds(mapData: any): {
  minTileX: number;
  minTileY: number;
  width: number;
  height: number;
} {
  let minTileX = 0;
  let minTileY = 0;
  let maxTileX = mapData.width ?? 0;
  let maxTileY = mapData.height ?? 0;
  let hasChunk = false;

  (mapData.layers ?? []).forEach((layer: any) => {
    (layer.chunks ?? []).forEach((chunk: any) => {
      hasChunk = true;
      minTileX = Math.min(minTileX, chunk.x ?? 0);
      minTileY = Math.min(minTileY, chunk.y ?? 0);
      maxTileX = Math.max(maxTileX, (chunk.x ?? 0) + (chunk.width ?? 0));
      maxTileY = Math.max(maxTileY, (chunk.y ?? 0) + (chunk.height ?? 0));
    });
  });

  if (!hasChunk) {
    return {
      minTileX: 0,
      minTileY: 0,
      width: mapData.width ?? 0,
      height: mapData.height ?? 0
    };
  }

  return {
    minTileX,
    minTileY,
    width: Math.max(0, maxTileX - minTileX),
    height: Math.max(0, maxTileY - minTileY)
  };
}

function flattenTileLayerData(
  layer: any,
  mapWidth: number,
  mapHeight: number,
  originTileX: number,
  originTileY: number
): number[] {
  if (Array.isArray(layer?.data) && layer.data.length > 0) {
    return layer.data;
  }

  const flattenedData = Array.from({ length: mapWidth * mapHeight }, () => 0);

  (layer?.chunks ?? []).forEach((chunk: any) => {
    const chunkData: number[] = chunk.data ?? [];
    const chunkWidth = chunk.width ?? 0;
    const chunkHeight = chunk.height ?? 0;
    const startTileX = (chunk.x ?? 0) - originTileX;
    const startTileY = (chunk.y ?? 0) - originTileY;

    for (let y = 0; y < chunkHeight; y++) {
      for (let x = 0; x < chunkWidth; x++) {
        const targetTileX = startTileX + x;
        const targetTileY = startTileY + y;

        if (targetTileX < 0 || targetTileY < 0 || targetTileX >= mapWidth || targetTileY >= mapHeight) {
          continue;
        }

        flattenedData[targetTileY * mapWidth + targetTileX] = chunkData[y * chunkWidth + x] ?? 0;
      }
    }
  });

  return flattenedData;
}

function getConfiguredTilesetEntry(mapId: string, tileset: any): GameMapTilesetRenderConfig | undefined {
  const tilesetEntries = getMapRegistryEntry(mapId)?.worldRender?.tilesets;

  if (!tilesetEntries || tilesetEntries.length === 0) {
    return undefined;
  }

  const tilesetName = String(tileset?.name ?? '').trim().toLowerCase();
  const tilesetImage = String(tileset?.image ?? '').trim().toLowerCase();

  const exactNameMatchedEntry = tilesetEntries.find((entry) => {
    const matchName = entry.match?.name?.trim().toLowerCase();
    return Boolean(matchName) && tilesetName === matchName;
  });

  if (exactNameMatchedEntry) {
    return exactNameMatchedEntry;
  }

  const imageMatchedEntries = tilesetEntries
    .map((entry) => {
      const matchedIncludes = (entry.match?.imageIncludes ?? [])
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0 && tilesetImage.includes(value));

      return {
        entry,
        matchedLength: matchedIncludes.reduce((maxLength, value) => Math.max(maxLength, value.length), 0)
      };
    })
    .filter((candidate) => candidate.matchedLength > 0)
    .sort((left, right) => right.matchedLength - left.matchedLength);

  return imageMatchedEntries[0]?.entry;
}

function resolveTilesetTextureKey(mapId: string, tileset: any): string {
  const explicitTextureKey = tileset?.textureKey;

  if (explicitTextureKey) {
    return explicitTextureKey;
  }

  const configuredTileset = getConfiguredTilesetEntry(mapId, tileset);

  if (configuredTileset?.textureKey) {
    return configuredTileset.textureKey;
  }

  return String(tileset?.name ?? `tileset_${tileset?.firstgid ?? 'unknown'}`);
}

export function getTilesetForTileGid(mapData: any, gid: number): any | undefined {
  if (gid <= 0) {
    return undefined;
  }

  const tilesets = [...(mapData.tilesets ?? [])].sort((a: any, b: any) => b.firstgid - a.firstgid);
  return tilesets.find((tileset: any) => gid >= tileset.firstgid);
}

export function isKnownTransparentTileGid(mapData: any, gid: number): boolean {
  if (gid <= 0) {
    return true;
  }

  const tileset = getTilesetForTileGid(mapData, gid);

  if (!tileset) {
    return false;
  }

  const knownTransparentIds = tileset.transparentTileLocalIds;

  if (!knownTransparentIds || knownTransparentIds.length === 0) {
    return false;
  }

  return knownTransparentIds.includes(gid - tileset.firstgid);
}

export function normalizeRuntimeMapData(mapId: string, mapData: any): any {
  const bounds = getChunkedMapBounds(mapData);
  const tileOffsetX = bounds.minTileX * (mapData.tilewidth ?? 32);
  const tileOffsetY = bounds.minTileY * (mapData.tileheight ?? 32);

  const normalizedMapData = {
    ...mapData,
    infinite: false,
    width: bounds.width,
    height: bounds.height,
    objects: (Array.isArray(mapData.objects) ? mapData.objects : []).map((object: any) => ({
      ...object,
      x: (object.x ?? 0) - tileOffsetX,
      y: (object.y ?? 0) - tileOffsetY
    })),
    tilesets: (mapData.tilesets ?? []).map((tileset: any) => {
      const configuredTileset = getConfiguredTilesetEntry(mapId, tileset);

      return {
        ...tileset,
        textureKey: resolveTilesetTextureKey(mapId, tileset),
        transparentTileLocalIds: configuredTileset?.transparentTileLocalIds
          ? [...configuredTileset.transparentTileLocalIds]
          : undefined
      };
    }),
    layers: (mapData.layers ?? []).map((layer: any) => {
      if (layer.type !== 'tilelayer') {
        return layer;
      }

      return {
        ...layer,
        width: bounds.width,
        height: bounds.height,
        data: flattenTileLayerData(layer, bounds.width, bounds.height, bounds.minTileX, bounds.minTileY)
      };
    })
  };

  return normalizedMapData;
}

export function getTileLayer(mapData: any, layerName: string): any | undefined {
  const normalizedLayerName = normalizeLayerName(layerName);

  return mapData.layers?.find(
    (layer: any) =>
      layer.type === 'tilelayer' &&
      normalizeLayerName(String(layer.name ?? '')) === normalizedLayerName
  );
}

export function getNonEmptyTilePositionsForLayer(
  mapData: any,
  layerName: string
): Array<{ tileX: number; tileY: number }> {
  const layer = getTileLayer(mapData, layerName);
  const layerData: number[] = layer?.data ?? [];
  const layerWidth = layer?.width ?? mapData.width ?? 0;

  if (!layerWidth || layerData.length === 0) {
    return [];
  }

  return layerData.flatMap((tileGid, index) => {
    if ((tileGid ?? 0) <= 0) {
      return [];
    }

    return {
      tileX: index % layerWidth,
      tileY: Math.floor(index / layerWidth)
    };
  });
}

export function getMapObject(mapData: any, objectName: string): any | undefined {
  return mapData.objects?.find((object: any) => object.name === objectName);
}
