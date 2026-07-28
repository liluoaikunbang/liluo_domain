<template>
  <div class="game-view-container">
    <GameEntryScreen
      v-if="!hasEnteredGame"
      :illustration="entryIllustration"
      :saves="saveSummaries"
      @start="startNewJourney"
      @select-save="startSavedJourney"
    />

    <template v-else>
      <div class="game-mode-stack">
        <MapMode
          :player-portrait-status-text="playerPortraitStatusText"
          :player-portrait-src="playerPortraitSrc"
          :player-portrait-layers="playerPortraitLayers"
          :player-portrait-back-layers="playerPortraitBackLayers"
          :player-portrait-motion-mode="playerPortraitMotionMode"
          :hide-player-portrait="isMenuOpen"
          :player-status-icons="playerStatusIcons"
          :active-scene-image-src="activeSceneImageSrc"
          :active-scene-image-alt="activeSceneImageAlt"
          :is-scene-image-previewing="isSceneImagePreviewing"
          :active-cutscene="activeCutscene"
          :cutscene-style="cutsceneStyle"
          :notifications="notifications"
          :runtime-errors="runtimeErrors"
          :loading-progress="loadingProgress"
          :show-dialog="showDialog"
          :active-dialogue="activeDialogue"
          :npc-portrait-alt="npcPortraitAlt"
          :current-map-name="currentMapName"
          :current-map-description="currentMapDescription"
          :primary-action="primaryPanelAction"
          :map-actions="mapPanelActions"
          :menu-disabled="isMenuButtonDisabled"
          @trigger-primary-action="triggerCurrentInteraction"
          @trigger-map-action="handleMapPanelAction"
          @open-menu="openMenu"
          @open-portrait-layers="openPortraitLayerDialog"
        >
          <template #overlay>
            <GameMenuOverlay
              v-bind="gameMenuOverlayProps"
              v-on="gameMenuOverlayListeners"
            />
            <GamePortraitLayerDialog
              :visible="isPortraitLayerDialogOpen"
              :layers="playerPortraitLayerOptions"
              :selected-layer-keys="selectedPlayerPortraitLayerKeys"
              @close="closePortraitLayerDialog"
              @toggle-layer="togglePlayerPortraitLayer"
            />
            <GameMapActionChoiceDialog
              :visible="isMapActionChoiceDialogVisible"
              :action="activeMapPanelAction"
              @choose="handleMapPanelActionChoice"
              @close="closeMapActionChoiceDialog"
            />
          </template>
        </MapMode>
        <div
          v-if="activeInteractiveFiction"
          class="game-mode-stack__overlay"
          @click.stop
          @contextmenu.stop
          @pointerdown.stop
          @pointerup.stop
          @touchstart.stop
          @touchend.stop
          @wheel.stop
        >
          <InteractiveFictionMode
            :player-portrait-status-text="playerPortraitStatusText"
            :player-portrait-src="playerPortraitSrc"
            :hide-player-portrait="isMenuOpen"
            :player-status-icons="playerStatusIcons"
            :payload="activeInteractiveFiction"
            :background-src="activeInteractiveFictionBackgroundSrc"
            @choose="handleInteractiveFictionChoice"
            @restart="restartInteractiveFiction"
            @leave="leaveInteractiveFiction"
          >
            <template #overlay>
              <GameMenuOverlay
                v-bind="gameMenuOverlayProps"
                v-on="gameMenuOverlayListeners"
              />
            </template>
          </InteractiveFictionMode>
        </div>
        <div
          v-if="activeDirectionPadGame"
          class="game-mode-stack__overlay"
          @click.stop
          @contextmenu.stop
          @pointerdown.stop
          @pointerup.stop
          @touchstart.stop
          @touchend.stop
          @wheel.stop
        >
          <DirectionPadMode
            :player-portrait-status-text="playerPortraitStatusText"
            :player-portrait-src="playerPortraitSrc"
            :payload="activeDirectionPadGame"
            @press="handleDirectionPadPress"
            @expire="handleDirectionPadExpire"
            @countdown-complete="handleDirectionPadCountdownComplete"
            @restart="restartDirectionPadGame"
            @leave="leaveDirectionPadGame"
          >
            <template #overlay>
              <GameMenuOverlay
                v-bind="gameMenuOverlayProps"
                v-on="gameMenuOverlayListeners"
              />
            </template>
          </DirectionPadMode>
        </div>
        <DialogHistoryOverlay
          v-if="isDialogueHistoryOpen"
          :history="dialogueHistory"
          @close="closeDialogueHistory"
        />
      </div>

      <DialogBox
        v-if="!activeCutscene && !activeInteractiveFiction && !activeDirectionPadGame && !isDialogueHistoryOpen"
        v-model:visible="showDialog"
        :speaker="activeDialogue.speaker"
        :speaker-side="activeDialogue.speakerSide"
        :text="activeDialogue.text"
        :choices="activeDialogue.choices"
        :can-advance="activeDialogue.canAdvance"
        :scene-mode="hasActiveSceneImage"
        :scene-previewing="isSceneImagePreviewing"
        @advance="handleDialogAdvance"
        @choose="handleDialogChoice"
        @open-history="openDialogueHistory"
        @close="closeDialogue"
        @scene-preview-change="isSceneImagePreviewing = $event"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { eventRunner } from '../core/EventRunner';
