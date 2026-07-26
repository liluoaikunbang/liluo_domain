import fs from 'node:fs';
import path from 'node:path';

const VALID_STATUSES = new Set(['active', 'deprecated']);
const VALID_DECISION_STATUSES = new Set(['proposed', 'accepted', 'superseded', 'deprecated', 'rejected']);
const toPosix = (value) => value.replaceAll('\\', '/');
const uniqueDuplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

export function classifyPersistence(text) {
  const input = String(text).trim();
  const transient = /仅本次|这一次|临时|不用写入规范|先试试|还没有结论|尚无结论/.test(input);
  if (transient) return { classes: ['transient'], askUser: false };

  const classes = [];
  const persistent = /以后|从现在开始|默认|每次|一律|必须|不要再|固定成规范|长期|项目核心|项目灵魂/.test(input);
  const userFacing = /用户命令|自然语言|可重复调用|工作流|Skill|Agent/.test(input);
  const architectural = /架构|系统行为|目录职责|目录结构|数据契约|schema|所有地图|扩展方式|加载.*约定/.test(input);
  const creative = /创作|世界观|画风|角色定位|项目灵魂/.test(input);
  if (persistent) classes.push('persistent');
  if (userFacing) classes.push('user-facing');
  if (architectural) classes.push('architectural');
  if (creative) classes.push('creative');

  const futureImpact = architectural || userFacing || creative;
  const askUser = !persistent && futureImpact;
  if (askUser) classes.push('unresolved');
  return { classes: classes.length ? classes : ['transient'], askUser };
}

export function analyzeImpact({ type, impactMap }) {
  const entry = impactMap.changeTypes?.[type];
  if (!entry) throw new Error(`unknown change type ${type}`);
  return { type, ...entry };
}

function validateRelativePath(root, value, label, errors) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || /^[A-Za-z]:/.test(value)) {
    errors.push(`${label} must be a repository-relative path`);
    return;
  }
  if (!fs.existsSync(path.resolve(root, value))) errors.push(`missing ${label} ${toPosix(value)}`);
}

export function validateRegistries({ root, documentRegistry, ruleRegistry }) {
  const errors = [];
  const warnings = [];
  if (documentRegistry.schemaVersion !== 1) errors.push('unsupported document registry schemaVersion');
  if (ruleRegistry.schemaVersion !== 1) errors.push('unsupported rule registry schemaVersion');

  const documents = documentRegistry.documents ?? [];
  for (const duplicate of uniqueDuplicates(documents.map((item) => item.documentId))) errors.push(`duplicate documentId ${duplicate}`);
  for (const document of documents) {
    if (!VALID_STATUSES.has(document.status)) errors.push(`invalid document status ${document.documentId}`);
    validateRelativePath(root, document.path, `document ${document.path}`, errors);
    for (const consumer of document.consumers ?? []) validateRelativePath(root, consumer, `consumer ${consumer}`, errors);
  }

  const rules = ruleRegistry.rules ?? [];
  for (const duplicate of uniqueDuplicates(rules.map((item) => item.ruleId))) errors.push(`duplicate ruleId ${duplicate}`);
  for (const rule of rules) {
    if (!VALID_STATUSES.has(rule.status)) errors.push(`invalid rule status ${rule.ruleId}`);
    validateRelativePath(root, rule.authority, `authority ${rule.authority}`, errors);
    if (rule.authority.startsWith('project-index/')) errors.push(`rule ${rule.ruleId} cannot use project index as authority`);
    if (rule.authority.startsWith('docs/功能更新/')) errors.push(`rule ${rule.ruleId} cannot use feature history as sole authority`);
    if (rule.decision) validateRelativePath(root, rule.decision, `decision ${rule.decision}`, errors);
    for (const consumer of rule.consumers ?? []) validateRelativePath(root, consumer, `consumer ${consumer}`, errors);
  }
  return { errors: [...new Set(errors)], warnings };
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (field) data[field[1]] = field[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return data;
}

function walkMarkdown(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walkMarkdown(target) : entry.name.endsWith('.md') ? [target] : [];
  });
}

export function validateDesignMemory({ root, ruleRegistry = null }) {
  const errors = [];
  const warnings = [];
  const memoryRoot = path.join(root, 'docs', '设计记忆');
  const files = [
    ...walkMarkdown(path.join(memoryRoot, '架构决策')),
    ...walkMarkdown(path.join(memoryRoot, '创作决策')),
  ].filter((file) => /[\\/](ADR|CDR)-\d{3}-/.test(file));
  const records = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const data = parseFrontmatter(text);
    const relative = toPosix(path.relative(root, file));
    if (!data) {
      errors.push(`missing frontmatter ${relative}`);
      continue;
    }
    records.push({ ...data, file: relative, text });
    const expected = path.basename(file).match(/^((?:ADR|CDR)-\d{3})-/)?.[1];
    if (data.id !== expected) errors.push(`filename/id mismatch ${relative}`);
    if (!VALID_DECISION_STATUSES.has(data.status)) errors.push(`invalid decision status ${relative}`);
    if (data.status === 'accepted') {
      if (!data.date) errors.push(`accepted decision missing date ${relative}`);
      if (!/## 当前结论/.test(text)) errors.push(`accepted decision missing current conclusion ${relative}`);
      if (!/## .*理由/.test(text)) errors.push(`accepted decision missing rationale ${relative}`);
    }
    if (/^(用户|User|Assistant|AI)\s*[:：]/m.test(text)) warnings.push(`possible chat transcript ${relative}`);
  }
  for (const duplicate of uniqueDuplicates(records.map((record) => record.id))) errors.push(`duplicate decision id ${duplicate}`);

  if (ruleRegistry) {
    const knownRules = new Set((ruleRegistry.rules ?? []).map((rule) => rule.ruleId));
    for (const record of records) {
      const raw = record.relatedRules?.replace(/^\[|\]$/g, '') ?? '';
      for (const id of raw.split(',').map((item) => item.trim()).filter(Boolean)) {
        if (!knownRules.has(id)) errors.push(`unknown related rule ${id} in ${record.file}`);
      }
    }
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], records: records.length };
}

