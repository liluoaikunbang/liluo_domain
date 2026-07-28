import * as Phaser from 'phaser';
import {
  getPlayerCharacterDefinition
} from '../../data/playerCharacter';
import {
  resolvePlayerRuntimeCharacterDefinition,
  resolvePlayerRuntimeVisionPresentation,
  setPlayerAppearance as setPlayerRuntimeAppearance,
  setPlayerStatus as setPlayerRuntimeStatus
} from '../../core/playerRuntime';
import type { WorldSceneInitData } from './MapLoader';
import type { EventMapTransitionSpawnMarkerData } from '../../core/EventRunner';
import { getMapRegistryEntry } from '../../data/registry';
import { computeCameraLayout, computeMapContentBounds } from './cameraLayout';
import { createCollisionRuntime } from './collision';
import { createPlayerController } from '../character/playerController';
import { createTimeOfDayOverlayController } from '../environment/timeOfDayOverlay';
import { createManualEventRegistry, type ManualEventRegistry } from './manualEventRegistry';
import { renderTileLayers } from './renderers/tileLayerRenderer';
import { createForegroundTileOverlay } from './foregroundTileOverlay';
import {
  renderWorldAnimations,
  shouldHideAnimatedSourceLayer
} from './renderers/worldAnimationRenderer';
import {
  renderNpcReplacements,
  shouldSkipNpcReplacementSourceTile
} from './renderers/npcReplacementRenderer';
import { renderWorldHints } from './renderers/worldHintRenderer';
import {
  getMapObject,
  getNonEmptyTilePositionsForLayer,
  normalizeRuntimeMapData
} from './runtimeMapNormalizer';
import {
  findNearestWalkableSpawnPosition,
  getFallbackPlayerSpawnPosition,
  type WorldPosition
} from './spawnPositionRules';
import type { TimeOfDayId, WeatherId } from '../../data/timeOfDay';
import {
  getLayeredCharacterTextureAnchor,
  resolveCharacterTextureDisplayOrigin
} from '../animation/character/layeredCharacterTexture.ts';

type MapViewportConfig = {
  smallMap: {
    fitStrategy: 'fit-short-side';
    allowZoomIn: boolean;
  };
  largeMap: {
    zoom: number;
  };
  cameraMode?: 'follow-player' | 'static-centered';
};

const HOP_CYCLE_RADIANS = Math.PI * 2;
const BLIND_MASK_DEPTH = 90;
const PLAYER_RENDER_DEPTH = 20;

const DEFAULT_MAP_VIEWPORT_CONFIG: MapViewportConfig = {
  smallMap: {
    fitStrategy: 'fit-short-side',
    allowZoomIn: true
  },
  largeMap: {
    zoom: 1
  },
  cameraMode: 'follow-player'
};

function resolveMarkerTilePosition(
  mapData: any,
  marker: EventMapTransitionSpawnMarkerData
): { tileX: number; tileY: number } | null {
  const tileMarkerPositions = getNonEmptyTilePositionsForLayer(mapData, marker.layerName);

  if (tileMarkerPositions.length === 0) {
    return null;
  }

  const sortedTileMarkerPositions = [...tileMarkerPositions].sort((left, right) => {
    if (left.tileY !== right.tileY) {
      return left.tileY - right.tileY;
    }

    return left.tileX - right.tileX;
  });

  if (marker.anchor === 'bottom-left') {
    const maxTileY = Math.max(...sortedTileMarkerPositions.map((position) => position.tileY));
    return sortedTileMarkerPositions.find((position) => position.tileY === maxTileY) ?? sortedTileMarkerPositions[0];
  }

  if (marker.anchor === 'center') {
    const minTileX = Math.min(...sortedTileMarkerPositions.map((position) => position.tileX));
    const maxTileX = Math.max(...sortedTileMarkerPositions.map((position) => position.tileX));
    const minTileY = Math.min(...sortedTileMarkerPositions.map((position) => position.tileY));
    const maxTileY = Math.max(...sortedTileMarkerPositions.map((position) => position.tileY));
    const centerTileX = (minTileX + maxTileX) / 2;
    const centerTileY = (minTileY + maxTileY) / 2;

    return sortedTileMarkerPositions
      .sort((left, right) => {
        const leftDistance = Math.abs(left.tileX - centerTileX) + Math.abs(left.tileY - centerTileY);
        const rightDistance = Math.abs(right.tileX - centerTileX) + Math.abs(right.tileY - centerTileY);
        return leftDistance - rightDistance || left.tileY - right.tileY || left.tileX - right.tileX;
      })[0];
  }

  return sortedTileMarkerPositions[0];
}

