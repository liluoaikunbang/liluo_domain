import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styles = readFileSync(
  new URL('../../src/game/views/components/base/gameMenuOverlay.css', import.meta.url),
  'utf8'
);

function readRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

test('CG preview frame establishes a bounded viewport for image variants', () => {
  const figureRule = readRule('.codex-cg-preview-figure');

  assert.match(figureRule, /width:\s*min\(94vw,\s*1180px\)/);
  assert.match(figureRule, /height:\s*min\(88vh,\s*760px\)/);
  assert.match(figureRule, /overflow:\s*hidden/);
});

test('CG preview layers fit the same stage instead of using intrinsic image dimensions', () => {
  const stageRule = readRule('.codex-cg-preview-stage');
  const stackRule = readRule('.codex-cg-preview-image-stack');
  const imageRule = readRule('.codex-cg-preview-image');

  assert.match(stageRule, /flex:\s*1 1 auto/);
  assert.match(stageRule, /width:\s*0/);
  assert.match(stageRule, /overflow:\s*hidden/);
  assert.match(stackRule, /position:\s*relative/);
  assert.match(stackRule, /width:\s*100%/);
  assert.match(stackRule, /height:\s*100%/);
  assert.match(imageRule, /position:\s*absolute/);
  assert.match(imageRule, /inset:\s*0/);
  assert.match(imageRule, /width:\s*100%/);
  assert.match(imageRule, /height:\s*100%/);
  assert.match(imageRule, /object-fit:\s*contain/);
});

test('CG variant switcher thumbnails shrink complete images into their preview frames', () => {
  const stackRule = readRule('.codex-cg-preview-variant-image-stack');
  const imageRule = readRule('.codex-cg-preview-variant-image');

  assert.match(stackRule, /position:\s*relative/);
  assert.match(stackRule, /overflow:\s*hidden/);
  assert.match(imageRule, /position:\s*absolute/);
  assert.match(imageRule, /inset:\s*0/);
  assert.match(imageRule, /object-fit:\s*contain/);
});
