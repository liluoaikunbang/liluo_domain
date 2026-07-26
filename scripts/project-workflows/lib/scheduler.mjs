/** 根据定义边与运行状态计算 ready / blocked 节点。 */

const TERMINAL = new Set(['completed', 'skipped-with-waiver', 'cancelled'])

export function nodeMap(definition) {
  return new Map(definition.nodes.map((node) => [node.id, node]))
}

export function outgoing(definition, nodeId, when = null) {
  return definition.edges.filter((edge) => edge.from === nodeId && (when == null || edge.when === when))
}

export function incoming(definition, nodeId) {
  return definition.edges.filter((edge) => edge.to === nodeId)
}

function predecessorsSatisfied(definition, run, nodeId) {
  const preds = incoming(definition, nodeId)
  if (preds.length === 0) return nodeId === definition.entryNodeId

  const successPreds = preds.filter((edge) => edge.when === 'success' || edge.when === 'condition' || edge.when === 'human-decision')
  const failurePreds = preds.filter((edge) => edge.when === 'failure' || edge.when === 'rework')

  // A node is unlockable if ANY incoming activating edge is satisfied.
  for (const edge of [...successPreds, ...failurePreds]) {
    const fromState = run.nodes[edge.from]
    if (!fromState) continue
    if (edge.when === 'success' && TERMINAL.has(fromState.status) && fromState.status === 'completed') {
      return true
    }
    if (edge.when === 'failure' && fromState.status === 'failed') return true
    if (edge.when === 'rework' && (fromState.adoption === 'rework' || fromState.status === 'failed')) return true
    if (edge.when === 'condition' && TERMINAL.has(fromState.status)) {
      if (evaluateCondition(edge.condition?.expression, run, edge.from)) return true
    }
    if (edge.when === 'human-decision' && TERMINAL.has(fromState.status)) {
      if (evaluateCondition(edge.condition?.expression ?? 'decision:approve', run, edge.from)) return true
    }
  }
  return false
}

export function evaluateCondition(expression, run, fromNodeId) {
  if (!expression) return false
  const flags = run.flags ?? {}
  if (expression.startsWith('flag:')) {
    const key = expression.slice('flag:'.length)
    return Boolean(flags[key])
  }
  if (expression.startsWith('!flag:')) {
    const key = expression.slice('!flag:'.length)
    return !flags[key]
  }
  if (expression.startsWith('adoption:')) {
    const expected = expression.slice('adoption:'.length)
    return run.nodes[fromNodeId]?.adoption === expected
  }
  if (expression.startsWith('decision:')) {
    const expected = expression.slice('decision:'.length)
    const approval = (run.approvals ?? []).find((item) => item.nodeId === fromNodeId)
    return approval?.decision === expected
  }
  if (expression === 'always') return true
  return false
}

export function computeReadyNodeIds(definition, run) {
  const ready = []
  for (const node of definition.nodes) {
    const state = run.nodes[node.id]
    if (!state) continue
    if (TERMINAL.has(state.status) || state.status === 'running' || state.status === 'blocked' || state.status === 'failed') {
      continue
    }
    if (state.status === 'ready') {
      ready.push(node.id)
      continue
    }
    if (state.status === 'pending' && predecessorsSatisfied(definition, run, node.id)) {
      ready.push(node.id)
    }
  }
  return ready
}

export function refreshNodeReadiness(definition, run) {
  const readyIds = new Set(computeReadyNodeIds(definition, run))
  for (const node of definition.nodes) {
    const state = run.nodes[node.id]
    if (!state) continue
    if (TERMINAL.has(state.status) || state.status === 'running' || state.status === 'blocked' || state.status === 'failed') {
      continue
    }
    state.status = readyIds.has(node.id) ? 'ready' : 'pending'
  }
  run.activeNodeIds = [...readyIds].sort()
  if (run.status === 'completed' || run.status === 'cancelled') return run
  if ([...Object.values(run.nodes)].some((state) => state.status === 'blocked')) {
    run.status = 'blocked'
  } else if (run.activeNodeIds.length > 0 || [...Object.values(run.nodes)].some((state) => state.status === 'running')) {
    run.status = 'running'
  } else if ([...Object.values(run.nodes)].some((state) => state.status === 'failed')) {
    run.status = 'failed'
  }
  return run
}

export function createEmptyRun(definition, { runId, mode = 'dry-run', inputSummary = '', flags = {} } = {}) {
  const createdAt = new Date().toISOString()
  const nodes = {}
  for (const node of definition.nodes) {
    nodes[node.id] = {
      status: node.id === definition.entryNodeId ? 'ready' : 'pending',
      attempts: 0,
      artifactPaths: [],
      completionChecks: [],
    }
  }
  const run = {
    schemaVersion: 1,
    runId,
    workflowId: definition.id,
    workflowVersion: definition.version,
    createdAt,
    updatedAt: createdAt,
    status: 'running',
    mode,
    inputSummary,
    flags,
    activeNodeIds: [definition.entryNodeId],
    nodes,
    invocations: [],
    waivers: [],
    approvals: [],
    errors: [],
    completionGate: { passed: false, checks: [] },
  }
  return refreshNodeReadiness(definition, run)
}

export function canStartNode(definition, run, nodeId) {
  refreshNodeReadiness(definition, run)
  return run.activeNodeIds.includes(nodeId)
}
