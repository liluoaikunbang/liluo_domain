import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const run = (...args) => JSON.parse(execFileSync(process.execPath, ['scripts/rag-knowledge/rag-knowledge.mjs', ...args], { cwd: root, encoding: 'utf8' }));

test('source interview returns a complete segment and explicit user actions', () => {
  const result = run('source-interview', '--seed', '1');
  assert.equal(result.kind, 'rag-source-interview');
  assert.equal(result.status, 'pending-user-decision');
  assert.ok(result.segment.segmentId);
  assert.ok(result.segment.excerpt.length > 0);
  assert.deepEqual(result.actions, ['relate', 'new-rag', 'none', 'context', 'resplit', 'exclude', 'defer']);
});

test('baseline reset is always a dry-run audit package', () => {
  const result = run('reset-human-baseline');
  assert.equal(result.dryRun, true);
  assert.equal(result.pack.status, 'awaiting-user-approval');
  assert.ok(Array.isArray(result.pack.retired));
});
