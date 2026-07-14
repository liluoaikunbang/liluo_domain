export const liluoHouseLivingRoomMeta = {
  id: 'liluo_house_living_room',
  name: '小别墅',
  description: '位于缚神领地-住宅区内的一座独栋别墅，璃落、沐沐和璃雪所住的房子。',
  defaultSpawnId: 'role',
  playerScale: 1,
  viewport: {
    smallMapAdaptiveFit: false
  },
  worldRender: {
    tilesets: [
      {
        textureKey: 'house_indoor_wall',
        match: {
          name: 'house_indoor_wall',
          imageIncludes: ['house_indoor_wall']
        }
      },
      {
        textureKey: 'house_indoor',
        match: {
          name: 'house_indoor',
          imageIncludes: ['house_indoor']
        }
      },
      {
        textureKey: 'house_indoor_europe',
        match: {
          name: 'house_indoor_europe',
          imageIncludes: ['house_indoor_europe']
        }
      },
      {
        textureKey: 'house_indoor_2',
        match: {
          name: 'house_indoor_2',
          imageIncludes: ['house_indoor_2']
        }
      },
      {
        textureKey: 'farm_object_2',
        match: {
          name: 'farm_object_2',
          imageIncludes: ['farm_object_2']
        }
      }
    ]
  }
} as const;
