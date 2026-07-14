import * as Phaser from 'phaser';
import type { GameCharacterDefinition } from '../../../data/playerCharacter';
import { registerAnimationBundle } from '../registerAnimationBundle';

function ensureCharacterFallbackTexture(scene: Phaser.Scene, character: GameCharacterDefinition): void {
  if (scene.textures.exists(character.fallbackTexture.key)) {
    return;
  }

  const graphics = scene.make.graphics();
  character.fallbackTexture.draw(graphics);
  graphics.generateTexture(
    character.fallbackTexture.key,
    character.fallbackTexture.width,
    character.fallbackTexture.height
  );
  graphics.destroy();
}

export function prepareCharacterAssets(
  scene: Phaser.Scene,
  character: GameCharacterDefinition | GameCharacterDefinition[]
): void {
  const characterDefinitions = Array.isArray(character) ? character : [character];

  characterDefinitions.forEach((entry) => {
    ensureCharacterFallbackTexture(scene, entry);
    registerAnimationBundle(scene, entry.animationBundle);
  });
}