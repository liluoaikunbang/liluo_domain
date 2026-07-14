import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtimeMapNormalizerSource = fs.readFileSync(
  new URL('../../src/game/systems/map/runtimeMapNormalizer.ts', import.meta.url),
  'utf8'
);
const liluoEstateMap = JSON.parse(
  fs.readFileSync(new URL('../../src/game/data/maps/munika/liluo_estate/map.json', import.meta.url), 'utf8')
);

function getChunkedMapBounds(mapData) {
  let minTileX = 0;
  let minTileY = 0;
  let maxTileX = mapData.width ?? 0;
  let maxTileY = mapData.height ?? 0;
  let hasChunk = false;

  (mapData.layers ?? []).forEach((layer) => {
    (layer.chunks ?? []).forEach((chunk) => {
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

function getRawChunkTilePositions(mapData, layerName) {
  const layer = mapData.layers.find(
    (candidateLayer) => candidateLayer.type === 'tilelayer' && candidateLayer.name === layerName
  );
  const bounds = getChunkedMapBounds(mapData);

  return (layer?.chunks ?? []).flatMap((chunk) => {
    const chunkData = chunk.data ?? [];
    const chunkWidth = chunk.width ?? 0;

    if (!chunkWidth) {
      return [];
    }

    return chunkData.flatMap((tileGid, index) => {
      if ((tileGid ?? 0) <= 0) {
        return [];
      }

      return {
        tileX: (index % chunkWidth) + (chunk.x ?? 0) - bounds.minTileX,
        tileY: Math.floor(index / chunkWidth) + (chunk.y ?? 0) - bounds.minTileY
      };
    });
  });
}

test('runtime map normalizer no longer contains runtime empty-border trimming', () => {
  assert.doesNotMatch(runtimeMapNormalizerSource, /function\s+trimRuntimeMapData/);
  assert.doesNotMatch(runtimeMapNormalizerSource, /function\s+getRuntimeTileContentBounds/);
  assert.doesNotMatch(runtimeMapNormalizerSource, /function\s+cropTileLayerData/);
});

test('liluo estate chunk bounds keep the original full map size', () => {
  const bounds = getChunkedMapBounds(liluoEstateMap);

  assert.equal(bounds.minTileX, 0);
  assert.equal(bounds.minTileY, 0);
  assert.equal(bounds.width, liluoEstateMap.width);
  assert.equal(bounds.height, liluoEstateMap.height);
});

test('liluo estate event marker chunks already align to normalized tile coordinates', () => {
  assert.deepEqual(getRawChunkTilePositions(liluoEstateMap, 'NPC_event'), [
    { tileX: 15, tileY: 17 },
    { tileX: 15, tileY: 18 },
    { tileX: 16, tileY: 17 },
    { tileX: 16, tileY: 18 }
  ]);
});