import { DirectionPadGameRunner } from '../core/directionPadGame';
import { InteractiveFictionRunner } from '../core/interactiveFiction';
import {
  getPlayerRuntimeState,
  resetPlayerRuntimeState,
  resolvePlayerRuntimePortrait,
  setPlayerPortrait
} from '../core/playerRuntime';
import { applyGameSaveData, createGameSaveData, parseGameSaveData } from '../core/saveData';
import {
  AUTO_SAVE_SLOT_ID,
  deleteAllGameSaveFiles,
  deleteGameSaveFile,
  exportAllGameSavesToLocalFile,
  importGameSaveExportData,
  listGameSaveFiles,
  loadGameFromFile,
  saveGameToFile
} from '../core/saveStorage';
import { findImageAssetUrl } from '../data/assets';
import {
  getInteractiveFictionAssetUrl,
  interactiveFictionRegistry
} from '../data/interactive_fictions/registry';
import { resolveMapPanelActions } from '../data/mapPanelActions';
import { directionPadGameRegistry } from '../data/minigames/directionPadGames';
import { resolvePlayerStatusDefinitions, resolvePlayerStatusLabels } from '../data/playerStatus';
import { getMapRegistryEntry, INITIAL_MAP_ID, mapRegistry } from '../data/registry';
import DialogBox from './components/base/DialogBox.vue';
import DialogHistoryOverlay from './components/base/DialogHistoryOverlay.vue';
import GameMenuOverlay from './components/base/GameMenuOverlay.vue';
import GamePortraitLayerDialog from './components/base/GamePortraitLayerDialog.vue';
import GameEntryScreen from './GameEntryScreen.vue';
import DirectionPadMode from './modes/direction-pad/DirectionPadMode.vue';
import InteractiveFictionMode from './modes/interactive-fiction/InteractiveFictionMode.vue';
import GameMapActionChoiceDialog from './modes/map/GameMapActionChoiceDialog.vue';
import MapMode from './modes/map/MapMode.vue';
import { useGameDialogueBridge } from './composables/useGameDialogueBridge';
import { useGameNotifications } from './composables/useGameNotifications';
import { usePhaserGameBridge } from './composables/usePhaserGameBridge';
import entryIllustration from '../../assets/images/index.jpg';
import {
  playerPortraitLayerOptions,
  resolvePlayerPortraitBackLayers
} from '../data/portraits/registry';

const activeEventId = ref(null);
const activeInteractiveFiction = ref(null);
const activeDirectionPadGame = ref(null);
const activeMapPanelActionId = ref(null);
const hasEnteredGame = ref(false);
const isMenuOpen = ref(false);
const isPortraitLayerDialogOpen = ref(false);
const isDialogueHistoryOpen = ref(false);
const isSceneImagePreviewing = ref(false);
const currentMapId = ref(INITIAL_MAP_ID);
const currentPlayerPosition = ref(null);
const saveSummaries = ref([]);
const mapSessionState = ref({
  mapId: INITIAL_MAP_ID,
  flags: {}
});
const runtimeErrors = ref([]);
const loadingProgress = ref({
  phase: 'boot',
  label: '准备进入地图...',
  progress: 0,
  isLoading: false
});
let runtimeErrorIdSeed = 0;
let shouldNotifyPlayerStatusChanges = true;
let shouldSkipNextMapAutosave = false;

const {
  notifications,
  pushNotification,
  clearAllNotifications
} = useGameNotifications();

const interactiveFictionRunner = new InteractiveFictionRunner(
  Object.fromEntries(
    Object.values(interactiveFictionRegistry).map((entry) => [entry.id, entry.scenario])
  )
);
const directionPadGameRunner = new DirectionPadGameRunner(directionPadGameRegistry);

