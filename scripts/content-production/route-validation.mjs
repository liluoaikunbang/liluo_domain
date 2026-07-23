function nodeMap(route) { return new Map((route.nodes ?? []).map((node) => [node.id, node])); }
function transitions(node) { return Array.isArray(node?.transitions) ? node.transitions : []; }
function requirementsMet(requires, state) { return Object.entries(requires ?? {}).every(([key, value]) => state[key] === value); }

export function validateRoute(route) {
  const errors = [], warnings = [], rawNodes = route?.nodes ?? [], nodes = nodeMap(route);
  const seenIds = new Set();
  for (const node of rawNodes) {
    if (!node?.id) errors.push({ code: 'missing-node-id' });
    else if (seenIds.has(node.id)) errors.push({ code: 'duplicate-node-id', nodeId: node.id });
    else seenIds.add(node.id);
  }
  if (!route?.entry || !nodes.has(route.entry)) errors.push({ code: 'missing-entry', nodeId: route?.entry ?? null });
  for (const node of nodes.values()) {
    for (const edge of transitions(node)) if (!nodes.has(edge.to)) errors.push({ code: 'missing-target', nodeId: node.id, target: edge.to });
    if (node.terminal && transitions(node).length > 0) warnings.push({ code: 'terminal-has-transitions', nodeId: node.id });
  }
  const reachable = new Set(), queue = nodes.has(route?.entry) ? [route.entry] : [];
  while (queue.length) {
    const id = queue.shift();
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const edge of transitions(nodes.get(id))) if (nodes.has(edge.to)) queue.push(edge.to);
  }
  for (const id of nodes.keys()) if (!reachable.has(id)) errors.push({ code: 'unreachable-node', nodeId: id });

  const canReachTerminal = new Set([...nodes.values()].filter((node) => node.terminal).map((node) => node.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes.values()) {
      if (!canReachTerminal.has(node.id) && transitions(node).some((edge) => canReachTerminal.has(edge.to))) {
        canReachTerminal.add(node.id); changed = true;
      }
    }
  }
  for (const id of reachable) if (!canReachTerminal.has(id)) errors.push({ code: 'non-terminating-component', nodeId: id });
  for (const entry of route?.formalEntries ?? []) if (!nodes.has(entry)) errors.push({ code: 'invalid-formal-entry', nodeId: entry });
  const producedKeys = new Set(Object.keys(route?.initialState ?? {}));
  for (const node of nodes.values()) for (const edge of transitions(node)) for (const key of Object.keys(edge.set ?? {})) producedKeys.add(key);
  for (const node of nodes.values()) {
    for (const key of Object.keys(node.requires ?? {})) if (!producedKeys.has(key)) warnings.push({ code: 'unproduced-required-state', nodeId: node.id, stateKey: key });
    for (const edge of transitions(node)) for (const key of Object.keys(edge.requires ?? {})) if (!producedKeys.has(key)) warnings.push({ code: 'unproduced-required-state', nodeId: node.id, target: edge.to, stateKey: key });
  }
  if (!nodes.size) warnings.push({ code: 'empty-route' });
  return { valid: errors.length === 0, errors, warnings, reachable: [...reachable] };
}

export function simulateRoute(route, options = {}) {
  const validation = validateRoute(route);
  if (!validation.valid && options.allowInvalid !== true) return { completed: false, reason: 'invalid-route', validation, state: { ...(options.state ?? {}) }, trace: [] };
  const nodes = nodeMap(route), state = { ...(options.state ?? {}) }, trace = [];
  let current = options.startNode ?? route.entry;
  const maxSteps = options.maxSteps ?? 100;
  for (let step = 0; step < maxSteps; step += 1) {
    const node = nodes.get(current);
    if (!node) return { completed: false, reason: 'missing-node', state, trace };
    if (!requirementsMet(node.requires, state)) return { completed: false, reason: 'node-requirements-unmet', nodeId: current, state, trace };
    trace.push(current);
    if (node.terminal) return { completed: true, terminal: current, state, trace };
    const edge = transitions(node).find((candidate) => requirementsMet(candidate.requires, state));
    if (!edge) return { completed: false, reason: 'no-available-transition', nodeId: current, state, trace };
    Object.assign(state, edge.set ?? {});
    current = edge.to;
  }
  return { completed: false, reason: 'step-limit', state, trace };
}

export function resumeRoute(route, snapshot, options = {}) {
  if (!snapshot?.nodeId || typeof snapshot.state !== 'object') return { completed: false, reason: 'invalid-snapshot', state: {}, trace: [] };
  return simulateRoute(route, { ...options, startNode: snapshot.nodeId, state: snapshot.state });
}
