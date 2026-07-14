import { createPhaserGame } from '../../core/createPhaserGame';
import { SceneKeys } from '../../core/SceneKeys';
import type { DialoguePayload } from '../../core/EventRunner';
import type { EventMapTransitionData } from '../../core/EventRunner';
import type { GameRuntimeError } from '../../core/runtimeError';
import type { GameLoadingProgress } from '../../core/loadingProgress';
import type { WorldSceneInitRequest } from '../../systems/map/MapLoader';

interface PhaserWorldSceneBridge {
  triggerCurrentInteraction?: () => void;
  setTimeOfDay?: (timeOfDayId: string) => boolean;
  setWeather?: (weatherId: string) => boolean;
  setPlayerAppearance?: (appearanceId: string) => boolean;
  setPlayerStatus?: (statusList: ReadonlyArray<string>) => boolean;
  playSoundEffect?: (soundKey: string) => boolean;
  changeMap?: (transition: EventMapTransitionData) => boolean;
  getCurrentMapId?: () => string | null;
  getPlayerWorldPosition?: () => { x: number; y: number } | null;
  loadMapAtPosition?: (mapId: string, position: { x: number; y: number }) => boolean;
  setUiOverlayOpen?: (isOpen: boolean) => void;
}

interface UsePhaserGameBridgeOptions {
  containerId?: string;
  onDialogTrigger?: (dialogue: DialoguePayload) => void;
  onEventExecute?: (eventId: string) => void;
  onInteractionChange?: (eventId: string | null) => void;
  onMapChange?: (mapId: string) => void;
  onPlayerStatusChange?: (change: { previousStatus: string[]; nextStatus: string[] }) => void;
  onRuntimeError?: (error: GameRuntimeError) => void;
  onLoadingProgress?: (progress: GameLoadingProgress) => void;
  getMapSessionFlag?: (flagId: string) => boolean;
  setMapSessionFlag?: (flagId: string, value: boolean) => boolean;
}

export function usePhaserGameBridge({
  containerId,
  onDialogTrigger,
  onEventExecute,
  onInteractionChange,
  onMapChange,
  onPlayerStatusChange,
  onRuntimeError,
  onLoadingProgress,
  getMapSessionFlag,
  setMapSessionFlag
}: UsePhaserGameBridgeOptions) {
  let game: any = null;

  const resolveContainer = () => {
    if (!containerId) {
      return null;
    }

    return document.getElementById(containerId);
  };

  const destroyGame = () => {
    if (game) {
      game.destroy(true);
      game = null;
    }
  };

  const getWorldScene = (): PhaserWorldSceneBridge | null => {
    if (!game?.scene) {
      return null;
    }

    return game.scene.getScene(SceneKeys.WORLD) as PhaserWorldSceneBridge;
  };

  const withWorldScene = <T>(handler: (worldScene: PhaserWorldSceneBridge) => T): T | undefined => {
    const worldScene = getWorldScene();

    if (!worldScene) {
      return undefined;
    }

    return handler(worldScene);
  };

  const mountGame = (initialWorldSceneRequest: WorldSceneInitRequest = {}) => {
    const container = resolveContainer();

    if (!container) {
      return;
    }

    destroyGame();

    game = createPhaserGame(container, {
      initialWorldSceneRequest,
      onDialogTrigger,
      onEventExecute,
      onInteractionChange,
      onMapChange,
      onPlayerStatusChange,
      onRuntimeError,
      onLoadingProgress,
      getMapSessionFlag,
      setMapSessionFlag
    });
  };

  const triggerCurrentInteraction = () => {
    withWorldScene((worldScene) => {
      worldScene.triggerCurrentInteraction?.();
    });
  };

  const setTimeOfDay = (timeOfDayId: string) => {
    return withWorldScene((worldScene) => worldScene.setTimeOfDay?.(timeOfDayId) ?? false) ?? false;
  };

  const setWeather = (weatherId: string) => {
    return withWorldScene((worldScene) => worldScene.setWeather?.(weatherId) ?? false) ?? false;
  };

  const setPlayerAppearance = (appearanceId: string) => {
    return withWorldScene((worldScene) => worldScene.setPlayerAppearance?.(appearanceId) ?? false) ?? false;
  };

  const setPlayerStatus = (statusList: ReadonlyArray<string>) => {
    return withWorldScene((worldScene) => worldScene.setPlayerStatus?.(statusList) ?? false) ?? false;
  };

  const playSoundEffect = (soundKey: string) => {
    return withWorldScene((worldScene) => worldScene.playSoundEffect?.(soundKey) ?? false) ?? false;
  };

  const changeMap = (transition: EventMapTransitionData) => {
    return withWorldScene((worldScene) => worldScene.changeMap?.(transition) ?? false) ?? false;
  };

  const getCurrentMapId = () => {
    return withWorldScene((worldScene) => worldScene.getCurrentMapId?.() ?? null) ?? null;
  };

  const getPlayerWorldPosition = () => {
    return withWorldScene((worldScene) => worldScene.getPlayerWorldPosition?.() ?? null) ?? null;
  };

  const loadMapAtPosition = (mapId: string, position: { x: number; y: number }) => {
    return withWorldScene((worldScene) => worldScene.loadMapAtPosition?.(mapId, position) ?? false) ?? false;
  };

  const setUiOverlayOpen = (visible: boolean) => {
    withWorldScene((worldScene) => {
      worldScene.setUiOverlayOpen?.(visible);
    });
  };

  return {
    mountGame,
    destroyGame,
    triggerCurrentInteraction,
    setTimeOfDay,
    setWeather,
    setPlayerAppearance,
    setPlayerStatus,
    playSoundEffect,
    changeMap,
    getCurrentMapId,
    getPlayerWorldPosition,
    loadMapAtPosition,
    setUiOverlayOpen
  };
}
