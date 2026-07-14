import * as Phaser from 'phaser';
import { SceneKeys } from '../core/SceneKeys';
import { prepareAssetBundle, queueAssetBundle } from '../data/assets';
import { globalAssetBundle } from '../data/globalAssets';
import { getAllPlayerCharacterDefinitions } from '../data/playerCharacter';
import { prepareCharacterAssets } from '../systems/animation/character/prepareCharacterAssets';
import type { WorldSceneInitRequest } from '../systems/map/MapLoader';
import {
  createLoaderErrorMessage,
  type GameRuntimeErrorHandler
} from '../core/runtimeError';
import {
  clampLoadingProgress,
  type GameLoadingProgressHandler
} from '../core/loadingProgress';

export default class BootScene extends Phaser.Scene {
  constructor(
    private readonly initialWorldSceneRequest: WorldSceneInitRequest = {},
    private readonly onRuntimeError?: GameRuntimeErrorHandler,
    private readonly onLoadingProgress?: GameLoadingProgressHandler
  ) {
    super({ key: SceneKeys.BOOT });
  }

  preload(): void {
    this.reportLoadingProgress('准备进入地图...', 0.02, true);
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      this.reportLoadingProgress('载入全局素材...', 0.02 + clampLoadingProgress(progress) * 0.68, true);
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`[BootScene] 资源加载失败: ${file.key}`, file.src);
      this.onRuntimeError?.({
        title: '全局资源加载失败',
        message: createLoaderErrorMessage(file),
        source: SceneKeys.BOOT
      });
    });

    queueAssetBundle(this, globalAssetBundle);
  }

  create(): void {
    this.reportLoadingProgress('生成角色图层...', 0.74, true);

    this.time.delayedCall(0, () => {
      prepareAssetBundle(this, globalAssetBundle);
      prepareCharacterAssets(this, getAllPlayerCharacterDefinitions());
      this.reportLoadingProgress('角色图层准备完成...', 0.9, true);

      // BootScene 只负责启动，将外部提供的初始进入请求转交给地图加载场景。
      this.scene.start(SceneKeys.MAP_LOADING, this.initialWorldSceneRequest);
    });
  }

  private reportLoadingProgress(label: string, progress: number, isLoading: boolean): void {
    this.onLoadingProgress?.({
      phase: 'boot',
      label,
      progress: clampLoadingProgress(progress),
      isLoading
    });
  }
}
