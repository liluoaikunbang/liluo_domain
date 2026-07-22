import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  analyzeImpact,
  classifyPersistence,
  compareFeatureIdSets,
  validateDesignMemory,
  validateRegistries,
} from '../document-governance/lib/governance.mjs';

test('feature record comparison reports missing and duplicate IDs', () => {
  const result = compareFeatureIdSets({ documents: ['017', '017', '118'], catalog: ['017'], records: ['017'] });
  assert.ok(result.some((issue) => issue.includes('duplicate feature document id 017')));
  assert.ok(result.some((issue) => issue.includes('feature id 118 presence=true/false/false')));
});

test('classifies persistent and user-facing requirements', () => {
  assert.deepEqual(classifyPersistence('以后每次新增 Skill 都加入用户命令目录'), {
    classes: ['persistent', 'user-facing'],
    askUser: false,
  });
});

test('classifies explicit one-off work as transient', () => {
  assert.deepEqual(classifyPersistence('这一次临时测试，不用写入规范'), {
    classes: ['transient'],
    askUser: false,
  });
});

test('does not persist unresolved creative discussion', () => {
  assert.deepEqual(classifyPersistence('先聊聊是否换一种画风，还没有结论'), {
    classes: ['transient'],
    askUser: false,
  });
});

test('asks once for an ambiguous requirement with future impact', () => {
  assert.deepEqual(classifyPersistence('所有地图加载都改成另一套约定'), {
    classes: ['architectural', 'unresolved'],
    askUser: true,
  });
});

test('maps a new user workflow to required documentation checks', () => {
  const impactMap = {
    changeTypes: {
      'new-user-invokable-workflow': {
        requiredChecks: ['docs/用户命令目录.md', '对应 Skill', '项目知识索引'],
        featureUpdate: true,
        userCommands: true,
        decision: false,
      },
    },
  };
  const result = analyzeImpact({ type: 'new-user-invokable-workflow', impactMap });
  assert.equal(result.userCommands, true);
  assert.equal(result.featureUpdate, true);
  assert.deepEqual(result.requiredChecks, impactMap.changeTypes['new-user-invokable-workflow'].requiredChecks);
});

test('registry validation reports duplicate IDs and missing consumers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'liluo-governance-'));
  fs.writeFileSync(path.join(root, 'authority.md'), '# authority');
  const result = validateRegistries({
    root,
    documentRegistry: {
      schemaVersion: 1,
      documents: [
        { documentId: 'same', path: 'authority.md', type: 'system-spec', authorityFor: [], consumers: ['missing.md'], indexable: true, status: 'active' },
        { documentId: 'same', path: 'authority.md', type: 'system-spec', authorityFor: [], consumers: [], indexable: true, status: 'active' },
      ],
    },
    ruleRegistry: { schemaVersion: 1, rules: [] },
  });
  assert.ok(result.errors.some((issue) => issue.includes('duplicate documentId same')));
  assert.ok(result.errors.some((issue) => issue.includes('missing consumer missing.md')));
});

test('design-memory validation accepts complete records and rejects duplicate IDs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'liluo-memory-'));
  const adrDir = path.join(root, 'docs', '设计记忆', '架构决策');
  const cdrDir = path.join(root, 'docs', '设计记忆', '创作决策');
  fs.mkdirSync(adrDir, { recursive: true });
  fs.mkdirSync(cdrDir, { recursive: true });
  const record = (id) => `---\nid: ${id}\nstatus: accepted\ntitle: Test\ndate: 2026-07-22\nrelatedRules: []\nsupersedes: []\n---\n# ${id}\n\n## 当前结论\nYes\n\n## 核心理由\nWhy\n`;
  fs.writeFileSync(path.join(adrDir, 'ADR-001-one.md'), record('ADR-001'));
  fs.writeFileSync(path.join(cdrDir, 'CDR-001-one.md'), record('CDR-001'));
  assert.equal(validateDesignMemory({ root }).errors.length, 0);
  fs.writeFileSync(path.join(adrDir, 'ADR-001-two.md'), record('ADR-001'));
  assert.ok(validateDesignMemory({ root }).errors.some((issue) => issue.includes('duplicate decision id ADR-001')));
});