function resolveSpawnPoint(
  mapData: any,
  options: {
    spawnId?: string;
    spawnMarker?: EventMapTransitionSpawnMarkerData;
  },
  tileSize: number
): WorldPosition | null {
  if (options.spawnMarker) {
    const tileMarkerPosition = resolveMarkerTilePosition(mapData, options.spawnMarker);

    if (tileMarkerPosition) {
      return {
        x: tileMarkerPosition.tileX * tileSize + tileSize / 2,
        y: tileMarkerPosition.tileY * tileSize + tileSize / 2
      };
    }
  }

  if (!options.spawnId) {
    return null;
  }

  const spawnObject = getMapObject(mapData, options.spawnId);

  if (spawnObject) {
    return { x: spawnObject.x, y: spawnObject.y };
  }

  const tileMarkerPosition = getNonEmptyTilePositionsForLayer(mapData, options.spawnId)[0];

  if (!tileMarkerPosition) {
    return null;
  }

  return {
    x: tileMarkerPosition.tileX * tileSize + tileSize / 2,
    y: tileMarkerPosition.tileY * tileSize + tileSize / 2
  };
}

export interface WorldSceneRuntime {
  currentMapId: string;
  interactionKey: Phaser.Input.Keyboard.Key;
  spaceKey: Phaser.Input.Keyboard.Key;
  manualEventTileKeys: ReadonlySet<string>;
  getManualEventsAtTile: ManualEventRegistry['getEventsAtTile'];
  setTimeOfDay: (timeOfDayId: string) => boolean;
  setWeather: (weatherId: string) => boolean;
  setPlayerAppearance: (appearanceId: string) => boolean;
  setPlayerStatus: (statusList: ReadonlyArray<string>) => boolean;
  getActiveTimeOfDayId: () => TimeOfDayId;
  getActiveWeatherId: () => WeatherId;
  update: (delta: number) => void;
  handleScaleResize: () => void;
  handlePointerDown: (pointer: Phaser.Input.Pointer) => void;
  getPlayerTilePosition: () => { tileX: number; tileY: number };
  getPlayerWorldPosition: () => WorldPosition;
}

