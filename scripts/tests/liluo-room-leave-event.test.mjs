import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const liluoRoomEvents = JSON.parse(fs.readFileSync(new URL('../../src/game/data/maps/munika/liluo_room/events.json', import.meta.url), 'utf8'));
const liluoRoomMap = JSON.parse(fs.readFileSync(new URL('../../src/game/data/maps/munika/liluo_room/map.json', import.meta.url), 'utf8'));

test('liluo room leave event is bound to the role marker layer', () => {
  const leaveEvent = liluoRoomEvents.liluo_room_leave;

  assert.ok(leaveEvent, '搴斿瓨鍦?liluo_room_leave 浜嬩欢');
  assert.deepEqual(leaveEvent.tileMarker, {
    mapId: 'liluo_room',
    layerName: 'role'
  });
  assert.equal(Array.isArray(leaveEvent.zones), false, '涓嶅簲鍐嶄緷璧栨棫鐨勭‖缂栫爜 zones 鍧愭爣');
});

test('liluo room role marker layer contains at least one trigger tile', () => {
  const roleLayer = liluoRoomMap.layers.find((layer) => layer.name === 'role');

  assert.ok(roleLayer, '鍦板浘涓簲瀛樺湪 role 鍥惧眰');

  const nonEmptyTileCount = (roleLayer.chunks ?? []).reduce((count, chunk) => {
    return count + (chunk.data ?? []).filter((tileGid) => (tileGid ?? 0) > 0).length;
  }, 0);

  assert.ok(nonEmptyTileCount > 0, 'role 鍥惧眰涓婅嚦灏戝簲鏈変竴涓湁鏁堣Е鍙戞牸');
});

test('liluo room bed event is bound to the bed_event marker layer', () => {
  const bedEvent = liluoRoomEvents.liluo_room_bed_event;

  assert.ok(bedEvent, '搴斿瓨鍦?liluo_room_bed_event 浜嬩欢');
  assert.equal(bedEvent.dialogueId, 'liluo_room_bed_dialogue');
  assert.deepEqual(bedEvent.tileMarker, {
    mapId: 'liluo_room',
    layerName: 'bed_event'
  });
});

test('liluo room bed dialogue declares a scene image that should be preloaded with map dialogue assets', async () => {
  const liluoRoomDialogues = JSON.parse(
    fs.readFileSync(new URL('../../src/game/data/maps/munika/liluo_room/dialogues.json', import.meta.url), 'utf8')
  );
  const liluoRoomDialoguesModule = await import('../../src/game/data/maps/munika/liluo_room/dialogues.ts');

  assert.deepEqual(liluoRoomDialogues.liluo_room_bed_dialogue.sceneImage, {
    assetKey: 'liluo-room-bed-background'
  });

  assert.ok(
    liluoRoomDialoguesModule.liluoRoomDialogueAssetBundle.manifest.some((asset) => {
      return asset.key === 'liluo-room-bed-background' && asset.type === 'image';
    }),
    '搴婁簨浠惰儗鏅浘搴旀斁鍦?liluo_room 瀵硅瘽璧勬簮鍖呴噷锛岄殢鍦板浘杩涘叆鏃堕鍔犺浇'
  );
});

test('liluo room leave event clears restrained sleep statuses before transition', () => {
  const leaveEvent = liluoRoomEvents.liluo_room_leave;

  assert.deepEqual(leaveEvent.playerStatusChange, {
    mode: 'remove',
    status: ['no_shoes', 'hands_bound', 'legs_bound']
  });
});
