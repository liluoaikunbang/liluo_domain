import type { GameObjects } from 'phaser';
import type { GameAssetBundle, GameAssetManifestEntry, GameSpriteSheetAssetEntry } from './assets';
import type { GameAnimationBundle } from './animations';
import {
  getLayeredCharacterTextureAnchor,
  getLayeredCharacterTexturePreviewUrl,
  registerLayeredCharacterTextures,
  resolveCharacterTextureDisplayOrigin,
  type CharacterFrameLayerDefinition
} from '../systems/animation/character/layeredCharacterTexture.ts';

export type CharacterFacingDirection = 'down' | 'left' | 'right' | 'up';
export type CharacterAnimationState = 'walk' | 'idle';
export type CharacterMovementStyle = 'normal' | 'hop';

interface CharacterDirectionalFrameConfig {
  walk: number[];
  idle: number;
  walkFrameRate?: number;
}

interface CharacterAnimationProfile {
  frameRate?: {
    walk?: number;
    idle?: number;
  };
  directions: Record<CharacterFacingDirection, CharacterDirectionalFrameConfig>;
}

interface PlayerAppearanceConfig {
  textureKey: string;
  spriteSheetFileName?: string;
  spriteSheetConfig?: GameSpriteSheetAssetEntry['config'];
  frameDirectoryName?: string;
  frameTextureKeyPrefix?: string;
  baseFrameDirectoryName?: string;
  baseFrameTextureKeyPrefix?: string;
  layers?: CharacterFrameLayerDefinition[];
  animationProfile: CharacterAnimationProfile;
  savePreview: {
    frame: number;
    columns: number;
  };
  displayOriginY?: number;
  scale?: number;
  cameraZoomMultiplier?: number;
  defaultMoveSpeed?: number;
  walkCycleDistanceInTiles?: number;
}

const layeredCharacterAnimationProfile: CharacterAnimationProfile = {
  frameRate: {
    walk: 12,
    idle: 0
  },
  directions: {
    down: { walk: [1, 2, 3, 4], idle: 0 },
    left: { walk: [1, 2, 3, 4], idle: 0 },
    right: { walk: [1, 2, 3, 4], idle: 0 },
    up: { walk: [1, 2, 3, 4], idle: 0 }
  }
};

const standingOnlyLayeredCharacterAnimationProfile: CharacterAnimationProfile = {
  frameRate: {
    walk: 1,
    idle: 0
  },
  directions: {
    down: { walk: [0], idle: 0 },
    left: { walk: [0], idle: 0 },
    right: { walk: [0], idle: 0 },
    up: { walk: [0], idle: 0 }
  }
};

const liluoFrameNames = {
  down: ['down_idle', 'down_walk_1', 'down_walk_2', 'down_walk_3', 'down_walk_4'],
  left: ['left_idle', 'left_walk_1', 'left_walk_2', 'left_walk_3', 'left_walk_4'],
  right: ['right_idle', 'right_walk_1', 'right_walk_2', 'right_walk_3', 'right_walk_4'],
  up: ['up_idle', 'up_walk_1', 'up_walk_2', 'up_walk_3', 'up_walk_4']
} as const satisfies Record<CharacterFacingDirection, readonly string[]>;

const defaultLayeredPlayerAppearanceConfig = {
  textureKey: 'liluo_body_up_down_idle',
  frameDirectoryName: 'LiLuo_body_down',
  frameTextureKeyPrefix: 'liluo_body_up',
  baseFrameDirectoryName: 'LiLuo_body_down',
  baseFrameTextureKeyPrefix: 'LiLuo_body_down',
  layers: [
    {
      sourceTextureKeyPrefix: 'LiLuo_body_up',
      mode: 'clear-base-side-pixels-within-layer-height'
    },
    {
      sourceTextureKeyPrefix: 'LiLuo_head',
      mode: 'overlay'
    }
  ],
  animationProfile: layeredCharacterAnimationProfile,
  savePreview: {
    frame: layeredCharacterAnimationProfile.directions.down.idle,
    columns: 5
  },
  // 保持脚底与原 32px 角色相同的地图基线（角色坐标下方 16px）。
  // 原图保持原始像素载入，仅缩放角色显示对象；脚底仍落在角色坐标下方 16px。
  displayOriginY: 179.666667,
  scale: 0.252632,
  cameraZoomMultiplier: 1,
  defaultMoveSpeed: 3.6,
  walkCycleDistanceInTiles: 3.75
} as const satisfies PlayerAppearanceConfig;

