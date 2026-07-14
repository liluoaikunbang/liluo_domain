import type { GameAssetBundle } from './assets';
import {
  globalPlayerDialoguePortraits,
  playerPortraitLayerOptions,
  resolvePlayerPortraitBackLayers
} from './portraits/registry.ts';
import type {
  DialoguePortraitData,
  DialoguePortraitLayerData
} from './portraits/types.ts';

export {
  playerPortraitLayerOptions,
  resolvePlayerPortraitBackLayers
};

export type {
  DialoguePortraitData,
  DialoguePortraitLayerData
} from './portraits/types.ts';

function createDialoguePortraitAssetBundle(
  portraits: ReadonlyArray<DialoguePortraitData>
): GameAssetBundle {
  return {
    manifest: portraits.flatMap((portrait) => {
      if (portrait.layers?.length) {
        return [...portrait.layers, ...(portrait.backLayers ?? [])].map((layer) => ({
          key: layer.key,
          type: 'image' as const,
          url: layer.src
        }));
      }

      if (!portrait.src) {
        return [];
      }

      return [{
        key: portrait.key,
        type: 'image' as const,
        url: portrait.src
      }];
    })
  };
}

const liYinEstatePortraitUrl = new URL('../../assets/game/standee/LiYin.png', import.meta.url).href;

export const globalDialoguePortraits = {
  ...globalPlayerDialoguePortraits
} satisfies Record<string, DialoguePortraitData>;

export const globalDialoguePortraitAssetBundle = createDialoguePortraitAssetBundle([
  globalDialoguePortraits.liLuoDefault,
  globalDialoguePortraits.liLuoSleep,
  globalDialoguePortraits.liLuoSleepTie,
  globalDialoguePortraits.liLuoJapaneseBinding
]);

export const mapDialoguePortraits = {
  liluoEstate: {
    liYinDefault: {
      key: 'portrait_liyin_estate',
      src: liYinEstatePortraitUrl,
      alt: '璃音立绘',
      statusText: '同行：璃音'
    }
  }
} satisfies Record<string, Record<string, DialoguePortraitData>>;

export const liluoEstateDialoguePortraitAssetBundle = createDialoguePortraitAssetBundle([
  mapDialoguePortraits.liluoEstate.liYinDefault
]);
