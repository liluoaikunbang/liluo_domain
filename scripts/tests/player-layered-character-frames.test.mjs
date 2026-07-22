import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  defaultPlayerAppearanceId,
  getAllPlayerCharacterDefinitions,
  playerAppearanceSpriteSheets,
  playerCharacterAssetBundle,
  playerCharacterDefinition,
  resolvePlayerCharacterStaticPreview,
  resolveCharacterWalkAnimationTimeScale,
  resolveCharacterWalkSpeedPerSecond
} from '../../src/game/data/playerCharacter.ts';
import {
  findCharacterBodyAnchor,
  registerLayeredCharacterTexturePreview
} from '../../src/game/systems/animation/character/layeredCharacterTexture.ts';

function readPngSize(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 24);

  assert.equal(header.toString('ascii', 1, 4), 'PNG');

  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20)
  };
}

function createTestImageData(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4)
  };
}

test('static menu and save previews reuse the runtime-composited frame at a uniform 56px UI height', () => {
  registerLayeredCharacterTexturePreview('liluo_bondage_body_up_down_idle', {
    toDataURL: () => 'data:image/png;base64,bondage-idle'
  });

  const preview = resolvePlayerCharacterStaticPreview('bondage');
  const fullBodyPreview = resolvePlayerCharacterStaticPreview('full_body_bondage');

  assert.deepEqual({
    ...preview,
    displayScale: undefined
  }, {
    imageUrl: 'data:image/png;base64,bondage-idle',
    frameWidth: 191,
    frameHeight: 243,
    frameIndex: 0,
    frameColumns: 1,
    displayOriginX: 95.5,
    displayOriginY: 179.666667,
    displayScale: undefined
  });
  assert.ok(Math.abs(preview.frameHeight * preview.displayScale - 56) < 0.000001);
  assert.ok(Math.abs(fullBodyPreview.frameHeight * fullBodyPreview.displayScale - 56) < 0.000001);
});

function fillAlphaRect(imageData, left, top, right, bottom) {
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      imageData.data[(y * imageData.width + x) * 4 + 3] = 255;
    }
  }
}

test('player character layered frames do not declare legacy per-frame normalization metadata', () => {
  assert.ok(playerCharacterAssetBundle.manifest.length > 0);

  playerCharacterAssetBundle.manifest.forEach((asset) => {
    assert.equal('normalization' in asset, false);
  });
});

test('player character definitions expose loadable texture assets without legacy normalization metadata', () => {
  const definitions = getAllPlayerCharacterDefinitions();

  assert.ok(definitions.length > 0);

  definitions.forEach((definition) => {
    assert.ok(definition.textureAssets.length > 0);
    definition.textureAssets.forEach((asset) => {
      assert.equal('normalization' in asset, false);
    });
  });
});

test('player character default appearance loads its cached liluo frame images', () => {
  assert.equal(defaultPlayerAppearanceId, 'default');
  assert.equal(playerCharacterDefinition.appearanceId, 'default');
  assert.equal(playerCharacterDefinition.textureKey, 'liluo_body_up_down_idle');
  assert.equal(playerCharacterDefinition.textureAssets.length, 60);
  assert.ok(playerCharacterDefinition.textureAssets.every((asset) => asset.type === 'image'));
  assert.match(playerCharacterDefinition.textureAssets[0].url, /sprite\/LiLuo_body_down\/down_idle\.png$/);
  assert.match(playerCharacterDefinition.textureAssets[20].url, /sprite\/LiLuo_body_up\/down_idle\.png$/);
  assert.match(playerCharacterDefinition.textureAssets[40].url, /sprite\/LiLuo_head\/down_idle\.png$/);
  assert.equal(playerCharacterDefinition.displayOriginY, 179.666667);
  assert.equal(playerCharacterDefinition.scale, 0.252632);
  assert.equal(playerCharacterDefinition.cameraZoomMultiplier, 1);
  assert.equal(playerCharacterDefinition.movementStyle, 'normal');
});

test('template-cut body frame caches contain fixed-size 4 by 5 direction sequences', () => {
  const frameNames = [
    'down_idle', 'down_walk_1', 'down_walk_2', 'down_walk_3', 'down_walk_4',
    'left_idle', 'left_walk_1', 'left_walk_2', 'left_walk_3', 'left_walk_4',
    'right_idle', 'right_walk_1', 'right_walk_2', 'right_walk_3', 'right_walk_4',
    'up_idle', 'up_walk_1', 'up_walk_2', 'up_walk_3', 'up_walk_4'
  ];
  const frameDirectories = [
    'bondage_body_down',
    'bondage_body_up',
    'LiLuo_body_up',
    'LiLuo_body_down',
    'LiLuo_head'
  ];

  frameDirectories.forEach((frameDirectoryName) => {
    const frameDirectory = path.resolve(process.cwd(), `src/assets/game/sprite/${frameDirectoryName}`);

    assert.equal(fs.existsSync(frameDirectory), true);
    assert.deepEqual(
      fs.readdirSync(frameDirectory).filter((fileName) => fileName.endsWith('.png')).sort(),
      frameNames.map((frameName) => `${frameName}.png`).sort()
    );
    assert.deepEqual(
      readPngSize(path.join(frameDirectory, 'down_idle.png')),
      { width: 191, height: 243 }
    );
  });
});

