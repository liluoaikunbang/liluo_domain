import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  diagnoseMechanicalPatterns,
  resolveExpressionRoute,
  validateRevisionAnchors,
} from '../../.agents/skills/writing/liluo-natural-expression/scripts/expression-contract.mjs';

const naturalExpressionRoot = new URL('../../.agents/skills/writing/liluo-natural-expression/', import.meta.url);

test('non-technical reader-facing text defaults to light compose or revise', () => {
  assert.deepEqual(resolveExpressionRoute({ textType: 'story-outline', operation: 'compose' }), { enabled: true, operation: 'compose', intensity: 'light' });
  assert.deepEqual(resolveExpressionRoute({ textType: 'game-dialogue', operation: 'revise' }), { enabled: true, operation: 'revise', intensity: 'light' });
  assert.deepEqual(resolveExpressionRoute({ textType: 'fiction-prose', operation: 'revise', intensity: 'deep' }), { enabled: true, operation: 'revise', intensity: 'deep' });
  assert.deepEqual(resolveExpressionRoute({ textType: 'project-note', operation: 'diagnose' }), { enabled: true, operation: 'diagnose', intensity: 'light' });
});

test('technical and exact-preservation text never receives literary rewriting', () => {
  for (const textType of ['code', 'json', 'schema', 'test-log', 'file-path', 'technical-audit']) {
    assert.deepEqual(resolveExpressionRoute({ textType, operation: 'revise' }), { enabled: false, operation: 'revise', intensity: 'off' });
  }
  assert.equal(resolveExpressionRoute({ textType: 'story-outline', operation: 'revise', preserveVerbatim: true }).enabled, false);
});

test('mechanical diagnosis detects uniform explanation without treating keywords as proof', () => {
  const findings = diagnoseMechanicalPatterns('她握紧门把手，心里感到很紧张。这说明她已经意识到了危险。于是，她决定继续前进。最后，她终于明白了勇气的重要性。', 'fiction-prose');
  assert.ok(findings.some((finding) => finding.code === 'emotion-reexplained'));
  assert.ok(findings.some((finding) => finding.code === 'summary-ending'));
  assert.ok(findings.every((finding) => finding.evidence && finding.suggestion));
});

test('revision anchor validation protects keys, numbers and named states', () => {
  const before = 'eventKey: room_escape，信任值 +2，状态：蒙眼。';
  assert.deepEqual(validateRevisionAnchors(before, 'eventKey: room_escape，信任值 +2，状态：蒙眼。她停了一会儿。'), []);
  assert.ok(validateRevisionAnchors(before, 'eventKey: room_leave，信任值 +3，状态：自由。').length >= 3);
});

test('writing contracts require credible actions before stylistic cleverness', async () => {
  const [skill, quickContract, fictionProse, mechanicalPatterns, revisionDepth, fixtureText] = await Promise.all([
    readFile(new URL('SKILL.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/quick-contract.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/fiction-prose.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/mechanical-patterns.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/revision-depth.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('tests/fixtures.json', naturalExpressionRoot), 'utf8'),
  ]);
  const fixtures = JSON.parse(fixtureText);

  assert.match(skill, /physical and behavioral plausibility first/u);
  assert.match(quickContract, /具体不等于复杂/u);
  assert.match(fictionProse, /起始姿态.*人物动作.*物体反馈.*实际后果/u);
  assert.match(mechanicalPatterns, /伪具体性/u);
  assert.match(revisionDepth, /人物是否做得到/u);
  assert.ok(fixtures.cases.some(({ id }) => id === 'physical-plausibility'));
});
