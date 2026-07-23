import path from 'node:path';

const COMMIT_PATTERN = /^[0-9a-f]{40}$/i;
const SOURCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STORAGE_MODES = new Set(['full-snapshot', 'selected-files', 'catalog-only', 'metadata-only']);

export function parseSourceDocument(text) {
  try { return JSON.parse(text); }
  catch (error) { throw new Error(`source.yaml must use the repository's JSON-compatible YAML profile: ${error.message}`); }
}

export function validateSource(source) {
  const errors = [];
  for (const field of ['schemaVersion', 'sourceId', 'displayName', 'category', 'repository', 'storageMode', 'trustTier', 'license', 'version', 'updatePolicy', 'security', 'localUsage']) {
    if (source?.[field] === undefined || source?.[field] === null) errors.push(`${field} is required`);
  }
  if (source?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!SOURCE_ID_PATTERN.test(source?.sourceId ?? '')) errors.push('sourceId must be lowercase kebab-case');
  if (!Array.isArray(source?.category) || source.category.length === 0) errors.push('category must be a non-empty array');
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(source?.repository ?? '')) errors.push('repository must be a public GitHub repository URL');
  if (!STORAGE_MODES.has(source?.storageMode)) errors.push('storageMode is invalid');
  if (source?.version?.currentCommit !== null && !COMMIT_PATTERN.test(source?.version?.currentCommit ?? '')) errors.push('version.currentCommit must be null or a 40-character Git commit');
  if (source?.updatePolicy?.autoReplaceCurrentSnapshot !== false) errors.push('updatePolicy.autoReplaceCurrentSnapshot must be false');
  if (source?.updatePolicy?.autoModifyLocalSkills !== false) errors.push('updatePolicy.autoModifyLocalSkills must be false');
  if (source?.security?.trustedForDirectExecution !== false) errors.push('security.trustedForDirectExecution must be false');
  return errors;
}

export function isSourceDue(source, now = new Date()) {
  if (source.updatePolicy?.checkIntervalDays === 'manual') return false;
  const next = Date.parse(source.version?.nextCheckAt ?? '');
  return Number.isFinite(next) && next <= now.getTime();
}

function tokens(value) { return String(value ?? '').toLowerCase().split(/[\s,，。；;：:、/|]+/u).filter(Boolean); }

export function queryDerivedKnowledge(records, { query = '', depth = 'light' } = {}) {
  if (depth === 'off') return [];
  const terms = tokens(query);
  const ranked = records.map((record) => {
    const haystack = `${record.title ?? ''} ${record.summary ?? ''} ${(record.tags ?? []).join(' ')}`.toLowerCase();
    const matched = terms.filter((term) => haystack.includes(term)).length;
    return { record, score: matched * 10 + Number(record.projectRelevance ?? 0) };
  }).filter(({ score }) => terms.length === 0 || score >= 10)
    .sort((a, b) => b.score - a.score || String(a.record.id).localeCompare(String(b.record.id)));
  const budgets = depth === 'deep' ? { capability: 8, pattern: 8, compatibility: 5, risk: 5 } : { capability: 5, pattern: 5, compatibility: 3, risk: 3 };
  const used = new Map();
  return ranked.filter(({ record }) => {
    const type = record.cardType ?? 'capability', count = used.get(type) ?? 0;
    if (count >= (budgets[type] ?? 3)) return false;
    used.set(type, count + 1);
    return true;
  }).map(({ record, score }) => ({ ...record, score }));
}

export function resolveStagingTarget(stagingRoot, sourceId) {
  if (!SOURCE_ID_PATTERN.test(sourceId)) throw new Error('Invalid sourceId');
  const root = path.resolve(stagingRoot), target = path.resolve(root, sourceId);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Staging target escaped the staging root');
  return target;
}

export function buildDiff(currentFiles, incomingFiles) {
  const current = new Map(currentFiles.map((file) => [file.path.replaceAll('\\', '/'), file.hash]));
  const incoming = new Map(incomingFiles.map((file) => [file.path.replaceAll('\\', '/'), file.hash]));
  const added = [...incoming.keys()].filter((file) => !current.has(file)).sort();
  const removed = [...current.keys()].filter((file) => !incoming.has(file)).sort();
  const modified = [...incoming.keys()].filter((file) => current.has(file) && current.get(file) !== incoming.get(file)).sort();
  const licenseChanged = modified.concat(added, removed).some((file) => /(^|\/)(license|copying)(\.|$)/i.test(file));
  return { added, removed, modified, blocked: licenseChanged, blockReason: licenseChanged ? 'License files changed; manual license review is required.' : null };
}

export function assessIncomingFiles(files) {
  const riskFlags = new Set();
  for (const file of files) {
    const text = String(file.text ?? '');
    if (/ignore (all |any )?(previous|prior) instructions|override .*instructions|忽略.{0,12}(规则|指令)/i.test(text)) riskFlags.add('prompt-injection');
    if (/\b(git commit|git push|create pull request|auto(?:matically)? commit)\b|自动.{0,6}(提交|推送)/i.test(text)) riskFlags.add('git-write-request');
    if (/\b(curl|wget|Invoke-WebRequest|fetch\(|axios\.|https?:\/\/).*(\.exe|\.msi|install|download)/i.test(text)) riskFlags.add('network-download');
    if (/\.(?:ps1|sh|bash|cmd|bat|py|mjs|js|exe)$/i.test(file.path)) riskFlags.add('executable-content');
    if (/credential|token|api[_ -]?key|secret|读取.{0,6}(密钥|凭据)/i.test(text)) riskFlags.add('credential-access-request');
  }
  return { riskFlags: [...riskFlags].sort(), trustedForDirectExecution: false };
}

export function validateLineage(lineage, sources) {
  const errors = [];
  if (lineage.projectAuthority !== true) errors.push('projectAuthority must be true');
  lineage.upstreamSources?.forEach((entry, index) => {
    if (!sources.has(entry.sourceId)) errors.push(`upstreamSources[${index}].sourceId is not registered`);
    if (!COMMIT_PATTERN.test(entry.commit ?? '')) errors.push(`upstreamSources[${index}].commit must be a 40-character Git commit`);
  });
  return errors;
}
