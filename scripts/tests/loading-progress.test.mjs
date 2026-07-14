import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LOADING_PROGRESS_DETAILS_DELAY_MS,
  clampLoadingProgress,
  shouldShowDetailedLoadingProgress
} from '../../src/game/core/loadingProgress.ts';

test('loading progress is clamped to a visible percent range', () => {
  assert.equal(clampLoadingProgress(-0.25), 0);
  assert.equal(clampLoadingProgress(0), 0);
  assert.equal(clampLoadingProgress(0.42), 0.42);
  assert.equal(clampLoadingProgress(1), 1);
  assert.equal(clampLoadingProgress(1.25), 1);
  assert.equal(clampLoadingProgress(Number.NaN), 0);
});

test('detailed loading progress stays hidden until loading exceeds the delay threshold', () => {
  assert.equal(LOADING_PROGRESS_DETAILS_DELAY_MS, 1000);
  assert.equal(shouldShowDetailedLoadingProgress(true, 999), false);
  assert.equal(shouldShowDetailedLoadingProgress(true, 1000), true);
  assert.equal(shouldShowDetailedLoadingProgress(true, 1200), true);
  assert.equal(shouldShowDetailedLoadingProgress(false, 1200), false);
});
