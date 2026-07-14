import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { liluoRoomMeta } from '../../src/game/data/maps/munika/liluo_room/meta.ts';
import { mumuRoomMeta } from '../../src/game/data/maps/munika/mumu_room/meta.ts';
import { computeCameraLayout } from '../../src/game/systems/map/cameraLayoutRules.ts';

test('room maps use a static centered camera mode', () => {
  assert.equal(liluoRoomMeta.viewport.cameraMode, 'static-centered');
  assert.equal(mumuRoomMeta.viewport.cameraMode, 'static-centered');
});

test('static centered camera mode uses the map focus target instead of player follow', () => {
  const cameraLayoutSource = readFileSync('src/game/systems/map/cameraLayoutRules.ts', 'utf8');
  const worldSceneRuntimeSource = readFileSync('src/game/systems/map/worldSceneRuntime.ts', 'utf8');

  assert.match(cameraLayoutSource, /shouldCenterSmallMapViewportX/);
  assert.match(cameraLayoutSource, /shouldCenterSmallMapViewportY/);
  assert.match(cameraLayoutSource, /shouldFollowPlayer:\s*mapViewportConfig\.cameraMode !== 'static-centered'/);
  assert.match(worldSceneRuntimeSource, /camera\.centerOn\(layout\.focusTarget\.x,\s*layout\.focusTarget\.y\)/);
  assert.match(worldSceneRuntimeSource, /mapViewportConfig\.cameraMode !== 'static-centered'[\s\S]*startFollow\(player\)/);
});

test('large follow camera clamps to renderable map content instead of empty outer map bounds', () => {
  const layout = computeCameraLayout({
    viewportWidth: 640,
    viewportHeight: 360,
    mapWidth: 60,
    mapHeight: 40,
    tileSize: 32,
    mapContentBounds: {
      x: 160,
      y: 96,
      width: 1280,
      height: 896
    },
    mapViewportConfig: {
      smallMap: {
        fitStrategy: 'fit-short-side',
        allowZoomIn: true
      },
      largeMap: {
        zoom: 1
      },
      cameraMode: 'follow-player'
    }
  });

  assert.deepEqual(layout.bounds, {
    x: 160,
    y: 96,
    width: 1280,
    height: 896
  });
  assert.equal(layout.viewport.width, 640);
  assert.equal(layout.viewport.height, 360);
  assert.equal(layout.shouldFollowPlayer, true);
});
