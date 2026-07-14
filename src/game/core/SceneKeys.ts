// Scene key constants for Phaser scenes
export const SceneKeys = {
  BOOT: 'BootScene',
  MAP_LOADING: 'MapLoadingScene',
  WORLD: 'WorldScene',
} as const;

export type SceneKeyType = keyof typeof SceneKeys;