const fullBodyBondageAnimationProfile: CharacterAnimationProfile = {
  frameRate: {
    walk: 8,
    idle: 0
  },
  directions: {
    down: { walk: [0], idle: 0 },
    left: { walk: [1], idle: 1 },
    right: { walk: [2], idle: 2 },
    up: { walk: [3], idle: 3 }
  }
};

export const playerAppearanceSpriteSheets = {
  default: defaultLayeredPlayerAppearanceConfig,
  bondage: {
    ...defaultLayeredPlayerAppearanceConfig,
    textureKey: 'liluo_bondage_body_up_down_idle',
    frameTextureKeyPrefix: 'liluo_bondage_body_up',
    layers: [
      {
        sourceTextureKeyPrefix: 'bondage_body_up',
        mode: 'clear-base-side-pixels-within-layer-height'
      },
      {
        sourceTextureKeyPrefix: 'LiLuo_head',
        mode: 'overlay'
      }
    ],
    savePreview: {
      frame: layeredCharacterAnimationProfile.directions.down.idle,
      columns: 5
    },
  },
  legs_bound: {
    ...defaultLayeredPlayerAppearanceConfig,
    textureKey: 'liluo_bondage_body_down_down_idle',
    frameTextureKeyPrefix: 'liluo_bondage_body_down',
    layers: [
      {
        sourceTextureKeyPrefix: 'LiLuo_body_up',
        mode: 'clear-base-side-pixels-within-layer-height'
      },
      {
        sourceTextureKeyPrefix: 'LiLuo_head',
        mode: 'overlay'
      },
      {
        sourceTextureKeyPrefix: 'bondage_body_down',
        mode: 'overlay'
      }
    ],
    animationProfile: standingOnlyLayeredCharacterAnimationProfile,
    savePreview: {
      frame: standingOnlyLayeredCharacterAnimationProfile.directions.down.idle,
      columns: 5
    },
    walkCycleDistanceInTiles: undefined
  },
  bondage_legs_bound: {
    ...defaultLayeredPlayerAppearanceConfig,
    textureKey: 'liluo_bondage_body_up_and_down_down_idle',
    frameTextureKeyPrefix: 'liluo_bondage_body_up_and_down',
    layers: [
      {
        sourceTextureKeyPrefix: 'bondage_body_up',
        mode: 'clear-base-side-pixels-within-layer-height'
      },
      {
        sourceTextureKeyPrefix: 'LiLuo_head',
        mode: 'overlay'
      },
      {
        sourceTextureKeyPrefix: 'bondage_body_down',
        mode: 'overlay'
      }
    ],
    animationProfile: standingOnlyLayeredCharacterAnimationProfile,
    savePreview: {
      frame: standingOnlyLayeredCharacterAnimationProfile.directions.down.idle,
      columns: 5
    },
    walkCycleDistanceInTiles: undefined
  },
  full_body_bondage: {
    textureKey: 'liluo_full_body_bondage',
    spriteSheetFileName: 'liluo_full_body_bondage.png',
    spriteSheetConfig: {
      frameWidth: 32,
      frameHeight: 32,
      startFrame: 0,
      endFrame: 3,
      margin: 0,
      spacing: 0
    },
    animationProfile: fullBodyBondageAnimationProfile,
    savePreview: {
      frame: fullBodyBondageAnimationProfile.directions.down.idle,
      columns: 4
    },
    defaultMoveSpeed: 3.6
  }
} as const satisfies Record<string, PlayerAppearanceConfig>;

export type PlayerCharacterAppearanceId = keyof typeof playerAppearanceSpriteSheets;

export const playerCharacterAppearanceIds = Object.keys(
  playerAppearanceSpriteSheets
) as PlayerCharacterAppearanceId[];

export function resolvePlayerCharacterSpriteSheetUrl(spriteSheetFileName: string): string {
  return new URL(`../../assets/game/sprite/${spriteSheetFileName}`, import.meta.url).href;
}

export interface GameCharacterCollisionBox {
  width: number;
  height: number;
  offsetY: number;
}

export interface GameCharacterFallbackTextureDefinition {
  key: string;
  width: number;
  height: number;
  draw: (graphics: GameObjects.Graphics) => void;
}

export interface GameCharacterDefinition {
  id: string;
  appearanceId: string;
  textureKey: string;
  textureAssets: GameAssetManifestEntry[];
  previewAsset: {
    url: string;
    frameWidth: number;
    frameHeight: number;
  };
  savePreview: {
    frame: number;
    columns: number;
  };
  displayOriginY?: number;
  cameraZoomMultiplier: number;
  fallbackTexture: GameCharacterFallbackTextureDefinition;
  animationBundle: GameAnimationBundle;
  scale: number;
  collisionBox: GameCharacterCollisionBox;
  defaultDirection: CharacterFacingDirection;
  defaultMoveSpeed: number;
  walkCycleDistanceInTiles?: number;
  movementStyle: CharacterMovementStyle;
  movementSpeedMultiplier: number;
  canMove: boolean;
  hopAmplitude: number;
  hopSpeed: number;
  getAnimationKey: (state: CharacterAnimationState, direction: CharacterFacingDirection) => string;
}