export function loadGovernance(root = process.cwd()) {
  const load = (name) => JSON.parse(fs.readFileSync(path.join(root, 'docs', '规范治理', name), 'utf8'));
  return {
    documentRegistry: load('document-registry.json'),
    ruleRegistry: load('rule-registry.json'),
    impactMap: load('impact-map.json'),
  };
}

export function compareFeatureIdSets({ documents, catalog, records }) {
  const issues = [];
  for (const duplicate of uniqueDuplicates(documents)) issues.push(`duplicate feature document id ${duplicate}`);
  for (const duplicate of uniqueDuplicates(catalog)) issues.push(`duplicate feature catalog id ${duplicate}`);
  for (const duplicate of uniqueDuplicates(records)) issues.push(`duplicate update record id ${duplicate}`);
  for (const id of new Set([...documents, ...catalog, ...records])) {
    const presence = [documents.includes(id), catalog.includes(id), records.includes(id)];
    if (!presence.every(Boolean)) issues.push(`feature id ${id} presence=${presence.join('/')}`);
  }
  return issues;
}

export function auditDocumentation({ root, documentRegistry, ruleRegistry }) {
  const registry = validateRegistries({ root, documentRegistry, ruleRegistry });
  const memory = validateDesignMemory({ root, ruleRegistry });
  const errors = [...registry.errors, ...memory.errors];
  const warnings = [...registry.warnings, ...memory.warnings];
  const featureDir = path.join(root, 'docs', '功能更新');
  const documents = fs.readdirSync(featureDir).map((name) => name.match(/^(\d{3}(?:-[a-z])?)-/)?.[1]).filter(Boolean);
  const catalogText = fs.readFileSync(path.join(root, 'docs', '功能更新目录.md'), 'utf8');
  const catalog = [...catalogText.matchAll(/^\|\s*(\d{3}(?:-[a-z])?)\s*\|/gm)].map((match) => match[1]);
  const recordsText = fs.readFileSync(path.join(root, 'src', 'game', 'data', 'global', 'updateRecords.js'), 'utf8');
  const records = [...recordsText.matchAll(/"id"\s*:\s*"(\d{3}(?:-[a-z])?)"/g)].map((match) => match[1]);
  errors.push(...compareFeatureIdSets({ documents, catalog, records }));
  const commands = validateUserCommands({ root });
  errors.push(...commands.errors);
  warnings.push(...(commands.warnings ?? []));
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], info: [`featureDocuments=${documents.length}`, `designDecisions=${memory.records}`] };
}

export function validateUserCommands({ root }) {
  const errors = [];
  const text = fs.readFileSync(path.join(root, 'docs', '用户命令目录.md'), 'utf8');
  const skills = fs.readdirSync(path.join(root, '.agents', 'skills', 'liluo-project'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, '.agents', 'skills', 'liluo-project', entry.name, 'SKILL.md')))
    .map((entry) => entry.name);
  for (const skill of skills) if (!text.includes(`\`${skill}\``)) errors.push(`user command catalog missing project skill ${skill}`);
  const commands = ['docs:impact', 'docs:governance:audit', 'docs:compact:report', 'docs:memory:validate', 'docs:commands:validate', 'docs:governance:validate'];
  for (const command of commands) if (!text.includes(`npm run ${command}`)) errors.push(`user command catalog missing ${command}`);
  return { errors, warnings: [] };
}

function normalizedParagraphs(text) {
  return text.split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph.length >= 100 && !paragraph.startsWith('```'));
}

export function findExactDuplicates({ root }) {
  const files = walkMarkdown(path.join(root, 'docs')).filter((file) => !file.includes(`${path.sep}功能更新${path.sep}`));
  const seen = new Map();
  const duplicates = [];
  for (const file of files) {
    const relative = toPosix(path.relative(root, file));
    for (const paragraph of normalizedParagraphs(fs.readFileSync(file, 'utf8'))) {
      const previous = seen.get(paragraph);
      if (previous && previous !== relative) duplicates.push({ first: previous, second: relative, chars: paragraph.length, similarity: 1 });
      else seen.set(paragraph, relative);
    }
  }
  return duplicates;
}

export function printReport(result) {
  for (const issue of result.errors ?? []) console.error(`ERROR ${issue}`);
  for (const issue of result.warnings ?? []) console.warn(`WARNING ${issue}`);
  for (const issue of result.info ?? []) console.log(`INFO ${issue}`);
  if (!(result.errors?.length)) console.log('INFO validation passed');
}
