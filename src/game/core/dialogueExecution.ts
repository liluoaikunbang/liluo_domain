import type { EventExecutionContext, NotificationExecutionData } from './eventExecution';
import type { DialogueCutsceneData } from './EventRunner';

export interface DialogueChoiceExecutionData {
  id: string;
  next?: string;
  cutscene?: DialogueCutsceneData;
  mapTransition?: {
    mapId: string;
    spawnId?: string;
  };
  timeOfDayChange?: {
    timeOfDayId: string;
  };
  weatherChange?: {
    weatherId: string;
  };
  notification?: NotificationExecutionData;
  playerPortraitChange?: {
    portraitKey: string;
  };
  playerAppearanceChange?: {
    appearanceId: string;
  };
  playerStatusChange?: {
    status: string[];
    mode?: 'set' | 'append' | 'remove';
  };
  mapSessionFlagChange?: {
    flagId: string;
    value: boolean;
  };
  interactiveFictionStart?: {
    scenarioId: string;
  };
  directionPadGameStart?: {
    gameId: string;
  };
  soundEffectPlay?: {
    key: string;
  };
}

export interface DialogueNodeExecutionData<TChoice extends DialogueChoiceExecutionData = DialogueChoiceExecutionData> {
  id: string;
  choices?: TChoice[];
}

export function resolveDialogueChoice(
  node: DialogueNodeExecutionData,
  choiceId: string,
  context: EventExecutionContext = {}
): DialogueChoiceExecutionData | null {
  const choice = node.choices?.find((candidate) => candidate.id === choiceId);

  if (!choice) {
    return null;
  }

  if (choice.timeOfDayChange) {
    if (!context.setTimeOfDay) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 setTimeOfDay 执行上下文，但当前未提供。`
      );
    } else {
      context.setTimeOfDay(choice.timeOfDayChange.timeOfDayId);
    }
  }

  if (choice.weatherChange) {
    if (!context.setWeather) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 setWeather 执行上下文，但当前未提供。`
      );
    } else {
      context.setWeather(choice.weatherChange.weatherId);
    }
  }

  if (choice.notification) {
    if (!context.pushNotification) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 pushNotification 执行上下文，但当前未提供。`
      );
    } else {
      context.pushNotification(choice.notification);
    }
  }

  if (choice.playerPortraitChange) {
    if (!context.setPlayerPortrait) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 setPlayerPortrait 执行上下文，但当前未提供。`
      );
    } else {
      context.setPlayerPortrait(choice.playerPortraitChange.portraitKey);
    }
  }

  if (choice.playerAppearanceChange) {
    if (!context.setPlayerAppearance) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 setPlayerAppearance 执行上下文，但当前未提供。`
      );
    } else {
      context.setPlayerAppearance(choice.playerAppearanceChange.appearanceId);
    }
  }

  if (choice.playerStatusChange) {
    if (!context.setPlayerStatus) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 setPlayerStatus 执行上下文，但当前未提供。`
      );
    } else if (
      (choice.playerStatusChange.mode === 'append' || choice.playerStatusChange.mode === 'remove') &&
      !context.getPlayerStatus
    ) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 getPlayerStatus 执行上下文，但当前未提供。`
      );
    } else {
      const statusList = resolvePlayerStatusChange(
        choice.playerStatusChange,
        context.getPlayerStatus?.() ?? []
      );

      context.setPlayerStatus(statusList);
    }
  }

  if (choice.mapSessionFlagChange) {
    if (!context.setMapSessionFlag) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 setMapSessionFlag 执行上下文，但当前未提供。`
      );
    } else {
      context.setMapSessionFlag(choice.mapSessionFlagChange.flagId, choice.mapSessionFlagChange.value);
    }
  }

  if (choice.interactiveFictionStart) {
    if (!context.startInteractiveFiction) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 startInteractiveFiction 执行上下文，但当前未提供。`
      );
    } else {
      context.startInteractiveFiction(choice.interactiveFictionStart.scenarioId);
    }
  }

  if (choice.directionPadGameStart) {
    if (!context.startDirectionPadGame) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 startDirectionPadGame 执行上下文，但当前未提供。`
      );
    } else {
      context.startDirectionPadGame(choice.directionPadGameStart.gameId);
    }
  }

  if (choice.soundEffectPlay) {
    if (!context.playSoundEffect) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 playSoundEffect 执行上下文，但当前未提供。`
      );
    } else {
      context.playSoundEffect(choice.soundEffectPlay.key);
    }
  }

  if (choice.mapTransition) {
    if (!context.changeMap) {
      console.error(
        `对话选项 ${node.id}:${choiceId} 需要 changeMap 执行上下文，但当前未提供。`
      );
    } else {
      context.changeMap(choice.mapTransition);
    }
  }

  return choice;
}

export function resolvePlayerStatusChange(
  change: NonNullable<DialogueChoiceExecutionData['playerStatusChange']>,
  currentStatusList: ReadonlyArray<string>
): string[] {
  if (change.mode === 'append') {
    return [...currentStatusList, ...change.status];
  }

  if (change.mode === 'remove') {
    const removedStatusIds = new Set(change.status);
    return currentStatusList.filter((statusId) => !removedStatusIds.has(statusId));
  }

  return change.status;
}
