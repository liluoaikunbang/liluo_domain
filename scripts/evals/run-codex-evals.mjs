import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

import { loadEvalCases } from './lib/load-eval-cases.mjs'
import { scoreEvalCase } from './lib/score-eval-case.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')
const codexCommand = process.env.LILUO_EVALS_CODEX_COMMAND || 'codex'
const zeroUsage = () => ({ input: 0, cachedInput: 0, output: 0, total: 0 })

function parseArgs(args) {
  const options = { suite: 'smoke', timeoutMs: 180_000, json: false, failOnSkipped: false }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--suite') options.suite = args[++index]
    else if (arg === '--target') options.target = args[++index]
    else if (arg === '--case') options.caseId = args[++index]
    else if (arg === '--timeout-ms') options.timeoutMs = Number(args[++index])
    else if (arg === '--json') options.json = true
    else if (arg === '--fail-on-skipped') options.failOnSkipped = true
    else throw new Error(`未知参数：${arg}`)
  }
  if (!['smoke', 'changed', 'full'].includes(options.suite)) throw new Error('--suite 仅允许 smoke、changed 或 full。')
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 10_000) throw new Error('--timeout-ms 必须是不小于 10000 的整数。')
  return options
}

function commandAvailable(command, args = []) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: false, timeout: 20_000 })
  return { ok: result.status === 0, reason: (result.stderr || result.stdout || result.error?.message || '').trim() }
}

function changedPaths() {
  const paths = new Set()
  for (const args of [['diff', '--name-only', '--relative'], ['ls-files', '--others', '--exclude-standard']]) {
    const result = spawnSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, encoding: 'utf8', shell: false })
    if (result.status === 0) for (const item of result.stdout.split(/\r?\n/).filter(Boolean)) paths.add(item.replaceAll('\\', '/'))
  }
  return [...paths]
}

async function selectCases(options, cases) {
  let selected = cases.filter((item) => item.status === 'active')
  if (options.caseId) selected = selected.filter((item) => item.id === options.caseId)
  else if (options.target) selected = selected.filter((item) => item.target === options.target)
  else if (options.suite === 'smoke') selected = selected.filter((item) => item.costTier === 'smoke')
  else if (options.suite === 'changed') {
    const registry = JSON.parse(await readFile(path.join(root, 'evals', 'registry.json'), 'utf8'))
    const changed = changedPaths()
    const targets = new Set(registry.targets.filter((target) => changed.includes(target.path)).map((target) => target.name))
    if (changed.some((item) => item.startsWith('evals/') || item.startsWith('scripts/evals/'))) targets.add('liluo-capability-regression')
    if (changed.some((item) => item === 'AGENTS.md' || item.startsWith('.codex/'))) {
      targets.add('liluo-project-governance-memory')
      targets.add('liluo-command-approval-governance')
    }
    selected = selected.filter((item) => targets.has(item.target))
  }
  if ((options.caseId || options.target) && selected.length === 0) throw new Error('没有找到匹配的 active 评测案例。')
  return selected
}

function buildPrompt(evalCase) {
  return [
    '你正在执行“璃落的城堡”能力路由回归评测。只做只读路由与计划判断，不修改任何文件，不运行测试、构建、浏览器或持续服务，不委派 Agent。',
    '请基于当前仓库真实 AGENTS.md、Skill、Agent 与规则，判断下列用户任务应加载哪些 Skill、是否需要项目 Agent、最小读取文件、写入范围、计划动作、明确禁止动作、最小验证 profile，以及是否需要用户批准。',
    '只输出 Schema 要求的决策字段；不要输出思维过程、命令结果或长篇项目内容。Skill 使用 frontmatter name，Agent 使用 .codex/agents 文件名（不含扩展名），验证 profile 使用 docs/workflow/team-presence/natural-expression/check/test/index/build/all 或 changed/smoke/full。',
    `caseId 必须是 ${evalCase.id}。`,
    `用户任务：${evalCase.userPrompt}`,
    `额外上下文文件：${evalCase.contextFiles.length ? evalCase.contextFiles.join(', ') : '无'}`,
  ].join('\n')
}

