export const cityDesireMeta = {
  id: 'city_desire',
  name: '醉欲之城',
  description: '慕妮卡帝国中的一座城市，街区、学校、集市、教堂与旧式建筑交错在一起。',
  defaultSpawnId: 'role',
  playerScale: 1.0,
  viewport: {
    smallMapAdaptiveFit: false,
    cameraMode: 'follow-player'
  },
  worldRender: {
    tilesets: [
      { textureKey: 'building_school', match: { name: 'building_school', imageIncludes: ['building_school.png'] } },
      { textureKey: 'Farm_tileset', match: { name: 'Farm_tileset', imageIncludes: ['Farm_tileset'] } },
      { textureKey: 'building_hospital', match: { name: 'building_hospital', imageIncludes: ['building_hospital'] } },
      { textureKey: 'building_school_2', match: { name: 'building_school_2', imageIncludes: ['building_school_2'] } },
      { textureKey: 'building_school_3', match: { name: 'building_school_3', imageIncludes: ['building_school_3'] } },
      { textureKey: 'stall', match: { name: 'stall', imageIncludes: ['stall'] } },
      { textureKey: 'sprites_liluo', match: { name: 'sprites_liluo', imageIncludes: ['sprites_liluo'] } },
      { textureKey: 'building_fountain', match: { name: 'building_fountain', imageIncludes: ['building_fountain'] } },
      { textureKey: 'tiled_2', match: { name: 'tiled_2', imageIncludes: ['tiled_2'] } },
      { textureKey: 'building_town_hall', match: { name: 'building_town_hall', imageIncludes: ['building_town_hall'] } },
      { textureKey: 'outdoors_1', match: { name: 'outdoors_1', imageIncludes: ['outdoors_1'] } },
      { textureKey: 'outdoors_2', match: { name: 'outdoors_2', imageIncludes: ['outdoors_2'] } },
      {
        textureKey: 'medieval_building_Props_Decor',
        match: {
          name: 'medieval_building_Props_Decor',
          imageIncludes: ['medieval_building_Props_Decor']
        }
      },
      {
        textureKey: 'medieval_building_Ground',
        match: {
          name: 'medieval_building_Ground',
          imageIncludes: ['medieval_building_Ground']
        }
      },
      {
        textureKey: 'medieval_building_Roofs',
        match: {
          name: 'medieval_building_Roofs',
          imageIncludes: ['medieval_building_Roofs']
        }
      },
      {
        textureKey: 'medieval_building_Sconce_Spritesheet',
        match: {
          name: 'medieval_building_Sconce_Spritesheet',
          imageIncludes: ['medieval_building_Sconce_Spritesheet']
        }
      },
      {
        textureKey: 'medieval_building_Walls',
        match: {
          name: 'medieval_building_Walls',
          imageIncludes: ['medieval_building_Walls']
        }
      },
      { textureKey: 'guard', match: { name: 'guard', imageIncludes: ['guard'] } },
      { textureKey: 'building_church', match: { name: 'building_church', imageIncludes: ['building_church'] } },
      { textureKey: 'mine', match: { name: 'mine', imageIncludes: ['mine'] } },
      { textureKey: 'house_indoor_7', match: { name: 'house_indoor_7', imageIncludes: ['house_indoor_7'] } },
      { textureKey: 'train', match: { name: 'train', imageIncludes: ['train'] } }
    ]
  }
} as const;
