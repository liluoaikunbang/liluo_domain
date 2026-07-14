import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLayeredCharacterTexturePreviewUrl,
  registerLayeredCharacterTexturePreview,
  resolveAnchoredCharacterFramePlacement,
  resolveCharacterTextureDisplayOrigin
} from '../../src/game/systems/animation/character/layeredCharacterTexture.ts';

test('layered character preview reuses the exact runtime-composited canvas as a lazy image URL', () => {
  let serializationCount = 0;
  const canvas = {
    toDataURL() {
      serializationCount += 1;
      return 'data:image/png;base64,layered-frame';
    }
  };

  registerLayeredCharacterTexturePreview('liluo_body_up_down_walk_1', canvas);

  assert.equal(serializationCount, 0);
  assert.equal(
    getLayeredCharacterTexturePreviewUrl('liluo_body_up_down_walk_1'),
    'data:image/png;base64,layered-frame'
  );
  assert.equal(
    getLayeredCharacterTexturePreviewUrl('liluo_body_up_down_walk_1'),
    'data:image/png;base64,layered-frame'
  );
  assert.equal(serializationCount, 1);
});

test('layered character preview returns null for a texture that was not composed at runtime', () => {
  assert.equal(getLayeredCharacterTexturePreviewUrl('missing-layered-frame'), null);
});

test('menu frame placement uses the same body and foot display origin as the map sprite', () => {
  const displayOrigin = resolveCharacterTextureDisplayOrigin({
    textureAnchor: { x: 90, y: 230 },
    fallbackOrigin: { x: 95.5, y: 179.666667 },
    configuredDisplayOriginY: 179.666667,
    frameHeight: 243
  });
  const placement = resolveAnchoredCharacterFramePlacement({
    displayOrigin,
    scale: 0.252632 * 0.8,
    target: { x: 32, y: 44 }
  });

  assert.deepEqual(displayOrigin, {
    x: 90,
    y: 166.666667
  });
  assert.ok(Math.abs(placement.left + displayOrigin.x * placement.scale - 32) < 0.000001);
  assert.ok(Math.abs(placement.top + displayOrigin.y * placement.scale - 44) < 0.000001);
  assert.ok(Math.abs(placement.scale - 0.2021056) < 0.000001);
});
