import assert from 'node:assert/strict';
import { resolveCgContentWarnings } from '../../src/game/data/global/cgMetadata.js';

const gameOverWarnings = resolveCgContentWarnings('荆锁会事件-game over');

assert.equal(gameOverWarnings.length, 1);
assert.equal(gameOverWarnings[0].label, 'R-18-G');
assert.equal(gameOverWarnings[0].previewTitle, 'R18-G 警告');
assert.equal(gameOverWarnings[0].note, '四肢切断');
assert.deepEqual(resolveCgContentWarnings('荆锁会事件-琴房'), []);

console.log('cgMetadata content warning tests passed');
