import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { updateRecords } from '../../src/game/data/global/updateRecords.js';

test('update records use unique document numbers and newest-first dates', () => {
  assert.ok(updateRecords.length >= 100);

  for (const record of updateRecords) {
    assert.match(record.id, /^\d{3}$/);
    assert.match(record.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(record.title.trim().length > 0);
    assert.ok(record.summary.trim().length >= 12);
  }

  assert.equal(new Set(updateRecords.map((record) => record.id)).size, updateRecords.length);
  const dates = updateRecords.map((record) => record.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(updateRecords.find((record) => record.id === '001')?.date, '2026-04-19');
  assert.equal(updateRecords.find((record) => record.id === '100')?.date, '2026-05-19');
  assert.equal(updateRecords.find((record) => record.id === '120')?.date, '2026-07-19');
  assert.equal(updateRecords.find((record) => record.id === '121')?.date, '2026-07-19');
});
test('game entry screen exposes the update records panel below continue journey', async () => {
  const source = await readFile(new URL('../../src/game/views/GameEntryScreen.vue', import.meta.url), 'utf8');
  const continueIndex = source.indexOf('继续旅程');
  const updatesIndex = source.indexOf('更新记录');

  assert.ok(continueIndex >= 0);
  assert.ok(updatesIndex > continueIndex);
  assert.match(source, /<UpdateRecordsPanel[\s\S]*:records="updateRecords"/);
  assert.match(source, /entry-stage-updates/);
  assert.match(source, /entry-centerpiece-updates/);
  assert.match(source, /width:\s*100vw/);
  assert.match(source, /height:\s*100vh/);
});