export const mumuRoomMeta = {
  id: 'mumu_room',
  name: '沐沐的牢房',
  description: '虽然名义上叫牢房，但这里实际上是沐沐的卧室啦。',
  defaultSpawnId: 'role',
  playerScale: 1.0,
  viewport: {
    smallMapAdaptiveFit: false,
    cameraMode: 'static-centered'
  },
  worldRender: {
    tilesets: [
      {
        textureKey: 'dungeon_tileset',
        match: {
          name: 'dungeon_tileset',
          imageIncludes: ['dungeon_tileset']
        }
      },
      {
        textureKey: 'house_indoor_3',
        match: {
          name: 'house_indoor_3',
          imageIncludes: ['house_indoor_3']
        }
      },
      {
        textureKey: 'Prison',
        match: {
          name: 'Prison',
          imageIncludes: ['Prison']
        }
      },
      {
        textureKey: 'Prison_1',
        match: {
          name: 'Prison_1',
          imageIncludes: ['Prison_1']
        }
      },
      {
        textureKey: 'Prison_2',
        match: {
          name: 'Prison_2',
          imageIncludes: ['Prison_2']
        }
      },
      {
        textureKey: 'Prison_3',
        match: {
          name: 'Prison_3',
          imageIncludes: ['Prison_3']
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
        textureKey: 'outhers_1',
        match: {
          name: 'outhers_1',
          imageIncludes: ['outhers_1']
        }
      }
    ]
  }
} as const;
