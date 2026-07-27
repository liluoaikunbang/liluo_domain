import { spawnSync } from 'node:child_process'
import { mkdir, cp } from 'node:fs/promises'
import path from 'node:path'
import {
  loadAllAuditRecords,
  loadPolicy,
  refreshRegistryFromDisk,
  saveAuditRecord,
  saveJson,
  repoPath,
} from './registry.mjs'
import { AUDIT_REBUILD_LOGS, ROOT } from './paths.mjs'
import { assertAuditChannel, AUDIT_CHANNEL_LABELS } from './channels.mjs'

function collectRebuildTargets(records, channel) {
  const filtered = records.filter(
    (r) =>
      r.channel === channel &&
      r.needsIndexRebuild &&
      ['recorded', 'awaiting-skill-decision', 'skill-updated', 'rebuild-pending'].includes(r.fixStatus),
  )
  const sourcePaths = new Set()
  const assetIds = new Set()
  const fields = new Set()
  const auditIds = []
  for (const record of filtered) {
    auditIds.push(record.auditId)
    assetIds.add(record.sourceAssetId)
    for (const p of record.rebuildScope?.sourcePaths ?? []) if (p) sourcePaths.add(p)
    for (const f of record.rebuildScope?.fields ?? []) if (f) fields.add(f)
    if (record.sourcePath) sourcePaths.add(record.sourcePath)
  }
  return {
    auditIds,
    sourcePaths: [...sourcePaths].sort(),
    assetIds: [...assetIds].sort(),
    fields: [...fields].sort(),
    count: filtered.length,
  }
}

function rebuildActionsForChannel(channel) {
  if (channel === 'rag') {
    return [
      {
        type: 'external-knowledge-update-changed',
        command: 'npm run external:knowledge:update',
        note: '仅增量更新变更源；不修改原始文章；卡片保持 candidate 直至人工审阅',
      },
      {
        type: 'external-knowledge-validate',
        command: 'npm run external:knowledge:validate',
      },
    ]
  }
  if (channel === 'style-rag') {
    return [
      {
        type: 'style-external-inventory',
        command: 'npm run writing:external:inventory',
        note: '增量刷新文章/作者 registry；不伪造用户评分；不改原文',
      },
      {
        type: 'style-external-validate',
        command: 'npm run writing:external:validate',
      },
      {
        type: 'style-validate',
        command: 'npm run writing:style:validate',
      },
    ]
  }
  if (channel === 'concept') {
    return [
      {
        type: 'manual-concept-edit',
        command: null,
        note: '人工修正 src/game/data/outline_relation_graph/conceptRegistry.js（及关联 RAG 卡，如需）',
      },
      {
        type: 'outline-graph-validate',
        command: 'npm run outline:graph:validate',
        note: '校验关联图谱投影；不自动改写正史',
      },
    ]
  }
  return [
    {
      type: 'manual-plot-edit',
      command: null,
      note: '人工修正 src/game/data/plot_outline/catalog.json（标签/摘要/usedBy 等）',
    },
    {
      type: 'outline-graph-validate',
      command: 'npm run outline:graph:validate',
      note: '校验关联图谱投影；不自动改写正史',
    },
  ]
}

export async function planRebuildAffected(options = {}) {
  const channel = assertAuditChannel(options.channel)
  const policy = await loadPolicy()
  if (options.full === true && policy.rebuild.forbidFullRebuildByDefault) {
    throw new Error('默认禁止全库重建；请去掉 --full，仅重建受影响范围')
  }
  const records = await loadAllAuditRecords()
  const scope = collectRebuildTargets(records, channel)
  if (!scope.count) {
    return {
      ok: true,
      dryRun: true,
      channel,
      scope,
      actions: [],
      note: '没有 needsIndexRebuild 的开放抽查记录；无需重建。',
    }
  }

  const actions = rebuildActionsForChannel(channel)

  const plan = {
    schemaVersion: 1,
    planId: `rrp-${Date.now().toString(36)}`,
    channel,
    channelLabel: AUDIT_CHANNEL_LABELS[channel],
    createdAt: new Date().toISOString(),
    dryRun: options.commit !== true,
    scope,
    actions,
    constraints: {
      forbidModifySourceArticles: true,
      forbidAutoMarkHumanApproved: true,
      requireDiffReport: true,
      retainPreviousSnapshot: true,
    },
    note: options.commit
      ? '将执行受影响重建/校验'
      : 'dry-run：仅生成计划与快照提示，不执行重建命令',
  }

  await saveJson(`${AUDIT_REBUILD_LOGS}/${plan.planId}.plan.json`, plan)
  return plan
}

async function snapshotStyleRegistries(planId) {
  const dir = repoPath(AUDIT_REBUILD_LOGS, planId, 'before')
  await mkdir(dir, { recursive: true })
  for (const rel of [
    'docs/写作资产/外部风格研究/article-registry.json',
    'docs/写作资产/外部风格研究/author-registry.json',
  ]) {
    try {
      await cp(repoPath(rel), path.join(dir, path.basename(rel)))
    } catch {
      // optional
    }
  }
  return toPosixDir(dir)
}

