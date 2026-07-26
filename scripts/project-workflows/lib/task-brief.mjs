import { computeReadyNodeIds, refreshNodeReadiness } from './scheduler.mjs'

export function buildNodeTaskBrief(definition, run, nodeId, options = {}) {
  refreshNodeReadiness(definition, run)
  const node = definition.nodes.find((item) => item.id === nodeId)
  if (!node) throw new Error(`节点不存在：${nodeId}`)
  const state = run.nodes[nodeId]
  const ready = computeReadyNodeIds(definition, run)
  if (!options.force && !ready.includes(nodeId) && state?.status !== 'running' && state?.status !== 'blocked') {
    throw new Error(`节点 ${nodeId} 当前不可执行（状态=${state?.status ?? 'missing'}）。可执行：${ready.join(', ') || '无'}`)
  }

  const required = (node.resources ?? []).filter((item) => item.requirement === 'required')
  const forbidden = (node.resources ?? []).filter((item) => item.requirement === 'forbidden')
  const optional = (node.resources ?? []).filter((item) => item.requirement === 'optional')

  return {
    workflowId: definition.id,
    workflowVersion: definition.version,
    runId: run.runId,
    mode: run.mode,
    nodeId: node.id,
    title: node.title,
    type: node.type,
    stage: node.stage,
    whyNow: node.why,
    risk: node.risk,
    actor: node.actor,
    status: state?.status,
    readableInputs: [
      ...(node.inputs ?? []),
      `run.flags=${JSON.stringify(run.flags ?? {})}`,
      `inputSummary=${run.inputSummary ?? ''}`,
    ],
    mustDo: node.actions,
    mustCallSkills: required.filter((item) => item.kind === 'skill').map((item) => item.ref),
    mustCallAgents: required.filter((item) => item.kind === 'agent').map((item) => ({
      ref: item.ref,
      selfExecutionAllowed: item.selfExecutionAllowed,
      evidence: item.evidence,
    })),
    mustRunCommands: required.filter((item) => item.kind === 'command' || item.kind === 'script').map((item) => item.ref),
    mustApprovals: required.filter((item) => item.kind === 'approval').map((item) => item.ref),
    optionalResources: optional.map((item) => `${item.kind}:${item.ref}`),
    forbidden: [
      ...forbidden.map((item) => `${item.kind}:${item.ref}`),
      ...required.filter((item) => item.selfExecutionAllowed === false).map((item) => `主 Agent 自行替代 ${item.kind}:${item.ref}`),
      '跳过必需资源却标记节点完成',
      '未记录采用决定就继续后继节点',
    ],
    expectedOutputs: node.expectedOutputs,
    completion: node.completion,
    failure: node.failure,
    fillBack: {
      recordInvocation: 'npm run project:workflow:record-invocation -- --run <runId> --node <nodeId> --kind <kind> --ref <ref> ...',
      completeNode: 'npm run project:workflow:complete-node -- --run <runId> --node <nodeId>',
      adopt: '在 record-invocation 中提供 --adoption accepted|rejected|rework|fallback --main-read --downstream-use',
    },
  }
}

export function renderTaskBriefMarkdown(brief) {
  const lines = [
    `# 节点任务书：${brief.title}`,
    '',
    `- 流程：\`${brief.workflowId}@${brief.workflowVersion}\``,
    `- 运行：\`${brief.runId}\`（${brief.mode}）`,
    `- 节点：\`${brief.nodeId}\`（${brief.status}）`,
    `- 阶段：${brief.stage}｜风险：${brief.risk}｜责任：${brief.actor}`,
    '',
    '## 为何此时执行',
    '',
    brief.whyNow,
    '',
    '## 可读取输入',
    '',
    ...brief.readableInputs.map((item) => `- ${item}`),
    '',
    '## 必须执行',
    '',
    ...brief.mustDo.map((item, index) => `${index + 1}. ${item}`),
    '',
    '## 必须调用的 Skill',
    '',
    ...(brief.mustCallSkills.length ? brief.mustCallSkills.map((item) => `- \`${item}\``) : ['- （无）']),
    '',
    '## 必须调用的子智能体',
    '',
    ...(brief.mustCallAgents.length
      ? brief.mustCallAgents.map((item) => `- \`${item.ref}\`（selfExecutionAllowed=${item.selfExecutionAllowed}；证据：${item.evidence.join(', ')}）`)
      : ['- （无）']),
    '',
    '## 必须运行的命令/脚本',
    '',
    ...(brief.mustRunCommands.length ? brief.mustRunCommands.map((item) => `- \`${item}\``) : ['- （无）']),
    '',
    '## 禁止',
    '',
    ...brief.forbidden.map((item) => `- ${item}`),
    '',
    '## 预期产物',
    '',
    ...(brief.expectedOutputs.length ? brief.expectedOutputs.map((item) => `- ${item}`) : ['- （无显式产物）']),
    '',
    '## 完成条件',
    '',
    `- requireResourceEvidence=${brief.completion.requireResourceEvidence}`,
    ...(brief.completion.artifactPaths ?? []).map((item) => `- 产物：\`${item}\``),
    brief.completion.notes ? `- 说明：${brief.completion.notes}` : '',
    '',
    '## 失败处理',
    '',
    `- 策略：${brief.failure.strategy}`,
    brief.failure.repairNodeId ? `- 返工节点：\`${brief.failure.repairNodeId}\`` : '',
    brief.failure.notes ? `- 说明：${brief.failure.notes}` : '',
    '',
    '## 结果回填',
    '',
    `- 记录调用：\`${brief.fillBack.recordInvocation}\``,
    `- 完成节点：\`${brief.fillBack.completeNode}\``,
    `- 采用决定：${brief.fillBack.adopt}`,
    '',
  ].filter((line) => line !== undefined)
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`
}