const {
  mountGame,
  destroyGame,
  triggerCurrentInteraction,
  setTimeOfDay,
  setWeather,
  setPlayerAppearance,
  setPlayerStatus: setPlayerStatusInWorld,
  playSoundEffect,
  changeMap,
  getCurrentMapId,
  getPlayerWorldPosition,
  loadMapAtPosition,
  setUiOverlayOpen
} = usePhaserGameBridge({
  containerId: 'phaser-game-container',
  onDialogTrigger: (dialogue) => openDialogue(dialogue),
  onEventExecute: () => {
    handleAutoSaveGame();
  },
  onInteractionChange: (eventId) => {
    activeEventId.value = eventId;
  },
  onMapChange: (mapId) => {
    currentMapId.value = mapId;

    if (mapSessionState.value.mapId !== mapId) {
      resetMapSessionState(mapId);
    }

    if (shouldSkipNextMapAutosave) {
      shouldSkipNextMapAutosave = false;
      return;
    }

    handleAutoSaveGame();
  },
  onPlayerStatusChange: (change) => {
    pushPlayerStatusChangeNotifications(change);
  },
  onRuntimeError: (error) => {
    runtimeErrors.value = [
      ...runtimeErrors.value,
      {
        ...error,
        id: error.id ?? `runtime-error-${runtimeErrorIdSeed += 1}`
      }
    ];
  },
  onLoadingProgress: (progress) => {
    loadingProgress.value = progress;
  },
  getMapSessionFlag: (flagId) => {
    return Boolean(mapSessionState.value.flags[flagId]);
  },
  setMapSessionFlag: (flagId, value) => {
    setMapSessionFlag(flagId, value);
    return true;
  }
});

const {
  showDialog,
  activeDialogue,
  dialogueHistory,
  activeCutscene,
  openDialogue,
  closeDialogue,
  handleDialogAdvance,
  handleDialogChoice
} = useGameDialogueBridge({
  eventRunner,
  applyTimeOfDayChoice: setTimeOfDay,
  applyWeatherChoice: setWeather,
  applyMapTransitionChoice: changeMap,
  playerRuntimeActions: {
    setAppearance: setPlayerAppearance,
    setPortrait: (portraitKey) => setPlayerPortrait(portraitKey) !== null,
    getStatus: () => getPlayerRuntimeState().status,
    setStatus: (statusList) => {
      return setPlayerStatusInWorld(statusList);
    }
  },
  mapSessionActions: {
    setFlag: (flagId, value) => {
      setMapSessionFlag(flagId, value);
      return true;
    }
  },
  pushNotificationChoice: (notification) => {
    pushNotification(notification);
    return true;
  },
  startInteractiveFictionChoice: (scenarioId) => {
    return startInteractiveFiction(scenarioId);
  },
  startDirectionPadGameChoice: (gameId) => {
    return startDirectionPadGame(gameId);
  },
  playSoundEffectChoice: (soundKey) => {
    return playSoundEffect(soundKey);
  }
});

