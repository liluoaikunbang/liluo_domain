import { createHash } from 'node:crypto'

const INTERPRETERS = new Set(['node', 'python', 'python3', 'powershell', 'pwsh', 'cmd', 'bash', 'sh', 'zsh'])
const BROAD_PATTERNS = new Set([
  'npm', 'npm\u0000run', 'git', 'node', 'python', 'python3', 'powershell', 'pwsh', 'cmd', 'bash', 'sh', 'zsh', 'curl', 'wget', 'npx',
])
const DANGEROUS_PREFIXES = [
  ['git', 'push'], ['git', 'commit'], ['git', 'reset'], ['git', 'clean'], ['git', 'rebase'],
  ['npm', 'install'], ['npm', 'update'], ['npm', 'audit', 'fix'], ['npx'], ['curl'], ['wget'],
]
const SECRET_PATTERN = /(token|password|passwd|secret|api[_-]?key|authorization|bearer)/i
const COMPLEX_SHELL_PATTERN = /[|;&<>`$*?]|\$\(|%[^%]+%/
const RISKY_PROJECT_SCRIPT = /(^|:)(release|package|fetch|maintain|install|update|sync|upload|publish|deploy|delete|remove|clean|migrate|changed|build)(:|$)/i
const SAFE_PROJECT_SCRIPT = /(^|:)(validate|check-encoding|test|catalog|list|query|status|available|report)(:|$)/i
const GOVERNED_PROJECT_SCRIPT = new Set([
  'project:routine',
  'project:skill:init',
  'project:gate:changed',
  'project:gate:prepush',
  'project:gate:ci',
  'project:gate:explain',
  'project:hooks:test',
])

function normalizedPattern(pattern) {
  if (!Array.isArray(pattern) || pattern.length === 0 || pattern.some((part) => typeof part !== 'string' || !part.trim())) {
    throw new TypeError('rule pattern must be a non-empty array of non-empty strings')
  }
  return pattern.map((part) => part.trim())
}

function startsWith(pattern, prefix) {
  return prefix.every((part, index) => pattern[index]?.toLowerCase() === part)
}

function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function sanitizeSnapshotToken(token) {
  if (SECRET_PATTERN.test(token)) return `<redacted:${fingerprint(token).slice(0, 10)}>`
  if (/^[a-z]:\\users\\/i.test(token) || /^\/(users|home)\//i.test(token)) {
    return `<private-path:${fingerprint(token).slice(0, 10)}>`
  }
  return token
}

export function classifyAuthorizationText(input) {
  const text = String(input ?? '').trim()
  let scope = 'ambiguous'
  if (/(仅本次|只允许一次|允许一次|这次可以|本次允许)/.test(text)) scope = 'once'
  else if (/(当前会话|本会话|这次会话)/.test(text)) scope = 'session'
  else if (/(所有项目|全部项目|全局允许|用户全局)/.test(text)) scope = 'global'
  else if (/(这个项目|当前项目|璃落项目|项目规则|项目允许列表)/.test(text)) scope = 'project'

  let decision = 'allow'
  if (/(禁止|不准|不得执行)/.test(text)) decision = 'forbidden'
  else if (/(每次.*(问|询问|审批)|仍然.*(问|询问)|保持.*审批|改为.*prompt)/i.test(text)) decision = 'prompt'

  const persist = scope === 'project' || scope === 'global'
  return {
    scope,
    decision,
    persist,
    requiresConfirmation: scope === 'ambiguous',
    reason: scope === 'ambiguous' ? '未明确是项目级还是用户全局级。' : undefined,
  }
}

export function classifyRulePattern(input) {
  const pattern = normalizedPattern(input)
  const lower = pattern.map((part) => part.toLowerCase())
  const joined = lower.join('\u0000')

  if (pattern.some((part) => SECRET_PATTERN.test(part))) {
    return { classification: 'dangerous', recommendedScope: 'none', reason: 'pattern 可能包含敏感字段。' }
  }
  if (pattern.some((part) => COMPLEX_SHELL_PATTERN.test(part))) {
    return { classification: 'dangerous', recommendedScope: 'none', reason: '复杂 shell、变量、通配符或重定向不得自动持久化。' }
  }
  if (DANGEROUS_PREFIXES.some((prefix) => startsWith(lower, prefix))) {
    return { classification: 'dangerous', recommendedScope: 'project', reason: '该命令类别有外部副作用或破坏风险，应保持 prompt/forbidden。' }
  }
  if (BROAD_PATTERNS.has(joined) || (INTERPRETERS.has(lower[0]) && pattern.length < 3)) {
    return { classification: 'overbroad', recommendedScope: 'none', reason: '前缀允许的命令范围过宽。' }
  }
  if (lower[0] === 'npm' && lower[1] === 'run' && pattern.length >= 3) {
    const script = pattern[2]
    if (GOVERNED_PROJECT_SCRIPT.has(script)) {
      return {
        classification: 'project-specific',
        recommendedScope: 'project',
        allowEligible: true,
        reason: '该 npm script 由项目内受测试的固定动作白名单约束，额外参数不能变成任意命令。',
      }
    }
    if (RISKY_PROJECT_SCRIPT.test(script)) {
      return { classification: 'dangerous', recommendedScope: 'project', allowEligible: false, reason: '该项目脚本名称表明可能写入、联网、发布或迁移，应保持 prompt。' }
    }
    return {
      classification: 'project-specific',
      recommendedScope: 'project',
      allowEligible: SAFE_PROJECT_SCRIPT.test(script),
      reason: SAFE_PROJECT_SCRIPT.test(script)
        ? '命名 npm script 属于当前仓库且表现为只读检查/查询。'
        : '命名 npm script 属于当前仓库，但 allow 前仍需审查实现与额外参数。',
    }
  }
  if (lower[0] === 'git' && ['status', 'diff', 'log', 'show'].includes(lower[1])) {
    return { classification: 'safe-global', recommendedScope: 'global-explicit-only', reason: '固定只读 Git 子命令通常低风险，但全局范围仍需明确授权。' }
  }
  if (INTERPRETERS.has(lower[0])) {
    return { classification: 'dangerous', recommendedScope: 'none', reason: '任意解释器命令不得自动 allow。' }
  }
  return { classification: 'unknown', recommendedScope: 'review', reason: '需要人工确认命令语义和副作用。' }
}

export function renderPrefixRule({ decisionId, pattern: input, decision, justification, match, notMatch }) {
  const pattern = normalizedPattern(input)
  if (!['allow', 'prompt', 'forbidden'].includes(decision)) throw new TypeError(`unsupported decision: ${decision}`)
  if (!String(justification ?? '').trim()) throw new TypeError('justification is required')
  const encode = (value) => Array.isArray(value)
    ? `[${value.map((item) => JSON.stringify(item)).join(', ')}]`
    : JSON.stringify(value)
  return [
    `# decision_id: ${decisionId}`,
    `# match: ${encode(match ?? pattern)}`,
    `# not_match: ${encode(notMatch ?? [])}`,
    'prefix_rule(',
    `    pattern = ${encode(pattern)},`,
    `    decision = ${encode(decision)},`,
    `    justification = ${encode(String(justification).trim())},`,
    ')',
  ].join('\n')
}

