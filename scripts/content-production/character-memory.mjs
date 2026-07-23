const KINDS = new Set(['character', 'relationship']);
const SCOPES = new Set(['world', 'cross-world', 'series']);

export function validateMemoryRecord(record = {}) {
  const errors = [];
  if (!KINDS.has(record.kind)) errors.push('kind 必须是 character 或 relationship');
  if (!String(record.subjectId ?? '').trim()) errors.push('缺少 subjectId');
  if (record.kind === 'relationship' && !String(record.counterpartId ?? '').trim()) errors.push('关系记录缺少 counterpartId');
  if (!SCOPES.has(record.scope)) errors.push('只有 world/cross-world/series 范围可进入长期记忆');
  if (record.lasting !== true) errors.push('短期情绪、临时姿态或单场景波动不得进入长期记忆');
  if (!String(record.change ?? '').trim()) errors.push('缺少可陈述的长期变化');
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) errors.push('缺少正式项目证据');
  if (!String(record.effectiveFrom ?? '').trim()) errors.push('缺少生效故事节点或时间位置');
  return { valid: errors.length === 0, errors };
}

export function appendMemoryRecord(memory, record) {
  const validation = validateMemoryRecord(record);
  if (!validation.valid) return { changed: false, validation, memory };
  const records = Array.isArray(memory?.records) ? memory.records : [];
  const id = record.id ?? `${record.kind}:${record.subjectId}:${record.counterpartId ?? '-'}:${record.effectiveFrom}`;
  if (records.some((item) => item.id === id)) return { changed: false, validation, memory, reason: 'duplicate-id' };
  return { changed: true, validation, memory: { schemaVersion: 1, records: [...records, { ...record, id }] } };
}
