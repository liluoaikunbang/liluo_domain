import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { ROOT } from './paths.mjs'
import { refreshNodeReadiness } from './scheduler.mjs'

const exists = (file) => access(file, constants.F_OK).then(() => true, () => false)

function requiredResources(node) {
  return (node.resources ?? []).filter((resource) => resource.requirement === 'required'
    || (resource.requirement === 'conditional' && resource.condition))
}

function matchingInvocations(run, nodeId, resource) {
  return (run.invocations ?? []).filter((item) => item.nodeId === nodeId && item.ref === resource.ref && item.kind === resource.kind)
}

function waiverFor(run, nodeId, ref) {
  return (run.waivers ?? []).find((item) => item.nodeId === nodeId && item.ref === ref && item.allowsContinue)
}

export async function evaluateResourceEvidence(definition, run, nodeId, options = {}) {
  const node = definition.nodes.find((item) => item.id === nodeId)
  if (!node) return { ok: false, checks: [{ id: 'node-exists', ok: false, detail: `节点不存在：${nodeId}` }] }
  const checks = []
  const root = options.root ?? ROOT

  for (const resource of node.resources ?? []) {
    if (resource.requirement === 'forbidden') {
      const hits = matchingInvocations(run, nodeId, resource)
      checks.push({
        id: `forbidden:${resource.ref}`,
        ok: hits.length === 0,
        detail: hits.length ? `禁止资源被调用：${resource.ref}` : `未调用禁止资源 ${resource.ref}`,
      })
      continue
    }
    if (resource.requirement === 'optional') continue
    if (resource.requirement === 'conditional') {
      // Conditional resources are enforced only when the run flag matches the condition key.
      const key = resource.condition?.startsWith('flag:') ? resource.condition.slice(5) : null
      if (key && !run.flags?.[key]) continue
    }

    const invocations = matchingInvocations(run, nodeId, resource)
    const waiver = waiverFor(run, nodeId, resource.ref)
    if (resource.fatal && waiver) {
      checks.push({
        id: `fatal-waiver:${resource.ref}`,
        ok: false,
        detail: `fatal 资源不得豁免：${resource.ref}`,
      })
      continue
    }
    if (!invocations.length) {
      if (waiver && resource.waiverAllowed && !resource.fatal) {
        checks.push({
          id: `waived:${resource.ref}`,
          ok: true,
          detail: `已合法豁免 ${resource.ref}`,
        })
        continue
      }
      checks.push({
        id: `invocation:${resource.ref}`,
        ok: false,
        detail: `缺少必需资源调用证据：${resource.kind}:${resource.ref}`,
      })
      continue
    }

    const latest = invocations[invocations.length - 1]
    if (latest.selfExecuted && resource.selfExecutionAllowed === false) {
      checks.push({
        id: `self-execution:${resource.ref}`,
        ok: false,
        detail: `主 Agent 不得替代执行：${resource.ref}`,
      })
    }

    for (const need of resource.evidence ?? []) {
      if (need === 'invocation') {
        checks.push({ id: `evidence-invocation:${resource.ref}`, ok: true, detail: '已记录调用' })
      } else if (need === 'success-or-explicit-failure') {
        const ok = ['succeeded', 'failed', 'waived'].includes(latest.status)
        checks.push({
          id: `evidence-status:${resource.ref}`,
          ok,
          detail: ok ? `调用状态 ${latest.status}` : `调用状态未终结：${latest.status}`,
        })
        if (latest.status === 'failed' && resource.onFailure === 'block') {
          checks.push({
            id: `failure-block:${resource.ref}`,
            ok: false,
            detail: `必需资源失败且策略为 block：${resource.ref}`,
          })
        }
      } else if (need === 'result-summary') {
        const ok = Boolean(latest.resultSummary || latest.outputSummary)
        checks.push({
          id: `evidence-summary:${resource.ref}`,
          ok,
          detail: ok ? '已有结果摘要' : '缺少结果摘要',
        })
      } else if (need === 'artifacts') {
        const paths = latest.artifactPaths ?? []
        let ok = paths.length > 0
        if (ok && options.checkArtifactFiles !== false) {
          for (const relative of paths) {
            if (!await exists(path.resolve(root, relative))) {
              ok = false
              checks.push({
                id: `evidence-artifact-missing:${resource.ref}:${relative}`,
                ok: false,
                detail: `产物不存在：${relative}`,
              })
            }
          }
        }
        checks.push({
          id: `evidence-artifacts:${resource.ref}`,
          ok,
          detail: ok ? `产物 ${paths.length} 项` : '缺少产物路径',
        })
      } else if (need === 'main-read') {
        checks.push({
          id: `evidence-main-read:${resource.ref}`,
          ok: latest.mainRead === true,
          detail: latest.mainRead ? '主流程已读取结果' : '主流程未标记已读取结果',
        })
      } else if (need === 'adoption-decision') {
        const adoption = latest.adoption ?? 'pending'
        const ok = adoption !== 'pending'
        checks.push({
          id: `evidence-adoption:${resource.ref}`,
          ok,
          detail: ok ? `采用决定：${adoption}` : '缺少采用决定（accepted/rejected/rework/fallback）',
        })
      } else if (need === 'downstream-use') {
        const adoption = latest.adoption
        if (adoption === 'accepted' || adoption === 'fallback') {
          checks.push({
            id: `evidence-downstream:${resource.ref}`,
            ok: Boolean(latest.downstreamUse),
            detail: latest.downstreamUse ? '已记录下游使用' : '已接受但未记录下游使用',
          })
        } else {
          checks.push({
            id: `evidence-downstream:${resource.ref}`,
            ok: true,
            detail: '未接受结果，无需下游使用证明',
          })
        }
      }
    }
  }

  if (node.completion?.artifactPaths?.length) {
    for (const relative of node.completion.artifactPaths) {
      const ok = options.checkArtifactFiles === false
        ? (run.nodes[nodeId]?.artifactPaths ?? []).includes(relative)
        : await exists(path.resolve(root, relative))
      checks.push({
        id: `node-artifact:${relative}`,
        ok,
        detail: ok ? `节点产物存在：${relative}` : `节点产物缺失：${relative}`,
      })
    }
  }

  return { ok: checks.every((item) => item.ok), checks }
}

