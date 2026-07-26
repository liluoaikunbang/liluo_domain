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

test('mechanical diagnosis flags a rhetorical question that only performs mystery', () => {
  const findings = diagnoseMechanicalPatterns('电梯究竟是在带人回到过去，还是在带人进入某人坚持要留下的过去？', 'story-outline');
  assert.ok(findings.some((finding) => finding.code === 'unsupported-rhetorical-question'));
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

test('fictional restraint prose uses the project adult default and bounded external-fiction retrieval', async () => {
  const restraintContract = await readFile(new URL('references/fictional-restraint-narrative.md', naturalExpressionRoot), 'utf8');

  assert.match(restraintContract, /项目正式角色统一为成年人/u);
  assert.match(restraintContract, /不再为年龄不明设置额外分支/u);
  assert.match(restraintContract, /必须做一次 low-token 定向检索路由/u);
  assert.match(restraintContract, /优先查询 `liluo-external-fiction-knowledge`/u);
  assert.match(restraintContract, /最多 5 张抽象卡或短结果/u);
  assert.match(restraintContract, /`external-skills:query` 查询 `liluo-restraint-research-pack`/u);
  assert.match(restraintContract, /最多采用 3 张卡/u);
  assert.match(restraintContract, /只有两类需求都实质影响当前段落时才各查一次/u);
  assert.match(restraintContract, /小说库最多核验 2 段不同来源短原文/u);
  assert.match(restraintContract, /研究包最多核验 2 份最相关摘要/u);
  assert.match(restraintContract, /不保留原句、专名、独特事件顺序或现实可执行细节/u);
});

test('scene prose keeps environment, direct states, causal timing, and character-centered endings', async () => {
  const [quickContract, fictionProse, restraintContract] = await Promise.all([
    readFile(new URL('references/quick-contract.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/fiction-prose.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/fictional-restraint-narrative.md', naturalExpressionRoot), 'utf8'),
  ]);

  assert.match(quickContract, /环境必须在场/u);
  assert.match(quickContract, /最小充分细节/u);
  assert.match(quickContract, /“抱住”“扶稳”等普通动作已经清楚时/u);
  assert.match(quickContract, /紧急场面可用“一把”“猛地”等一个短促修饰词提速/u);
  assert.match(quickContract, /危险尚在发生时/u);
  assert.match(fictionProse, /不要把“具体”误写成连续动作分解/u);
  assert.match(fictionProse, /不要用多层副词代替节奏/u);
  assert.match(fictionProse, /不跳到作者位置评价人物或概括主题/u);
  assert.match(fictionProse, /没有反差的转折/u);
  assert.match(restraintContract, /绑在身后/u);
  assert.match(restraintContract, /委婉词回避/u);
});

test('figurative modifiers must stay grounded in character and scene materials', async () => {
  const [systemDoc, quickContract, fictionProse, mechanicalPatterns, skillGuide] = await Promise.all([
    readFile(new URL('../../docs/系统说明/璃落自然表达与文气塑形系统.md', import.meta.url), 'utf8'),
    readFile(new URL('references/quick-contract.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/fiction-prose.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/mechanical-patterns.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('../../docs/技能说明/liluo-natural-expression.md', import.meta.url), 'utf8'),
  ]);

  assert.match(systemDoc, /像在核对一门功课/u);
  assert.match(systemDoc, /场景无关的抽象修饰和比喻/u);
  assert.match(quickContract, /不为短促指令、对话附注或普通动作外挂与场景无关的抽象修饰和比喻/u);
  assert.match(fictionProse, /像在核对一门功课/u);
  assert.match(mechanicalPatterns, /场景外抽象修饰/u);
  assert.match(skillGuide, /修饰门禁/u);
});

test('process-focused restraint scenes preserve selective method detail without becoming tutorials', async () => {
  const [quickContract, fictionProse, restraintContract] = await Promise.all([
    readFile(new URL('references/quick-contract.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/fiction-prose.md', naturalExpressionRoot), 'utf8'),
    readFile(new URL('references/fictional-restraint-narrative.md', naturalExpressionRoot), 'utf8'),
  ]);

  assert.match(quickContract, /若场景重点就是制作、束缚、变装或其他过程/u);
  assert.match(quickContract, /起始固定、推进顺序、可见路径和完成状态/u);
  assert.match(quickContract, /用于表现程度的圈数和松紧变化/u);
  assert.match(fictionProse, /过程本身是场景看点时/u);
  assert.match(restraintContract, /不得只写“绳索收紧”后跳到完成姿势/u);
  assert.match(restraintContract, /宽泛路径、阶段顺序和姿态变化/u);
  assert.match(restraintContract, /具体或约略圈数、逐段收紧和压迫感/u);
  assert.match(restraintContract, /不写角度、受力数值、完整结法/u);
  assert.match(quickContract, /专门名称必须与正文中的关键姿态相符/u);
  assert.match(fictionProse, /区别于相近技法的识别动作/u);
  assert.match(restraintContract, /绑法名称必须与识别姿态一致/u);
  assert.match(restraintContract, /不能把“并腕压肘”等另一套动作骨架冠成目标绑法/u);
});