function getCharacterAnimationKey(
  textureKey: string,
  state: CharacterAnimationState,
  direction: CharacterFacingDirection
): string {
  return `${textureKey}_${state}_${direction}`;
}

function createPlayerCharacterAnimationBundle(
  textureKey: string,
  animationProfile: CharacterAnimationProfile,
  frameNames?: typeof liluoFrameNames,
  frameTextureKeyPrefix = 'liluo'
): GameAnimationBundle {
  return (
    Object.entries(animationProfile.directions) as Array<[
      CharacterFacingDirection,
      CharacterDirectionalFrameConfig
    ]>
  ).flatMap(([direction, config]) => {
    const directionalFrameNames = frameNames?.[direction];
    const resolveNamedFrames = (frameIndexes: readonly number[]) =>
      frameIndexes.map((frameIndex) => ({ textureKey: `${frameTextureKeyPrefix}_${directionalFrameNames![frameIndex]}` }));

    return [
      {
        key: getCharacterAnimationKey(textureKey, 'walk', direction),
        textureKey,
        frames: directionalFrameNames
          ? resolveNamedFrames(config.walk)
          : config.walk,
        frameRate: config.walkFrameRate ?? animationProfile.frameRate?.walk ?? 8,
        repeat: -1
      },
      {
        key: getCharacterAnimationKey(textureKey, 'idle', direction),
        textureKey,
        frames: directionalFrameNames
          ? resolveNamedFrames([config.idle])
          : [config.idle],
        frameRate: animationProfile.frameRate?.idle ?? 0,
        repeat: 0
      }
    ];
  });
}

export interface PlayerCharacterStaticPreview {
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  frameIndex: number;
  frameColumns: number;
  displayOriginX: number;
  displayOriginY: number;
  displayScale: number;
}

export const playerCharacterUiPreviewHeight = 56;

export function resolvePlayerCharacterUiPreviewScale(frameHeight: number): number {
  return Number.isFinite(frameHeight) && frameHeight > 0
    ? playerCharacterUiPreviewHeight / frameHeight
    : 1;
}

const playerFallbackTexture = {
  key: 'player_fallback',
  width: 32,
  height: 32,
  draw: (graphics: GameObjects.Graphics) => {
    graphics.clear();
    graphics.fillStyle(0xf4d35e);
    graphics.fillRect(8, 4, 16, 12);
    graphics.fillStyle(0x8d5524);
    graphics.fillRect(10, 18, 12, 10);
    graphics.fillStyle(0x5b3a29);
    graphics.fillRect(8, 28, 6, 4);
    graphics.fillRect(18, 28, 6, 4);
  }
};

