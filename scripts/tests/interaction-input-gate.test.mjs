import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveInteractionInputGate } from '../../src/game/systems/character/interactionInputGate.ts';

test('keeps the interaction latch while dialog overlay is open so space does not retrigger the same event', () => {
  const firstTrigger = resolveInteractionInputGate({
    isInteractionPressed: true,
    dialogKeyTriggered: false,
    isUiOverlayOpen: false,
    hasInteractionEvent: true
  });

  assert.equal(firstTrigger.shouldTriggerInteraction, true);
  assert.equal(firstTrigger.nextDialogKeyTriggered, true);

  const releaseWhileOverlayOpen = resolveInteractionInputGate({
    isInteractionPressed: false,
    dialogKeyTriggered: firstTrigger.nextDialogKeyTriggered,
    isUiOverlayOpen: true,
    hasInteractionEvent: true
  });

  assert.equal(
    releaseWhileOverlayOpen.nextDialogKeyTriggered,
    true,
    'dialog 打开期间松开空格后，交互锁不应被提前释放'
  );

  const pressAgainWhileOverlayOpen = resolveInteractionInputGate({
    isInteractionPressed: true,
    dialogKeyTriggered: releaseWhileOverlayOpen.nextDialogKeyTriggered,
    isUiOverlayOpen: true,
    hasInteractionEvent: true
  });

  assert.equal(pressAgainWhileOverlayOpen.shouldTriggerInteraction, false);
  assert.equal(pressAgainWhileOverlayOpen.nextDialogKeyTriggered, true);
});

test('releases the interaction latch after the overlay closes and the key is no longer pressed', () => {
  const nextState = resolveInteractionInputGate({
    isInteractionPressed: false,
    dialogKeyTriggered: true,
    isUiOverlayOpen: false,
    hasInteractionEvent: true
  });

  assert.equal(nextState.shouldTriggerInteraction, false);
  assert.equal(nextState.nextDialogKeyTriggered, false);
});