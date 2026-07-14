import * as Phaser from 'phaser';
import { SceneKeys } from '../core/SceneKeys';
import {
  createLoaderErrorMessage,
  type GameRuntimeErrorHandler
} from '../core/runtimeError';
import {
  clampLoadingProgress,
  type GameLoadingProgressHandler
} from '../core/loadingProgress';
import { prepareAssetBundle, queueAssetBundle } from '../data/assets';
import { getMapRegistryEntry, type GameMapRegistryEntry } from '../data/registry';
import { registerAnimationBundle } from '../systems/animation/registerAnimationBundle';
import {
  resolveWorldSceneInitData,
  type WorldSceneInitData,
  type WorldSceneInitRequest
} from '../systems/map/MapLoader';

export default class MapLoadingScene extends Phaser.Scene {
  private worldSceneInitRequest: WorldSceneInitRequest = {};
  private resolvedInitData: WorldSceneInitData | null = null;
  private resolvedMapRegistryEntry: GameMapRegistryEntry | null = null;

  constructor(
    private readonly onRuntimeError?: GameRuntimeErrorHandler,
    private readonly onLoadingProgress?: GameLoadingProgressHandler
  ) {
    super({ key: SceneKeys.MAP_LOADING });
  }

  init(data?: WorldSceneInitRequest): void {
    this.worldSceneInitRequest = data ?? {};
    try {
      this.resolvedInitData = resolveWorldSceneInitData(this.worldSceneInitRequest);
      this.resolvedMapRegistryEntry = getMapRegistryEntry(this.resolvedInitData.mapId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '地图初始化数据解析失败。';
      this.onRuntimeError?.({
        title: '地图加载失败',
        message,
        source: SceneKeys.MAP_LOADING
      });
      throw error;
    }
  }

  preload(): void {
    const mapName = this.resolvedMapRegistryEntry?.name ?? this.resolvedInitData?.mapId ?? '未知地图';
    const handleLoadError = (file: Phaser.Loader.File) => {
      console.error(`[MapLoadingScene] 地图资源加载失败: ${file.key}`, file.src);
      this.onRuntimeError?.({
        title: '地图资源加载失败',
        message: createLoaderErrorMessage(file),
        detail: this.resolvedInitData?.mapId ? `mapId=${this.resolvedInitData.mapId}` : undefined,
        source: SceneKeys.MAP_LOADING
      });
    };
    const handleLoadProgress = (progress: number) => {
      this.reportLoadingProgress(`载入地图：${mapName}`, 0.08 + clampLoadingProgress(progress) * 0.78, true);
    };

    this.reportLoadingProgress(`准备地图：${mapName}`, 0.04, true);
    this.load.on(Phaser.Loader.Events.PROGRESS, handleLoadProgress);
    this.load.on('loaderror', handleLoadError);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.load.off(Phaser.Loader.Events.PROGRESS, handleLoadProgress);
      this.load.off('loaderror', handleLoadError);
      this.reportLoadingProgress(`整理地图：${mapName}`, 0.9, true);
    });

    queueAssetBundle(this, this.resolvedMapRegistryEntry?.assets);
  }

  create(): void {
    if (!this.resolvedInitData) {
      this.onRuntimeError?.({
        title: '地图加载失败',
        message: '缺少已解析的地图初始化数据。',
        source: SceneKeys.MAP_LOADING
      });
      throw new Error('[MapLoadingScene] 缺少已解析的地图初始化数据');
    }

    prepareAssetBundle(this, this.resolvedMapRegistryEntry?.assets);
    registerAnimationBundle(this, this.resolvedMapRegistryEntry?.animations);
    this.reportLoadingProgress('进入地图...', 1, false);
    this.scene.start(SceneKeys.WORLD, this.resolvedInitData);
  }

  private reportLoadingProgress(label: string, progress: number, isLoading: boolean): void {
    this.onLoadingProgress?.({
      phase: 'map',
      label,
      progress: clampLoadingProgress(progress),
      isLoading,
      mapId: this.resolvedInitData?.mapId
    });
  }
}