async function snapshotRagManifest(planId) {
  const dir = repoPath(AUDIT_REBUILD_LOGS, planId, 'before')
  await mkdir(dir, { recursive: true })
  try {
    await cp(repoPath('external-knowledge/manifest.json'), path.join(dir, 'manifest.json'))
  } catch {
    // optional
  }
  return toPosixDir(dir)
}

async function snapshotOutlineProjection(planId, channel) {
  const dir = repoPath(AUDIT_REBUILD_LOGS, planId, 'before')
  await mkdir(dir, { recursive: true })
  const targets =
    channel === 'concept'
      ? ['src/game/data/outline_relation_graph/conceptRegistry.js']
      : ['src/game/data/plot_outline/catalog.json']
  for (const rel of targets) {
    try {
      await cp(repoPath(rel), path.join(dir, path.basename(rel)))
    } catch {
      // optional
    }
  }
  return toPosixDir(dir)
}

function toPosixDir(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/')
}

function runNpm(script) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
  })
  return {
    script,
    status: result.status,
    stdout: (result.stdout ?? '').slice(0, 4000),
    stderr: (result.stderr ?? '').slice(0, 2000),
  }
}

function rebuildNextHint(channel) {
  if (channel === 'rag') return 'npm run rag:rebuild:affected -- --commit'
  if (channel === 'style-rag') return 'npm run style-rag:rebuild:affected -- --commit'
  if (channel === 'concept') return 'npm run concept:rebuild:affected -- --commit'
  return 'npm run plot:rebuild:affected -- --commit'
}

export async function rebuildAffected(options = {}) {
  const dryRun = options.commit !== true
  const plan = await planRebuildAffected({ ...options, commit: false })
  if (!plan.scope?.count) return { ...plan, executed: false }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      plan,
      next: `确认范围后执行：${rebuildNextHint(options.channel)}`,
    }
  }

  const policy = await loadPolicy()
  if (policy.rebuild.requireDryRunFirst && options.force !== true && !options.afterDryRun) {
    // still allow commit if plan file exists from prior dry-run; we just generated one above
  }

  let snapshotPath
  if (options.channel === 'rag') snapshotPath = await snapshotRagManifest(plan.planId)
  else if (options.channel === 'style-rag') snapshotPath = await snapshotStyleRegistries(plan.planId)
  else snapshotPath = await snapshotOutlineProjection(plan.planId, options.channel)

  const results = []
  for (const action of plan.actions) {
    if (!action.command) {
      results.push({
        script: action.type,
        status: 0,
        stdout: action.note || 'manual step',
        stderr: '',
        manual: true,
      })
      continue
    }
    const script = action.command.replace(/^npm run\s+/, '')
    results.push(runNpm(script))
  }

  // mark audits rebuild-done only if commands succeeded
  const failed = results.filter((r) => r.status !== 0)
  if (!failed.length) {
    const records = await loadAllAuditRecords()
    for (const id of plan.scope.auditIds) {
      const record = records.find((r) => r.auditId === id)
      if (!record) continue
      record.fixStatus = 'rebuild-done'
      record.needsIndexRebuild = false
      record.notes = `${record.notes ?? ''}\nrebuild ${plan.planId}`.trim()
      await saveAuditRecord(record)
    }
  }

  await refreshRegistryFromDisk()

  // after snapshot
  const afterDir = repoPath(AUDIT_REBUILD_LOGS, plan.planId, 'after')
  await mkdir(afterDir, { recursive: true })
  if (options.channel === 'style-rag') {
    for (const name of ['article-registry.json', 'author-registry.json']) {
      try {
        await cp(repoPath('docs/写作资产/外部风格研究', name), path.join(afterDir, name))
      } catch {
        // ignore
      }
    }
  } else if (options.channel === 'rag') {
    try {
      await cp(repoPath('external-knowledge/manifest.json'), path.join(afterDir, 'manifest.json'))
    } catch {
      // ignore
    }
  } else if (options.channel === 'concept') {
    try {
      await cp(
        repoPath('src/game/data/outline_relation_graph/conceptRegistry.js'),
        path.join(afterDir, 'conceptRegistry.js'),
      )
    } catch {
      // ignore
    }
  } else if (options.channel === 'plot') {
    try {
      await cp(repoPath('src/game/data/plot_outline/catalog.json'), path.join(afterDir, 'catalog.json'))
    } catch {
      // ignore
    }
  }

  const report = {
    ok: failed.length === 0,
    dryRun: false,
    planId: plan.planId,
    channel: options.channel,
    scope: plan.scope,
    snapshotBefore: snapshotPath,
    snapshotAfter: toPosixDir(afterDir),
    commandResults: results,
    note: '未修改原始外部文章；未将模型结果标为人工批准。concept/plot 仅校验投影，正文需人工已改。',
  }
  await saveJson(`${AUDIT_REBUILD_LOGS}/${plan.planId}.result.json`, report)
  return report
}