test('dynamic layered liluo frame images keep the first frame idle and cycle the remaining four frames per direction', () => {
  const animationsByKey = Object.fromEntries(
    playerCharacterDefinition.animationBundle.map((animation) => [animation.key, animation])
  );

  assert.deepEqual(animationsByKey.liluo_body_up_down_idle_idle_down.frames, [{ textureKey: 'liluo_body_up_down_idle' }]);
  assert.deepEqual(animationsByKey.liluo_body_up_down_idle_walk_down.frames, [
    { textureKey: 'liluo_body_up_down_walk_1' }, { textureKey: 'liluo_body_up_down_walk_2' },
    { textureKey: 'liluo_body_up_down_walk_3' }, { textureKey: 'liluo_body_up_down_walk_4' }
  ]);
  assert.deepEqual(animationsByKey.liluo_body_up_down_idle_idle_left.frames, [{ textureKey: 'liluo_body_up_left_idle' }]);
  assert.deepEqual(animationsByKey.liluo_body_up_down_idle_idle_right.frames, [{ textureKey: 'liluo_body_up_right_idle' }]);
  assert.deepEqual(animationsByKey.liluo_body_up_down_idle_idle_up.frames, [{ textureKey: 'liluo_body_up_up_idle' }]);
});

test('default body layers use the same template coordinates as the base body parts', () => {
  assert.equal(playerAppearanceSpriteSheets.default.baseFrameTextureKeyPrefix, 'LiLuo_body_down');
  assert.deepEqual(playerAppearanceSpriteSheets.default.layers, [
    {
      sourceTextureKeyPrefix: 'LiLuo_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    }
  ]);
});

test('hands-bound bondage appearance swaps only the upper body layer', () => {
  const definition = getAllPlayerCharacterDefinitions().find(
    (entry) => entry.appearanceId === 'bondage'
  );

  assert.ok(definition);
  assert.equal(definition.textureKey, 'liluo_bondage_body_up_down_idle');
  assert.equal(definition.textureAssets.length, 60);
  assert.match(definition.textureAssets[0].url, /sprite\/LiLuo_body_down\/down_idle\.png$/);
  assert.match(definition.textureAssets[20].url, /sprite\/bondage_body_up\/down_idle\.png$/);
  assert.match(definition.textureAssets[40].url, /sprite\/LiLuo_head\/down_idle\.png$/);
  assert.equal(playerAppearanceSpriteSheets.bondage.baseFrameTextureKeyPrefix, 'LiLuo_body_down');
  assert.deepEqual(playerAppearanceSpriteSheets.bondage.layers, [
    {
      sourceTextureKeyPrefix: 'bondage_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    }
  ]);
});

test('legs-bound bondage appearance overlays the lower body layer and uses standing frames only', () => {
  const definition = getAllPlayerCharacterDefinitions().find(
    (entry) => entry.appearanceId === 'legs_bound'
  );

  assert.ok(definition);
  assert.equal(definition.textureKey, 'liluo_bondage_body_down_down_idle');
  assert.equal(definition.textureAssets.length, 80);
  assert.match(definition.textureAssets[0].url, /sprite\/LiLuo_body_down\/down_idle\.png$/);
  assert.match(definition.textureAssets[20].url, /sprite\/LiLuo_body_up\/down_idle\.png$/);
  assert.match(definition.textureAssets[40].url, /sprite\/LiLuo_head\/down_idle\.png$/);
  assert.match(definition.textureAssets[60].url, /sprite\/bondage_body_down\/down_idle\.png$/);
  assert.equal(definition.walkCycleDistanceInTiles, undefined);
  assert.equal(resolveCharacterWalkSpeedPerSecond(definition, 'down', 32), null);
  assert.deepEqual(playerAppearanceSpriteSheets.legs_bound.layers, [
    {
      sourceTextureKeyPrefix: 'LiLuo_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    },
    {
      sourceTextureKeyPrefix: 'bondage_body_down',
      mode: 'overlay'
    }
  ]);

  const animationsByKey = Object.fromEntries(
    definition.animationBundle.map((animation) => [animation.key, animation])
  );

  assert.deepEqual(animationsByKey.liluo_bondage_body_down_down_idle_walk_down.frames, [{ textureKey: 'liluo_bondage_body_down_down_idle' }]);
  assert.deepEqual(animationsByKey.liluo_bondage_body_down_down_idle_walk_left.frames, [{ textureKey: 'liluo_bondage_body_down_left_idle' }]);
  assert.deepEqual(animationsByKey.liluo_bondage_body_down_down_idle_walk_right.frames, [{ textureKey: 'liluo_bondage_body_down_right_idle' }]);
  assert.deepEqual(animationsByKey.liluo_bondage_body_down_down_idle_walk_up.frames, [{ textureKey: 'liluo_bondage_body_down_up_idle' }]);
});

test('hands and legs bound appearance keeps the bound upper body layer and puts bound legs on top', () => {
  const definition = getAllPlayerCharacterDefinitions().find(
    (entry) => entry.appearanceId === 'bondage_legs_bound'
  );

  assert.ok(definition);
  assert.equal(definition.textureKey, 'liluo_bondage_body_up_and_down_down_idle');
  assert.equal(definition.textureAssets.length, 80);
  assert.match(definition.textureAssets[0].url, /sprite\/LiLuo_body_down\/down_idle\.png$/);
  assert.match(definition.textureAssets[20].url, /sprite\/bondage_body_up\/down_idle\.png$/);
  assert.match(definition.textureAssets[40].url, /sprite\/LiLuo_head\/down_idle\.png$/);
  assert.match(definition.textureAssets[60].url, /sprite\/bondage_body_down\/down_idle\.png$/);
  assert.equal(definition.walkCycleDistanceInTiles, undefined);
  assert.equal(resolveCharacterWalkSpeedPerSecond(definition, 'down', 32), null);
  assert.deepEqual(playerAppearanceSpriteSheets.bondage_legs_bound.layers, [
    {
      sourceTextureKeyPrefix: 'bondage_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    },
    {
      sourceTextureKeyPrefix: 'bondage_body_down',
      mode: 'overlay'
    }
  ]);

  const animationsByKey = Object.fromEntries(
    definition.animationBundle.map((animation) => [animation.key, animation])
  );

  assert.deepEqual(animationsByKey.liluo_bondage_body_up_and_down_down_idle_walk_down.frames, [{ textureKey: 'liluo_bondage_body_up_and_down_down_idle' }]);
  assert.deepEqual(animationsByKey.liluo_bondage_body_up_and_down_down_idle_walk_left.frames, [{ textureKey: 'liluo_bondage_body_up_and_down_left_idle' }]);
  assert.deepEqual(animationsByKey.liluo_bondage_body_up_and_down_down_idle_walk_right.frames, [{ textureKey: 'liluo_bondage_body_up_and_down_right_idle' }]);
  assert.deepEqual(animationsByKey.liluo_bondage_body_up_and_down_down_idle_walk_up.frames, [{ textureKey: 'liluo_bondage_body_up_and_down_up_idle' }]);
});

test('liluo movement speed follows its configured walk-cycle stride', () => {
  assert.equal(playerCharacterDefinition.walkCycleDistanceInTiles, 3.75);
  assert.equal(resolveCharacterWalkSpeedPerSecond(playerCharacterDefinition, 'down', 32), 360);
  assert.equal(resolveCharacterWalkSpeedPerSecond(playerCharacterDefinition, 'left', 32), 360);
  assert.equal(resolveCharacterWalkSpeedPerSecond(playerCharacterDefinition, 'right', 32), 360);
  assert.equal(resolveCharacterWalkSpeedPerSecond(playerCharacterDefinition, 'up', 32), 360);
});

test('liluo walk animation scales with its movement speed multiplier', () => {
  const slowedCharacterDefinition = {
    ...playerCharacterDefinition,
    movementSpeedMultiplier: 0.75
  };

  assert.equal(resolveCharacterWalkAnimationTimeScale(slowedCharacterDefinition), 0.75);
});

test('dynamic layered frame anchor keeps horizontal origin on the body instead of the stepping foot', () => {
  const leftFootForwardFrame = createTestImageData(100, 100);
  fillAlphaRect(leftFootForwardFrame, 44, 30, 56, 70);
  fillAlphaRect(leftFootForwardFrame, 10, 88, 20, 92);

  const rightFootForwardFrame = createTestImageData(100, 100);
  fillAlphaRect(rightFootForwardFrame, 44, 30, 56, 70);
  fillAlphaRect(rightFootForwardFrame, 80, 88, 90, 92);

  assert.deepEqual(findCharacterBodyAnchor(leftFootForwardFrame), { x: 50, y: 92 });
  assert.deepEqual(findCharacterBodyAnchor(rightFootForwardFrame), { x: 50, y: 92 });
});

test('full body bondage appearance is visual only and does not carry movement metadata', () => {
  const definition = getAllPlayerCharacterDefinitions().find(
    (entry) => entry.appearanceId === 'full_body_bondage'
  );

  assert.ok(definition);
  assert.equal(definition.textureKey, 'liluo_full_body_bondage_down_idle');
  assert.equal(definition.movementStyle, 'normal');
  assert.equal(definition.movementSpeedMultiplier, 1);
  assert.equal(definition.canMove, true);
  assert.equal(definition.hopAmplitude, 0);
  assert.equal(definition.hopSpeed, 0);
  assert.ok(definition.textureAssets.length > 1);
  assert.ok(definition.textureAssets.every((asset) => asset.type === 'image'));
  assert.ok(definition.textureAssets.every((asset) => !asset.url.includes('undefined')));
});
