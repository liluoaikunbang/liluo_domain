import { type GameAssetBundle } from '../../../assets';

const buildingSchoolUrl = new URL('../../../../../assets/game/sucai/building_school.png', import.meta.url).href;
const farmTilesetUrl = new URL('../../../../../assets/game/sucai/Farm_tileset.png', import.meta.url).href;
const buildingHospitalUrl = new URL('../../../../../assets/game/sucai/building_hospital.png', import.meta.url).href;
const buildingSchool2Url = new URL('../../../../../assets/game/sucai/building_school_2.png', import.meta.url).href;
const buildingSchool3Url = new URL('../../../../../assets/game/sucai/building_school_3.png', import.meta.url).href;
const stallUrl = new URL('../../../../../assets/game/sucai/stall.png', import.meta.url).href;
const spritesLiluoUrl = new URL('../../../../../assets/game/sucai/sprites_liluo.png', import.meta.url).href;
const buildingFountainUrl = new URL('../../../../../assets/game/sucai/building_fountain.png', import.meta.url).href;
const tiled2Url = new URL('../../../../../assets/game/sucai/tiled_2.png', import.meta.url).href;
const buildingTownHallUrl = new URL('../../../../../assets/game/sucai/building_town_hall.png', import.meta.url).href;
const outdoors1Url = new URL('../../../../../assets/game/sucai/outdoors_1.png', import.meta.url).href;
const outdoors2Url = new URL('../../../../../assets/game/sucai/outdoors_2.png', import.meta.url).href;
const medievalPropsDecorUrl = new URL(
  '../../../../../assets/game/sucai/medieval_building/medieval_building_Props_Decor.png',
  import.meta.url
).href;
const medievalGroundUrl = new URL(
  '../../../../../assets/game/sucai/medieval_building/medieval_building_Ground.png',
  import.meta.url
).href;
const medievalRoofsUrl = new URL(
  '../../../../../assets/game/sucai/medieval_building/medieval_building_Roofs.png',
  import.meta.url
).href;
const medievalSconceSpritesheetUrl = new URL(
  '../../../../../assets/game/sucai/medieval_building/medieval_building_Sconce_Spritesheet.png',
  import.meta.url
).href;
const medievalWallsUrl = new URL(
  '../../../../../assets/game/sucai/medieval_building/medieval_building_Walls.png',
  import.meta.url
).href;
const guardUrl = new URL('../../../../../assets/game/sucai/NPCs/guard.png', import.meta.url).href;
const buildingChurchUrl = new URL('../../../../../assets/game/sucai/building_church.png', import.meta.url).href;
const mineUrl = new URL('../../../../../assets/game/sucai/mine.png', import.meta.url).href;
const houseIndoor7Url = new URL('../../../../../assets/game/sucai/house_indoor_7.png', import.meta.url).href;
const trainUrl = new URL('../../../../../assets/game/sucai/train.png', import.meta.url).href;

const spritesheetConfig = {
  frameWidth: 16,
  frameHeight: 16,
  margin: 0,
  spacing: 0
} as const;

export const cityDesireAssetBundle: GameAssetBundle = {
  manifest: [
    { key: 'building_school', type: 'spritesheet', url: buildingSchoolUrl, config: spritesheetConfig },
    { key: 'Farm_tileset', type: 'spritesheet', url: farmTilesetUrl, config: spritesheetConfig },
    { key: 'building_hospital', type: 'spritesheet', url: buildingHospitalUrl, config: spritesheetConfig },
    { key: 'building_school_2', type: 'spritesheet', url: buildingSchool2Url, config: spritesheetConfig },
    { key: 'building_school_3', type: 'spritesheet', url: buildingSchool3Url, config: spritesheetConfig },
    { key: 'stall', type: 'spritesheet', url: stallUrl, config: spritesheetConfig },
    { key: 'sprites_liluo', type: 'spritesheet', url: spritesLiluoUrl, config: spritesheetConfig },
    { key: 'building_fountain', type: 'spritesheet', url: buildingFountainUrl, config: spritesheetConfig },
    { key: 'tiled_2', type: 'spritesheet', url: tiled2Url, config: spritesheetConfig },
    { key: 'building_town_hall', type: 'spritesheet', url: buildingTownHallUrl, config: spritesheetConfig },
    { key: 'outdoors_1', type: 'spritesheet', url: outdoors1Url, config: spritesheetConfig },
    { key: 'outdoors_2', type: 'spritesheet', url: outdoors2Url, config: spritesheetConfig },
    { key: 'medieval_building_Props_Decor', type: 'spritesheet', url: medievalPropsDecorUrl, config: spritesheetConfig },
    { key: 'medieval_building_Ground', type: 'spritesheet', url: medievalGroundUrl, config: spritesheetConfig },
    { key: 'medieval_building_Roofs', type: 'spritesheet', url: medievalRoofsUrl, config: spritesheetConfig },
    {
      key: 'medieval_building_Sconce_Spritesheet',
      type: 'spritesheet',
      url: medievalSconceSpritesheetUrl,
      config: spritesheetConfig
    },
    { key: 'medieval_building_Walls', type: 'spritesheet', url: medievalWallsUrl, config: spritesheetConfig },
    { key: 'guard', type: 'spritesheet', url: guardUrl, config: spritesheetConfig },
    { key: 'building_church', type: 'spritesheet', url: buildingChurchUrl, config: spritesheetConfig },
    { key: 'mine', type: 'spritesheet', url: mineUrl, config: spritesheetConfig },
    { key: 'house_indoor_7', type: 'spritesheet', url: houseIndoor7Url, config: spritesheetConfig },
    { key: 'train', type: 'spritesheet', url: trainUrl, config: spritesheetConfig }
  ]
};