function createPlayerCharacterDefinition(appearanceId: PlayerCharacterAppearanceId): GameCharacterDefinition {
  const spriteSheetRegistration = playerAppearanceSpriteSheets[appearanceId];
  const textureKey = spriteSheetRegistration.textureKey;
  const frameDirectoryName = spriteSheetRegistration.frameDirectoryName;
  const frameTextureKeyPrefix = spriteSheetRegistration.frameTextureKeyPrefix ?? 'liluo';
  const baseFrameTextureKeyPrefix = spriteSheetRegistration.baseFrameTextureKeyPrefix ?? frameTextureKeyPrefix;
  const layerTextureKeyPrefixes = spriteSheetRegistration.layers?.map((layer) => layer.sourceTextureKeyPrefix) ?? [];
  const textureAssets: GameAssetManifestEntry[] = frameDirectoryName
    ? [
        ...Object.values(liluoFrameNames).flatMap((frameNames) => frameNames).map((frameName) => ({
          key: `${baseFrameTextureKeyPrefix}_${frameName}`,
          type: 'image' as const,
          url: resolvePlayerCharacterSpriteSheetUrl(`${spriteSheetRegistration.baseFrameDirectoryName ?? frameDirectoryName}/${frameName}.png`)
        })),
        ...layerTextureKeyPrefixes.flatMap((layerTextureKeyPrefix) =>
          Object.values(liluoFrameNames).flatMap((frameNames) => frameNames).map((frameName) => ({
            key: `${layerTextureKeyPrefix}_${frameName}`,
            type: 'image' as const,
            url: resolvePlayerCharacterSpriteSheetUrl(`${layerTextureKeyPrefix}/${frameName}.png`)
          }))
        )
      ]
    : [{
        key: textureKey,
        type: 'spritesheet' as const,
        url: resolvePlayerCharacterSpriteSheetUrl(spriteSheetRegistration.spriteSheetFileName!),
        config: spriteSheetRegistration.spriteSheetConfig!
      }];
  const previewAsset = frameDirectoryName
    ? {
        url: resolvePlayerCharacterSpriteSheetUrl(`${frameDirectoryName}/down_idle.png`),
        frameWidth: 191,
        frameHeight: 243
      }
    : {
        url: textureAssets[0].url,
        frameWidth: spriteSheetRegistration.spriteSheetConfig!.frameWidth,
        frameHeight: spriteSheetRegistration.spriteSheetConfig!.frameHeight
      };

  return {
    id: 'liluo',
    appearanceId,
    textureKey,
    textureAssets,
    previewAsset,
    savePreview: spriteSheetRegistration.savePreview,
    displayOriginY: spriteSheetRegistration.displayOriginY,
    cameraZoomMultiplier: spriteSheetRegistration.cameraZoomMultiplier ?? 1,
    fallbackTexture: playerFallbackTexture,
    animationBundle: createPlayerCharacterAnimationBundle(
      textureKey,
      spriteSheetRegistration.animationProfile,
      frameDirectoryName ? liluoFrameNames : undefined,
      frameTextureKeyPrefix
    ),
    scale: spriteSheetRegistration.scale ?? 1,
    collisionBox: {
      width: 14,
      height: 10,
      offsetY: 6
    },
    defaultDirection: 'down',
    defaultMoveSpeed: spriteSheetRegistration.defaultMoveSpeed ?? 2,
    walkCycleDistanceInTiles: spriteSheetRegistration.walkCycleDistanceInTiles,
    movementStyle: 'normal',
    movementSpeedMultiplier: 1,
    canMove: true,
    hopAmplitude: 0,
    hopSpeed: 0,
    getAnimationKey: (state, direction) => getCharacterAnimationKey(textureKey, state, direction)
  };
}

export function resolveCharacterWalkSpeedPerSecond(
  characterDefinition: GameCharacterDefinition,
  direction: CharacterFacingDirection,
  tileSize: number
): number | null {
  const walkCycleDistanceInTiles = characterDefinition.walkCycleDistanceInTiles;

  if (walkCycleDistanceInTiles === undefined || !Number.isFinite(walkCycleDistanceInTiles) || walkCycleDistanceInTiles <= 0) {
    return null;
  }

  const walkAnimation = characterDefinition.animationBundle.find(
    (animation) => animation.key === characterDefinition.getAnimationKey('walk', direction)
  );
  const frameCount = walkAnimation?.frames?.length ?? 0;
  const frameRate = walkAnimation?.frameRate ?? 0;

  if (frameCount <= 0 || frameRate <= 0 || !Number.isFinite(tileSize) || tileSize <= 0) {
    return null;
  }

  return tileSize * walkCycleDistanceInTiles / (frameCount / frameRate);
}

export function resolveCharacterWalkAnimationTimeScale(
  characterDefinition: GameCharacterDefinition
): number {
  if (characterDefinition.walkCycleDistanceInTiles === undefined) {
    return 1;
  }

  const movementSpeedMultiplier = characterDefinition.movementSpeedMultiplier;

  return Number.isFinite(movementSpeedMultiplier) && movementSpeedMultiplier >= 0
    ? movementSpeedMultiplier
    : 1;
}

export const defaultPlayerAppearanceId: PlayerCharacterAppearanceId = 'default';

export const playerCharacterDefinition: GameCharacterDefinition = createPlayerCharacterDefinition(
  defaultPlayerAppearanceId
);

function dedupeAssetManifestEntries(
  manifestEntries: readonly GameAssetManifestEntry[]
): GameAssetManifestEntry[] {
  const manifestEntriesByKey = new Map<string, GameAssetManifestEntry>();

  manifestEntries.forEach((manifestEntry) => {
    if (!manifestEntriesByKey.has(manifestEntry.key)) {
      manifestEntriesByKey.set(manifestEntry.key, manifestEntry);
    }
  });

  return Array.from(manifestEntriesByKey.values());
}

