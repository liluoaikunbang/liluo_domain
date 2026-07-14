export const liluoEstateMeta = {
  id: 'liluo_estate',
  name: '四季花园',
  description: '缚神祝福过的花园，四季的植物都能在这里同时生存。',
  defaultSpawnId: 'player_spawn',
  playerScale: 0.8,
  viewport: {
    smallMapAdaptiveFit: true
  },
  worldHints: [
    {
      id: 'liyin-search-hint',
      layerName: 'NPC_event',
      icon: '🔍',
      depth: 120,
      offsetPercentX: -80,
      offsetY: -34
    }
  ],
  worldRender: {
    tilesets: [
      {
        textureKey: 'legacy_farm_tileset',
        transparentTileLocalIds: [94],
        match: {
          name: 'Tileset',
          imageIncludes: ['farm_tileset']
        }
      },
      {
        textureKey: 'legacy_farm_object',
        transparentTileLocalIds: [6, 344],
        match: {
          name: 'Object',
          imageIncludes: ['farm_object']
        }
      },
      {
        textureKey: 'sprites_liluo',
        match: {
          name: 'sprites_liluo',
          imageIncludes: ['sprites_liluo']
        }
      },
      {
        textureKey: 'object_portal',
        match: {
          name: 'object_portal',
          imageIncludes: ['object_portal']
        }
      },
      {
        textureKey: 'cozytown_buildings_roofs',
        match: {
          name: 'cozytown_buildings_roofs',
          imageIncludes: ['cozytown_buildings_roofs']
        }
      },
      {
        textureKey: 'cozytown_buildings_walls',
        match: {
          name: 'cozytown_buildings_walls',
          imageIncludes: ['cozytown_buildings_walls']
        }
      },
      {
        textureKey: 'cozytown_terrain',
        match: {
          name: 'cozytown_terrain',
          imageIncludes: ['cozytown_terrain']
        }
      },
      {
        textureKey: 'cozytown_buildings_door',
        match: {
          name: 'cozytown_buildings_door',
          imageIncludes: ['cozytown_buildings_door']
        }
      },
      {
        textureKey: 'cozytown_buildings_objects',
        match: {
          name: 'cozytown_buildings_objects',
          imageIncludes: ['cozytown_buildings_objects']
        }
      },
      {
        textureKey: 'cozytown_structure_balcony',
        match: {
          name: 'cozytown_structure_balcony',
          imageIncludes: ['cozytown_structure_balcony']
        }
      },
      {
        textureKey: 'cozytown_small_bushes',
        match: {
          name: 'cozytown_small_bushes',
          imageIncludes: ['cozytown_small_bushes']
        }
      }
    ],
    npcReplacements: [
      {
        layerName: 'NPC',
        sourceTextureKey: 'sprites_liluo',
        appearanceId: 'bondage_legs_bound',
        direction: 'right',
        state: 'idle',
        depth: 12
      }
    ]
  }
} as const;
