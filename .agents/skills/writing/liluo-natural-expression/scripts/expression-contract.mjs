const READER_FACING_TYPES = new Set(['fiction-prose', 'story-outline', 'game-dialogue', 'character-interiority', 'scene-description', 'cg-event', 'team-dialogue', 'project-note', 'creative-decision-narrative', 'public-development-writing', 'player-facing-copy', 'world-introduction']);
const PRECISION_TYPES = new Set(['code', 'json', 'yaml', 'schema', 'toml', 'cli', 'file-path', 'test-log', 'data-table', 'technical-interface', 'technical-audit']);

export function resolveExpressionRoute({ textType, operation = 'compose', intensity, preserveVerbatim = false } = {}) {
  const normalizedOperation = ['compose', 'revise', 'diagnose'].includes(operation) ? operation : 'compose';
  if (preserveVerbatim || PRECISION_TYPES.has(textType) || intensity === 'off' || !READER_FACING_TYPES.has(textType)) return { enabled: false, operation: normalizedOperation, intensity: 'off' };
  return { enabled: true, operation: normalizedOperation, intensity: intensity === 'deep' ? 'deep' : 'light' };
}

export function diagnoseMechanicalPatterns(text, textType = 'generic') {
  const findings = [];
  const rules = [
    ['emotion-reexplained', /(感到|觉得).{0,10}(紧张|害怕|悲伤|愤怒).{0,20}(这说明|意味着|意识到)/u, '情绪已经出现，又被结论句解释了一次。', '保留动作、感知或判断，让读者自行完成情绪推断。'],
    ['summary-ending', /(最后|总之|由此可见|这让.{0,8}明白|的重要性)[^。！？]*[。！？]?$/u, '段尾用抽象结论收束已经呈现的变化。', '停在具体后果、选择或未完成的张力上。'],
    ['unsupported-rhetorical-question', /究竟.{0,80}(还是|抑或|或).{0,80}[？?]/u, '设问没有落到可核验的对象、调查方向或实际选择上。', '改为已确认事实，或明确谁能回答、答案将改变的判断与行动。'],
    ['uniform-transition', /(于是|随后|接着|与此同时)[，,]/gu, '连接词承担了过多节奏工作。', '根据动作因果或视角变化重组句子，不只替换连接词。'],
  ];
  for (const [code, pattern, evidence, suggestion] of rules) {
    const matches = text.match(pattern);
    if (matches && (code !== 'uniform-transition' || matches.length >= 2)) findings.push({ code, textType, evidence, suggestion });
  }
  return findings;
}

function collectAnchors(text) {
  const anchors = [];
  for (const match of text.matchAll(/\b[A-Za-z][A-Za-z0-9_]*\s*:\s*[A-Za-z][A-Za-z0-9_-]*/g)) anchors.push({ type: 'key', value: match[0].replaceAll(' ', '') });
  for (const match of text.matchAll(/[+-]\d+(?:\.\d+)?/g)) anchors.push({ type: 'number', value: match[0] });
  for (const match of text.matchAll(/状态\s*[：:]\s*[^，。；;]+/gu)) anchors.push({ type: 'state', value: match[0].replaceAll(' ', '') });
  return anchors;
}

export function validateRevisionAnchors(before, after) {
  const normalized = after.replaceAll(' ', '');
  return collectAnchors(before).filter((anchor) => !normalized.includes(anchor.value)).map((anchor) => `${anchor.type} changed or disappeared: ${anchor.value}`);
}
