#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

import { buildGatePlan } from './build-gate-plan.mjs'
import { classifyChanges } from './classify-changes.mjs'
import { runCommand } from './lib/command-runner.mjs'
import { writeGateReport } from './lib/gate-report.mjs'
import { getGitChanges } from './lib/git-changes.mjs'

function parseArgs(args) {
  const options = { mode: 'changed', json: false, explain: false }
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--mode') options.mode = args[++index]
    else if (args[index] === '--json') options.json = true
    else if (args[index] === '--explain') options.explain = true
    else if (args[index] === '--help') options.help = true
    else throw new Error(`Unknown argument: ${args[index]}`)
  }
  if (!['hook', 'changed', 'prepush', 'ci'].includes(options.mode)) throw new Error(`Unsupported mode: ${options.mode}`)
  return options
}

async function readAvailableStdin() {
  if (process.stdin.isTTY) return ''
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

export function createEmptyReport({ mode, gitRange = 'unavailable', startedAt = Date.now() }) {
  return {
    schemaVersion: 1,
    mode,
    gitRange,
    files: [],
    domains: [],
    requires: [],
    commands: [],
    executed: [],
    skipped: [],
    errors: [],
    warnings: [],
    durationMs: Date.now() - startedAt,
    status: 'passed',
  }
}

export async function runQualityGate(options, {
  root = path.resolve(import.meta.dirname, '..', '..'),
  stdinText = '',
} = {}) {
  const startedAt = Date.now()
  const report = createEmptyReport({ mode: options.mode, startedAt })
  try {
    const git = getGitChanges(root, options.mode, stdinText)
    const classification = classifyChanges(git.files)
    const plan = buildGatePlan({ classification, mode: options.mode })
    Object.assign(report, {
      gitRange: git.range,
      files: classification.files,
      domains: classification.domains,
      requires: classification.requires,
      commands: plan.commands,
      skipped: plan.skipped,
      warnings: classification.warnings,
    })
    if (!options.explain) {
      for (const command of plan.commands) {
        const result = runCommand(command, { cwd: root, quiet: options.json })
        report.executed.push(result)
        if (!result.ok) {
          report.errors.push({ command, message: result.error ?? 'command failed' })
          break
        }
      }
    }
  } catch (error) {
    report.errors.push({ command: null, message: error.message })
  }
  report.durationMs = Date.now() - startedAt
  report.status = report.errors.length > 0 ? 'failed' : report.warnings.length > 0 ? 'warning' : 'passed'
  writeGateReport(root, report)
  return report
}

try {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: node scripts/quality-gate/run-quality-gate.mjs --mode hook|changed|prepush|ci [--json] [--explain]')
  } else {
    const report = await runQualityGate(options, { stdinText: await readAvailableStdin() })
    if (options.json || options.explain) console.log(JSON.stringify(report, null, 2))
    else console.log(`Quality gate ${report.status}. Report: reports/quality-gate/latest.md`)
    if (report.errors.length > 0) process.exitCode = 1
  }
} catch (error) {
  console.error(`ERROR ${error.message}`)
  process.exitCode = 2
}
