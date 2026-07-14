export interface InteractionInputGateParams {
  isInteractionPressed: boolean;
  dialogKeyTriggered: boolean;
  isUiOverlayOpen: boolean;
  hasInteractionEvent: boolean;
}

export interface InteractionInputGateResult {
  shouldTriggerInteraction: boolean;
  nextDialogKeyTriggered: boolean;
}

export function resolveInteractionInputGate({
  isInteractionPressed,
  dialogKeyTriggered,
  isUiOverlayOpen,
  hasInteractionEvent
}: InteractionInputGateParams): InteractionInputGateResult {
  let nextDialogKeyTriggered = dialogKeyTriggered;
  let shouldTriggerInteraction = false;

  if (isInteractionPressed && !dialogKeyTriggered && hasInteractionEvent) {
    shouldTriggerInteraction = true;
    nextDialogKeyTriggered = true;
  }

  if (!isInteractionPressed && nextDialogKeyTriggered && !isUiOverlayOpen) {
    nextDialogKeyTriggered = false;
  }

  return {
    shouldTriggerInteraction: !isUiOverlayOpen && shouldTriggerInteraction,
    nextDialogKeyTriggered
  };
}