export const liluoRoomMeta = {
  id: 'liluo_room',
  name: '璃落的房间',
  description: '充满少女心装饰的卧室，是只属于璃落自己的小小城堡。',
  defaultSpawnId: 'role',
  playerScale: 1,
  viewport: {
    smallMapAdaptiveFit: false,
    cameraMode: 'static-centered'
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
        textureKey: 'house_indoor_4',
        match: {
          name: 'house_indoor_4',
          imageIncludes: ['house_indoor_4']
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
        textureKey: 'house_indoor',
        match: {
          name: 'house_indoor',
          imageIncludes: ['house_indoor']
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
        textureKey: 'Prison_2',
        match: {
          name: 'Prison_2',
          imageIncludes: ['Prison_2']
        }
      },
      {
        textureKey: 'house_indoor_6',
        match: {
          name: 'house_indoor_6',
          imageIncludes: ['house_indoor_6']
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
        textureKey: 'house_indoor_carpet',
        match: {
          name: 'house_indoor_carpet',
          imageIncludes: ['house_indoor_carpet']
        }
      }
    ]
  }
} as const;
