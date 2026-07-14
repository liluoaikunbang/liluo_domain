import type { EventData, DialoguePayload } from './EventRunner';
import { resolvePlayerStatusChange } from './dialogueExecution.ts';

export interface NotificationExecutionData {
  text: string;
  type?: 'neutral' | 'gain' | 'loss';
  duration?: number;
}

export interface EventExecutionContext {
  setTimeOfDay?: (timeOfDayId: string) => boolean;
  setWeather?: (weatherId: string) => boolean;
  changeMap?: (transition: NonNullable<EventData['mapTransition']>) => boolean;
  pushNotification?: (notification: NotificationExecutionData) => boolean;
  setPlayerPortrait?: (portraitKey: string) => boolean;
  setPlayerAppearance?: (appearanceId: string) => boolean;
  getPlayerStatus?: () => string[];
  setPlayerStatus?: (statusList: ReadonlyArray<string>) => boolean;
  setMapSessionFlag?: (flagId: string, value: boolean) => boolean;
  startInteractiveFiction?: (scenarioId: string) => boolean;
  startDirectionPadGame?: (gameId: string) => boolean;
  playSoundEffect?: (soundKey: string) => boolean;
  getMapSessionFlag?: (flagId: string) => boolean;
  isPlayerPortraitDefault?: () => boolean;
}

export interface EventExecutionResult {
  dialogue: DialoguePayload | null;
  didExecute: boolean;
}

export function executeEventActions(
  event: EventData,
  context: EventExecutionContext,
  options: {
    resolveDialogue: (dialogueId: string) => DialoguePayload | null;
  }
): EventExecutionResult {
  let didExecute = false;

  if (event.defaultPlayerPortraitRequired && context.isPlayerPortraitDefault?.() === false) {
    return {
      dialogue: options.resolveDialogue(event.defaultPlayerPortraitRequired.fallbackDialogueId),
      didExecute: true
    };
  }

  if (event.mapSessionFlagRequired) {
    const currentValue = context.getMapSessionFlag?.(event.mapSessionFlagRequired.flagId) ?? false;

    if (currentValue !== event.mapSessionFlagRequired.expected) {
      return {
        dialogue: options.resolveDialogue(event.mapSessionFlagRequired.fallbackDialogueId),
        didExecute: true
      };
    }
  }

  if (event.timeOfDayChange) {
    if (!context.setTimeOfDay) {
      console.error(`事件 ${event.eventId} 需要 setTimeOfDay 执行上下文，但当前未提供。`);
    } else {
      didExecute = context.setTimeOfDay(event.timeOfDayChange.timeOfDayId) || didExecute;
    }
  }

  if (event.weatherChange) {
    if (!context.setWeather) {
      console.error(`事件 ${event.eventId} 需要 setWeather 执行上下文，但当前未提供。`);
    } else {
      didExecute = context.setWeather(event.weatherChange.weatherId) || didExecute;
    }
  }

  if (event.mapTransition) {
    if (!context.changeMap) {
      console.error(`事件 ${event.eventId} 需要 changeMap 执行上下文，但当前未提供。`);
    } else {
      didExecute = context.changeMap(event.mapTransition) || didExecute;
    }
  }

  if (event.playerPortraitChange) {
    if (!context.setPlayerPortrait) {
      console.error(`事件 ${event.eventId} 需要 setPlayerPortrait 执行上下文，但当前未提供。`);
    } else {
      didExecute = context.setPlayerPortrait(event.playerPortraitChange.portraitKey) || didExecute;
    }
  }

  if (event.playerAppearanceChange) {
    if (!context.setPlayerAppearance) {
      console.error(`事件 ${event.eventId} 需要 setPlayerAppearance 执行上下文，但当前未提供。`);
    } else {
      didExecute = context.setPlayerAppearance(event.playerAppearanceChange.appearanceId) || didExecute;
    }
  }

  if (event.playerStatusChange) {
    if (!context.setPlayerStatus) {
      console.error(`事件 ${event.eventId} 需要 setPlayerStatus 执行上下文，但当前未提供。`);
    } else if (
      (event.playerStatusChange.mode === 'append' || event.playerStatusChange.mode === 'remove') &&
      !context.getPlayerStatus
    ) {
      console.error(`事件 ${event.eventId} 需要 getPlayerStatus 执行上下文，但当前未提供。`);
    } else {
      didExecute = context.setPlayerStatus(resolvePlayerStatusChange(
        event.playerStatusChange,
        context.getPlayerStatus?.() ?? []
      )) || didExecute;
    }
  }

  if (event.dialogueId) {
    return {
      dialogue: options.resolveDialogue(event.dialogueId),
      didExecute: true
    };
  }

  if (!didExecute) {
    console.error(`事件 ${event.eventId} 没有可执行的动作`);
  }

  return {
    dialogue: null,
    didExecute
  };
}
