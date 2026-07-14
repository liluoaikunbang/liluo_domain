import { onUnmounted, ref } from 'vue';
import type {
  DialogueCutsceneData,
  DialoguePayload,
  EventMapTransitionData,
  EventRunner
} from '../../core/EventRunner';
import type { NotificationExecutionData } from '../../core/eventExecution';

interface DialogueState {
  id: string;
  nodeId: string;
  speaker: string;
  speakerSide: 'left' | 'right';
  npcPortrait: DialoguePayload['npcPortrait'] | null;
  sceneImage: DialoguePayload['sceneImage'] | null;
  text: string;
  choices: DialoguePayload['choices'];
  canAdvance: boolean;
}

interface DialogueHistoryEntry {
  id: string;
  type: 'dialogue' | 'choice';
  speaker: string;
  text: string;
}

interface DialogueCutsceneState {
  text: string;
  phase: 'visible' | 'leaving';
  fadeInMs: number;
  fadeOutMs: number;
}

interface UseGameDialogueBridgeOptions {
  eventRunner: Pick<EventRunner, 'advanceDialogue' | 'selectDialogueChoiceWithContext'>;
  applyTimeOfDayChoice: (timeOfDayId: string) => boolean;
  applyWeatherChoice: (weatherId: string) => boolean;
  applyMapTransitionChoice: (transition: EventMapTransitionData) => boolean;
  pushNotificationChoice: (notification: NotificationExecutionData) => boolean;
  startInteractiveFictionChoice?: (scenarioId: string) => boolean;
  startDirectionPadGameChoice?: (gameId: string) => boolean;
  playSoundEffectChoice?: (soundKey: string) => boolean;
  playerRuntimeActions: {
    setPortrait: (portraitKey: string) => boolean;
    setAppearance: (appearanceId: string) => boolean;
    getStatus: () => string[];
    setStatus: (statusList: ReadonlyArray<string>) => boolean;
  };
  mapSessionActions?: {
    setFlag: (flagId: string, value: boolean) => boolean;
  };
}

const createEmptyDialogueState = (): DialogueState => ({
  id: '',
  nodeId: '',
  speaker: '',
  speakerSide: 'right',
  npcPortrait: null,
  sceneImage: null,
  text: '',
  choices: [],
  canAdvance: false
});

const DEFAULT_CUTSCENE_FADE_IN_MS = 450;
const DEFAULT_CUTSCENE_HOLD_MS = 2000;
const DEFAULT_CUTSCENE_FADE_OUT_MS = 450;