const currentMapEntry = computed(() => getMapRegistryEntry(currentMapId.value));
const currentMapName = computed(() => currentMapEntry.value?.name ?? '未知地点');
const currentMapDescription = computed(() => currentMapEntry.value?.description ?? '');
const activePlayerPortrait = computed(() => resolvePlayerRuntimePortrait());
const playerPortraitStatusText = computed(() => '璃落的冒险');
const selectedPlayerPortraitLayerKeys = ref([]);
const playerStatusIcons = computed(() => {
  return resolvePlayerStatusDefinitions(getPlayerRuntimeState().status)
    .filter((status) => status.iconUrl)
    .map((status) => ({
      id: status.id,
      label: status.label,
      description: status.description,
      functionInfo: status.functionInfo,
      iconUrl: status.iconUrl
    }));
});
const activeInteractiveFictionPortraitSrc = computed(() => {
  if (!activeInteractiveFiction.value) {
    return '';
  }

  const portraitKey = activeInteractiveFiction.value.node.portraitKey
    ?? activeInteractiveFiction.value.scenario.defaultPortraitKey
    ?? '';

  return getInteractiveFictionAssetUrl(activeInteractiveFiction.value.scenario.id, portraitKey);
});
const isActivePlayerPortraitLayerControlled = computed(() => {
  return !activeInteractiveFictionPortraitSrc.value
    && Boolean(activePlayerPortrait.value.layers?.length)
    && playerPortraitLayerOptions.length > 0;
});
const selectedPlayerPortraitLayers = computed(() => {
  const selectedLayerKeySet = new Set(selectedPlayerPortraitLayerKeys.value);
  return playerPortraitLayerOptions.filter((layer) => selectedLayerKeySet.has(layer.key));
});
const playerPortraitSrc = computed(() => {
  if (activeInteractiveFictionPortraitSrc.value) {
    return activeInteractiveFictionPortraitSrc.value;
  }

  return isActivePlayerPortraitLayerControlled.value ? '' : activePlayerPortrait.value.src || '';
});
const playerPortraitLayers = computed(() => {
  if (activeInteractiveFictionPortraitSrc.value) {
    return [];
  }

  return isActivePlayerPortraitLayerControlled.value
    ? selectedPlayerPortraitLayers.value
    : activePlayerPortrait.value.layers ?? [];
});
const playerPortraitBackLayers = computed(() => {
  if (activeInteractiveFictionPortraitSrc.value) {
    return [];
  }

  return isActivePlayerPortraitLayerControlled.value
    ? resolvePlayerPortraitBackLayers(selectedPlayerPortraitLayers.value)
    : activePlayerPortrait.value.backLayers ?? [];
});
const playerPortraitMotionMode = computed(() => {
  const statusSet = new Set(getPlayerRuntimeState().status);

  if (statusSet.has('confined') || (statusSet.has('hands_bound') && statusSet.has('legs_bound'))) {
    return 'boundTight';
  }

  if (statusSet.has('hands_bound') || statusSet.has('legs_bound') || statusSet.has('muted') || statusSet.has('blind')) {
    return 'boundSoft';
  }

  return 'idle';
});
const currentPlayerPortraitForMenu = computed(() => ({
  ...activePlayerPortrait.value,
  src: playerPortraitSrc.value,
  layers: playerPortraitLayers.value,
  backLayers: playerPortraitBackLayers.value
}));
const gameMenuOverlayProps = computed(() => ({
  visible: isMenuOpen.value,
  saves: saveSummaries.value,
  currentMapId: currentMapId.value,
  currentMapEntry: currentMapEntry.value,
  currentMapName: currentMapName.value,
  currentPosition: currentPlayerPosition.value,
  currentPlayerPortrait: currentPlayerPortraitForMenu.value
}));
const activeInteractiveFictionBackgroundSrc = computed(() => {
  if (!activeInteractiveFiction.value) {
    return '';
  }

  const backgroundKey = activeInteractiveFiction.value.node.backgroundKey
    ?? activeInteractiveFiction.value.scenario.defaultBackgroundKey
    ?? '';

  return getInteractiveFictionAssetUrl(activeInteractiveFiction.value.scenario.id, backgroundKey);
});
const activeSceneImageSrc = computed(() => {
  if (!showDialog.value || !activeDialogue.value.sceneImage?.assetKey) {
    return '';
  }

  const sceneImageAssetKey = activeDialogue.value.sceneImage.assetKey;
  const currentMapAssets = getMapRegistryEntry(currentMapId.value)?.assets;
  const currentMapSceneImageUrl = findImageAssetUrl(currentMapAssets, sceneImageAssetKey);

  if (currentMapSceneImageUrl) {
    return currentMapSceneImageUrl;
  }

  for (const mapEntry of Object.values(mapRegistry)) {
    const sceneImageUrl = findImageAssetUrl(mapEntry.assets, sceneImageAssetKey);

    if (sceneImageUrl) {
      return sceneImageUrl;
    }
  }

  return '';
});
const hasActiveSceneImage = computed(() => {
  return showDialog.value && Boolean(activeDialogue.value.sceneImage?.assetKey);
});
const activeSceneImageAlt = computed(() => {
  if (activeDialogue.value.speaker) {
    return `${activeDialogue.value.speaker}事件场景图`;
  }

  return '事件场景背景图';
});
const cutsceneStyle = computed(() => {
  if (!activeCutscene.value) {
    return {};
  }

  return {
    '--cutscene-fade-in-ms': `${activeCutscene.value.fadeInMs}ms`,
    '--cutscene-fade-out-ms': `${activeCutscene.value.fadeOutMs}ms`
  };
});
const npcPortraitAlt = computed(() => {
  if (activeDialogue.value.speaker) {
    return `${activeDialogue.value.speaker}立绘`;
  }

  return '对话对象立绘';
});

const activeEvent = computed(() => {
  if (!activeEventId.value) {
    return null;
  }

  return eventRunner.getEvent(activeEventId.value);
});

