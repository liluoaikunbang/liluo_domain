const REF_GROUPS = { maps: 'mapRefs', events: 'eventRefs', dialogues: 'dialogueRefs', gameplay: 'gameplayRefs', assets: 'assetRefs', audio: 'audioRefs' };

export function buildPlayablePlan(node, catalog = {}) {
  if (!node?.key) throw new Error('story node key is required');
  const resolved = {}, missing = {};
  for (const [group, field] of Object.entries(REF_GROUPS)) {
    const refs = Array.isArray(node[field]) ? node[field] : [];
    const known = catalog[group] instanceof Set ? catalog[group] : new Set(catalog[group] ?? []);
    resolved[group] = refs.filter((ref) => known.has(ref));
    missing[group] = refs.filter((ref) => !known.has(ref));
  }
  const requiredContracts = ['entryConditions', 'completionConditions', 'stateChanges', 'minimumPlayableVersion'];
  const missingContracts = requiredContracts.filter((field) => !Array.isArray(node[field]) || node[field].length === 0);
  const unresolvedRefs = Object.values(missing).flat();
  const unresolvedDesignGaps = Array.isArray(node.missingItems) ? node.missingItems : [];
  return {
    schemaVersion: 1,
    storyKey: node.key,
    title: node.title ?? node.key,
    world: node.world ?? null,
    resolved,
    missing,
    missingContracts,
    unresolvedDesignGaps,
    minimumPlayableVersion: node.minimumPlayableVersion ?? [],
    readyForImplement: missingContracts.length === 0 && unresolvedRefs.length === 0 && unresolvedDesignGaps.length === 0,
    modes: ['plan', 'skeleton', 'implement', 'validate'],
    note: 'implement 仅编排现有地图、事件、对话、存档与验证工作流，不会批量改写故事。'
  };
}