export function useGameDialogueBridge({
  eventRunner,
  applyTimeOfDayChoice,
  applyWeatherChoice,
  applyMapTransitionChoice,
  pushNotificationChoice,
  startInteractiveFictionChoice,
  startDirectionPadGameChoice,
  playSoundEffectChoice,
  playerRuntimeActions,
  mapSessionActions
}: UseGameDialogueBridgeOptions) {
  const showDialog = ref(false);
  const activeCutscene = ref<DialogueCutsceneState | null>(null);
  const activeDialogue = ref<DialogueState>(createEmptyDialogueState());
  const dialogueHistory = ref<DialogueHistoryEntry[]>([]);
  const cutsceneTimers: ReturnType<typeof window.setTimeout>[] = [];

  const setCutsceneTimer = (callback: () => void, delayMs: number) => {
    const timer = window.setTimeout(callback, delayMs);
    cutsceneTimers.push(timer);
    return timer;
  };

  const clearCutsceneTimers = () => {
    cutsceneTimers.splice(0).forEach((timer) => window.clearTimeout(timer));
  };

  const appendDialogueHistory = (dialogue: DialogueState) => {
    const text = dialogue.text.trim();

    if (!text) {
      return;
    }

    dialogueHistory.value = [
      ...dialogueHistory.value,
      {
        id: `${dialogue.id}:${dialogue.nodeId}:${dialogueHistory.value.length}`,
        type: 'dialogue',
        speaker: dialogue.speaker,
        text
      }
    ];
  };

  const appendChoiceHistory = (choiceId: string) => {
    const choice = activeDialogue.value.choices.find((candidate) => candidate.id === choiceId);
    const text = choice?.label?.trim();

    if (!text) {
      return;
    }

    dialogueHistory.value = [
      ...dialogueHistory.value,
      {
        id: `${activeDialogue.value.id}:${activeDialogue.value.nodeId}:${choiceId}:${dialogueHistory.value.length}`,
        type: 'choice',
        speaker: '选择',
        text
      }
    ];
  };

  const applyDialoguePayload = (payload: Partial<DialoguePayload>) => {
    activeDialogue.value = {
      id: payload.id ?? '',
      nodeId: payload.nodeId ?? '',
      speaker: payload.speaker ?? '',
      speakerSide: payload.speakerSide ?? 'right',
      npcPortrait: payload.npcPortrait ?? null,
      sceneImage: payload.sceneImage ?? null,
      text: payload.text ?? '',
      choices: payload.choices ?? [],
      canAdvance: payload.canAdvance ?? false
    };
    appendDialogueHistory(activeDialogue.value);
  };

  const resetDialogueState = () => {
    activeDialogue.value = createEmptyDialogueState();
  };

  const closeDialogue = () => {
    clearCutsceneTimers();
    activeCutscene.value = null;
    showDialog.value = false;
    resetDialogueState();
    dialogueHistory.value = [];
  };

  const openDialogue = (payload: DialoguePayload) => {
    dialogueHistory.value = [];
    applyDialoguePayload(payload);
    showDialog.value = true;
  };

  const playEntryCutscene = (
    cutscene: DialogueCutsceneData,
    onComplete: () => void
  ) => {
    if (cutscene.type !== 'fade_message') {
      onComplete();
      return;
    }

    clearCutsceneTimers();

    const fadeInMs = cutscene.fadeInMs ?? DEFAULT_CUTSCENE_FADE_IN_MS;
    const holdMs = cutscene.holdMs ?? DEFAULT_CUTSCENE_HOLD_MS;
    const fadeOutMs = cutscene.fadeOutMs ?? DEFAULT_CUTSCENE_FADE_OUT_MS;

    activeCutscene.value = {
      text: cutscene.text,
      phase: 'visible',
      fadeInMs,
      fadeOutMs
    };

    setCutsceneTimer(() => {
      if (activeCutscene.value) {
        activeCutscene.value = {
          ...activeCutscene.value,
          phase: 'leaving'
        };
      }
    }, fadeInMs + holdMs);

    setCutsceneTimer(() => {
      onComplete();
      activeCutscene.value = null;
    }, fadeInMs + holdMs + fadeOutMs);
  };

  const applyNextDialogueOrClose = (nextDialogue: DialoguePayload | null) => {
    if (!nextDialogue) {
      closeDialogue();
      return;
    }

    if (nextDialogue.entryCutscene) {
      playEntryCutscene(nextDialogue.entryCutscene, () => {
        applyDialoguePayload(nextDialogue);
      });
      return;
    }

    applyDialoguePayload(nextDialogue);
  };

  const handleDialogAdvance = () => {
    if (!activeDialogue.value.id || !activeDialogue.value.nodeId) {
      closeDialogue();
      return;
    }

    const nextDialogue = eventRunner.advanceDialogue(
      activeDialogue.value.id,
      activeDialogue.value.nodeId
    );

    applyNextDialogueOrClose(nextDialogue);
  };

  const handleDialogChoice = (choiceId: string) => {
    if (!activeDialogue.value.id || !activeDialogue.value.nodeId) {
      closeDialogue();
      return;
    }

    appendChoiceHistory(choiceId);

    const nextDialogue = eventRunner.selectDialogueChoiceWithContext(
      activeDialogue.value.id,
      activeDialogue.value.nodeId,
      choiceId,
      {
        setTimeOfDay: applyTimeOfDayChoice,
        setWeather: applyWeatherChoice,
        changeMap: applyMapTransitionChoice,
        pushNotification: pushNotificationChoice,
        startInteractiveFiction: startInteractiveFictionChoice,
        startDirectionPadGame: startDirectionPadGameChoice,
        playSoundEffect: playSoundEffectChoice,
        setPlayerPortrait: playerRuntimeActions.setPortrait,
        setPlayerAppearance: playerRuntimeActions.setAppearance,
        getPlayerStatus: playerRuntimeActions.getStatus,
        setPlayerStatus: playerRuntimeActions.setStatus,
        setMapSessionFlag: mapSessionActions?.setFlag
      }
    );

    applyNextDialogueOrClose(nextDialogue);
  };

  onUnmounted(() => {
    clearCutsceneTimers();
  });

  return {
    showDialog,
    activeDialogue,
    dialogueHistory,
    activeCutscene,
    openDialogue,
    closeDialogue,
    handleDialogAdvance,
    handleDialogChoice,
    resetDialogueState
  };
}
