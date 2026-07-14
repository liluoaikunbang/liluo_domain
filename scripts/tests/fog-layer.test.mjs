import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFogDriftState,
  updateFogDriftState,
  getFogPuffCount
} from '../../src/game/systems/environment/fogLayer.ts';

test('getFogPuffCount scales with viewport size and stays clamped', () => {
  assert.equal(getFogPuffCount(320, 180), 4);
  assert.equal(getFogPuffCount(1280, 720), 11);
  assert.equal(getFogPuffCount(3840, 2160), 16);
});

test('updateFogDriftState moves fog puffs forward and wraps them when leaving the viewport', () => {
  const initialState = {
    seed: 7,
    puffs: [
      {
        x: 120,
        y: 80,
        radiusX: 100,
        radiusY: 48,
        speedX: 14,
        speedY: -3,
        alpha: 0.2
      },
      {
        x: 780,
        y: 40,
        radiusX: 90,
        radiusY: 44,
        speedX: 24,
        speedY: 1,
        alpha: 0.16
      }
    ]
  };

  const nextState = updateFogDriftState(initialState, {
    delta: 1000,
    viewportWidth: 640,
    viewportHeight: 360
  });

  assert.notEqual(nextState, initialState);
  assert.equal(nextState.puffs[0].x, 134);
  assert.equal(nextState.puffs[0].y, 77);

  assert.ok(nextState.puffs[1].x < 0, 'wrapped puff should respawn from the left side');
  assert.ok(nextState.puffs[1].y >= -24 && nextState.puffs[1].y <= 384);
  assert.equal(nextState.puffs[1].radiusX, 90);
  assert.equal(nextState.puffs[1].radiusY, 44);
  assert.equal(nextState.puffs[1].alpha, 0.16);
});

test('createFogDriftState creates a stable amount of fog puffs for a viewport', () => {
  const viewportWidth = 960;
  const viewportHeight = 540;
  const fogState = createFogDriftState(viewportWidth, viewportHeight, 11);
  const visiblePuffs = fogState.puffs.filter(
    (puff) => puff.x + puff.radiusX > 0 && puff.x - puff.radiusX < viewportWidth
  );
  const horizontalSectors = new Set(
    visiblePuffs.map((puff) => Math.max(0, Math.min(2, Math.floor((puff.x / viewportWidth) * 3))))
  );

  assert.equal(fogState.puffs.length, getFogPuffCount(viewportWidth, viewportHeight));
  assert.ok(fogState.puffs.every((puff) => puff.radiusX >= 150 && puff.radiusX <= 250));
  assert.ok(fogState.puffs.every((puff) => puff.radiusY >= 34 && puff.radiusY <= 62));
  assert.ok(fogState.puffs.every((puff) => puff.speedX >= 8 && puff.speedX <= 22));
  assert.ok(fogState.puffs.every((puff) => Array.isArray(puff.lobes) && puff.lobes.length >= 5));
  assert.ok(
    fogState.puffs.every((puff) => puff.lobes.some((lobe) => Math.abs(lobe.offsetX) > 0 || Math.abs(lobe.offsetY) > 0))
  );
  assert.ok(visiblePuffs.length >= 2, 'viewport should show at least two fog areas');
  assert.ok(horizontalSectors.size >= 2, 'visible fog should cover at least two horizontal sectors');
  assert.ok(
    fogState.puffs.every((puff) => puff.radiusX / puff.radiusY >= 2.2),
    'fog puffs should prefer a horizontal strip silhouette'
  );
  assert.ok(
    fogState.puffs.every((puff) => puff.lobes.filter((lobe) => lobe.scaleX > lobe.scaleY * 1.35).length >= 4),
    'most fog lobes should be horizontally stretched instead of round'
  );
});

test('createFogDriftState keeps at least two fog regions visible even in a smaller viewport', () => {
  const viewportWidth = 640;
  const viewportHeight = 360;
  const fogState = createFogDriftState(viewportWidth, viewportHeight, 3);
  const visiblePuffs = fogState.puffs.filter(
    (puff) => puff.x + puff.radiusX > 0 && puff.x - puff.radiusX < viewportWidth
  );
  const sectors = new Set(
    visiblePuffs.map((puff) => Math.max(0, Math.min(3, Math.floor((puff.x / viewportWidth) * 4))))
  );

  assert.ok(visiblePuffs.length >= 3, 'small viewport should still show several fog groups');
  assert.ok(sectors.size >= 2, 'small viewport should still show fog in at least two regions');
});

test('updateFogDriftState keeps fog cycling after earlier visible groups drift away', () => {
  const viewportWidth = 640;
  const viewportHeight = 360;
  const initialState = createFogDriftState(viewportWidth, viewportHeight, 3);
  const cycledState = updateFogDriftState(initialState, {
    delta: 32000,
    viewportWidth,
    viewportHeight
  });
  const visiblePuffs = cycledState.puffs.filter(
    (puff) => puff.x + puff.radiusX > 0 && puff.x - puff.radiusX < viewportWidth
  );
  const sectors = new Set(
    visiblePuffs.map((puff) => Math.max(0, Math.min(3, Math.floor((puff.x / viewportWidth) * 4))))
  );

  assert.ok(visiblePuffs.length >= 2, 'fog should still have follow-up groups after cycling');
  assert.ok(sectors.size >= 2, 'cycled fog should still cover more than one visible region');
});