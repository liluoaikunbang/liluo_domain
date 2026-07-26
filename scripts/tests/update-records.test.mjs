import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { updateRecords } from '../../src/game/data/global/updateRecords.js';
import { groupUpdateRecordsByMonth } from '../../src/game/data/global/updateRecordGroups.js';

test('update records use unique document numbers and newest-first dates', () => {
  assert.ok(updateRecords.length >= 100);

  for (const record of updateRecords) {
    assert.match(record.id, /^\d{3}(?:-[a-z])?$/);
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
test('update records group by month from newest to oldest', () => {
  const groups = groupUpdateRecordsByMonth([
    { id: '003', date: '2026-07-19', title: '七月记录' },
    { id: '002', date: '2026-06-30', title: '六月记录' },
    { id: '001', date: '2025-07-01', title: '去年七月记录' }
  ]);

  assert.deepEqual(groups.map((group) => group.key), ['2026-07', '2026-06', '2025-07']);
  assert.deepEqual(groups.map((group) => group.label), ['2026年7月', '2026年6月', '2025年7月']);
  assert.deepEqual(groups.map((group) => group.records.map((record) => record.id)), [['003'], ['002'], ['001']]);
});
test('game entry screen exposes the update records panel below continue journey', async () => {
  const source = await readFile(new URL('../../src/game/views/GameEntryScreen.vue', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../../src/game/views/components/base/UpdateRecordsPanel.vue', import.meta.url), 'utf8');
  const continueIndex = source.indexOf('继续旅程');
  const updatesIndex = source.indexOf('更新记录');

  assert.ok(continueIndex >= 0);
  assert.ok(updatesIndex > continueIndex);
  assert.match(source, /<UpdateRecordsPanel[\s\S]*:records="updateRecords"/);
  assert.match(source, /entry-stage-updates/);
  assert.match(source, /entry-centerpiece-updates/);
  assert.match(source, /width:\s*100vw/);
  assert.match(source, /height:\s*100vh/);
  assert.match(panelSource, /recordGroups/);
  assert.match(panelSource, /expandedMonthKey/);
  assert.match(panelSource, /:aria-expanded="isMonthExpanded\(group.key\)"/);
  assert.match(panelSource, /@click="toggleMonth\(group.key\)"/);
});