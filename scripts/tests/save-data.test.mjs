import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyGameSaveData,
  createGameSaveData,
  parseGameSaveData
} from '../../src/game/core/saveData.ts';
import {
  getGameRuntimeState,
  resetGameRuntimeState,
  setDesireCrystalAmount,
  setGoldAmount
} from '../../src/game/core/gameRuntime.ts';
import {
  getPlayerRuntimeState,
  resetPlayerRuntimeState,
  setPlayerAppearance,
  setPlayerEquipment,
  setPlayerInventory,
  setPlayerStatus
} from '../../src/game/core/playerRuntime.ts';
import {
  resolveEquipmentMenuCategories,
  resolveInventoryMenuCategories
} from '../../src/game/core/gameMenuDataResolver.ts';

test('game save data captures player runtime state, map id, and world position', () => {
  resetPlayerRuntimeState();
  resetGameRuntimeState();
  setPlayerAppearance('bondage');
  setPlayerStatus(['双手被缚']);

  const saveData = createGameSaveData({
    mapId: 'liluo_room',
    position: { x: 144.4, y: 208.9 },
    mapSession: {
      mapId: 'liluo_room',
      flags: {
        inspected_bed: true
      }
    },
    savedAt: '2026-05-09T00:00:00.000Z'
  });

  assert.equal(saveData.version, 1);
  assert.equal(saveData.location.mapId, 'liluo_room');
  assert.deepEqual(saveData.location.position, { x: 144.4, y: 208.9 });
  assert.equal(saveData.player.appearanceId, 'bondage');
  assert.deepEqual(saveData.player.status, ['hands_bound']);
  assert.deepEqual(saveData.global, { gold: 100, desireCrystals: 0 });
  assert.deepEqual(saveData.mapSession.flags, { inspected_bed: true });
});

test('applying a save restores player runtime state', () => {
  resetPlayerRuntimeState();
  resetGameRuntimeState();

  const saveData = createGameSaveData({
    mapId: 'liluo_room',
    position: { x: 48, y: 64 },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    },
    player: {
      appearanceId: 'bondage',
      portraitKey: 'portrait_liluo_default',
      status: ['双手被缚'],
      restraints: ['rope'],
      inventory: { key: 1 },
      equipment: { hands: 'rope' }
    },
    global: {
      gold: 235,
      desireCrystals: 9
    }
  });

  assert.equal(applyGameSaveData(saveData), true);
  assert.equal(getPlayerRuntimeState().appearanceId, 'bondage');
  assert.deepEqual(getPlayerRuntimeState().status, ['hands_bound']);
  assert.deepEqual(getPlayerRuntimeState().inventory, { key: 1 });
  assert.deepEqual(getPlayerRuntimeState().equipment, { hands: 'rope' });
  assert.equal(getGameRuntimeState().gold, 235);
  assert.equal(getGameRuntimeState().desireCrystals, 9);
});

test('game runtime global resources start at defaults and are included in save data', () => {
  resetGameRuntimeState();

  assert.equal(getGameRuntimeState().gold, 100);
  assert.equal(getGameRuntimeState().desireCrystals, 0);

  setGoldAmount(88);
  setDesireCrystalAmount(6);

  const saveData = createGameSaveData({
    mapId: 'liluo_room',
    position: { x: 48, y: 64 },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  });

  assert.deepEqual(saveData.global, { gold: 88, desireCrystals: 6 });
});

test('save data stores dynamic menu state as ids while menu resolver reads static definitions', () => {
  resetPlayerRuntimeState();
  setPlayerInventory({
    old_key: 2,
    unnamed_relic: 1
  });
  setPlayerEquipment({
    weapon: 'wooden_sword',
    unknown_slot: 'old_ring'
  });

  const saveData = createGameSaveData({
    mapId: 'liluo_room',
    position: { x: 48, y: 64 },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  });

  assert.deepEqual(saveData.player.inventory, {
    old_key: 2,
    unnamed_relic: 1
  });
  assert.deepEqual(saveData.player.equipment, {
    weapon: 'wooden_sword',
    unknown_slot: 'old_ring'
  });
  assert.equal(saveData.player.inventory.old_key.name, undefined);

  const inventoryCategories = resolveInventoryMenuCategories([
    {
      key: 'valuables',
      label: 'Valuables',
      slots: [
        {
          key: 'old_key',
          title: 'Old key',
          summary: 'Not owned'
        }
      ]
    }
  ], saveData.player.inventory);
  const equipmentCategories = resolveEquipmentMenuCategories([
    {
      key: 'weapon',
      label: 'Weapon',
      items: [
        {
          key: 'wooden_sword',
          title: 'Wooden sword',
          summary: 'Unequipped'
        }
      ]
    }
  ], saveData.player.equipment);

  assert.equal(inventoryCategories[0].slots[0].title, 'Old key');
  assert.equal(inventoryCategories[0].slots[0].summary, '持有 2');
  assert.equal(inventoryCategories[1].key, 'runtime-unfiled-inventory');
  assert.equal(inventoryCategories[1].slots[0].key, 'unnamed_relic');
  assert.equal(equipmentCategories[0].items[0].summary, '已装备');
  assert.equal(equipmentCategories[1].key, 'runtime-unfiled-equipment');
  assert.equal(equipmentCategories[1].items[0].key, 'unknown_slot:old_ring');
});

test('parseGameSaveData defaults missing global state to initial values', () => {
  resetGameRuntimeState();
  setGoldAmount(12);

  const saveData = parseGameSaveData({
    version: 1,
    savedAt: '2026-05-09T00:00:00.000Z',
    player: getPlayerRuntimeState(),
    location: {
      mapId: 'liluo_room',
      position: { x: 48, y: 64 }
    },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  });

  assert.deepEqual(saveData.global, { gold: 100, desireCrystals: 0 });
});

test('parseGameSaveData rejects invalid positions', () => {
  assert.equal(parseGameSaveData({
    version: 1,
    savedAt: '2026-05-09T00:00:00.000Z',
    player: getPlayerRuntimeState(),
    location: {
      mapId: 'liluo_room',
      position: { x: Number.NaN, y: 2 }
    },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  }), null);
});

test('parseGameSaveData rejects saves with stale player appearance data', () => {
  resetPlayerRuntimeState();
  setPlayerAppearance('full_body_bondage');

  assert.equal(parseGameSaveData({
    version: 1,
    savedAt: '2026-05-09T00:00:00.000Z',
    player: {
      appearanceId: 'missing_old_appearance',
      portraitKey: 'portrait_liluo_default',
      status: [],
      restraints: [],
      inventory: {},
      equipment: {}
    },
    location: {
      mapId: 'liluo_room',
      position: { x: 48, y: 64 }
    },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  }), null);
});

test('parseGameSaveData rejects older saves without player data', () => {
  assert.equal(parseGameSaveData({
    version: 1,
    savedAt: '2026-05-09T00:00:00.000Z',
    location: {
      mapId: 'liluo_room',
      position: { x: 48, y: 64 }
    },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  }), null);
});

test('player status save data is selected from the shared status list', () => {
  resetPlayerRuntimeState();

  setPlayerStatus(['未穿鞋', 'hands_bound', 'missing_status', '未穿鞋']);

  const saveData = createGameSaveData({
    mapId: 'liluo_room',
    position: { x: 48, y: 64 },
    mapSession: {
      mapId: 'liluo_room',
      flags: {}
    }
  });

  assert.deepEqual(saveData.player.status, ['no_shoes', 'hands_bound']);

  resetPlayerRuntimeState();
});
