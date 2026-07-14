import type { GameAssetBundle } from '../../../assets';
import liluoRoomDialoguesJson from './dialogues.json' with { type: 'json' };

const liluoBedBackgroundUrl = new URL('../../../../../assets/game/backgrounds/Liluo_bed.png', import.meta.url).href;

export const liluoRoomDialogueAssetBundle: GameAssetBundle = {
  manifest: [
    {
      key: 'liluo-room-bed-background',
      type: 'image',
      url: liluoBedBackgroundUrl
    }
  ]
};

const liluoRoomDialogues = liluoRoomDialoguesJson;

export default liluoRoomDialogues;
