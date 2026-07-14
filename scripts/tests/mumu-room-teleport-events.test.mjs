import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mumuRoomEvents = JSON.parse(fs.readFileSync(new URL('../../src/game/data/maps/munika/mumu_room/events.json', import.meta.url), 'utf8'));
const mumuRoomMap = JSON.parse(fs.readFileSync(new URL('../../src/game/data/maps/munika/mumu_room/map.json', import.meta.url), 'utf8'));

function getNonEmptyTilePositionsForLayer(mapData, layerName) {
  const layer = mapData.layers.find((candidateLayer) => candidateLayer.type === 'tilelayer' && candidateLayer.name === layerName);
  const chunks = layer?.chunks ?? [];
  const allChunks = (mapData.layers ?? []).flatMap((candidateLayer) => candidateLayer.chunks ?? []);
  const minTileX = allChunks.length > 0
    ? Math.min(0, ...allChunks.map((chunk) => chunk.x ?? 0))
    : 0;
  const minTileY = allChunks.length > 0
    ? Math.min(0, ...allChunks.map((chunk) => chunk.y ?? 0))
    : 0;

  if (chunks.length > 0) {
    return chunks.flatMap((chunk) => {
      const chunkData = chunk.data ?? [];
      const chunkWidth = chunk.width ?? 0;

      return chunkData.flatMap((tileGid, index) => {
        if ((tileGid ?? 0) <= 0 || !chunkWidth) {
          return [];
        }

        return {
          tileX: (index % chunkWidth) + chunk.x - minTileX,
          tileY: Math.floor(index / chunkWidth) + chunk.y - minTileY
        };
      });
    });
  }

  const layerData = layer?.data ?? [];
  const layerWidth = layer?.width ?? mapData.width ?? 0;

  if (!layerWidth || layerData.length === 0) {
    return [];
  }

  return layerData.flatMap((tileGid, index) => {
    if ((tileGid ?? 0) <= 0) {
      return [];
    }

    return {
      tileX: index % layerWidth,
      tileY: Math.floor(index / layerWidth)
    };
  });
}

function eventContract(event) {
  return {
    eventId: event.eventId,
    triggerType: event.triggerType,
    mapTransition: event.mapTransition,
    tileMarker: event.tileMarker,
    panelActionIds: event.panelActions.map(({ actionId }) => actionId)
  };
}

test('mumu room teleport markers are bound to bidirectional manual transition events', () => {
  assert.equal(mumuRoomEvents.mumu_room_leave.triggerType, 'manual');
  assert.deepEqual(mumuRoomEvents.mumu_room_leave.mapTransition, {
    mapId: 'liluo_house_living_room',
    spawnId: 'mumu_room_event'
  });
  assert.deepEqual(mumuRoomEvents.mumu_room_leave.tileMarker, {
    mapId: 'mumu_room',
    layerName: 'role'
  });

  assert.deepEqual(eventContract(mumuRoomEvents.mumu_room_input_event_1), {
    eventId: 'mumu_room_input_event_1',
    triggerType: 'manual',
    mapTransition: {
      mapId: 'mumu_room',
      spawnMarker: {
        layerName: 'output_event_1',
        anchor: 'first'
      }
    },
    tileMarker: {
      mapId: 'mumu_room',
      layerName: 'input_event_1'
    },
    panelActionIds: ['use_mumu_room_input_event_1']
  });

  assert.deepEqual(eventContract(mumuRoomEvents.mumu_room_output_event_1), {
    eventId: 'mumu_room_output_event_1',
    triggerType: 'manual',
    mapTransition: {
      mapId: 'mumu_room',
      spawnMarker: {
        layerName: 'input_event_1',
        anchor: 'bottom-left'
      }
    },
    tileMarker: {
      mapId: 'mumu_room',
      layerName: 'output_event_1'
    },
    panelActionIds: ['use_mumu_room_output_event_1']
  });

  assert.deepEqual(eventContract(mumuRoomEvents.mumu_room_input_event_2), {
    eventId: 'mumu_room_input_event_2',
    triggerType: 'manual',
    mapTransition: {
      mapId: 'mumu_room',
      spawnMarker: {
        layerName: 'output_event_2',
        anchor: 'first'
      }
    },
    tileMarker: {
      mapId: 'mumu_room',
      layerName: 'input_event_2'
    },
    panelActionIds: ['use_mumu_room_input_event_2']
  });

  assert.deepEqual(eventContract(mumuRoomEvents.mumu_room_output_event_2), {
    eventId: 'mumu_room_output_event_2',
    triggerType: 'manual',
    mapTransition: {
      mapId: 'mumu_room',
      spawnMarker: {
        layerName: 'input_event_2',
        anchor: 'bottom-left'
      }
    },
    tileMarker: {
      mapId: 'mumu_room',
      layerName: 'output_event_2'
    },
    panelActionIds: ['use_mumu_room_output_event_2']
  });
});

test('mumu room leave event stays bound to the current room entrance marker', () => {
  const roleTiles = getNonEmptyTilePositionsForLayer(mumuRoomMap, 'role');

  assert.equal(roleTiles.length, 1);
  assert.equal(mumuRoomEvents.mumu_room_leave.zones, undefined);
  assert.deepEqual(mumuRoomEvents.mumu_room_leave.tileMarker, {
    mapId: 'mumu_room',
    layerName: 'role'
  });
});

test('mumu room teleport marker layers all exist and keep paired portal footprints', () => {
  const inputEvent1Tiles = getNonEmptyTilePositionsForLayer(mumuRoomMap, 'input_event_1');
  const outputEvent1Tiles = getNonEmptyTilePositionsForLayer(mumuRoomMap, 'output_event_1');
  const inputEvent2Tiles = getNonEmptyTilePositionsForLayer(mumuRoomMap, 'input_event_2');
  const outputEvent2Tiles = getNonEmptyTilePositionsForLayer(mumuRoomMap, 'output_event_2');

  assert.ok(inputEvent1Tiles.length > 0);
  assert.ok(outputEvent1Tiles.length > 0);
  assert.ok(inputEvent2Tiles.length > 0);
  assert.ok(outputEvent2Tiles.length > 0);

  assert.ok(Math.min(...inputEvent1Tiles.map((tile) => tile.tileY)) > Math.max(...outputEvent1Tiles.map((tile) => tile.tileY)));
  assert.ok(Math.min(...inputEvent2Tiles.map((tile) => tile.tileY)) > Math.max(...outputEvent2Tiles.map((tile) => tile.tileY)));
});

test('mumu room output-to-input teleports target the input marker layer instead of a disposable spawn layer', () => {
  assert.equal(mumuRoomEvents.mumu_room_output_event_1.mapTransition.spawnId, undefined);
  assert.equal(mumuRoomEvents.mumu_room_output_event_2.mapTransition.spawnId, undefined);
  assert.deepEqual(mumuRoomEvents.mumu_room_output_event_1.mapTransition.spawnMarker, {
    layerName: 'input_event_1',
    anchor: 'bottom-left'
  });
  assert.deepEqual(mumuRoomEvents.mumu_room_output_event_2.mapTransition.spawnMarker, {
    layerName: 'input_event_2',
    anchor: 'bottom-left'
  });
});