export function createRuleSnapshot(rules, observedAt = new Date().toISOString()) {
  return {
    schemaVersion: 1,
    observedAt,
    rules: rules.map(({ pattern: input, decision }) => {
      const pattern = normalizedPattern(input)
      const classification = classifyRulePattern(pattern).classification
      return {
        fingerprint: fingerprint({ pattern, decision }),
        pattern: pattern.map(sanitizeSnapshotToken),
        decision,
        classification,
        handled: false,
      }
    }).sort((a, b) => a.fingerprint.localeCompare(b.fingerprint)),
  }
}

export function compareRuleSnapshots(previous, current) {
  const before = new Map((previous?.rules ?? []).map((rule) => [rule.fingerprint, rule]))
  const after = new Map((current?.rules ?? []).map((rule) => [rule.fingerprint, rule]))
  return {
    added: [...after.values()].filter((rule) => !before.has(rule.fingerprint)),
    removed: [...before.values()].filter((rule) => !after.has(rule.fingerprint)),
  }
}

export function parsePrefixRules(source) {
  const text = String(source ?? '')
  const rules = []
  const blockPattern = /prefix_rule\s*\(([\s\S]*?)\)\s*/g
  for (const match of text.matchAll(blockPattern)) {
    const body = match[1]
    const patternMatch = body.match(/pattern\s*=\s*(\[[\s\S]*\])\s*,\s*decision/)
    const decisionMatch = body.match(/decision\s*=\s*["'](allow|prompt|forbidden)["']/)
    if (!patternMatch || !decisionMatch) continue
    try {
      const pattern = JSON.parse(patternMatch[1].replace(/'/g, '"'))
      const expanded = pattern.reduce((prefixes, part) => {
        const choices = Array.isArray(part) ? part : [part]
        if (choices.some((choice) => typeof choice !== 'string')) throw new TypeError('unsupported nested pattern')
        return prefixes.flatMap((prefix) => choices.map((choice) => [...prefix, choice]))
      }, [[]])
      rules.push(...expanded.map((item) => ({ pattern: item, decision: decisionMatch[1] })))
    } catch {
      // Nested alternatives and non-literal Starlark are intentionally not interpreted.
    }
  }
  return rules
}

export function upsertApprovalDecision(inputRegistry, inputDecision) {
  const registry = structuredClone(inputRegistry)
  registry.schemaVersion ??= 1
  registry.decisions ??= []
  const pattern = normalizedPattern(inputDecision.rulePattern)
  const samePattern = registry.decisions.find((item) => item.scope === inputDecision.scope
    && JSON.stringify(item.rulePattern) === JSON.stringify(pattern)
    && item.status === 'active')

  if (samePattern?.decision === inputDecision.decision) {
    Object.assign(samePattern, {
      reason: inputDecision.reason ?? samePattern.reason,
      lastReviewedAt: inputDecision.lastReviewedAt ?? samePattern.lastReviewedAt,
    })
    return { registry, decision: samePattern, action: 'updated' }
  }

  if (samePattern) samePattern.status = 'superseded'
  const idRoot = `codex-approval-${fingerprint({ scope: inputDecision.scope, pattern, decision: inputDecision.decision }).slice(0, 12)}`
  let baseId = idRoot
  let suffix = 2
  while (registry.decisions.some((item) => item.decisionId === baseId)) {
    baseId = `${idRoot}-${suffix}`
    suffix += 1
  }
  const decision = {
    decisionId: baseId,
    scope: inputDecision.scope,
    source: inputDecision.source,
    commandClass: inputDecision.commandClass,
    ruleFile: inputDecision.ruleFile,
    rulePattern: pattern,
    decision: inputDecision.decision,
    reason: inputDecision.reason,
    status: inputDecision.status ?? 'active',
    createdAt: inputDecision.createdAt,
    lastReviewedAt: inputDecision.lastReviewedAt,
    ...(samePattern ? { supersedes: samePattern.decisionId } : {}),
  }
  registry.decisions.push(decision)
  return { registry, decision, action: samePattern ? 'superseded' : 'created' }
}

export function retireApprovalDecision(inputRegistry, { scope, rulePattern: input, reason, date }) {
  const registry = structuredClone(inputRegistry)
  const pattern = normalizedPattern(input)
  const decision = (registry.decisions ?? []).find((item) => item.scope === scope
    && item.status === 'active'
    && JSON.stringify(item.rulePattern) === JSON.stringify(pattern))
  if (!decision) throw new Error('没有找到相同 scope 和 pattern 的 active 决定。')
  decision.status = 'retired'
  decision.retiredAt = date
  decision.lastReviewedAt = date
  decision.retirementReason = reason
  return { registry, decision, action: 'retired' }
}