export function createWorldSceneRuntime(
  scene: Phaser.Scene,
  worldSceneInitData: WorldSceneInitData,
  options: {
    isInputBlocked?: () => boolean;
    moveSpeed?: number;
    mapViewportConfig?: MapViewportConfig;
  } = {}
): WorldSceneRuntime {
  const currentMapId = worldSceneInitData.mapId;
  const currentMapRegistryEntry = getMapRegistryEntry(currentMapId);
  const configuredMapViewport = currentMapRegistryEntry?.viewport;
  const npcReplacements = currentMapRegistryEntry?.worldRender?.npcReplacements ?? [];
  const mapViewportConfig: MapViewportConfig = {
    smallMap: {
      ...DEFAULT_MAP_VIEWPORT_CONFIG.smallMap,
      ...options.mapViewportConfig?.smallMap,
      allowZoomIn:
        configuredMapViewport?.smallMapAdaptiveFit
        ?? options.mapViewportConfig?.smallMap?.allowZoomIn
        ?? DEFAULT_MAP_VIEWPORT_CONFIG.smallMap.allowZoomIn
    },
    largeMap: {
      ...DEFAULT_MAP_VIEWPORT_CONFIG.largeMap,
      ...options.mapViewportConfig?.largeMap
    },
    cameraMode:
      configuredMapViewport?.cameraMode
      ?? options.mapViewportConfig?.cameraMode
      ?? DEFAULT_MAP_VIEWPORT_CONFIG.cameraMode
  };
  const mapData = normalizeRuntimeMapData(currentMapId, worldSceneInitData.mapData as any);
  const tileSize = mapData.tilewidth;
  const mapWidth = mapData.width;
  const mapHeight = mapData.height;
  const mapCharacterScale = worldSceneInitData.playerScale ?? 1;
  const manualEventRegistry = createManualEventRegistry(currentMapId, mapData);
  let activeCharacterDefinition = resolvePlayerRuntimeCharacterDefinition();
  let activeVisionPresentation = resolvePlayerRuntimeVisionPresentation();
  const moveSpeed = options.moveSpeed ?? activeCharacterDefinition.defaultMoveSpeed;
  const mapContentBounds = computeMapContentBounds(mapData, {
    mapWidth,
    mapHeight,
    tileSize
  });
  const manualEventTileKeys = manualEventRegistry.manualEventTileKeys;
  const collisionRuntime = createCollisionRuntime(mapData, {
    mapWidth,
    mapHeight,
    tileSize,
    playerCollisionBox: activeCharacterDefinition.collisionBox
  });

  renderTileLayers(scene, mapData, {
    tileSize,
    shouldSkipLayer: (layer: any) => shouldHideAnimatedSourceLayer(scene, layer, currentMapId),
    shouldSkipTile: ({ layer, tileset }) => shouldSkipNpcReplacementSourceTile({
      npcReplacements,
      layer,
      tileset
    }),
    playerDepth: PLAYER_RENDER_DEPTH,
    collisionMap: collisionRuntime.collisionMap
  });
  renderWorldAnimations(scene, mapData, currentMapId);
  renderNpcReplacements(scene, mapData, npcReplacements, {
    mapCharacterScale
  });
  renderWorldHints(scene, mapData, currentMapId);
  const timeOfDayOverlay = createTimeOfDayOverlayController(scene);

  scene.cameras.main.setBackgroundColor('#1a1a2e');
  scene.cameras.main.roundPixels = true;

  const autoPathGraphics = scene.add.graphics();
  autoPathGraphics.setDepth(19);

  const savedPlayerPosition = worldSceneInitData.playerPosition;
  const spawnPoint = savedPlayerPosition && Number.isFinite(savedPlayerPosition.x) && Number.isFinite(savedPlayerPosition.y)
    ? savedPlayerPosition
    : resolveSpawnPoint(mapData, {
    spawnId: worldSceneInitData.spawnId,
    spawnMarker: worldSceneInitData.spawnMarker
  }, tileSize);
  const fallbackSpawnPosition = getFallbackPlayerSpawnPosition({
    mapContentBounds,
    mapWidth,
    mapHeight,
    tileSize
  });
  const nearestWalkableSpawnPosition = !spawnPoint
    ? findNearestWalkableSpawnPosition({
        mapWidth,
        mapHeight,
        collisionRuntime
      })
    : null;
  const resolvedSpawnPosition = spawnPoint
    ? spawnPoint
    : nearestWalkableSpawnPosition ?? fallbackSpawnPosition;

  if (!spawnPoint) {
    console.warn(
      `[WorldScene] 未找到出生点 ${worldSceneInitData.spawnId ?? '(empty)'}，已回退到${
        nearestWalkableSpawnPosition ? '地图中心附近最近可通行格' : '地图内容中心'
      }。`
    );
  }

  const playerStartX = resolvedSpawnPosition.x;
  const playerStartY = resolvedSpawnPosition.y;
  // 地图配置只作为外观比例的附加倍率，不能覆盖角色自身基于有效像素计算的缩放。
  const resolvedPlayerScale = activeCharacterDefinition.scale * mapCharacterScale;

  const hasCharacterSpriteSheet = scene.textures.exists(activeCharacterDefinition.textureKey);

  if (!hasCharacterSpriteSheet) {
    console.error(
      `[WorldScene] 角色精灵图 ${activeCharacterDefinition.textureKey} 不存在，已使用 fallback 纹理。`
    );
  }

  const player = scene.add.sprite(
    playerStartX,
    playerStartY,
    hasCharacterSpriteSheet ? activeCharacterDefinition.textureKey : activeCharacterDefinition.fallbackTexture.key
  );
  if (activeCharacterDefinition.displayOriginY !== undefined) {
    player.setDisplayOrigin(player.displayOriginX, activeCharacterDefinition.displayOriginY);
  }
  player.setScale(resolvedPlayerScale);
  player.setDepth(PLAYER_RENDER_DEPTH);
  const foregroundTileOverlay = createForegroundTileOverlay({
    scene,
    mapData,
    tileSize,
    player,
    playerDepth: PLAYER_RENDER_DEPTH,
    collisionMap: collisionRuntime.collisionMap,
    shouldSkipLayer: (layer: any) => shouldHideAnimatedSourceLayer(scene, layer, currentMapId),
    shouldSkipTile: ({ layer, tileset }) => shouldSkipNpcReplacementSourceTile({
      npcReplacements,
      layer,
      tileset
    })
  });
  const blindMaskGraphics = scene.add.graphics();
  blindMaskGraphics.setDepth(BLIND_MASK_DEPTH);
  blindMaskGraphics.setVisible(false);
  let playerBaseDisplayOrigin = {
    x: player.displayOriginX,
    y: player.displayOriginY
  };
  let playerHopOffset = 0;
  let playerHopPhase = 0;

  const easeOutQuad = (value: number): number => 1 - (1 - value) * (1 - value);
  const easeInQuad = (value: number): number => value * value;

  const getHopOffset = (phase: number, amplitude: number): number => {
    const normalizedPhase = ((phase % HOP_CYCLE_RADIANS) + HOP_CYCLE_RADIANS) % HOP_CYCLE_RADIANS;
    const cycleProgress = normalizedPhase / HOP_CYCLE_RADIANS;

    if (cycleProgress < 0.2) {
      return Math.round(easeOutQuad(cycleProgress / 0.2) * amplitude);
    }

    if (cycleProgress < 0.52) {
      const fallProgress = (cycleProgress - 0.2) / 0.32;
      return Math.round((1 - easeInQuad(fallProgress)) * amplitude);
    }

    return 0;
  };

  const resolvePlayerDisplayOriginBase = (): { x: number; y: number } => {
    const textureAnchor = getLayeredCharacterTextureAnchor(player.texture.key);

    return resolveCharacterTextureDisplayOrigin({
      textureAnchor,
      fallbackOrigin: playerBaseDisplayOrigin,
      configuredDisplayOriginY: activeCharacterDefinition.displayOriginY,
      frameHeight: activeCharacterDefinition.previewAsset.frameHeight
    });
  };

  const syncPlayerDisplayOrigin = (): void => {
    const displayOriginBase = resolvePlayerDisplayOriginBase();

    player.setDisplayOrigin(displayOriginBase.x, displayOriginBase.y + playerHopOffset);
  };

  const capturePlayerDisplayOriginBase = (): void => {
    playerBaseDisplayOrigin = {
      x: player.displayOriginX,
      y: player.displayOriginY - playerHopOffset
    };
  };

  const resetPlayerMovementPresentation = (): void => {
    playerHopOffset = 0;
    playerHopPhase = 0;
    syncPlayerDisplayOrigin();
  };

  const updatePlayerMovementPresentation = (delta: number): void => {
    const { isMoving } = playerController.getMovementState();

    if (activeCharacterDefinition.movementStyle !== 'hop' || !isMoving) {
      if (playerHopOffset !== 0 || playerHopPhase !== 0) {
        resetPlayerMovementPresentation();
      }
      return;
    }

    playerHopPhase += delta * activeCharacterDefinition.hopSpeed;
    playerHopOffset = getHopOffset(playerHopPhase, activeCharacterDefinition.hopAmplitude);
    syncPlayerDisplayOrigin();
  };

  const applyCameraLayout = (): void => {
    const layout = computeCameraLayout({
      viewportWidth: scene.scale.width,
      viewportHeight: scene.scale.height,
      mapWidth,
      mapHeight,
      tileSize,
      mapContentBounds,
      mapViewportConfig
    });
    const camera = scene.cameras.main;

    camera.setViewport(layout.viewport.x, layout.viewport.y, layout.viewport.width, layout.viewport.height);
    camera.setZoom(layout.zoom * activeCharacterDefinition.cameraZoomMultiplier);
    camera.setBounds(layout.bounds.x, layout.bounds.y, layout.bounds.width, layout.bounds.height, true);
    if (layout.shouldFollowPlayer) {
      camera.centerOn(player.x, player.y);
    } else {
      camera.centerOn(layout.focusTarget.x, layout.focusTarget.y);
    }
    timeOfDayOverlay.syncToCameraViewport();
  };

  const drawBlindMaskRect = (x: number, y: number, width: number, height: number, alpha: number): void => {
    if (width <= 0 || height <= 0) {
      return;
    }

    blindMaskGraphics.fillStyle(0x000000, alpha);
    blindMaskGraphics.fillRect(x, y, width, height);
  };

  const updateBlindMaskPresentation = (): void => {
    const blindMask = activeVisionPresentation.blindMask;

    if (!blindMask.enabled) {
      blindMaskGraphics.clear();
      blindMaskGraphics.setVisible(false);
      return;
    }

    const mapWorldWidth = mapWidth * tileSize;
    const mapWorldHeight = mapHeight * tileSize;
    const radius = blindMask.radiusInTiles * tileSize;
    const fadeWidth = Math.max(1, blindMask.edgeFadeInTiles * tileSize);
    const outerRadius = radius + fadeWidth;
    const outerRadiusSquared = outerRadius * outerRadius;
    const centerX = player.x;
    const centerY = player.y;
    const circleTop = Math.max(0, Math.floor(centerY - outerRadius));
    const circleBottom = Math.min(mapWorldHeight, Math.ceil(centerY + outerRadius));

    blindMaskGraphics.clear();
    blindMaskGraphics.setVisible(true);
    drawBlindMaskRect(0, 0, mapWorldWidth, circleTop, blindMask.overlayAlpha);
    drawBlindMaskRect(0, circleBottom, mapWorldWidth, mapWorldHeight - circleBottom, blindMask.overlayAlpha);

    for (let y = circleTop; y < circleBottom; y += 1) {
      const dy = y + 0.5 - centerY;
      const halfOuterVisibleWidth = Math.sqrt(Math.max(0, outerRadiusSquared - dy * dy));
      const outerLeft = Math.max(0, centerX - halfOuterVisibleWidth);
      const outerRight = Math.min(mapWorldWidth, centerX + halfOuterVisibleWidth);

      drawBlindMaskRect(0, y, outerLeft, 1, blindMask.overlayAlpha);
      drawBlindMaskRect(outerRight, y, mapWorldWidth - outerRight, 1, blindMask.overlayAlpha);

      for (let x = Math.floor(outerLeft); x < Math.ceil(outerRight); x += 1) {
        const dx = x + 0.5 - centerX;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          continue;
        }

        const edgeProgress = Math.min(1, (distance - radius) / fadeWidth);
        const alpha = Number((edgeProgress * blindMask.overlayAlpha).toFixed(3));

        drawBlindMaskRect(x, y, 1, 1, alpha);
      }
    }
  };

  if (mapViewportConfig.cameraMode !== 'static-centered') {
    scene.cameras.main.startFollow(player);
  }
  applyCameraLayout();

  const cursors = scene.input.keyboard!.createCursorKeys();
  const interactionKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  const spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  const playerController = createPlayerController({
    scene,
    player,
    cursors,
    collisionRuntime,
    tileSize,
    mapWidth,
    mapHeight,
    moveSpeed,
    manualEventTileKeys,
    autoPathGraphics,
    initialDirection: activeCharacterDefinition.defaultDirection,
    isInputBlocked: options.isInputBlocked,
    getCharacterDefinition: () => activeCharacterDefinition,
    getVisionPresentation: () => activeVisionPresentation
  });

  if (hasCharacterSpriteSheet) {
    player.anims.play(
      activeCharacterDefinition.getAnimationKey('idle', playerController.getCurrentDirection()),
      true
    );
    syncPlayerDisplayOrigin();
  }

  const syncPlayerCharacterDefinition = (): boolean => {
    const nextCharacterDefinition = resolvePlayerRuntimeCharacterDefinition();

    if (!nextCharacterDefinition) {
      console.error('[WorldScene] 未找到可用的角色运行表现定义。');
      return false;
    }

    if (!scene.textures.exists(nextCharacterDefinition.textureKey)) {
      console.error(
        `[WorldScene] 角色运行表现依赖的精灵图 ${nextCharacterDefinition.textureKey} 尚未加载。`
      );
      return false;
    }

    activeCharacterDefinition = nextCharacterDefinition;
    activeVisionPresentation = resolvePlayerRuntimeVisionPresentation();
    player.setTexture(nextCharacterDefinition.textureKey);
    capturePlayerDisplayOriginBase();
    resetPlayerMovementPresentation();
    playerController.refreshAnimation(false);
    syncPlayerDisplayOrigin();
    updateBlindMaskPresentation();
    return true;
  };

  const setPlayerAppearance = (appearanceId: string): boolean => {
    const nextCharacterDefinition = getPlayerCharacterDefinition(appearanceId);

    if (!nextCharacterDefinition) {
      console.error(`[WorldScene] 未找到角色外观定义: ${appearanceId}`);
      return false;
    }

    setPlayerRuntimeAppearance(appearanceId);
    return syncPlayerCharacterDefinition();
  };

  const setPlayerStatus = (statusList: ReadonlyArray<string>): boolean => {
    setPlayerRuntimeStatus(statusList);
    return syncPlayerCharacterDefinition();
  };

  timeOfDayOverlay.setTimeOfDay('day', { duration: 0 });
  updateBlindMaskPresentation();

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    playerController.destroy();
    foregroundTileOverlay.destroy();
    blindMaskGraphics.destroy();
    timeOfDayOverlay.destroy();
  });

  return {
    currentMapId,
    interactionKey,
    spaceKey,
    manualEventTileKeys,
    getManualEventsAtTile: manualEventRegistry.getEventsAtTile,
    setTimeOfDay: timeOfDayOverlay.setTimeOfDay,
    setWeather: timeOfDayOverlay.setWeather,
    setPlayerAppearance,
    setPlayerStatus,
    getActiveTimeOfDayId: timeOfDayOverlay.getActiveTimeOfDayId,
    getActiveWeatherId: timeOfDayOverlay.getActiveWeatherId,
    update: (delta: number) => {
      playerController.update(delta);
      updatePlayerMovementPresentation(delta);
      syncPlayerDisplayOrigin();
      foregroundTileOverlay.update();
      updateBlindMaskPresentation();
      timeOfDayOverlay.update(delta);
    },
    handleScaleResize: applyCameraLayout,
    handlePointerDown: playerController.handlePointerDown,
    getPlayerTilePosition: playerController.getPlayerTilePosition,
    getPlayerWorldPosition: () => ({
      x: player.x,
      y: player.y
    })
  };
}
