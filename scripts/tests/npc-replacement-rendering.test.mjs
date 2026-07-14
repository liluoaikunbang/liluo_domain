import test from 'node:test';
import assert from 'node:assert/strict';

import { liluoEstateMeta } from '../../src/game/data/maps/munika/liluo_estate/meta.ts';
import { getPlayerCharacterFrameTextureKey } from '../../src/game/data/playerCharacter.ts';
import {
  resolveNpcReplacementPlacements,
  resolveNpcReplacementScale,
  shouldSkipNpcReplacementSourceTile
} from '../../src/game/systems/map/renderers/npcReplacementRenderer.ts';

function createNormalizedNpcReplacementMap() {
  const width = 32;
  const height = 22;
  const data = Array.from({ length: width * height }, () => 0);

  data[16 * width + 14] = 1053;
  data[16 * width + 15] = 1054;
  data[17 * width + 14] = 1077;
  data[17 * width + 15] = 1078;
  data[20 * width + 29] = 493;
  data[20 * width + 30] = 493;
  data[21 * width + 29] = 493;
  data[21 * width + 30] = 493;

  return {
    tilewidth: 32,
    tileheight: 32,
    width,
    height,
    layers: [
      {
        name: 'NPC',
        type: 'tilelayer',
        width,
        height,
        data
      }
    ],
    tilesets: [
      {
        firstgid: 487,
        textureKey: 'legacy_farm_object'
      },
      {
        firstgid: 943,
        textureKey: 'sprites_liluo'
      }
    ]
  };
}

function getTileLayer(mapData, layerName) {
  return mapData.layers.find((layer) => layer.name === layerName);
}

function getTilesetForTileGid(mapData, gid) {
  return [...mapData.tilesets].sort((a, b) => b.firstgid - a.firstgid).find((tileset) => gid >= tileset.firstgid);
}

test('liluo estate replaces the sprites_liluo NPC placeholder with the right-facing bound character frame', () => {
  const rule = liluoEstateMeta.worldRender.npcReplacements[0];
  const normalizedMap = createNormalizedNpcReplacementMap();

  assert.equal(rule.layerName, 'NPC');
  assert.equal(rule.sourceTextureKey, 'sprites_liluo');
  assert.equal(rule.appearanceId, 'bondage_legs_bound');
  assert.equal(rule.direction, 'right');
  assert.equal(
    getPlayerCharacterFrameTextureKey(rule.appearanceId, rule.direction, rule.state),
    'liluo_bondage_body_up_and_down_right_idle'
  );

  assert.deepEqual(resolveNpcReplacementPlacements(normalizedMap, rule, normalizedMap.tilewidth), [
    {
      x: 480,
      y: 576,
      minTileX: 14,
      minTileY: 16,
      maxTileX: 15,
      maxTileY: 17
    }
  ]);
});

test('npc replacement hides only matching sprites_liluo source tiles and keeps other NPC-layer tiles renderable', () => {
  const normalizedMap = createNormalizedNpcReplacementMap();
  const npcLayer = getTileLayer(normalizedMap, 'NPC');
  const layerWidth = npcLayer.width;
  const spritesLiluoTileGid = npcLayer.data[17 * layerWidth + 14];
  const legacyObjectTileGid = npcLayer.data[20 * layerWidth + 29];
  const spritesLiluoTileset = getTilesetForTileGid(normalizedMap, spritesLiluoTileGid);
  const legacyObjectTileset = getTilesetForTileGid(normalizedMap, legacyObjectTileGid);

  assert.equal(shouldSkipNpcReplacementSourceTile({
    npcReplacements: liluoEstateMeta.worldRender.npcReplacements,
    layer: npcLayer,
    tileset: spritesLiluoTileset
  }), true);
  assert.equal(shouldSkipNpcReplacementSourceTile({
    npcReplacements: liluoEstateMeta.worldRender.npcReplacements,
    layer: npcLayer,
    tileset: legacyObjectTileset
  }), false);
});

test('npc replacement scale shares the same map character scale as the player', () => {
  assert.equal(resolveNpcReplacementScale({
    characterScale: 0.252632,
    mapCharacterScale: 0.8
  }), 0.20210560000000002);
  assert.equal(resolveNpcReplacementScale({
    characterScale: 0.252632,
    mapCharacterScale: 0.8,
    ruleScale: 1.25
  }), 0.252632);
});
