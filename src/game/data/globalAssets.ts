import { type GameAssetBundle } from './assets';
import { globalDialoguePortraitAssetBundle } from './dialoguePortraits';
import { playerCharacterAssetBundle } from './playerCharacter';

export const globalAssetBundle: GameAssetBundle = {
  manifest: [
    ...playerCharacterAssetBundle.manifest,
    ...globalDialoguePortraitAssetBundle.manifest
  ],
  prepare: (scene) => {
    playerCharacterAssetBundle.prepare?.(scene);
    globalDialoguePortraitAssetBundle.prepare?.(scene);
  }
};
