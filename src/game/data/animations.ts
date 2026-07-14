import * as Phaser from 'phaser';

export type GameAnimationFrame =
  | string
  | number
  | {
      textureKey: string;
      frame?: string | number;
    };

export interface GameNumberFrameAnimationDefinition {
  key: string;
  textureKey: string;
  frameRate: number;
  repeat?: number;
  start?: number;
  end?: number;
  frames?: Array<GameAnimationFrame>;
  worldObject?: {
    objectName?: string;
    layerName?: string;
    hideSourceLayer?: boolean;
    scale?: number;
    depth?: number;
    originX?: number;
    originY?: number;
  };
}

export type GameAnimationDefinition = GameNumberFrameAnimationDefinition;

export type GameAnimationBundle = GameAnimationDefinition[];

export function buildAnimationFrames(
  scene: Phaser.Scene,
  definition: GameAnimationDefinition
): Phaser.Types.Animations.AnimationFrame[] {
  if (Array.isArray(definition.frames) && definition.frames.length > 0) {
    return definition.frames.map((frame) => {
      if (typeof frame === 'object') {
        return { key: frame.textureKey, frame: frame.frame };
      }

      return { key: definition.textureKey, frame };
    });
  }

  if (definition.start === undefined || definition.end === undefined) {
    throw new Error(`[AnimationData] 动画 ${definition.key} 缺少 frames 或 start/end 配置。`);
  }

  return scene.anims.generateFrameNumbers(definition.textureKey, {
    start: definition.start,
    end: definition.end
  });
}
