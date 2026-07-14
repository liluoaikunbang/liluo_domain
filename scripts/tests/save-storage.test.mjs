import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() {
    this.items = new Map();
  }

  get length() {
    return this.items.size;
  }

  key(index) {
    return Array.from(this.items.keys())[index] ?? null;
  }

  getItem(key) {
    return this.items.get(key) ?? null;
  }

  setItem(key, value) {
    this.items.set(key, String(value));
  }

  removeItem(key) {
    this.items.delete(key);
  }

  clear() {
    this.items.clear();
  }
}

global.window = {
  localStorage: new MemoryStorage()
};

const {
  createGameSaveExportData,
  deleteAllGameSaveFiles,
  deleteGameSaveFile,
  importGameSaveExportData,
  listGameSaveFiles,
  loadGameFromFile,
  saveGameToFile
} = await import('../../src/game/core/saveStorage.ts');

function createSaveData(mapId, x, gold = 100, desireCrystals = 0) {
  return {
    version: 1,
    savedAt: '2026-05-09T00:00:00.000Z',
    global: {
      gold,
      desireCrystals
    },
    player: {
      appearanceId: 'default',
      portraitKey: 'portrait_liluo_default',
      status: [],
      restraints: [],
      inventory: {},
      equipment: {}
    },
    location: {
      mapId,
      position: { x, y: 64 }
    },
    mapSession: {
      mapId,
      flags: {}
    }
  };
}

test('local storage save files can be listed, loaded, and exported', () => {
  window.localStorage.clear();

  saveGameToFile(createSaveData('liluo_room', 32), 'slot one');

  assert.deepEqual(listGameSaveFiles(), [{
    slotId: 'slot-one',
    savedAt: '2026-05-09T00:00:00.000Z',
    mapId: 'liluo_room',
    position: { x: 32, y: 64 },
    playerStatus: [],
    playerRestraints: [],
    goldAmount: 100,
    desireCrystalAmount: 0,
    playerPreview: {
      imageUrl: new URL('../../src/assets/game/sprite/liluo_walk_source.png', import.meta.url).href,
      frameWidth: 32,
      frameHeight: 32,
      frameIndex: 1,
      frameColumns: 3
    }
  }]);
  assert.equal(loadGameFromFile('slot-one').location.position.x, 32);
  assert.equal(createGameSaveExportData().saves['slot-one'].location.mapId, 'liluo_room');
});

test('saving without a slot creates a new save entry instead of overwriting default', () => {
  window.localStorage.clear();

  const firstSummary = saveGameToFile(createSaveData('liluo_room', 32));
  const secondSummary = saveGameToFile(createSaveData('city_desire', 96, 237, 5));

  assert.equal(firstSummary.slotId, 'save001');
  assert.equal(secondSummary.slotId, 'save002');
  assert.equal(secondSummary.goldAmount, 237);
  assert.equal(secondSummary.desireCrystalAmount, 5);
  assert.deepEqual(listGameSaveFiles().map((save) => save.slotId), ['save001', 'save002']);
});

test('legacy default and dashed save ids are migrated to numbered save ids', () => {
  window.localStorage.clear();

  window.localStorage.setItem('liluo_domain:game_save:default', JSON.stringify(createSaveData('liluo_room', 32)));
  window.localStorage.setItem('liluo_domain:game_save:save-001', JSON.stringify(createSaveData('city_desire', 96)));

  assert.deepEqual(listGameSaveFiles().map((save) => save.slotId), ['save001', 'save002']);
  assert.equal(loadGameFromFile('save001').location.mapId, 'liluo_room');
  assert.equal(loadGameFromFile('save002').location.mapId, 'city_desire');
  assert.equal(loadGameFromFile('default').location.mapId, 'liluo_room');

  const nextSummary = saveGameToFile(createSaveData('liluo_room', 128));
  assert.equal(nextSummary.slotId, 'save003');
});

test('local save files can be deleted by slot id', () => {
  window.localStorage.clear();

  saveGameToFile(createSaveData('liluo_room', 32), 'delete target');
  saveGameToFile(createSaveData('city_desire', 96), 'keep target');

  assert.equal(deleteGameSaveFile('delete-target'), true);
  assert.equal(loadGameFromFile('delete-target'), null);
  assert.deepEqual(listGameSaveFiles().map((save) => save.slotId), ['keep-target']);
  assert.equal(deleteGameSaveFile('missing-target'), false);
});

test('numbered save ids are compacted after a numbered save is deleted', () => {
  window.localStorage.clear();

  saveGameToFile(createSaveData('liluo_room', 32));
  saveGameToFile(createSaveData('city_desire', 96));
  saveGameToFile(createSaveData('liluo_room', 128));

  assert.equal(deleteGameSaveFile('save001'), true);
  assert.deepEqual(listGameSaveFiles().map((save) => save.slotId), ['save001', 'save002']);
  assert.equal(loadGameFromFile('save001').location.mapId, 'city_desire');
  assert.equal(loadGameFromFile('save002').location.position.x, 128);

  const nextSummary = saveGameToFile(createSaveData('city_desire', 160));
  assert.equal(nextSummary.slotId, 'save003');
});

test('all local save files can be deleted without clearing unrelated local storage', () => {
  window.localStorage.clear();

  saveGameToFile(createSaveData('liluo_room', 32));
  saveGameToFile(createSaveData('city_desire', 96), 'custom');
  window.localStorage.setItem('appVersion', '1.0.0');

  assert.equal(deleteAllGameSaveFiles(), 2);
  assert.deepEqual(listGameSaveFiles(), []);
  assert.equal(window.localStorage.getItem('appVersion'), '1.0.0');
  assert.equal(deleteAllGameSaveFiles(), 0);
});

test('importing exported save data replaces existing local saves after validation', () => {
  window.localStorage.clear();
  saveGameToFile(createSaveData('liluo_room', 32), 'old');

  const count = importGameSaveExportData({
    version: 1,
    exportedAt: '2026-05-09T00:00:00.000Z',
    saves: {
      fresh: createSaveData('city_desire', 96)
    }
  });

  assert.equal(count, 1);
  assert.deepEqual(listGameSaveFiles().map((save) => save.slotId), ['fresh']);
  assert.equal(loadGameFromFile('fresh').location.mapId, 'city_desire');
});

test('exported saves can be deleted, imported again, and loaded with player data intact', () => {
  window.localStorage.clear();
  saveGameToFile({
    ...createSaveData('liluo_room', 32),
    player: {
      appearanceId: 'full_body_bondage',
      portraitKey: 'portrait_liluo_default',
      status: ['双手被缚'],
      restraints: [],
      inventory: { key: 1 },
      equipment: {}
    }
  });

  const exportedData = createGameSaveExportData();

  assert.equal(deleteAllGameSaveFiles(), 1);
  assert.deepEqual(listGameSaveFiles(), []);

  const importCount = importGameSaveExportData(exportedData);
  const importedSave = loadGameFromFile('save001');

  assert.equal(importCount, 1);
  assert.deepEqual(listGameSaveFiles().map((save) => save.slotId), ['save001']);
  assert.equal(importedSave.location.mapId, 'liluo_room');
  assert.deepEqual(importedSave.location.position, { x: 32, y: 64 });
  assert.equal(importedSave.player.appearanceId, 'full_body_bondage');
  assert.deepEqual(importedSave.player.status, ['hands_bound']);
});
