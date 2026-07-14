import type { GameAssetBundle } from '../../../assets';
import {
  liluoEstateDialoguePortraitAssetBundle,
  mapDialoguePortraits
} from '../../../dialoguePortraits.ts';
import liluoEstateDialoguesJson from './dialogues.json' with { type: 'json' };

export const liluoEstateDialogueAssetBundle: GameAssetBundle = {
  manifest: [...liluoEstateDialoguePortraitAssetBundle.manifest]
};

const liluoEstateDialogues = {
  ...liluoEstateDialoguesJson,
  estate_time_of_day_selection: {
    ...liluoEstateDialoguesJson.estate_time_of_day_selection,
    npcPortrait: mapDialoguePortraits.liluoEstate.liYinDefault
  }
};

export default liluoEstateDialogues;
