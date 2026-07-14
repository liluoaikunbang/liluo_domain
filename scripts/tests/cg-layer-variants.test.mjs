import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveCgBaseVariant,
  resolveCgPreviewImages,
  resolveCgSelectableVariants,
  resolveCgVariantColumns,
  resolveCgVariantDisplayMode
} from '../../src/game/data/global/cgVariantRules.ts';

const supermarketVariants = [
  { key: 'base', label: '基础', image: '/base.png', displayMode: 'single', isDefault: true },
  { key: 'unbound', label: '无束缚', image: '/unbound.png', displayMode: 'single', isDefault: false },
  { key: 'clogs', label: '洞洞鞋', image: '/clogs.png', displayMode: 'layer', isDefault: false },
  { key: 'slippers', label: '拖鞋', image: '/slippers.png', displayMode: 'layer', isDefault: false }
];

test('supermarket shoes are layers while the base and unbound variants remain bottom images', () => {
  assert.equal(resolveCgVariantDisplayMode('超市购物'), 'single');
  assert.equal(resolveCgVariantDisplayMode('超市购物（无束缚）'), 'single');
  assert.equal(resolveCgVariantDisplayMode('超市购物（洞洞鞋）'), 'layer');
  assert.equal(resolveCgVariantDisplayMode('超市购物（拖鞋）'), 'layer');
});

test('mixed CG variants switch bottom images without discarding selected overlay layers', () => {
  assert.equal(resolveCgBaseVariant(supermarketVariants, 1)?.key, 'unbound');
  assert.deepEqual(
    resolveCgPreviewImages(supermarketVariants, 1, new Set(['clogs'])),
    ['/unbound.png', '/clogs.png']
  );
  assert.deepEqual(
    resolveCgSelectableVariants(supermarketVariants, 1).map((variant) => variant.key),
    ['base', 'unbound', 'clogs', 'slippers']
  );
});

test('mixed CG variants split into stable bottom-image and overlay-layer columns', () => {
  const columns = resolveCgVariantColumns(supermarketVariants);

  assert.deepEqual(columns.baseVariants.map((variant) => variant.key), ['base', 'unbound']);
  assert.deepEqual(columns.layerVariants.map((variant) => variant.key), ['clogs', 'slippers']);
});
