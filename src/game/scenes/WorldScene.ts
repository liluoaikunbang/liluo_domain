import * as Phaser from 'phaser';
import { SceneKeys } from '../core/SceneKeys';
import { eventRunner, type DialoguePayload, type EventMapTransitionData } from '../core/EventRunner';
import {
  defaultPlayerPortraitKey,
  getPlayerPortraitKey,
  getPlayerStatusList,
  setPlayerPortrait
} from '../core/playerRuntime';
import { resolveWorldSceneInitData, type WorldSceneInitData } from '../systems/map/MapLoader';
import { resolveInteractionInputGate } from '../systems/character/interactionInputGate';
import {
  createWorldSceneRuntime,
  type WorldSceneRuntime
} from '../systems/map/worldSceneRuntime';

export default class WorldScene extends Phaser.Scene {
  private static readonly MAP_TRANSITION_FADE_OUT_DURATION = 120;
  private runtime: WorldSceneRuntime | null = null;
  private dialogCallback?: (dialogue: DialoguePayload) => void;
  private eventExecutionCallback?: (eventId: string) => void;
  private interactionChangeCallback?: (eventId: string | null) => void;
  private mapChangeCallback?: (mapId: string) => void;
  private playerStatusChangeCallback?: (change: { previousStatus: string[]; nextStatus: string[] }) => void;
  private mapSessionFlagCallbacks: {
    get?: (flagId: string) => boolean;
    set?: (flagId: string, value: boolean) => boolean;
  } = {};
  private dialogKeyTriggered: boolean = false;
  private isUiOverlayOpen: boolean = false;
  private currentInteractionEventId: string | null = null;
  private isMapTransitioning: boolean = false;

  constructor() {
    super({ key: SceneKeys.WORLD });
  }

  private bindRuntimeListeners(): void {
    if (!this.runtime) {
      return;
    }

    this.scale.on('resize', this.runtime.handleScaleResize);
    this.input.on('pointerdown', this.runtime.handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.detachRuntimeListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.detachRuntimeListeners, this);
  }

  private detachRuntimeListeners(): void {
    if (!this.runtime) {
      return;
    }

    this.scale.off('resize', this.runtime.handleScaleResize);
    this.input.off('pointerdown', this.runtime.handlePointerDown);
  }

  create(data?: Partial<WorldSceneInitData>): void {
    const worldSceneInitData = resolveWorldSceneInitData(data);
    this.detachRuntimeListeners();
    this.isMapTransitioning = false;
    this.runtime = createWorldSceneRuntime(this, worldSceneInitData, {
      isInputBlocked: () => this.isUiOverlayOpen || this.isMapTransitioning
    });
    this.dialogKeyTriggered = false;
    this.currentInteractionEventId = null;

    this.bindRuntimeListeners();

    if (worldSceneInitData.fadeInDuration && worldSceneInitData.fadeInDuration > 0) {
      this.cameras.main.fadeIn(worldSceneInitData.fadeInDuration, 0, 0, 0);
    }

    this.refreshInteractionState();
    this.mapChangeCallback?.(worldSceneInitData.mapId);
    this.game.events.emit('world-scene-ready');
  }

  update(time: number, delta: number): void {
    if (!this.runtime) return;

    this.runtime.update(delta);

    this.refreshInteractionState();
    this.handleInteraction();
  }

  private refreshInteractionState(): void {
    if (this.isMapTransitioning) {
      if (this.currentInteractionEventId !== null) {
        this.currentInteractionEventId = null;
        this.interactionChangeCallback?.(null);
      }

      return;
    }

    if (!this.runtime || this.runtime.manualEventTileKeys.size === 0) {
      if (this.currentInteractionEventId !== null) {
        this.currentInteractionEventId = null;
        this.interactionChangeCallback?.(null);
      }

      return;
    }

    const { tileX, tileY } = this.runtime.getPlayerTilePosition();
    const nextInteractionEventId = this.runtime.getManualEventsAtTile(tileX, tileY)[0]?.eventId ?? null;

    if (nextInteractionEventId === this.currentInteractionEventId) {
      return;
    }

    this.currentInteractionEventId = nextInteractionEventId;
    this.interactionChangeCallback?.(this.currentInteractionEventId);
  }

  private handleInteraction(): void {
    if (!this.runtime || this.isMapTransitioning) {
      return;
    }

    const interactionGate = resolveInteractionInputGate({
      isInteractionPressed: this.runtime.interactionKey.isDown || this.runtime.spaceKey.isDown,
      dialogKeyTriggered: this.dialogKeyTriggered,
      isUiOverlayOpen: this.isUiOverlayOpen,
      hasInteractionEvent: Boolean(this.currentInteractionEventId)
    });

    this.dialogKeyTriggered = interactionGate.nextDialogKeyTriggered;

    if (interactionGate.shouldTriggerInteraction) {
      this.triggerCurrentInteraction();
    }
  }

  public triggerCurrentInteraction(): void {
    if (!this.currentInteractionEventId) {
      return;
    }

    this.triggerEvent(this.currentInteractionEventId);
  }

