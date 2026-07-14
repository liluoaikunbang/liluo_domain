import * as Phaser from 'phaser';
import { buildAnimationFrames, type GameAnimationBundle } from '../../data/animations';

export function registerAnimationBundle(scene: Phaser.Scene, animationBundle?: GameAnimationBundle): void {
  if (!animationBundle || animationBundle.length === 0) {
    return;
  }

  animationBundle.forEach((definition) => {
    if (scene.anims.exists(definition.key)) {
      return;
    }

    if (!scene.textures.exists(definition.textureKey)) {
      console.error(
        `[AnimationSystem] 动画 ${definition.key} 依赖的素材 ${definition.textureKey} 不存在，已跳过注册。`
      );
      return;
    }

    scene.anims.create({
      key: definition.key,
      frames: buildAnimationFrames(scene, definition),
      frameRate: definition.frameRate,
      repeat: definition.repeat ?? 0
    });
  });
}