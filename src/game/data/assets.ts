import * as Phaser from 'phaser';

export interface GameImageAssetEntry {
  key: string;
  type: 'image';
  url: string;
}

export interface GameSpriteSheetAssetEntry {
  key: string;
  type: 'spritesheet';
  url: string;
  config: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
}

export interface GameAudioAssetEntry {
  key: string;
  type: 'audio';
  url: string;
}

export type GameAssetManifestEntry = GameImageAssetEntry | GameSpriteSheetAssetEntry | GameAudioAssetEntry;

export interface GameAssetBundle {
  manifest: GameAssetManifestEntry[];
  prepare?: (scene: Phaser.Scene) => void;
}

export function mergeAssetBundles(...assetBundles: Array<GameAssetBundle | undefined>): GameAssetBundle | undefined {
  const availableBundles = assetBundles.filter(Boolean) as GameAssetBundle[];

  if (!availableBundles.length) {
    return undefined;
  }

  return {
    manifest: availableBundles.flatMap((assetBundle) => assetBundle.manifest),
    prepare: (scene: Phaser.Scene) => {
      availableBundles.forEach((assetBundle) => {
        assetBundle.prepare?.(scene);
      });
    }
  };
}

function isAssetLoaded(scene: Phaser.Scene, asset: GameAssetManifestEntry): boolean {
  switch (asset.type) {
    case 'image':
    case 'spritesheet':
      return scene.textures.exists(asset.key);
    case 'audio':
      return scene.cache.audio.exists(asset.key);
    default:
      return false;
  }
}

export function queueAssetBundle(scene: Phaser.Scene, assetBundle?: GameAssetBundle): number {
  if (!assetBundle) {
    return 0;
  }

  let queuedCount = 0;

  assetBundle.manifest.forEach((asset) => {
    if (isAssetLoaded(scene, asset)) {
      return;
    }

    switch (asset.type) {
      case 'image':
        scene.load.image(asset.key, asset.url);
        queuedCount += 1;
        break;
      case 'spritesheet':
        scene.load.spritesheet(asset.key, asset.url, asset.config);
        queuedCount += 1;
        break;
      case 'audio':
        scene.load.audio(asset.key, asset.url);
        queuedCount += 1;
        break;
    }
  });

  return queuedCount;
}

export function prepareAssetBundle(scene: Phaser.Scene, assetBundle?: GameAssetBundle): void {
  assetBundle?.prepare?.(scene);
}

export function findImageAssetUrl(assetBundle: GameAssetBundle | undefined, assetKey: string): string | null {
  if (!assetBundle || !assetKey) {
    return null;
  }

  const asset = assetBundle.manifest.find((entry) => entry.key === assetKey && entry.type === 'image');

  return asset?.url ?? null;
}
