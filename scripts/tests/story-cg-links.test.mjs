import assert from 'node:assert/strict';
import {
  createStoryCgPreview,
  resolveStoryCgEntries,
  resolveStoryCgSequence
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

assert.deepEqual(
  resolveStoryCgSequence(
    ['都市DID-KTV服务员', '都市DID-保洁员'],
    [
      '都市DID-KTV服务员｜夜班收尾｜璃落被留在最后一桌旁，窗外霓虹映入空荡包厢',
      '梦境种子植入｜昏迷转场｜种子化作微光沉入璃落胸口，旧记忆在背景闪回'
    ],
    cgSlots
  ),
  [
    {
      ...cgSlots[0],
      sequenceIndex: 1,
      timing: '夜班收尾',
      content: '璃落被留在最后一桌旁，窗外霓虹映入空荡包厢',
      hasAsset: true
    },
    {
      ...cgSlots[1],
      sequenceIndex: 2,
      timing: '',
      content: '',
      hasAsset: true
    }
  ],
  'CG 序列应展示已有资源的具体内容、排除未制作画面，并在末尾补充未写入序列的有效 cgRefs'
);

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
