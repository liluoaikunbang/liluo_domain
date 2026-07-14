import test from 'node:test';
import assert from 'node:assert/strict';

import liluoEstateDialogues from '../../src/game/data/maps/munika/liluo_estate/dialogues.ts';
import liluoEstateDialoguesJson from '../../src/game/data/maps/munika/liluo_estate/dialogues.json' with { type: 'json' };
import liluoHouseLivingRoomDialogues from '../../src/game/data/maps/munika/liluo_house_living_room/dialogues.ts';
import liluoHouseLivingRoomDialoguesJson from '../../src/game/data/maps/munika/liluo_house_living_room/dialogues.json' with { type: 'json' };
import liluoRoomDialogues from '../../src/game/data/maps/munika/liluo_room/dialogues.ts';
import liluoRoomDialoguesJson from '../../src/game/data/maps/munika/liluo_room/dialogues.json' with { type: 'json' };

test('living room dialogue text uses dialogues.json as the single source of truth', () => {
  assert.deepEqual(liluoHouseLivingRoomDialogues, liluoHouseLivingRoomDialoguesJson);
});

test('estate dialogue text stays aligned with dialogues.json while allowing portrait injection', () => {
  const { estate_time_of_day_selection, ...restEstateDialogues } = liluoEstateDialogues;
  const { estate_time_of_day_selection: estateTimeOfDaySelectionJson, ...restEstateDialoguesJson } = liluoEstateDialoguesJson;

  assert.deepEqual(restEstateDialogues, restEstateDialoguesJson);
  assert.equal(
    estate_time_of_day_selection.text,
    estateTimeOfDaySelectionJson.text
  );
  assert.deepEqual(
    estate_time_of_day_selection.nodes,
    estateTimeOfDaySelectionJson.nodes
  );
  assert.equal(estate_time_of_day_selection.startNodeId, estateTimeOfDaySelectionJson.startNodeId);
  assert.ok(estate_time_of_day_selection.npcPortrait);
});

test('liluo room dialogue text uses dialogues.json as the single source of truth', () => {
  assert.deepEqual(liluoRoomDialogues, liluoRoomDialoguesJson);
});
