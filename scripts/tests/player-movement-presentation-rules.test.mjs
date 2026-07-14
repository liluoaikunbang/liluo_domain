import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolvePlayerMovementPresentation,
  resolvePlayerVisionPresentation
} from '../../src/game/data/playerMovementPresentationRules.ts';

test('movement status reductions stack additively without changing the base appearance by themselves', () => {
  const presentation = resolvePlayerMovementPresentation(['no_shoes', 'barefoot'], 'default');

  assert.equal(presentation.appearanceId, 'default');
  assert.equal(presentation.movementStyle, 'normal');
  assert.equal(presentation.movementSpeedMultiplier, 0.85);
});

test('hands bound status applies its own speed reduction and bondage walk spritesheet', () => {
  const presentation = resolvePlayerMovementPresentation(['hands_bound'], 'default');

  assert.equal(presentation.appearanceId, 'bondage');
  assert.equal(presentation.movementStyle, 'normal');
  assert.equal(presentation.movementSpeedMultiplier, 0.95);
});

test('legs bound status enables hop movement while keeping other active body layers', () => {
  const presentation = resolvePlayerMovementPresentation(
    ['no_shoes', 'barefoot', 'hands_bound', 'legs_bound'],
    'default'
  );

  assert.equal(presentation.appearanceId, 'bondage_legs_bound');
  assert.equal(presentation.movementStyle, 'hop');
  assert.equal(presentation.movementSpeedMultiplier, 0.3);
  assert.equal(presentation.hopAmplitude, 18);
  assert.equal(presentation.hopSpeed, 0.02);
});

test('removing one movement status only removes that status contribution', () => {
  const presentation = resolvePlayerMovementPresentation(['no_shoes', 'hands_bound'], 'default');

  assert.equal(presentation.appearanceId, 'bondage');
  assert.equal(presentation.movementSpeedMultiplier, 0.85);
});

test('status appearance resolution keeps active layers while switching movement mode', () => {
  assert.deepEqual(resolvePlayerMovementPresentation(['no_shoes', 'hands_bound'], 'default'), {
    appearanceId: 'bondage',
    movementStyle: 'normal',
    movementSpeedMultiplier: 0.85,
    canMove: true,
    hopAmplitude: 0,
    hopSpeed: 0
  });

  assert.deepEqual(resolvePlayerMovementPresentation(['no_shoes', 'hands_bound', 'legs_bound'], 'default'), {
    appearanceId: 'bondage_legs_bound',
    movementStyle: 'hop',
    movementSpeedMultiplier: 0.35,
    canMove: true,
    hopAmplitude: 18,
    hopSpeed: 0.02
  });

  assert.deepEqual(resolvePlayerMovementPresentation(['no_shoes'], 'default'), {
    appearanceId: 'default',
    movementStyle: 'normal',
    movementSpeedMultiplier: 0.9,
    canMove: true,
    hopAmplitude: 0,
    hopSpeed: 0
  });
});

test('confined status uses the full body bondage spritesheet and disables movement', () => {
  const presentation = resolvePlayerMovementPresentation(['no_shoes', 'legs_bound', 'confined'], 'default');

  assert.equal(presentation.appearanceId, 'full_body_bondage');
  assert.equal(presentation.movementStyle, 'normal');
  assert.equal(presentation.canMove, false);
  assert.equal(presentation.movementSpeedMultiplier, 0);
});

test('blind status resolves a soft two-tile circular vision mask', () => {
  const vision = resolvePlayerVisionPresentation(['blind']);

  assert.equal(vision.blindMask.enabled, true);
  assert.equal(vision.blindMask.radiusInTiles, 2);
  assert.equal(vision.blindMask.edgeFadeInTiles, 1);
  assert.equal(vision.blindMask.overlayAlpha, 0.9);
});

test('vision mask stays disabled without blind status', () => {
  const vision = resolvePlayerVisionPresentation(['no_shoes', 'confined']);

  assert.equal(vision.blindMask.enabled, false);
});
