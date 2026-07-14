import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEnvironmentOverlayLayers,
  resolveEnvironmentStateChange,
  resolveInitialEnvironmentState
} from '../../src/game/systems/environment/environmentOverlayState.ts';

test('buildEnvironmentOverlayLayers stacks time-of-day and weather overlay layers together', () => {
  const overlayLayers = buildEnvironmentOverlayLayers({
    timeOfDayId: 'night',
    weatherId: 'rain'
  });

  assert.deepEqual(overlayLayers, [
    {
      color: 0x4a4f96,
      alpha: 0.33
    },
    {
      color: 0x7a889d,
      alpha: 0.16
    },
    {
      color: 0x9db4cf,
      alpha: 0.08
    }
  ]);
});

test('resolveEnvironmentStateChange keeps weather when only time-of-day changes', () => {
  const nextState = resolveEnvironmentStateChange(
    {
      timeOfDayId: 'day',
      weatherId: 'fog'
    },
    {
      timeOfDayId: 'dusk'
    }
  );

  assert.deepEqual(nextState, {
    timeOfDayId: 'dusk',
    weatherId: 'fog'
  });
});

test('resolveInitialEnvironmentState falls back to day + clear', () => {
  assert.deepEqual(resolveInitialEnvironmentState(), {
    timeOfDayId: 'day',
    weatherId: 'clear'
  });
});