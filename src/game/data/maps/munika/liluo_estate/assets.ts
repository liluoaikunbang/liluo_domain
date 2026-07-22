import * as Phaser from 'phaser';
import type { GameAssetBundle } from '../../../assets';

const legacyFarmTilesetUrl = new URL('../../../../../assets/game/sucai/Farm_tileset.png', import.meta.url).href;
const legacyFarmObjectUrl = new URL('../../../../../assets/game/sucai/Farm_object.png', import.meta.url).href;
const legacyLiluoSpriteTilesetUrl = new URL('../../../../../assets/game/sucai/sprites_liluo.png', import.meta.url).href;
const legacyPortalTilesetUrl = new URL('../../../../../assets/game/sucai/object_portal.png', import.meta.url).href;
const cozytownBuildingsRoofsUrl = new URL('../../../../../assets/game/sucai/cozytown_buildings_roofs.png', import.meta.url)
  .href;
const cozytownBuildingsWallsUrl = new URL('../../../../../assets/game/sucai/cozytown_buildings_walls.png', import.meta.url)
  .href;
const cozytownTerrainUrl = new URL('../../../../../assets/game/sucai/cozytown_terrain.png', import.meta.url).href;
const cozytownBuildingsDoorUrl = new URL('../../../../../assets/game/sucai/cozytown_buildings_door.png', import.meta.url)
  .href;
const cozytownBuildingsObjectsUrl = new URL('../../../../../assets/game/sucai/cozytown_buildings_objects.png', import.meta.url)
  .href;
const cozytownStructureBalconyUrl = new URL('../../../../../assets/game/sucai/cozytown_structure_balcony.png', import.meta.url)
  .href;
const cozytownSmallBushesUrl = new URL('../../../../../assets/game/sucai/cozytown_small_bushes.png', import.meta.url).href;
const zipTieTighten1Url = new URL('../../../../../assets/game/audio/sfx/zip_tie_tighten_1.mp3', import.meta.url)
  .href;
const zipTieTighten2Url = new URL('../../../../../assets/game/audio/sfx/zip_tie_tighten_2.mp3', import.meta.url)
  .href;
const zipTieTighten3Url = new URL('../../../../../assets/game/audio/sfx/zip_tie_tighten_3.mp3', import.meta.url)
  .href;
const zipTieTighten4Url = new URL('../../../../../assets/game/audio/sfx/zip_tie_tighten_4.mp3', import.meta.url)
  .href;
const legShackleUrl = new URL('../../../../../assets/game/audio/sfx/leg_shackle.mp3', import.meta.url).href;

function preparePortalTexture(scene: Phaser.Scene): void {
  const portalTexture = scene.textures.get('object_portal');

  if (!portalTexture || portalTexture.has('portal_frame_0')) {
    return;
  }

  const portalFrameWidth = 32;
  const portalFrameHeight = 64;
  const portalFrameStartX = 16;
  const portalFrameStepX = 64;

  for (let frameIndex = 0; frameIndex < 8; frameIndex++) {
    portalTexture.add(
      `portal_frame_${frameIndex}`,
      0,
      portalFrameStartX + frameIndex * portalFrameStepX,
      0,
      portalFrameWidth,
      portalFrameHeight
    );
  }
}

function prepareLiluoEstateTextures(scene: Phaser.Scene): void {
  preparePortalTexture(scene);
}

export const liluoEstateAssetBundle: GameAssetBundle = {
  manifest: [
    {
      key: 'legacy_farm_tileset',
      type: 'spritesheet',
      url: legacyFarmTilesetUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'legacy_farm_object',
      type: 'spritesheet',
      url: legacyFarmObjectUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'sprites_liluo',
      type: 'spritesheet',
      url: legacyLiluoSpriteTilesetUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'object_portal',
      type: 'spritesheet',
      url: legacyPortalTilesetUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_buildings_roofs',
      type: 'spritesheet',
      url: cozytownBuildingsRoofsUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_buildings_walls',
      type: 'spritesheet',
      url: cozytownBuildingsWallsUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_terrain',
      type: 'spritesheet',
      url: cozytownTerrainUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_buildings_door',
      type: 'spritesheet',
      url: cozytownBuildingsDoorUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_buildings_objects',
      type: 'spritesheet',
      url: cozytownBuildingsObjectsUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_structure_balcony',
      type: 'spritesheet',
      url: cozytownStructureBalconyUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'cozytown_small_bushes',
      type: 'spritesheet',
      url: cozytownSmallBushesUrl,
      config: {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    },
    {
      key: 'sfx_zip_tie_tighten_1',
      type: 'audio',
      url: zipTieTighten1Url
    },
    {
      key: 'sfx_zip_tie_tighten_2',
      type: 'audio',
      url: zipTieTighten2Url
    },
    {
      key: 'sfx_zip_tie_tighten_3',
      type: 'audio',
      url: zipTieTighten3Url
    },
    {
      key: 'sfx_zip_tie_tighten_4',
      type: 'audio',
      url: zipTieTighten4Url
    },
    {
      key: 'sfx_leg_shackle',
      type: 'audio',
      url: legShackleUrl
    }
  ],
  prepare: prepareLiluoEstateTextures
};