const primaryPanelAction = computed(() => activeEvent.value?.panelActions?.[0] ?? null);
const mapPanelActions = computed(() => resolveMapPanelActions(currentMapId.value));
const activeMapPanelAction = computed(() => {
  if (!activeMapPanelActionId.value) {
    return null;
  }

  return mapPanelActions.value.find((action) => action.actionId === activeMapPanelActionId.value) ?? null;
});
const isMapActionChoiceDialogVisible = computed(() => Boolean(activeMapPanelAction.value?.choices?.length));

const isMenuButtonDisabled = computed(() => {
  if (!hasEnteredGame.value || activeInteractiveFiction.value || activeDirectionPadGame.value) {
    return true;
  }

  return showDialog.value;
});

const refreshSaveSummaries = () => {
  saveSummaries.value = listGameSaveFiles();
};

const refreshCurrentPlayerPosition = () => {
  currentPlayerPosition.value = getPlayerWorldPosition();
};

const openMenu = () => {
  if (isMenuButtonDisabled.value) {
    return;
  }

  refreshCurrentPlayerPosition();
  refreshSaveSummaries();
  closeMapActionChoiceDialog();
  isMenuOpen.value = true;
};

const handleMapPanelAction = (actionId) => {
  const mapAction = mapPanelActions.value.find((action) => action.actionId === actionId);

  if (mapAction?.choices?.length) {
    activeMapPanelActionId.value = actionId;
    return;
  }

  if (!mapAction?.resultNotification) {
    return;
  }

  pushNotification({
    text: mapAction.resultNotification.text,
    type: mapAction.resultNotification.type ?? 'neutral'
  });
};

const closeMapActionChoiceDialog = () => {
  activeMapPanelActionId.value = null;
};

