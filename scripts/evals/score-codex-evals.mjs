import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { loadEvalCases } from './lib/load-eval-cases.mjs'
import { scoreEvalCase } from './lib/score-eval-case.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')

function parseArgs(args) {
  const options = { updateBaseline: false, confirm: false, json: false }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--report') options.report = args[++index]
    else if (arg === '--case') options.caseId = args[++index]
    else if (arg === '--update-baseline') options.updateBaseline = true
    else if (arg === '--confirm') options.confirm = true
    else if (arg === '--json') options.json = true
    else throw new Error(`未知参数：${arg}`)
  }
  return options
}

async function latestReport() {
  const directory = path.join(root, 'evals', 'reports')
  const entries = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => b.name.localeCompare(a.name))
  if (!entries.length) throw new Error('没有可评分的评测报告。')
  return path.join(directory, entries[0].name, 'report.json')
}

const options = parseArgs(process.argv.slice(2))
const reportPath = options.report ? path.resolve(root, options.report) : await latestReport()
const report = JSON.parse(await readFile(reportPath, 'utf8'))
const cases = await loadEvalCases(root)
const caseMap = new Map(cases.map((item) => [item.id, item]))
for (const result of report.results) {
  if (result.status === 'SKIPPED') continue
  const evalCase = caseMap.get(result.caseId)
  try {
    const actual = JSON.parse(await readFile(path.resolve(root, result.resultFile), 'utf8'))
    const scored = scoreEvalCase(evalCase, actual)
    result.status = scored.pass ? 'PASS' : 'FAIL'
    result.failures = scored.failures
  } catch (error) {
    result.status = 'FAIL'
    result.failures = [{ field: 'result', kind: 'unreadable', values: [error.message] }]
  }
}
report.summary = {
  total: report.results.length,
  pass: report.results.filter((item) => item.status === 'PASS').length,
  fail: report.results.filter((item) => item.status === 'FAIL').length,
  skipped: report.results.filter((item) => item.status === 'SKIPPED').length,
}

const baselinePath = path.join(root, 'evals', 'baselines', 'smoke-baseline.json')
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
const baselineMap = new Map(baseline.entries.map((entry) => [entry.caseId, entry]))
const baselineDiff = report.results.flatMap((result) => {
  const previous = baselineMap.get(result.caseId)
  if (!previous) return []
  return previous.expectedScore === (result.status === 'PASS' ? 1 : 0) ? [] : [{ caseId: result.caseId, previous: previous.expectedScore, current: result.status }]
})

if (options.updateBaseline) {
  if (!options.confirm) throw new Error('更新 baseline 必须显式提供 --confirm。')
  if (!options.caseId) throw new Error('更新 baseline 必须显式提供 --case <id>。')
  const result = report.results.find((item) => item.caseId === options.caseId)
  if (!result || result.status !== 'PASS') throw new Error('只能从当前报告中确认通过的案例更新 baseline。')
  const evalCase = caseMap.get(options.caseId)
  const registry = JSON.parse(await readFile(path.join(root, 'evals', 'registry.json'), 'utf8'))
  const target = registry.targets.find((item) => item.type === evalCase.targetType && item.name === evalCase.target)
  const actual = JSON.parse(await readFile(path.resolve(root, result.resultFile), 'utf8'))
  const targetHash = createHash('sha256').update(await readFile(path.join(root, target.path))).digest('hex')
  const entry = {
    caseId: options.caseId,
    expectedScore: 1,
    structuredSummary: {
      selectedSkills: actual.selectedSkills,
      selectedAgents: actual.selectedAgents,
      writeScopes: actual.writeScopes,
      validationProfiles: actual.validationProfiles,
      needsApproval: actual.needsApproval,
    },
    confirmedAt: new Date().toISOString().slice(0, 10),
    targetFileHash: targetHash,
  }
  baseline.entries = baseline.entries.filter((item) => item.caseId !== options.caseId)
  baseline.entries.push(entry)
  baseline.entries.sort((a, b) => a.caseId.localeCompare(b.caseId))
  await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
}

const output = { report: path.relative(root, reportPath).replaceAll(path.sep, '/'), summary: report.summary, baselineDiff, tokenUsage: report.tokenUsage }
if (options.json) console.log(JSON.stringify(output))
else {
  console.log(`PASS=${report.summary.pass} FAIL=${report.summary.fail} SKIPPED=${report.summary.skipped}`)
  for (const result of report.results.filter((item) => item.status === 'FAIL')) console.log(`FAIL ${result.caseId}: ${JSON.stringify(result.failures)}`)
  console.log(`BASELINE_DIFF=${baselineDiff.length} TOKENS=${report.tokenUsage.total}`)
}
if (report.summary.fail > 0) process.exitCode = 1
