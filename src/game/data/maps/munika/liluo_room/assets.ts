import { type GameAssetBundle } from '../../../assets';

const houseIndoorWallUrl = new URL('../../../../../assets/game/sucai/house_indoor_wall.png', import.meta.url).href;
const houseIndoor4Url = new URL('../../../../../assets/game/sucai/house_indoor_4.png', import.meta.url).href;
const houseIndoor3Url = new URL('../../../../../assets/game/sucai/house_indoor_3.png', import.meta.url).href;
const houseIndoorUrl = new URL('../../../../../assets/game/sucai/house_indoor.png', import.meta.url).href;
const prison3Url = new URL('../../../../../assets/game/sucai/Prison_3.png', import.meta.url).href;
const prison2Url = new URL('../../../../../assets/game/sucai/Prison_2.png', import.meta.url).href;
const houseIndoor6Url = new URL('../../../../../assets/game/sucai/house_indoor_6.png', import.meta.url).href;
const houseIndoor2Url = new URL('../../../../../assets/game/sucai/house_indoor_2.PNG', import.meta.url).href;
const houseIndoorCarpetUrl = new URL('../../../../../assets/game/sucai/house_indoor_carpet.png', import.meta.url)
  .href;

export const liluoRoomAssetBundle: GameAssetBundle = {
  manifest: [
    {
      key: 'house_indoor_wall',
      type: 'spritesheet',
      url: houseIndoorWallUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'house_indoor_4',
      type: 'spritesheet',
      url: houseIndoor4Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'house_indoor_3',
      type: 'spritesheet',
      url: houseIndoor3Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'house_indoor',
      type: 'spritesheet',
      url: houseIndoorUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'Prison_3',
      type: 'spritesheet',
      url: prison3Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'Prison_2',
      type: 'spritesheet',
      url: prison2Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'house_indoor_6',
      type: 'spritesheet',
      url: houseIndoor6Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'house_indoor_2',
      type: 'spritesheet',
      url: houseIndoor2Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'house_indoor_carpet',
      type: 'spritesheet',
      url: houseIndoorCarpetUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    }
  ]
};