const handleMapPanelActionChoice = (choiceId) => {
  const choice = activeMapPanelAction.value?.choices?.find((item) => item.id === choiceId);

  closeMapActionChoiceDialog();

  if (choice?.playerPortraitKey) {
    setPlayerPortrait(choice.playerPortraitKey);
  }

  if (choice?.appendPlayerStatus?.length) {
    setPlayerStatusInWorld([
      ...getPlayerRuntimeState().status,
      ...choice.appendPlayerStatus
    ]);
  }

  if (!choice?.resultNotification) {
    return;
  }

  pushNotification({
    text: choice.resultNotification.text,
    type: choice.resultNotification.type ?? 'neutral'
  });
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const resetPlayerPortraitLayerSelection = () => {
  const activeLayerAltSet = new Set((activePlayerPortrait.value.layers ?? [])
    .map((layer) => layer.alt)
    .filter(Boolean));

  selectedPlayerPortraitLayerKeys.value = playerPortraitLayerOptions
    .filter((layer) => activeLayerAltSet.has(layer.alt))
    .map((layer) => layer.key);
};

const openPortraitLayerDialog = () => {
  if (isMenuButtonDisabled.value) {
    return;
  }

  closeMapActionChoiceDialog();
  isPortraitLayerDialogOpen.value = true;
};

const closePortraitLayerDialog = () => {
  isPortraitLayerDialogOpen.value = false;
};

const togglePlayerPortraitLayer = (layerKey) => {
  if (selectedPlayerPortraitLayerKeys.value.includes(layerKey)) {
    selectedPlayerPortraitLayerKeys.value = selectedPlayerPortraitLayerKeys.value.filter((key) => key !== layerKey);
    return;
  }

  selectedPlayerPortraitLayerKeys.value = [...selectedPlayerPortraitLayerKeys.value, layerKey];
};

const openDialogueHistory = () => {
  if (!showDialog.value) {
    return;
  }

  isSceneImagePreviewing.value = false;
  isDialogueHistoryOpen.value = true;
};

const closeDialogueHistory = () => {
  isDialogueHistoryOpen.value = false;
};

const resetMapSessionState = (mapId = currentMapId.value) => {
  mapSessionState.value = {
    mapId,
    flags: {}
  };
};

const clearRuntimeErrors = () => {
  runtimeErrors.value = [];
};

const runWithoutPlayerStatusNotifications = (handler) => {
  shouldNotifyPlayerStatusChanges = false;

  try {
    return handler();
  } finally {
    shouldNotifyPlayerStatusChanges = true;
  }
};

const pushPlayerStatusChangeNotifications = ({ previousStatus, nextStatus }) => {
  if (!shouldNotifyPlayerStatusChanges) {
    return;
  }

  const previousStatusSet = new Set(previousStatus);
  const nextStatusSet = new Set(nextStatus);
  const addedStatus = nextStatus.filter((statusId) => !previousStatusSet.has(statusId));
  const removedStatus = previousStatus.filter((statusId) => !nextStatusSet.has(statusId));

  if (addedStatus.length > 0) {
    pushNotification({
      text: `状态增加：${resolvePlayerStatusLabels(addedStatus).join(' / ')}`,
      type: 'gain'
    });
  }

  if (removedStatus.length > 0) {
    pushNotification({
      text: `状态解除：${resolvePlayerStatusLabels(removedStatus).join(' / ')}`,
      type: 'loss'
    });
  }
};

const setMapSessionFlag = (flagId, value) => {
  mapSessionState.value = {
    mapId: currentMapId.value,
    flags: {
      ...mapSessionState.value.flags,
      [flagId]: value
    }
  };
};

const createCurrentGameSaveData = () => {
  const mapId = getCurrentMapId() ?? currentMapId.value;
  const position = getPlayerWorldPosition();

  if (!position) {
    return null;
  }

  return createGameSaveData({
    mapId,
    position,
    mapSession: mapSessionState.value,
    player: getPlayerRuntimeState()
  });
};

const handleAutoSaveGame = () => {
  const saveData = createCurrentGameSaveData();

  if (!saveData) {
    return;
  }

  saveGameToFile(saveData, AUTO_SAVE_SLOT_ID);
  currentPlayerPosition.value = saveData.location.position;
  refreshSaveSummaries();
};

const handleSaveGame = (slotId = undefined) => {
  const saveData = createCurrentGameSaveData();

  if (!saveData) {
    pushNotification({
      text: '现在还无法读取角色坐标，存档没有写入。',
      type: 'loss'
    });
    return;
  }

  const saveSummary = saveGameToFile(saveData, slotId);
  const feedbackText = slotId
    ? `已覆盖存档 ${saveSummary.slotId}。`
    : `已新增存档 ${saveSummary.slotId}。`;

  currentPlayerPosition.value = saveData.location.position;
  refreshSaveSummaries();
  pushNotification({
    text: feedbackText,
    type: 'neutral'
  });
};

const handleLoadGame = (slotId = 'default') => {
  const rawSaveData = loadGameFromFile(slotId);
  const saveData = parseGameSaveData(rawSaveData);

  if (!saveData || !getMapRegistryEntry(saveData.location.mapId) || !applyGameSaveData(saveData)) {
    pushNotification({
      text: '这个存档无法读取。',
      type: 'loss'
    });
    return;
  }

  activeEventId.value = null;
  activeMapPanelActionId.value = null;
  activeInteractiveFiction.value = null;
  activeDirectionPadGame.value = null;
  closeDialogue();
  mapSessionState.value = saveData.mapSession;
  currentMapId.value = saveData.location.mapId;
  currentPlayerPosition.value = saveData.location.position;
  setPlayerAppearance(saveData.player.appearanceId);
  runWithoutPlayerStatusNotifications(() => {
    setPlayerStatusInWorld(saveData.player.status);
  });
  shouldSkipNextMapAutosave = true;
  const didStartLoad = loadMapAtPosition(saveData.location.mapId, saveData.location.position);

  if (!didStartLoad) {
    shouldSkipNextMapAutosave = false;
    pushNotification({
      text: '地图正在切换中，暂时无法读取这个存档。',
      type: 'loss'
    });
    return;
  }

  closeMenu();
  pushNotification({
    text: '已读取存档。',
    type: 'neutral'
  });
};

const handleDeleteSave = (slotId) => {
  const didDelete = deleteGameSaveFile(slotId);
  const feedbackText = didDelete
    ? `已删除存档 ${slotId}。`
    : `没有找到存档 ${slotId}。`;

  refreshSaveSummaries();
  pushNotification({
    text: feedbackText,
    type: didDelete ? 'neutral' : 'loss'
  });
};

const handleDeleteAllSaves = () => {
  const deletedCount = deleteAllGameSaveFiles();

  refreshSaveSummaries();
  pushNotification({
    text: deletedCount > 0 ? `已清空 ${deletedCount} 个浏览器本机存档。` : '当前没有可清空的浏览器本机存档。',
    type: deletedCount > 0 ? 'neutral' : 'loss'
  });
};

const handleExportSaves = () => {
  exportAllGameSavesToLocalFile();
  pushNotification({
    text: '已生成全部存档 JSON 下载。',
    type: 'gain'
  });
};

const handleImportSaves = (text) => {
  try {
    const importCount = importGameSaveExportData(JSON.parse(text));
    refreshSaveSummaries();
    pushNotification({
      text: `已导入 ${importCount} 个存档。`,
      type: 'gain'
    });
  } catch (error) {
    pushNotification({
      text: error instanceof Error ? error.message : '导入存档失败。',
      type: 'loss'
    });
  }
};

const gameMenuOverlayListeners = {
  close: closeMenu,
  saveGame: handleSaveGame,
  loadGame: handleLoadGame,
  deleteSave: handleDeleteSave,
  deleteAllSaves: handleDeleteAllSaves,
  exportSaves: handleExportSaves,
  importSaves: handleImportSaves
};

const startInteractiveFiction = (scenarioId) => {
  const payload = interactiveFictionRunner.startScenario(scenarioId);

  if (!payload) {
    return false;
  }

  activeInteractiveFiction.value = payload;
  activeDirectionPadGame.value = null;
  closeMapActionChoiceDialog();
  isMenuOpen.value = false;
  isPortraitLayerDialogOpen.value = false;
  closeDialogue();
  return true;
};

const startDirectionPadGame = (gameId) => {
  const payload = directionPadGameRunner.startGame(gameId);

  if (!payload) {
    return false;
  }

  activeDirectionPadGame.value = payload;
  activeInteractiveFiction.value = null;
  closeMapActionChoiceDialog();
  isMenuOpen.value = false;
  isPortraitLayerDialogOpen.value = false;
  closeDialogue();
  return true;
};

const handleInteractiveFictionChoice = (choiceId) => {
  if (!activeInteractiveFiction.value) {
    return;
  }

  const payload = interactiveFictionRunner.selectChoice(activeInteractiveFiction.value.state, choiceId);

  if (payload) {
    activeInteractiveFiction.value = payload;
  }
};

const restartInteractiveFiction = () => {
  if (!activeInteractiveFiction.value) {
    return;
  }

  activeInteractiveFiction.value = interactiveFictionRunner.restartScenario(activeInteractiveFiction.value.state);
};

const leaveInteractiveFiction = () => {
  activeInteractiveFiction.value = null;
};

const handleDirectionPadPress = (direction, pressedAtMs = Date.now()) => {
  if (!activeDirectionPadGame.value) {
    return;
  }

  const payload = directionPadGameRunner.pressDirection(activeDirectionPadGame.value.state, direction, pressedAtMs);

  if (payload) {
    activeDirectionPadGame.value = payload;
  }
};

const handleDirectionPadExpire = (checkedAtMs = Date.now()) => {
  if (!activeDirectionPadGame.value) {
    return;
  }

  const currentState = activeDirectionPadGame.value.state;
  const payload = directionPadGameRunner.resolveExpiredNotes(currentState, checkedAtMs);

  if (payload && payload.state !== currentState) {
    activeDirectionPadGame.value = payload;
  }
};

const handleDirectionPadCountdownComplete = (checkedAtMs = Date.now()) => {
  if (!activeDirectionPadGame.value) {
    return;
  }

  const currentState = activeDirectionPadGame.value.state;
  const payload = directionPadGameRunner.completeCountdown(currentState, checkedAtMs);

  if (payload && payload.state !== currentState) {
    activeDirectionPadGame.value = payload;
  }
};

const restartDirectionPadGame = () => {
  if (!activeDirectionPadGame.value) {
    return;
  }

  activeDirectionPadGame.value = directionPadGameRunner.restartGame(activeDirectionPadGame.value.state);
};

const leaveDirectionPadGame = () => {
  activeDirectionPadGame.value = null;
};

const handleMenuShortcut = (event) => {
  if (event.key !== 'Escape' || event.repeat || !hasEnteredGame.value) {
    return;
  }

  if (isMenuOpen.value) {
    event.preventDefault();
    closeMenu();
    return;
  }

  if (isMenuButtonDisabled.value) {
    return;
  }

  event.preventDefault();
  openMenu();
};

const startNewJourney = async () => {
  activeEventId.value = null;
  activeMapPanelActionId.value = null;
  isMenuOpen.value = false;
  isPortraitLayerDialogOpen.value = false;
  currentMapId.value = INITIAL_MAP_ID;
  resetMapSessionState(INITIAL_MAP_ID);
  resetPlayerRuntimeState();
  resetPlayerPortraitLayerSelection();
  activeInteractiveFiction.value = null;
  activeDirectionPadGame.value = null;
  currentPlayerPosition.value = null;
  refreshSaveSummaries();
  closeDialogue();
  clearAllNotifications();
  clearRuntimeErrors();
  hasEnteredGame.value = true;
  await nextTick();
  shouldSkipNextMapAutosave = true;
  mountGame({});
};

const startSavedJourney = async (slotId = 'default') => {
  const rawSaveData = loadGameFromFile(slotId);
  const saveData = parseGameSaveData(rawSaveData);

  if (!saveData || !getMapRegistryEntry(saveData.location.mapId) || !applyGameSaveData(saveData)) {
    return;
  }

  activeEventId.value = null;
  activeMapPanelActionId.value = null;
  isMenuOpen.value = false;
  isPortraitLayerDialogOpen.value = false;
  mapSessionState.value = saveData.mapSession;
  currentMapId.value = saveData.location.mapId;
  currentPlayerPosition.value = saveData.location.position;
  activeInteractiveFiction.value = null;
  activeDirectionPadGame.value = null;
  resetPlayerPortraitLayerSelection();
  closeDialogue();
  clearAllNotifications();
  clearRuntimeErrors();
  hasEnteredGame.value = true;
  await nextTick();
  shouldSkipNextMapAutosave = true;
  mountGame({
    mapId: saveData.location.mapId,
    playerPosition: saveData.location.position
  });
  pushNotification({
    text: '已读取存档。',
    type: 'neutral'
  });
};

watch([showDialog, isMenuOpen, isPortraitLayerDialogOpen, isDialogueHistoryOpen, activeInteractiveFiction, activeDirectionPadGame, isMapActionChoiceDialogVisible], ([
  dialogVisible,
  menuVisible,
  portraitLayerDialogVisible,
  historyVisible,
  fictionPayload,
  directionPadPayload,
  mapActionChoiceVisible
]) => {
  if ((!dialogVisible || fictionPayload || directionPadPayload) && isDialogueHistoryOpen.value) {
    closeDialogueHistory();
  }

  setUiOverlayOpen(
    dialogVisible
    || menuVisible
    || portraitLayerDialogVisible
    || historyVisible
    || Boolean(fictionPayload)
    || Boolean(directionPadPayload)
    || mapActionChoiceVisible
  );
});

watch(hasActiveSceneImage, (hasSceneImage) => {
  if (!hasSceneImage) {
    isSceneImagePreviewing.value = false;
  }
});

watch(isMenuButtonDisabled, (disabled) => {
  if (disabled && isMenuOpen.value) {
    closeMenu();
  }

  if (disabled && isPortraitLayerDialogOpen.value) {
    closePortraitLayerDialog();
  }
});

watch(() => activePlayerPortrait.value.key, () => {
  resetPlayerPortraitLayerSelection();
}, { immediate: true });

watch(currentMapId, () => {
  closeMapActionChoiceDialog();
});

onMounted(() => {
  activeEventId.value = null;
  activeMapPanelActionId.value = null;
  isMenuOpen.value = false;
  isPortraitLayerDialogOpen.value = false;
  currentMapId.value = INITIAL_MAP_ID;
  resetMapSessionState(INITIAL_MAP_ID);
  resetPlayerRuntimeState();
  resetPlayerPortraitLayerSelection();
  activeInteractiveFiction.value = null;
  activeDirectionPadGame.value = null;
  currentPlayerPosition.value = null;
  refreshSaveSummaries();
  closeDialogue();
  clearAllNotifications();
  clearRuntimeErrors();
  window.addEventListener('keydown', handleMenuShortcut);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleMenuShortcut);
  activeEventId.value = null;
  activeMapPanelActionId.value = null;
  isMenuOpen.value = false;
  isPortraitLayerDialogOpen.value = false;
  currentMapId.value = INITIAL_MAP_ID;
  resetMapSessionState(INITIAL_MAP_ID);
  resetPlayerRuntimeState();
  resetPlayerPortraitLayerSelection();
  activeInteractiveFiction.value = null;
  activeDirectionPadGame.value = null;
  currentPlayerPosition.value = null;
  closeDialogue();
  clearAllNotifications();
  clearRuntimeErrors();
  destroyGame();
});
</script>

<style scoped>
.game-view-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top, rgba(255, 160, 244, 0.2), transparent 40%),
    linear-gradient(180deg, #2a1730 0%, #1b1024 100%);
  color: white;
}

.game-mode-stack {
  position: relative;
}

.game-mode-stack__overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: auto;
}

@media (max-width: 900px) {
  .game-view-container {
    padding: 12px;
  }
}
</style>
