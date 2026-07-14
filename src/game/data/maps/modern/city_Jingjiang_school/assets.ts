import { type GameAssetBundle } from '../../../assets';

const tiles4Url = new URL('../../../../../assets/game/sucai/Modern/school/tiles_4.png', import.meta.url).href;
const tilesUrl = new URL('../../../../../assets/game/sucai/Modern/school/tiles.png', import.meta.url).href;
const tiles2Url = new URL('../../../../../assets/game/sucai/Modern/school/tiles_2.png', import.meta.url).href;
const tiles3Url = new URL('../../../../../assets/game/sucai/Modern/school/tiles_3.png', import.meta.url).href;
const tiles5Url = new URL('../../../../../assets/game/sucai/Modern/school/tiles_5.png', import.meta.url).href;
const outdoor2Url = new URL('../../../../../assets/game/sucai/Modern/school/outdoor_2.png', import.meta.url).href;
const outDoor3Url = new URL('../../../../../assets/game/sucai/Modern/school/out_door_3.png', import.meta.url).href;
const runwayUrl = new URL('../../../../../assets/game/sucai/Modern/school/runway.png', import.meta.url).href;
const spritesLiluoUrl = new URL('../../../../../assets/game/sucai/sprites_liluo.png', import.meta.url).href;
const outdoor1Url = new URL('../../../../../assets/game/sucai/Modern/school/outdoor_1.png', import.meta.url).href;
const supermarketUrl = new URL('../../../../../assets/game/sucai/Modern/school/supermarket.png', import.meta.url).href;
const dormitoryOldUrl = new URL('../../../../../assets/game/sucai/Modern/school/dormitory_old.png', import.meta.url).href;
const teamUrl = new URL('../../../../../assets/game/sucai/Modern/school/team.png', import.meta.url).href;
const tiled4Url = new URL('../../../../../assets/game/sucai/tiled_4.png', import.meta.url).href;
const dingingHallUrl = new URL('../../../../../assets/game/sucai/Modern/school/dinging_hall.png', import.meta.url).href;
const farmObject2Url = new URL('../../../../../assets/game/sucai/farm_object_2.png', import.meta.url).href;
const student1Url = new URL('../../../../../assets/game/sucai/Modern/school/NPCs/student1.png', import.meta.url).href;

const spritesheetConfig = {
  frameWidth: 16,
  frameHeight: 16,
  margin: 0,
  spacing: 0
} as const;

export const cityJingjiangSchoolAssetBundle: GameAssetBundle = {
  manifest: [
    { key: 'modern_school_tiles_4', type: 'spritesheet', url: tiles4Url, config: spritesheetConfig },
    { key: 'modern_school_tiles', type: 'spritesheet', url: tilesUrl, config: spritesheetConfig },
    { key: 'modern_school_tiles_2', type: 'spritesheet', url: tiles2Url, config: spritesheetConfig },
    { key: 'modern_school_tiles_3', type: 'spritesheet', url: tiles3Url, config: spritesheetConfig },
    { key: 'modern_school_tiles_5', type: 'spritesheet', url: tiles5Url, config: spritesheetConfig },
    { key: 'modern_school_outdoor_2', type: 'spritesheet', url: outdoor2Url, config: spritesheetConfig },
    { key: 'modern_school_out_door_3', type: 'spritesheet', url: outDoor3Url, config: spritesheetConfig },
    { key: 'modern_school_runway', type: 'spritesheet', url: runwayUrl, config: spritesheetConfig },
    { key: 'modern_school_sprites_liluo', type: 'spritesheet', url: spritesLiluoUrl, config: spritesheetConfig },
    { key: 'modern_school_outdoor_1', type: 'spritesheet', url: outdoor1Url, config: spritesheetConfig },
    { key: 'modern_school_supermarket', type: 'spritesheet', url: supermarketUrl, config: spritesheetConfig },
    { key: 'modern_school_dormitory_old', type: 'spritesheet', url: dormitoryOldUrl, config: spritesheetConfig },
    { key: 'modern_school_team', type: 'spritesheet', url: teamUrl, config: spritesheetConfig },
    { key: 'modern_school_tiled_4', type: 'spritesheet', url: tiled4Url, config: spritesheetConfig },
    { key: 'modern_school_dinging_hall', type: 'spritesheet', url: dingingHallUrl, config: spritesheetConfig },
    { key: 'modern_school_farm_object_2', type: 'spritesheet', url: farmObject2Url, config: spritesheetConfig },
    { key: 'modern_school_student1', type: 'spritesheet', url: student1Url, config: spritesheetConfig }
  ]
};
