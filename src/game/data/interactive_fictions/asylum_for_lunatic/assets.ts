import hospitalRoomBackground from '../../../../assets/game/backgrounds/Liluo_bed.png';
import liluoStandee from '../../../../assets/game/standee/LiLuo.png';
import type { GameAssetBundle } from '../../assets';

export const asylumForLunaticInteractiveFictionAssetBundle: GameAssetBundle = {
  manifest: [
    {
      key: 'if-asylum-for-lunatic-hospital-room',
      type: 'image',
      url: hospitalRoomBackground
    },
    {
      key: 'if-asylum-for-lunatic-liluo-default',
      type: 'image',
      url: liluoStandee
    }
  ]
};

export const asylumForLunaticInteractiveFictionAssetUrls: Record<string, string> = {
  'if-asylum-for-lunatic-hospital-room': hospitalRoomBackground,
  'if-asylum-for-lunatic-liluo-default': liluoStandee
};
