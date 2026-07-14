import * as Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import MapLoadingScene from '../scenes/MapLoadingScene';
import WorldScene from '../scenes/WorldScene';
import type { DialoguePayload } from './EventRunner';
import { SceneKeys } from './SceneKeys';
import type { GameRuntimeErrorHandler } from './runtimeError';
import type { GameLoadingProgressHandler } from './loadingProgress';
import type { WorldSceneInitRequest } from '../systems/map/MapLoader';

interface PhaserUiCallbacks {
  onDialogTrigger?: (dialogue: DialoguePayload) => void;
  onEventExecute?: (eventId: string) => void;
  onInteractionChange?: (eventId: string | null) => void;
  onMapChange?: (mapId: string) => void;
  onPlayerStatusChange?: (change: { previousStatus: string[]; nextStatus: string[] }) => void;
  getMapSessionFlag?: (flagId: string) => boolean;
  setMapSessionFlag?: (flagId: string, value: boolean) => boolean;
  onRuntimeError?: GameRuntimeErrorHandler;
  onLoadingProgress?: GameLoadingProgressHandler;
}

interface PhaserGameOptions extends PhaserUiCallbacks {
  initialWorldSceneRequest?: WorldSceneInitRequest;
}

/**
 * Creates and initializes a Phaser.Game instance
 * @param container - DOM element where the game will be rendered
 * @param options - Vue 侧 UI 回调与初始进入地图请求
 * @returns Phaser.Game instance
 */
export function createPhaserGame(container: HTMLElement, options: PhaserGameOptions = {}): any {
  const {
    initialWorldSceneRequest = {},
    onDialogTrigger,
    onEventExecute,
    onInteractionChange,
    onMapChange,
    onPlayerStatusChange,
    getMapSessionFlag,
    setMapSessionFlag,
    onRuntimeError,
    onLoadingProgress
  } = options;

  const config: any = {
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      new BootScene(initialWorldSceneRequest, onRuntimeError, onLoadingProgress),
      new MapLoadingScene(onRuntimeError, onLoadingProgress),
      WorldScene
    ],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
  };

  const game = new Phaser.Game(config);

  const syncSceneCallbacks = () => {
    const worldScene = game.scene.getScene(SceneKeys.WORLD);
    if (worldScene && 'setDialogCallback' in worldScene) {
      (worldScene as any).setDialogCallback(onDialogTrigger);
    }

    if (worldScene && 'setEventExecutionCallback' in worldScene) {
      (worldScene as any).setEventExecutionCallback(onEventExecute);
    }

    if (worldScene && 'setInteractionChangeCallback' in worldScene) {
      (worldScene as any).setInteractionChangeCallback(onInteractionChange);
    }

    if (worldScene && 'setMapChangeCallback' in worldScene) {
      (worldScene as any).setMapChangeCallback(onMapChange);
    }

    if (worldScene && 'setPlayerStatusChangeCallback' in worldScene) {
      (worldScene as any).setPlayerStatusChangeCallback(onPlayerStatusChange);
    }

    if (worldScene && 'setMapSessionFlagCallbacks' in worldScene) {
      (worldScene as any).setMapSessionFlagCallbacks({
        get: getMapSessionFlag,
        set: setMapSessionFlag
      });
    }
  };

  game.events.on('world-scene-ready', syncSceneCallbacks);

  return game;
}