  private triggerEvent(eventId: string): void {
    if (!eventId) {
      return;
    }

    if (this.isMapTransitioning) {
      return;
    }

    const eventResult = eventRunner.runEvent(eventId, {
      setTimeOfDay: (timeOfDayId) => this.runtime?.setTimeOfDay(timeOfDayId) ?? false,
      setWeather: (weatherId) => this.runtime?.setWeather(weatherId) ?? false,
      setPlayerAppearance: (appearanceId) => this.runtime?.setPlayerAppearance(appearanceId) ?? false,
      setPlayerStatus: (statusList) => this.setPlayerStatus(statusList),
      setPlayerPortrait: (portraitKey) => setPlayerPortrait(portraitKey) !== null,
      getMapSessionFlag: (flagId) => this.mapSessionFlagCallbacks.get?.(flagId) ?? false,
      setMapSessionFlag: (flagId, value) => this.mapSessionFlagCallbacks.set?.(flagId, value) ?? false,
      isPlayerPortraitDefault: () => getPlayerPortraitKey() === defaultPlayerPortraitKey,
      changeMap: (transition) => this.changeMap(transition),
      playSoundEffect: (soundKey) => this.playSoundEffect(soundKey)
    });
    const dialogue = eventResult.dialogue;

    if (eventResult.didExecute) {
      this.eventExecutionCallback?.(eventId);
    }

    if (dialogue) {
      this.dialogCallback?.(dialogue);
    }
  }

  public setTimeOfDay(timeOfDayId: string): boolean {
    return this.runtime?.setTimeOfDay(timeOfDayId) ?? false;
  }

  public setWeather(weatherId: string): boolean {
    return this.runtime?.setWeather(weatherId) ?? false;
  }

  public playSoundEffect(soundKey: string): boolean {
    if (!soundKey || !this.cache.audio.exists(soundKey)) {
      console.warn(`[WorldScene] 未找到音效资源: ${soundKey}`);
      return false;
    }

    this.sound.play(soundKey);
    return true;
  }

  public setPlayerAppearance(appearanceId: string): boolean {
    return this.runtime?.setPlayerAppearance(appearanceId) ?? false;
  }

  public setPlayerStatus(statusList: ReadonlyArray<string>): boolean {
    if (!this.runtime) {
      return false;
    }

    const previousStatus = getPlayerStatusList();
    const didApply = this.runtime.setPlayerStatus(statusList);

    if (!didApply) {
      return false;
    }

    const nextStatus = getPlayerStatusList();
    const previousStatusKey = previousStatus.join('\n');
    const nextStatusKey = nextStatus.join('\n');

    if (previousStatusKey !== nextStatusKey) {
      this.playerStatusChangeCallback?.({
        previousStatus,
        nextStatus
      });
    }

    return true;
  }

  public getPlayerWorldPosition(): { x: number; y: number } | null {
    return this.runtime?.getPlayerWorldPosition() ?? null;
  }

  public getCurrentMapId(): string | null {
    return this.runtime?.currentMapId ?? null;
  }

  public loadMapAtPosition(mapId: string, position: { x: number; y: number }): boolean {
    if (this.isMapTransitioning) {
      return false;
    }

    this.isMapTransitioning = true;
    this.currentInteractionEventId = null;
    this.interactionChangeCallback?.(null);
    this.dialogKeyTriggered = true;

    this.scene.start(SceneKeys.MAP_LOADING, {
      mapId,
      playerPosition: position,
      fadeInDuration: WorldScene.MAP_TRANSITION_FADE_OUT_DURATION
    });

    return true;
  }

  public changeMap({ mapId, spawnId, spawnMarker }: EventMapTransitionData): boolean {
    if (this.isMapTransitioning) {
      return false;
    }

    this.isMapTransitioning = true;
    this.currentInteractionEventId = null;
    this.interactionChangeCallback?.(null);
    this.dialogKeyTriggered = true;

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKeys.MAP_LOADING, {
        mapId,
        spawnId,
        spawnMarker,
        fadeInDuration: WorldScene.MAP_TRANSITION_FADE_OUT_DURATION
      });
    });

    this.cameras.main.fadeOut(WorldScene.MAP_TRANSITION_FADE_OUT_DURATION, 0, 0, 0);

    return true;
  }

  public setDialogCallback(callback?: (dialogue: DialoguePayload) => void): void {
    this.dialogCallback = callback;
  }

  public setEventExecutionCallback(callback?: (eventId: string) => void): void {
    this.eventExecutionCallback = callback;
  }

  public setUiOverlayOpen(isOpen: boolean): void {
    this.isUiOverlayOpen = isOpen;

    if (isOpen) {
      this.dialogKeyTriggered = true;
    }
  }

  public setInteractionChangeCallback(callback?: (eventId: string | null) => void): void {
    this.interactionChangeCallback = callback;
    this.interactionChangeCallback?.(this.currentInteractionEventId);
  }

  public setMapChangeCallback(callback?: (mapId: string) => void): void {
    this.mapChangeCallback = callback;

    if (callback && this.runtime?.currentMapId) {
      callback(this.runtime.currentMapId);
    }
  }

  public setPlayerStatusChangeCallback(
    callback?: (change: { previousStatus: string[]; nextStatus: string[] }) => void
  ): void {
    this.playerStatusChangeCallback = callback;
  }

  public setMapSessionFlagCallbacks(callbacks: {
    get?: (flagId: string) => boolean;
    set?: (flagId: string, value: boolean) => boolean;
  } = {}): void {
    this.mapSessionFlagCallbacks = callbacks;
  }
}
