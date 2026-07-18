import assert from 'node:assert/strict';
import {
  createStoryCgPreview,
  resolveStoryCgEntries
} from '../../src/game/data/story_outline/storyCgLinks.js';

const cgSlots = [
  { key: 'codex-cg-ktv', title: '都市DID-KTV服务员' },
  { key: 'codex-cg-cleaner', title: '都市DID-保洁员' },
  { key: 'codex-cg-taxi', title: '都市DID-出租车' }
];

assert.deepEqual(
  resolveStoryCgEntries(
    [' 都市DID-KTV服务员 ', '都市DID-保洁员', '都市DID-KTV服务员', '不存在的CG'],
    cgSlots
  ),
  [cgSlots[0], cgSlots[1]],
  '应按 cgRefs 顺序解析、去重，并忽略不存在的 CG 标题'
);

assert.deepEqual(resolveStoryCgEntries([], cgSlots), []);
assert.deepEqual(resolveStoryCgEntries(null, cgSlots), []);

const previewEntry = {
  ...cgSlots[0],
  variants: [
    { key: 'base', label: '基础', image: '/assets/cg/ktv-base.png' },
    { key: 'light', label: '轻度束缚', image: '/assets/cg/ktv-light.png' },
    { key: 'missing', label: '缺图' }
  ]
};

assert.deepEqual(createStoryCgPreview(previewEntry, 1), {
  title: '都市DID-KTV服务员',
  variants: previewEntry.variants.slice(0, 2),
  activeVariantIndex: 1
});
assert.deepEqual(createStoryCgPreview(previewEntry), {
  title: '都市DID-KTV服务员',
  variants: previewEntry.variants.slice(0, 2),
  activeVariantIndex: 0
});
assert.equal(createStoryCgPreview(cgSlots[0]), null);

console.log('story CG links mapping passed');
