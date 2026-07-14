import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveDefaultPlayerPortraitLayerSet,
  resolveDefaultPlayerPortraitLayers
} from '../../src/game/data/dialoguePortraitLayerRules.ts';

test('default player portrait uses front body and one default head layer sorted by layer order', () => {
  const layerSet = resolveDefaultPlayerPortraitLayerSet([
    { path: 'partial/素体-上身-后背(3-0).png', src: '/back-body.png' },
    { path: 'partial/素体-上身(0-1).png', src: '/front-body.png' },
    { path: 'partial/素体-下身-并腿(0-2).png', src: '/front-legs.png' },
    { path: 'partial/素体-下身-并腿-后背(3-1).png', src: '/back-legs.png' },
    { path: 'partial/通用-头部-丸子头+脖颈(1-1).png', src: '/bun-head.png' },
    { path: 'partial/通用-头部-高马尾+脖颈(1-0).png', src: '/ponytail-head.png' },
    { path: 'partial/通用-头部-upper-高马尾-后背(10-1).png', src: '/back-head.png' }
  ]);

  assert.deepEqual(
    layerSet.layers.map((layer) => layer.src),
    ['/front-body.png', '/front-legs.png', '/ponytail-head.png']
  );
  assert.deepEqual(
    layerSet.backLayers.map((layer) => layer.src),
    ['/back-body.png', '/back-legs.png', '/back-head.png']
  );
});

test('default player portrait falls back when any required partial layer is missing', () => {
  const layers = resolveDefaultPlayerPortraitLayers([
    { path: 'partial/素体-上身.png', src: '/body-without-order.png' },
    { path: 'partial/素体-下身-并腿(0-2).png', src: '/front-legs.png' },
    { path: 'partial/通用-头部-高马尾+脖颈(1-0).png', src: '/ponytail-head.png' }
  ]);

  assert.deepEqual(layers, []);
});

test('default player portrait omits back preview when any matching back layer is missing', () => {
  const layerSet = resolveDefaultPlayerPortraitLayerSet([
    { path: 'partial/素体-上身-后背(3-0).png', src: '/back-body.png' },
    { path: 'partial/素体-上身(0-1).png', src: '/front-body.png' },
    { path: 'partial/素体-下身-并腿(0-2).png', src: '/front-legs.png' },
    { path: 'partial/通用-头部-高马尾+脖颈(1-0).png', src: '/ponytail-head.png' }
  ]);

  assert.deepEqual(
    layerSet.layers.map((layer) => layer.src),
    ['/front-body.png', '/front-legs.png', '/ponytail-head.png']
  );
  assert.deepEqual(layerSet.backLayers, []);
});
