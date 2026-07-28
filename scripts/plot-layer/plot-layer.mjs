#!/usr/bin/env node
/**
 * 情节层级核对 CLI
 * npm run plot-layer:<command>
 *
 * audit（只读）→ review-queue / show / propose → confirm（默认 dry-run）→ apply 需显式令牌
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  confirmProposal,
  deferProposal,
  loadQueue,
  rebuildAffectedHint,
  rollbackMigration,
  runAudit,
  showProposal,
  statusReport
} from './lib/workflow.mjs'
import { proposePlotLayer } from './lib/propose.mjs'
import { loadPlotCatalog, loadRestraintCards, loadStoryNodes } from './lib/load.mjs'
import { nextPendingProposal } from './lib/queue.mjs'

function parseArgs(argv) {
  const args = { _: [], flags: {} }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token.startsWith('--')) {
      const key = token.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) args.flags[key] = true
      else {
        args.flags[key] = next
        i += 1
      }
    } else args._.push(token)
  }
  return args
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

function parseOverrides(flags) {
  if (flags['overrides-file']) {
    return JSON.parse(fs.readFileSync(path.resolve(flags['overrides-file']), 'utf8'))
  }
  if (!flags.overrides) return {}
  return JSON.parse(flags.overrides)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]
  const flags = args.flags

  switch (command) {
    case 'audit': {
      const result = runAudit({ writeArtifacts: flags['no-write'] !== true })
      printJson({
        ok: true,
        readonly: true,
        snapshotId: result.snapshot.snapshotId,
        summary: {
          formalStoryNodeCount: result.queueDoc.summary.formalStoryNodeCount,
          formalPlotEntryCount: result.queueDoc.summary.formalPlotEntryCount,
          plotGroupCount: result.queueDoc.summary.plotGroupCount,
          realPlotCountExcludingGroups: result.queueDoc.summary.realPlotCountExcludingGroups,
          ragCardCount: result.queueDoc.summary.ragCardCount,
          obviousMoveToRag: result.summary.obviousMoveToRag,
          splitCandidates: result.summary.splitCandidates,
          promoteToStoryCandidates: result.summary.promoteToStoryCandidates,
          keepAsPlot: result.summary.keepAsPlot,
          uncertain: result.summary.uncertain,
          byRecommendation: result.summary.byRecommendation
        },
        firstCandidate: result.first
          ? {
              sourcePlotId: result.first.sourcePlotId,
              title: result.first.title,
              recommendation: result.first.recommendation,
              confidence: result.first.confidence
            }
          : null
      })
      break
    }
    case 'review-queue': {
      const queue = loadQueue()
      printJson({
        generatedAt: queue.generatedAt,
        summary: queue.summary,
        pending: (queue.items ?? [])
          .filter((item) => !['migrated', 'deferred', 'skipped'].includes(item.reviewStatus))
          .map((item) => ({
            sourcePlotId: item.sourcePlotId,
            title: item.title,
            recommendation: item.recommendation,
            confidence: item.confidence,
            reviewStatus: item.reviewStatus
          })),
        next: nextPendingProposal(queue)
      })
      break
    }
    case 'show': {
      const plotId = args._[1] || flags.id
      if (!plotId) throw new Error('usage: plot-layer show <plotId>')
      printJson(showProposal(plotId))
      break
    }
    case 'propose': {
      const plotId = args._[1] || flags.id
      if (!plotId) throw new Error('usage: plot-layer propose <plotId>')
      const catalog = loadPlotCatalog()
      const entry = catalog.entries.find((item) => item.id === plotId)
      if (!entry) throw new Error(`plot not found: ${plotId}`)
      const proposal = proposePlotLayer(entry, {
        storyNodes: loadStoryNodes(),
        ragCards: loadRestraintCards(),
        groups: catalog.groups
      })
      printJson(proposal)
      break
    }
    case 'confirm': {
      const plotId = args._[1] || flags.id
      const decision = flags.decision || args._[2]
      if (!plotId || !decision) {
        throw new Error(
          'usage: plot-layer confirm <plotId> --decision <decision> [--note ...] [--apply --confirm-token <plotId>]'
        )
      }
      const result = confirmProposal(plotId, {
        decision,
        userNote: flags.note || '',
        overrides: parseOverrides(flags),
        apply: flags.apply === true,
        confirmToken: flags['confirm-token'] || null
      })
      printJson(result)
      break
    }
    case 'defer': {
      const plotId = args._[1] || flags.id
      if (!plotId) throw new Error('usage: plot-layer defer <plotId> [--reason ...]')
      printJson(deferProposal(plotId, flags.reason || ''))
      break
    }
    case 'rollback': {
      const migrationId = args._[1] || flags.id
      if (!migrationId) throw new Error('usage: plot-layer rollback <migrationId>')
      printJson(rollbackMigration(migrationId))
      break
    }
    case 'status': {
      printJson(statusReport())
      break
    }
    case 'rebuild-affected': {
      const plotId = args._[1] || flags.id
      if (!plotId) throw new Error('usage: plot-layer rebuild-affected <plotId>')
      printJson(rebuildAffectedHint(plotId))
      break
    }
    default:
      console.error(`Unknown command: ${command ?? '(missing)'}
Commands:
  audit | review-queue | show <id> | propose <id>
  confirm <id> --decision <...> [--apply --confirm-token <id>]
  defer <id> | rollback <migrationId> | status | rebuild-affected <id>`)
      process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error))
  process.exitCode = 1
})
