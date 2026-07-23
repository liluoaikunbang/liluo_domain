import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { readHookInput } from './lib/read-hook-input.mjs'
import { writeHookOutput } from './lib/write-hook-output.mjs'

export function decideStopResult({ gateResult, stopHookActive }) {
  if (gateResult.ok) return {}
  const summary = gateResult.summary || gateResult.errors?.slice(0, 3).join('; ') || '质量门禁失败。'
  if (stopHookActive) {
    return { systemMessage: `自动质量门禁仍失败：${summary}。已停止再次触发 Stop，保留报告供如实说明。` }
  }
  return {
    decision: 'block',
    reason: `自动质量门禁失败：${summary}。请修复后重试，或向用户明确报告未通过项。`,
  }
}

export function gateReportPassed(report) {
  return Boolean(report) && report.status !== 'failed' && (report.errors?.length ?? 0) === 0
}

export function stopExecutionPassed(result, report) {
  return !result?.error && result?.status === 0 && gateReportPassed(report)
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  const input = await readHookInput()
  if (!input.ok) {
    writeHookOutput({ systemMessage: `ERROR Stop Hook 输入无效：${input.error}` })
  } else {
    const root = path.resolve(import.meta.dirname, '..', '..')
    const result = spawnSync(process.execPath, ['scripts/quality-gate/run-quality-gate.mjs', '--mode', 'hook', '--json'], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    })
    let report = null
    try {
      report = JSON.parse(fs.readFileSync(path.join(root, 'reports/quality-gate/latest.json'), 'utf8'))
    } catch {}
    if (result.error) {
      writeHookOutput(decideStopResult({
        gateResult: { ok: false, summary: `Hook 无法启动门禁：${result.error.message}` },
        stopHookActive: Boolean(input.value.stop_hook_active),
      }))
    } else {
      writeHookOutput(decideStopResult({
        gateResult: report
          ? { ok: stopExecutionPassed(result, report), summary: report.errors?.slice(0, 3).map((item) => item.message ?? item).join('; ') }
          : { ok: result.status === 0, summary: (result.stderr || result.stdout || '门禁未生成报告').trim().slice(0, 800) },
        stopHookActive: Boolean(input.value.stop_hook_active),
      }))
    }
  }
}
