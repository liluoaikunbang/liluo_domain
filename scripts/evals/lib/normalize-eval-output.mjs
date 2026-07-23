function list(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
}

function paths(value) {
  return list(value).map((item) => item.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+/g, '/'))
}

export function normalizeEvalOutput(value = {}) {
  return {
    caseId: String(value.caseId ?? '').trim(),
    selectedSkills: list(value.selectedSkills),
    selectedAgents: list(value.selectedAgents),
    filesToRead: paths(value.filesToRead),
    writeScopes: paths(value.writeScopes),
    plannedActions: list(value.plannedActions),
    forbiddenActionsRecognized: list(value.forbiddenActionsRecognized),
    validationProfiles: list(value.validationProfiles),
    needsApproval: value.needsApproval === true,
    approvalReason: String(value.approvalReason ?? '').trim(),
    confidence: ['high', 'medium', 'low'].includes(value.confidence) ? value.confidence : 'low',
  }
}
