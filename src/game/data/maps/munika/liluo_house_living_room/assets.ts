import { type GameAssetBundle } from '../../../assets';

const houseIndoorWallUrl = new URL('../../../../../assets/game/sucai/house_indoor_wall.png', import.meta.url).href;
const houseIndoorUrl = new URL('../../../../../assets/game/sucai/house_indoor.png', import.meta.url).href;
const houseIndoorEuropeUrl = new URL('../../../../../assets/game/sucai/house_indoor_europe.png', import.meta.url)
  .href;
const houseIndoor2Url = new URL('../../../../../assets/game/sucai/house_indoor_2.PNG', import.meta.url).href;
const farmObject2Url = new URL('../../../../../assets/game/sucai/farm_object_2.png', import.meta.url).href;

export const liluoHouseLivingRoomAssetBundle: GameAssetBundle = {
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
      key: 'house_indoor_europe',
      type: 'spritesheet',
      url: houseIndoorEuropeUrl,
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
      key: 'farm_object_2',
      type: 'spritesheet',
      url: farmObject2Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    }
  ]
};
