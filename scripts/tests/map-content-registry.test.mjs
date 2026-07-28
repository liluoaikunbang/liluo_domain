import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeMapContentRegistry } from '../../src/game/data/mapContentRegistry.ts';

test('map content registry preserves unique ids from every map', () => {
  assert.deepEqual(
    mergeMapContentRegistry('event', [
      { mapId: 'first_map', entries: { first_event: { id: 'first_event' } } },
      { mapId: 'second_map', entries: { second_event: { id: 'second_event' } } }
    ]),
    {
      first_event: { id: 'first_event' },
      second_event: { id: 'second_event' }
    }
  );
});

test('map content registry rejects duplicate ids instead of silently overwriting them', () => {
  assert.throws(
    () => mergeMapContentRegistry('dialogue', [
      { mapId: 'first_map', entries: { shared_dialogue: {} } },
      { mapId: 'second_map', entries: { shared_dialogue: {} } }
    ]),
    /Duplicate dialogue id "shared_dialogue" in maps "first_map" and "second_map"\./
  );
});