export async function tryCompleteNode(definition, run, nodeId, options = {}) {
  const state = run.nodes[nodeId]
  if (!state) throw new Error(`运行记录缺少节点状态：${nodeId}`)
  if (state.status !== 'running' && state.status !== 'ready' && state.status !== 'blocked') {
    return { ok: false, reason: `节点状态不可完成：${state.status}`, run }
  }

  const evaluation = await evaluateResourceEvidence(definition, run, nodeId, options)
  state.completionChecks = evaluation.checks
  if (!evaluation.ok) {
    state.status = 'blocked'
    state.blockReason = evaluation.checks.filter((item) => !item.ok).map((item) => item.detail).join('；')
    run.status = 'blocked'
    run.updatedAt = new Date().toISOString()
    refreshNodeReadiness(definition, run)
    return { ok: false, reason: state.blockReason, checks: evaluation.checks, run }
  }

  state.status = 'completed'
  state.endedAt = new Date().toISOString()
  state.blockReason = undefined
  run.updatedAt = state.endedAt
  refreshNodeReadiness(definition, run)
  return { ok: true, checks: evaluation.checks, run }
}

export function evaluateCompletionGate(definition, run) {
  const checks = []
  for (const nodeId of definition.completionGate.requiredNodeIds) {
    const status = run.nodes[nodeId]?.status
    checks.push({
      id: `required-node:${nodeId}`,
      ok: status === 'completed' || status === 'skipped-with-waiver',
      detail: `节点 ${nodeId} 状态=${status ?? 'missing'}`,
    })
  }
  if (definition.completionGate.forbidOpenBlockers) {
    const blocked = Object.entries(run.nodes)
      .filter(([, state]) => state.status === 'blocked' || state.status === 'failed')
      .map(([id]) => id)
    checks.push({
      id: 'no-open-blockers',
      ok: blocked.length === 0,
      detail: blocked.length ? `仍有阻塞/失败节点：${blocked.join(', ')}` : '无开放阻塞',
    })
  }
  for (const relative of definition.completionGate.requiredArtifacts ?? []) {
    const present = Object.values(run.nodes).some((state) => (state.artifactPaths ?? []).includes(relative))
      || (run.invocations ?? []).some((item) => (item.artifactPaths ?? []).includes(relative))
    checks.push({
      id: `required-artifact:${relative}`,
      ok: present,
      detail: present ? `已登记产物 ${relative}` : `缺少流程产物登记 ${relative}`,
    })
  }
  const passed = checks.every((item) => item.ok)
  run.completionGate = {
    passed,
    checkedAt: new Date().toISOString(),
    checks,
  }
  if (passed) run.status = 'completed'
  return { ok: passed, checks, run }
}

export function assertInvariantWaivers(definition, run) {
  const issues = []
  for (const invariant of definition.invariants ?? []) {
    if (!invariant.fatal) continue
    const waived = (run.waivers ?? []).some((item) => item.ref === invariant.id || item.ref === `invariant:${invariant.id}`)
    if (waived) issues.push(`不可豁免的不可变约束被豁免：${invariant.id}`)
  }
  return issues
}

export { requiredResources }