export const playerCharacterAssetBundle: GameAssetBundle = {
  manifest: dedupeAssetManifestEntries(
    playerCharacterAppearanceIds.flatMap(
      (appearanceId) => createPlayerCharacterDefinition(appearanceId).textureAssets
    )
  ),
  prepare: (scene) => {
    playerCharacterAppearanceIds.forEach((appearanceId) => {
      const spriteSheetRegistration = playerAppearanceSpriteSheets[appearanceId];

      if (!spriteSheetRegistration.frameDirectoryName || !spriteSheetRegistration.layers?.length) {
        return;
      }

      const baseFrameTextureKeyPrefix = spriteSheetRegistration.baseFrameTextureKeyPrefix
        ?? spriteSheetRegistration.frameTextureKeyPrefix
        ?? 'liluo';
      const outputFrameTextureKeyPrefix = spriteSheetRegistration.frameTextureKeyPrefix ?? 'liluo';

      registerLayeredCharacterTextures(
        scene,
        Object.values(liluoFrameNames).flatMap((frameNames) => frameNames).map((frameName) => ({
          outputTextureKey: `${outputFrameTextureKeyPrefix}_${frameName}`,
          baseTextureKey: `${baseFrameTextureKeyPrefix}_${frameName}`,
          frameName,
          layers: spriteSheetRegistration.layers!
        }))
      );
    });
  }
};

export function getAllPlayerCharacterDefinitions(): GameCharacterDefinition[] {
  return playerCharacterAppearanceIds.map((appearanceId) => createPlayerCharacterDefinition(appearanceId));
}

export function getPlayerCharacterDefinition(appearanceId: string): GameCharacterDefinition | null {
  if (!(appearanceId in playerAppearanceSpriteSheets)) {
    return null;
  }

  return createPlayerCharacterDefinition(appearanceId as PlayerCharacterAppearanceId);
}

export function getPlayerCharacterFrameTextureKey(
  appearanceId: string,
  direction: CharacterFacingDirection,
  state: CharacterAnimationState = 'idle'
): string | null {
  if (!(appearanceId in playerAppearanceSpriteSheets)) {
    return null;
  }

  const spriteSheetRegistration = playerAppearanceSpriteSheets[appearanceId as PlayerCharacterAppearanceId];
  const frameDirectoryName = spriteSheetRegistration.frameDirectoryName;

  if (!frameDirectoryName) {
    return spriteSheetRegistration.textureKey;
  }

  const directionalFrameConfig = spriteSheetRegistration.animationProfile.directions[direction];
  const frameIndex = state === 'walk'
    ? directionalFrameConfig.walk[0]
    : directionalFrameConfig.idle;
  const frameName = liluoFrameNames[direction][frameIndex];
  const frameTextureKeyPrefix = spriteSheetRegistration.frameTextureKeyPrefix ?? 'liluo';

  return `${frameTextureKeyPrefix}_${frameName}`;
}

export function resolvePlayerCharacterStaticPreview(
  appearanceId: string
): PlayerCharacterStaticPreview | null {
  const characterDefinition = getPlayerCharacterDefinition(appearanceId);

  if (!characterDefinition) {
    return null;
  }

  const frameTextureKey = getPlayerCharacterFrameTextureKey(appearanceId, 'down', 'idle');
  const layeredFramePreviewUrl = frameTextureKey
    ? getLayeredCharacterTexturePreviewUrl(frameTextureKey)
    : null;
  const displayOrigin = resolveCharacterTextureDisplayOrigin({
    textureAnchor: frameTextureKey
      ? getLayeredCharacterTextureAnchor(frameTextureKey)
      : null,
    fallbackOrigin: {
      x: characterDefinition.previewAsset.frameWidth / 2,
      y: characterDefinition.displayOriginY ?? characterDefinition.previewAsset.frameHeight / 2
    },
    configuredDisplayOriginY: characterDefinition.displayOriginY,
    frameHeight: characterDefinition.previewAsset.frameHeight
  });
  const displayProperties = {
    displayOriginX: displayOrigin.x,
    displayOriginY: displayOrigin.y,
    displayScale: resolvePlayerCharacterUiPreviewScale(
      characterDefinition.previewAsset.frameHeight
    )
  };

  if (layeredFramePreviewUrl) {
    return {
      imageUrl: layeredFramePreviewUrl,
      frameWidth: characterDefinition.previewAsset.frameWidth,
      frameHeight: characterDefinition.previewAsset.frameHeight,
      frameIndex: 0,
      frameColumns: 1,
      ...displayProperties
    };
  }

  return {
    imageUrl: characterDefinition.previewAsset.url,
    frameWidth: characterDefinition.previewAsset.frameWidth,
    frameHeight: characterDefinition.previewAsset.frameHeight,
    frameIndex: characterDefinition.savePreview.frame,
    frameColumns: characterDefinition.savePreview.columns,
    ...displayProperties
  };
}