function parseUsage(stdout) {
  const usage = zeroUsage()
  for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
    try {
      const value = JSON.parse(line)
      const candidate = value.usage ?? value.item?.usage ?? value.data?.usage
      if (!candidate) continue
      usage.input = Math.max(usage.input, candidate.input_tokens ?? candidate.input ?? 0)
      usage.cachedInput = Math.max(usage.cachedInput, candidate.cached_input_tokens ?? candidate.cached_input ?? 0)
      usage.output = Math.max(usage.output, candidate.output_tokens ?? candidate.output ?? 0)
      usage.total = Math.max(usage.total, candidate.total_tokens ?? usage.input + usage.output)
    } catch {}
  }
  return usage
}

function summarize(results) {
  return {
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    skipped: results.filter((item) => item.status === 'SKIPPED').length,
  }
}

const options = parseArgs(process.argv.slice(2))
const cases = await selectCases(options, await loadEvalCases(root))
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const reportDirectory = path.join(root, 'evals', 'reports', `${stamp}-${options.suite}`)
await mkdir(reportDirectory, { recursive: true })

const cli = commandAvailable(codexCommand, ['--version'])
const login = cli.ok ? commandAvailable(codexCommand, ['login', 'status']) : { ok: false, reason: cli.reason }
const results = []
for (const evalCase of cases) {
  const resultFile = path.join(reportDirectory, `${evalCase.id}.json`)
  const relativeResult = path.relative(root, resultFile).replaceAll(path.sep, '/')
  if (!cli.ok || !login.ok) {
    results.push({ caseId: evalCase.id, target: evalCase.target, status: 'SKIPPED', failures: [], resultFile: relativeResult, skipReason: cli.ok ? `Codex 未登录：${login.reason}` : `Codex CLI 不可用：${cli.reason}`, tokenUsage: zeroUsage() })
    continue
  }
  const invocation = spawnSync(codexCommand, [
    'exec', '--ephemeral', '--sandbox', 'read-only',
    '--output-schema', path.join(root, 'evals', 'schemas', 'codex-eval-output.schema.json'),
    '--json', '-o', resultFile, buildPrompt(evalCase),
  ], { cwd: root, encoding: 'utf8', shell: false, timeout: options.timeoutMs, maxBuffer: 10 * 1024 * 1024 })
  const tokenUsage = parseUsage(invocation.stdout ?? '')
  if (invocation.status !== 0) {
    const reason = invocation.error?.code === 'ETIMEDOUT' ? `超时（${options.timeoutMs}ms）` : (invocation.stderr || invocation.error?.message || `exit ${invocation.status}`).trim()
    results.push({ caseId: evalCase.id, target: evalCase.target, status: 'FAIL', failures: [{ field: 'codex-exec', kind: 'execution-failed', values: [reason] }], resultFile: relativeResult, tokenUsage })
    continue
  }
  try {
    const actual = JSON.parse(await readFile(resultFile, 'utf8'))
    const scored = scoreEvalCase(evalCase, actual)
    results.push({ caseId: evalCase.id, target: evalCase.target, status: scored.pass ? 'PASS' : 'FAIL', failures: scored.failures, resultFile: relativeResult, tokenUsage })
  } catch (error) {
    results.push({ caseId: evalCase.id, target: evalCase.target, status: 'FAIL', failures: [{ field: 'result', kind: 'invalid-json', values: [error.message] }], resultFile: relativeResult, tokenUsage })
  }
}

const tokenUsage = results.reduce((total, item) => ({
  input: total.input + item.tokenUsage.input,
  cachedInput: total.cachedInput + item.tokenUsage.cachedInput,
  output: total.output + item.tokenUsage.output,
  total: total.total + item.tokenUsage.total,
}), zeroUsage())
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), suite: options.suite, summary: summarize(results), results, tokenUsage }
const reportFile = path.join(reportDirectory, 'report.json')
await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
if (options.json) console.log(JSON.stringify({ ...report, reportFile: path.relative(root, reportFile).replaceAll(path.sep, '/') }))
else {
  console.log(`[evals:codex] suite=${options.suite} report=${path.relative(root, reportFile)}`)
  console.log(`PASS=${report.summary.pass} FAIL=${report.summary.fail} SKIPPED=${report.summary.skipped} TOKENS=${report.tokenUsage.total}`)
  for (const item of results.filter((result) => result.status !== 'PASS')) console.log(`${item.status} ${item.caseId}: ${JSON.stringify(item.failures.length ? item.failures : item.skipReason)}`)
}
if (report.summary.fail > 0 || (options.failOnSkipped && report.summary.skipped > 0)) process.exitCode = 1
