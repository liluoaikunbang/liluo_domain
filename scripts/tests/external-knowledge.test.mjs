import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { segmentText } from '../external-knowledge/lib/segmenter.mjs';
import { matchQuery } from '../external-knowledge/lib/query.mjs';
import { assessSimilarity } from '../external-knowledge/lib/similarity.mjs';
import { createSyncPlan, syncAuthoritativeSource } from '../external-knowledge/lib/sync.mjs';

test('segmentText preserves headings and source line locations deterministically', () => {
  const text = '# 第一章\n\n雾气笼罩古堡。\n\n门在身后合拢。\n\n## 地下室\n\n她听见远处的钟声。';
  const first = segmentText(text, { sourceId: 'fb-src-test', sourcePath: 'source.md', maxChars: 40 });
  const second = segmentText(text, { sourceId: 'fb-src-test', sourcePath: 'source.md', maxChars: 40 });

  assert.deepEqual(first, second);
  assert.ok(first.length >= 2);
  assert.deepEqual(first.at(-1).headingPath, ['第一章', '地下室']);
  assert.equal(first[0].sourcePath, 'source.md');
  assert.ok(first.every((segment) => segment.startLine <= segment.endLine));
  assert.ok(first.every((segment) => segment.preview.length <= 80));
});

test('matchQuery supports AND, OR, exclusions and filters', () => {
  const item = {
    title: '古堡逃脱',
    searchableText: '古堡 密室 钟声 逃脱',
    tags: ['环境:古堡', '叙事:逃脱'],
    sourceId: 'fb-src-1',
  };

  assert.equal(matchQuery(item, { query: '古堡 逃脱', mode: 'and' }).matched, true);
  assert.equal(matchQuery(item, { query: '古堡 仪式', mode: 'or' }).matched, true);
  assert.equal(matchQuery(item, { query: '古堡', exclude: ['钟声'] }).matched, false);
  assert.equal(matchQuery(item, { query: '古堡', tags: ['叙事:逃脱'], sourceId: 'fb-src-1' }).matched, true);
  assert.equal(matchQuery(item, { query: 'fb-src-1', mode: 'exact' }).matched, true);
  assert.equal(matchQuery(item, { query: '古堡', mode: 'exact' }).matched, false);
});

test('assessSimilarity reports high risk for long copied spans without reproducing source text', () => {
  const source = '昏黄灯火沿着长廊逐盏熄灭，沉重门扉在回声中缓慢闭合，窗外只剩无名风声。';
  const generated = `新的开头。${source}新的结尾。`;
  const result = assessSimilarity(generated, [{
    sourceId: 'fb-src-1',
    sourcePath: 'external-knowledge/sources/fiction-bondage/example.md',
    startLine: 10,
    endLine: 12,
    text: source,
  }]);

  assert.equal(result.risk, 'high');
  assert.equal(result.rewriteRecommended, true);
  assert.equal(result.matches[0].sourcePath.endsWith('example.md'), true);
  assert.ok(result.matches[0].longestSharedChars >= 30);
  assert.equal('matchedText' in result.matches[0], false);
});

test('assessSimilarity ignores short generic overlaps', () => {
  const result = assessSimilarity('她走进古堡，望向窗外。', [{
    sourceId: 'fb-src-1',
    sourcePath: 'source.md',
    startLine: 1,
    endLine: 2,
    text: '古堡外下着雨，窗外很暗。',
  }]);

  assert.equal(result.risk, 'low');
  assert.equal(result.rewriteRecommended, false);
});

test('createSyncPlan detects additions, modifications, renames and managed mirror deletions', () => {
  const authoritative = [
    { relativePath: 'new.md', contentHash: 'hash-new' },
    { relativePath: 'changed.md', contentHash: 'hash-changed' },
    { relativePath: 'renamed.md', contentHash: 'hash-same' },
  ];
  const mirror = [
    { relativePath: 'changed.md', contentHash: 'hash-old' },
    { relativePath: 'old-name.md', contentHash: 'hash-same' },
    { relativePath: 'removed.md', contentHash: 'hash-removed' },
  ];

  const plan = createSyncPlan(authoritative, mirror, { deleteThreshold: 0.5 });

  assert.deepEqual(plan.added, ['new.md']);
  assert.deepEqual(plan.modified, ['changed.md']);
  assert.deepEqual(plan.renamed, [{ from: 'old-name.md', to: 'renamed.md' }]);
  assert.deepEqual(plan.deleted, ['removed.md']);
  assert.equal(plan.blocked, false);
});

test('createSyncPlan blocks abnormal mass deletion but permits routine automatic deletion', () => {
  const mirror = Array.from({ length: 10 }, (_, index) => ({ relativePath: `${index}.md`, contentHash: `hash-${index}` }));
  const routine = createSyncPlan(mirror.slice(0, 9), mirror, { deleteThreshold: 0.2 });
  const abnormal = createSyncPlan(mirror.slice(0, 7), mirror, { deleteThreshold: 0.2 });

  assert.equal(routine.blocked, false);
  assert.equal(routine.deleted.length, 1);
  assert.equal(abnormal.blocked, true);
  assert.match(abnormal.blockReason, /20%/);
});

test('syncAuthoritativeSource copies changes and automatically deletes only managed mirror files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'external-knowledge-sync-'));
  const authoritativeRoot = path.join(root, 'authoritative'), mirrorRoot = path.join(root, 'mirror');
  const configPath = path.join(root, 'sync.local.json'), manifestPath = path.join(root, 'manifest.json'), statusPath = path.join(root, 'status.json');
  try {
    await fs.mkdir(authoritativeRoot); await fs.mkdir(mirrorRoot);
    await fs.writeFile(path.join(authoritativeRoot, 'added.md'), 'new content');
    await fs.writeFile(path.join(authoritativeRoot, 'changed.md'), 'new version');
    await fs.writeFile(path.join(mirrorRoot, 'changed.md'), 'old version');
    await fs.writeFile(path.join(mirrorRoot, 'removed.md'), 'remove me');
    await fs.writeFile(configPath, JSON.stringify({ authoritativeSourcePath: authoritativeRoot, deleteThreshold: 0.6 }));
    await fs.writeFile(manifestPath, JSON.stringify({ files: [{ relativePath: 'changed.md' }, { relativePath: 'removed.md' }] }));

    const result = await syncAuthoritativeSource({ configPath, mirrorRoot, manifestPath, statusPath });

    assert.deepEqual(result.added, ['added.md']);
    assert.deepEqual(result.modified, ['changed.md']);
    assert.deepEqual(result.deleted, ['removed.md']);
    assert.equal(await fs.readFile(path.join(mirrorRoot, 'changed.md'), 'utf8'), 'new version');
    assert.equal(await fs.readFile(path.join(mirrorRoot, 'added.md'), 'utf8'), 'new content');
    await assert.rejects(fs.access(path.join(mirrorRoot, 'removed.md')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
