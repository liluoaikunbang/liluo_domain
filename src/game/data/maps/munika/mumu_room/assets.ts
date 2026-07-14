import { type GameAssetBundle } from '../../../assets';

const dungeonTilesetUrl = new URL('../../../../../assets/game/sucai/dungeon_tileset.png', import.meta.url).href;
const houseIndoor3Url = new URL('../../../../../assets/game/sucai/house_indoor_3.png', import.meta.url).href;
const prisonUrl = new URL('../../../../../assets/game/sucai/Prison.png', import.meta.url).href;
const prison1Url = new URL('../../../../../assets/game/sucai/Prison_1.png', import.meta.url).href;
const prison2Url = new URL('../../../../../assets/game/sucai/Prison_2.png', import.meta.url).href;
const prison3Url = new URL('../../../../../assets/game/sucai/Prison_3.png', import.meta.url).href;
const houseIndoorEuropeUrl = new URL('../../../../../assets/game/sucai/house_indoor_europe.png', import.meta.url).href;
const outhers1Url = new URL('../../../../../assets/game/sucai/outhers_1.png', import.meta.url).href;

export const mumuRoomAssetBundle: GameAssetBundle = {
  manifest: [
    {
      key: 'dungeon_tileset',
      type: 'spritesheet',
      url: dungeonTilesetUrl,
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
      key: 'Prison',
      type: 'spritesheet',
      url: prisonUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'Prison_1',
      type: 'spritesheet',
      url: prison1Url,
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
      key: 'outhers_1',
      type: 'spritesheet',
      url: outhers1Url,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    }
  ]
};
