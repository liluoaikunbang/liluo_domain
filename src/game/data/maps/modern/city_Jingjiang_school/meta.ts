export const cityJingjiangSchoolMeta = {
  id: 'city_jingjiang_school',
  name: '荆南大学',
  description: '现代城区中的学校地图，先作为 modern 地图内容接入准备。',
  defaultSpawnId: 'role',
  playerScale: 1.0,
  viewport: {
    smallMapAdaptiveFit: false,
    cameraMode: 'follow-player'
  },
  worldRender: {
    tilesets: [
      { textureKey: 'modern_school_tiles_4', match: { name: 'tiles_4', imageIncludes: ['tiles_4'] } },
      { textureKey: 'modern_school_tiles', match: { name: 'tiles', imageIncludes: ['tiles.png'] } },
      { textureKey: 'modern_school_tiles_2', match: { name: 'tiles_2', imageIncludes: ['tiles_2'] } },
      { textureKey: 'modern_school_tiles_3', match: { name: 'tiles_3', imageIncludes: ['tiles_3'] } },
      { textureKey: 'modern_school_tiles_5', match: { name: 'tiles_5', imageIncludes: ['tiles_5'] } },
      { textureKey: 'modern_school_outdoor_2', match: { name: 'outdoor_2', imageIncludes: ['outdoor_2'] } },
      { textureKey: 'modern_school_out_door_3', match: { name: 'out_door_3', imageIncludes: ['out_door_3'] } },
      { textureKey: 'modern_school_runway', match: { name: 'runway', imageIncludes: ['runway'] } },
      { textureKey: 'modern_school_sprites_liluo', match: { name: 'sprites_liluo', imageIncludes: ['sprites_liluo'] } },
      { textureKey: 'modern_school_outdoor_1', match: { name: 'outdoor_1', imageIncludes: ['outdoor_1'] } },
      { textureKey: 'modern_school_supermarket', match: { name: 'supermarket', imageIncludes: ['supermarket'] } },
      { textureKey: 'modern_school_dormitory_old', match: { name: 'dormitory_old', imageIncludes: ['dormitory_old'] } },
      { textureKey: 'modern_school_team', match: { name: 'team', imageIncludes: ['team'] } },
      { textureKey: 'modern_school_tiled_4', match: { name: 'tiled_4', imageIncludes: ['tiled_4'] } },
      { textureKey: 'modern_school_dinging_hall', match: { name: 'dinging_hall', imageIncludes: ['dinging_hall'] } },
      { textureKey: 'modern_school_farm_object_2', match: { name: 'farm_object_2', imageIncludes: ['farm_object_2'] } },
      { textureKey: 'modern_school_student1', match: { name: 'student1', imageIncludes: ['student1'] } }
    ]
  }
} as const;
