import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { segmentText } from '../external-knowledge/lib/segmenter.mjs';
import { matchQuery } from '../external-knowledge/lib/query.mjs';
import { assessSimilarity } from '../external-knowledge/lib/similarity.mjs';
import { createSyncPlan, syncAuthoritativeSource } from '../external-knowledge/lib/sync.mjs';
import { createCandidateCards } from '../external-knowledge/lib/indexer.mjs';

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

test('createCandidateCards emits traceable term and plot-pattern candidates only when every evidence group is present', () => {
  const segments = [
    { sourceId: 'fb-src-1', segmentId: 'seg-1', sourcePath: 'one.md', startLine: 3, endLine: 8, preview: '主动送绑后仍以为可以随时结束。', tags: ['状态:受限'] },
    { sourceId: 'fb-src-2', segmentId: 'seg-2', sourcePath: 'two.md', startLine: 12, endLine: 18, preview: '局面玩脱，原先的保障失效。', tags: ['叙事:失控'] },
    { sourceId: 'fb-src-3', segmentId: 'seg-3', sourcePath: 'three.md', startLine: 20, endLine: 24, preview: '控制权转移后才发现无法自行脱身。', tags: ['叙事:转折'] },
  ];
  const rules = {
    terms: [{ id: 'voluntary-loss-of-control', title: '送绑玩脱', aliases: ['送绑', '玩脱'], evidenceGroups: [['送绑'], ['玩脱', '无法自行脱身']], definition: '角色主动进入自认为可控的受限情境，随后因保障失效而失去退出能力。', distinctions: ['不等同于从一开始就遭到强迫。'] }],
    plotPatterns: [{ id: 'voluntary-entry-control-transfer', title: '主动进入—保障失效—控制权转移', evidenceGroups: [['主动', '送绑'], ['保障失效', '玩脱'], ['控制权转移', '无法自行脱身']], prerequisites: ['角色相信自己保有退出权。'], progression: ['主动进入', '保障失效', '控制权转移'], reversals: ['原本的参与条件不再成立。'], outcomes: ['脱身并承担后果', '进入长期支线'] }],
  };

  const cards = createCandidateCards(segments, rules);
  const term = cards.find((card) => card.cardType === 'term');
  const pattern = cards.find((card) => card.cardType === 'plot-pattern');

  assert.equal(term.title, '送绑玩脱');
  assert.deepEqual(term.aliases, ['送绑', '玩脱']);
  assert.equal(pattern.progression.length, 3);
  assert.ok(term.sourceRefs.length >= 2);
  assert.ok(pattern.sourceRefs.length >= 2);
  assert.ok(cards.every((card) => card.reviewStatus === 'candidate' && card.directQuoteIncluded === false && card.canonical === false));
  assert.ok(cards.every((card) => card.sourceRefs.every((ref) => ref.sourcePath && ref.startLine <= ref.endLine)));

  const missingEvidence = createCandidateCards(segments.slice(0, 1), rules);
  assert.equal(missingEvidence.some((card) => card.title === '送绑玩脱'), false);
});
