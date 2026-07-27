#!/usr/bin/env node
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { sampleAuditBatch } from './lib/sample.mjs'
import { auditStatus, recordAudit } from './lib/record.mjs'
import { planRebuildAffected, rebuildAffected } from './lib/rebuild.mjs'
import { loadCategories, refreshRegistryFromDisk, loadPolicy } from './lib/registry.mjs'
import { AUDIT_CHANNELS, AUDIT_CHANNEL_LABELS, assertAuditChannel } from './lib/channels.mjs'
import { suggestRelatedAssets } from './lib/related.mjs'

function parseArgs(argv) {
  const args = { _: [], flags: {} }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token.startsWith('--')) {
      const key = token.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) args.flags[key] = true
      else {
        if (args.flags[key] === undefined) args.flags[key] = next
        else if (Array.isArray(args.flags[key])) args.flags[key].push(next)
        else args.flags[key] = [args.flags[key], next]
        i += 1
      }
    } else args._.push(token)
  }
  return args
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

function resolveChannel(command, flags) {
  if (flags.channel) return flags.channel
  if (command.startsWith('style-rag') || command.startsWith('style_')) return 'style-rag'
  if (command.startsWith('concept')) return 'concept'
  if (command.startsWith('plot')) return 'plot'
  if (command.startsWith('knowledge') || command.includes('all')) return 'all'
  if (command.startsWith('rag')) return 'rag'
  return null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]
  const flags = args.flags
  const channel = resolveChannel(command, flags)

  switch (command) {
    case 'sample':
    case 'rag:audit:sample':
    case 'style-rag:audit:sample':
    case 'concept:audit:sample':
    case 'plot:audit:sample':
    case 'knowledge:audit:sample': {
      const resolved =
        channel ??
        (command.includes('style')
          ? 'style-rag'
          : command.includes('concept')
            ? 'concept'
            : command.includes('plot')
              ? 'plot'
              : command.includes('knowledge')
                ? 'all'
                : 'rag')
      const result = await sampleAuditBatch({
        channel: resolved,
        mode: flags.mode ?? flags.priority ?? 'low-confidence',
        batchSize: flags['batch-size'] ?? flags.limit,
        theme: flags.theme,
        author: flags.author,
        sourceFolder: flags.source ?? flags.folder,
        unreviewedOnly: flags['unreviewed-only'] === true,
        seed: flags.seed,
        excludeAudited: flags['include-audited'] !== true,
        includeSources: flags['include-sources'] === true,
        assetKind: flags['asset-kind'] ?? flags['asset-kinds'],
      })
      printJson(result)
      return
    }
    case 'record':
    case 'rag:audit:record':
    case 'style-rag:audit:record':
    case 'concept:audit:record':
    case 'plot:audit:record': {
      const cats = [].concat(flags.category ?? flags.categories ?? []).flat()
      const resolved =
        channel ??
        (command.includes('style')
          ? 'style-rag'
          : command.includes('concept')
            ? 'concept'
            : command.includes('plot')
              ? 'plot'
              : 'rag')
      assertAuditChannel(resolved)
      const relatedRaw = [].concat(flags.related ?? []).flat()
      const relatedAdjustments = relatedRaw
        .map((token) => {
          const text = String(token)
          const [ch, id, action] = text.split(':')
          if (!ch || !id) return null
          return {
            channel: ch,
            assetId: id,
            action: action || 'adjusted',
          }
        })
        .filter(Boolean)
      const result = await recordAudit({
        channel: resolved,
        sourceAssetId: flags.asset ?? flags.id,
        sourcePath: flags.path,
        reportedIssue: flags.issue,
        correctResult: flags.correct,
        issueCategories: cats.length
          ? cats
          : String(flags.categories ?? '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        isSingleCase: flags['single-case'],
        mayBecomeGeneralRule: flags['general-rule'],
        needsIndexRebuild: flags.rebuild,
        userExplicitRuleRequest: flags['user-rule'] === true,
        batchId: flags.batch,
        fields: [].concat(flags.field ?? []).flat(),
        notes: flags.notes,
        relatedAdjustments,
        relatedReviewComplete: flags['related-complete'] === true,
      })
      printJson(result)
      return
    }
    case 'related':
    case 'rag:audit:related':
    case 'concept:audit:related':
    case 'plot:audit:related':
    case 'style-rag:audit:related': {
      const resolved =
        channel ??
        (command.includes('style')
          ? 'style-rag'
          : command.includes('concept')
            ? 'concept'
            : command.includes('plot')
              ? 'plot'
              : 'rag')
      const result = await suggestRelatedAssets({
        channel: assertAuditChannel(resolved),
        assetId: flags.asset ?? flags.id,
        limit: Number(flags.limit ?? 12) || 12,
      })
      printJson(result)
      return
    }
    case 'status':
    case 'rag:audit:status':
    case 'style-rag:audit:status':
    case 'concept:audit:status':
    case 'plot:audit:status':
    case 'knowledge:audit:status': {
      const resolved = channel === 'all' ? null : channel
      const result = await auditStatus({
        channel: resolved ?? (command.includes('style') ? 'style-rag' : flags.channel === 'all' ? null : flags.channel),
        openOnly: flags.open !== false,
        limit: flags.limit,
      })
      printJson(result)
      return
    }
    case 'rebuild':
    case 'rag:rebuild:affected':
    case 'style-rag:rebuild:affected':
    case 'concept:rebuild:affected':
    case 'plot:rebuild:affected': {
      const ch = assertAuditChannel(
        channel ??
          (command.includes('style')
            ? 'style-rag'
            : command.includes('concept')
              ? 'concept'
              : command.includes('plot')
                ? 'plot'
                : 'rag'),
      )
      if (flags.plan === true || flags['dry-run'] === true || flags.commit !== true) {
        const plan = await rebuildAffected({ channel: ch, commit: false })
        printJson(plan)
        return
      }
      const result = await rebuildAffected({ channel: ch, commit: true, afterDryRun: true })
      printJson(result)
      if (!result.ok) process.exitCode = 1
      return
    }
    case 'validate': {
      const policy = await loadPolicy()
      const categories = await loadCategories()
      const registry = await refreshRegistryFromDisk()
      const errors = []
      if (policy.skillUpgrade?.forbidSingleIncidentSkillPatch !== true) {
        errors.push('必须禁止单次事件膨胀 Skill')
      }
      if (policy.rebuild?.forbidFullRebuildByDefault !== true) {
        errors.push('必须默认禁止全库重建')
      }
      for (const ch of AUDIT_CHANNELS) {
        if (!categories?.categories?.[ch]?.length) errors.push(`类别表缺少 ${ch}`)
      }
      const missingPolicyChannels = AUDIT_CHANNELS.filter((ch) => !(policy.channels ?? []).includes(ch))
      if (missingPolicyChannels.length) {
        errors.push(`策略 channels 缺少：${missingPolicyChannels.join(', ')}`)
      }
      printJson({
        ok: errors.length === 0,
        errors,
        channels: AUDIT_CHANNELS,
        channelLabels: AUDIT_CHANNEL_LABELS,
        registryCounts: registry.counts,
        policyId: policy.policyId,
      })
      if (errors.length) process.exitCode = 1
      return
    }
    case 'categories': {
      printJson(await loadCategories())
      return
    }
    default:
      console.error(`未知命令：${command ?? '(empty)'}
用法:
  node scripts/rag-audit/rag-audit.mjs sample --channel rag|style-rag|concept|plot|all [--mode low-confidence|random|hit-frequency|graph-gap|...] [--batch-size 8] [--include-sources] [--asset-kind card|source|all]
  node scripts/rag-audit/rag-audit.mjs record --channel ... --asset <id> --issue ... --correct ... --category <cat> [--related channel:id:adjusted] [--related-complete] [--general-rule] [--rebuild] [--user-rule]
  node scripts/rag-audit/rag-audit.mjs related --channel ... --asset <id>
  node scripts/rag-audit/rag-audit.mjs status [--channel ...]
  node scripts/rag-audit/rag-audit.mjs rebuild --channel ...            # dry-run
  node scripts/rag-audit/rag-audit.mjs rebuild --channel ... --commit   # 执行受影响重建/校验
  node scripts/rag-audit/rag-audit.mjs validate`)
      process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
}
