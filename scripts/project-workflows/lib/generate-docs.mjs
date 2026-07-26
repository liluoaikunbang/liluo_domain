export function generateProcessMarkdown(definition, options = {}) {
  const view = options.view ?? 'full'
  const simpleIds = new Set(definition.visualization?.simpleNodeIds ?? definition.nodes.filter((node) => node.criticalPath !== false).map((node) => node.id))
  const nodes = view === 'simple'
    ? definition.nodes.filter((node) => simpleIds.has(node.id))
    : definition.nodes

  const stages = new Map()
  for (const node of nodes) {
    const list = stages.get(node.stage) ?? []
    list.push(node)
    stages.set(node.stage, list)
  }

  const requiredSkills = new Set()
  const requiredAgents = new Set()
  const approvals = []
  for (const node of definition.nodes) {
    for (const resource of node.resources ?? []) {
      if (resource.requirement !== 'required') continue
      if (resource.kind === 'skill') requiredSkills.add(resource.ref)
      if (resource.kind === 'agent') requiredAgents.add(resource.ref)
      if (resource.kind === 'approval') approvals.push(`${node.id}:${resource.ref}`)
    }
  }

  const lines = [
    `# ${definition.title}`,
    '',
    `> 本文件由 \`project-workflows/definitions\` 生成，勿手工改写后反向覆盖 JSON。工作流版本：\`${definition.version}\`。`,
    '',
    '## 目标',
    '',
    definition.purpose,
    '',
    '## 适用范围',
    '',
    `- 领域：${definition.domain}`,
    `- 状态：${definition.status}`,
    `- 成熟度：${definition.maturity}`,
    `- 维护 Skill：\`${definition.ownerSkill}\``,
    definition.tags?.length ? `- 标签：${definition.tags.join('、')}` : '',
    '',
    '## 流程概览（可视化介绍）',
    '',
    '以下简图由工作流定义生成，是本任务的默认可视化介绍。仅在节点/边/门禁等重大修改后运行 `npm run project:workflow:generate` 重写；日常 `validate` 只检查是否过期，不频繁重生成。',
    '',
    '```mermaid',
    generateMermaid(definition, { view: 'simple' }).trim(),
    '```',
    '',
    '## 输入 / 输出',
    '',
    '### 输入',
    '',
    ...definition.inputs.map((item) => `- **${item.id}**：${item.description}${item.pathHint ? `（\`${item.pathHint}\`）` : ''}`),
    '',
    '### 输出',
    '',
    ...definition.outputs.map((item) => `- **${item.id}**：${item.description}${item.pathHint ? `（\`${item.pathHint}\`）` : ''}`),
    '',
    '## 不可变约束',
    '',
    ...definition.invariants.map((item) => `- \`${item.id}\`${item.fatal ? '（fatal）' : ''}：${item.statement}`),
    '',
    '## 阶段与节点',
    '',
  ]

  for (const [stage, stageNodes] of stages) {
    lines.push(`### ${stage}`, '')
    for (const node of stageNodes) {
      lines.push(`#### ${node.title}（\`${node.id}\`）`, '')
      lines.push(`- 类型：${node.type}｜责任：${node.actor}｜风险：${node.risk}`)
      lines.push(`- 原因：${node.why}`)
      lines.push('- 动作：')
      for (const action of node.actions) lines.push(`  - ${action}`)
      const required = (node.resources ?? []).filter((item) => item.requirement === 'required')
      if (required.length) {
        lines.push('- 必需资源：')
        for (const resource of required) {
          lines.push(`  - ${resource.kind}:\`${resource.ref}\`（selfExecutionAllowed=${resource.selfExecutionAllowed}；失败=${resource.onFailure}）`)
        }
      }
      lines.push(`- 失败策略：${node.failure.strategy}${node.failure.repairNodeId ? ` → \`${node.failure.repairNodeId}\`` : ''}`)
      lines.push('')
    }
  }

  lines.push(
    '## 必需 Skill / 子智能体',
    '',
    '### Skills',
    '',
    ...(requiredSkills.size ? [...requiredSkills].map((item) => `- \`${item}\``) : ['- （无）']),
    '',
    '### Agents',
    '',
    ...(requiredAgents.size ? [...requiredAgents].map((item) => `- \`${item}\``) : ['- （无）']),
    '',
    '## 审批点',
    '',
    ...(approvals.length ? approvals.map((item) => `- ${item}`) : ['- （无显式人工审批资源）']),
    '',
    '## 分支与返工',
    '',
    ...definition.edges
      .filter((edge) => edge.when !== 'success' || edge.label)
      .map((edge) => `- \`${edge.from}\` → \`${edge.to}\`（${edge.when}${edge.condition?.expression ? ` / ${edge.condition.expression}` : ''}${edge.label ? `：${edge.label}` : ''}）`),
    '',
    '## 完成条件',
    '',
    ...definition.completionGate.requiredNodeIds.map((id) => `- 必经节点完成：\`${id}\``),
    definition.completionGate.forbidOpenBlockers ? '- 不得残留 blocked/failed 节点' : '',
    ...(definition.completionGate.requiredArtifacts ?? []).map((item) => `- 产物：\`${item}\``),
    '',
    '## 常见失败',
    '',
    '- 必需 Skill/Agent 未调用或仅“考虑过”',
    '- 子智能体结果未读取或未记录采用决定',
    '- 主 Agent 替代 `selfExecutionAllowed=false` 的独立审查',
    '- fatal 约束被错误豁免',
    '- 跳步完成未解锁节点',
    '',
    '## 最终产物',
    '',
    ...definition.outputs.map((item) => `- ${item.description}`),
    '',
    '## 详细流程图',
    '',
    '详图同样由定义生成，供查阅资源调用与返工边；日常介绍以文首「流程概览」为准。',
    '',
    '```mermaid',
    generateMermaid(definition, { view: 'detail' }).trim(),
    '```',
    '',
    '- 源文件副本：同目录 `flow-simple.mmd` / `flow-detail.mmd`（勿手改后反向覆盖 JSON）',
    '- 单次运行叠加：见运行报告内 Mermaid',
    '- 交互大图：仅当用户明确要求「动态大图 / 交互图」时，再打开 `project-workflows/viewer/index.html`',
    '',
    `## 工作流版本`,
    '',
    `\`${definition.id}@${definition.version}\``,
    '',
  )

  // Ensure success edges also appear briefly
  const successEdges = definition.edges.filter((edge) => edge.when === 'success')
  if (successEdges.length) {
    const insertAt = lines.indexOf('## 分支与返工')
    if (insertAt >= 0) {
      lines.splice(insertAt + 2, 0, '主成功路径：', ...successEdges.map((edge) => `- \`${edge.from}\` → \`${edge.to}\``), '')
    }
  }

  return `${lines.filter((line) => line !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')}\n`
}

export function generateMermaid(definition, options = {}) {
  const view = options.view ?? 'detail'
  const run = options.run
  const simpleIds = new Set(definition.visualization?.simpleNodeIds ?? definition.nodes.filter((node) => node.criticalPath !== false).map((node) => node.id))
  const includeNode = (id) => view === 'detail' || view === 'run' || simpleIds.has(id)
  const statusClass = {
    pending: 'pending',
    ready: 'ready',
    running: 'running',
    completed: 'completed',
    blocked: 'blocked',
    failed: 'failed',
    'skipped-with-waiver': 'skipped',
    cancelled: 'cancelled',
  }

  const lines = ['flowchart TD']
  const stageGroups = new Map()
  for (const node of definition.nodes) {
    if (!includeNode(node.id)) continue
    const list = stageGroups.get(node.stage) ?? []
    list.push(node)
    stageGroups.set(node.stage, list)
  }

  let groupIndex = 0
  for (const [stage, nodes] of stageGroups) {
    lines.push(`  subgraph S${groupIndex}["${stage}"]`)
    for (const node of nodes) {
      const label = node.title.replaceAll('"', "'")
      lines.push(`    ${node.id}["${label}"]`)
    }
    lines.push('  end')
    groupIndex += 1
  }

  for (const edge of definition.edges) {
    if (!includeNode(edge.from) || !includeNode(edge.to)) continue
    // 简图保留主路径连通（含 condition），省略失败/返工边，避免介绍图断链。
    if (view === 'simple' && (edge.when === 'failure' || edge.when === 'rework')) continue
    const label = edge.label || edge.when + (edge.condition?.expression ? `:${edge.condition.expression}` : '')
    lines.push(`  ${edge.from} -->|${label}| ${edge.to}`)
  }

  if (view === 'detail') {
    for (const node of definition.nodes) {
      if (!includeNode(node.id)) continue
      for (const resource of node.resources ?? []) {
        if (resource.requirement !== 'required') continue
        if (resource.kind !== 'skill' && resource.kind !== 'agent' && resource.kind !== 'approval') continue
        const rid = `${node.id}_${resource.kind}_${resource.ref}`.replace(/[^a-zA-Z0-9_]/g, '_')
        const short = resource.ref.replace(/^skill-/, 'S:').replace(/^agent-/, 'A:')
        lines.push(`  ${rid}(["${short}"])`)
        lines.push(`  ${node.id} -.-> ${rid}`)
      }
    }
  }

  if (run) {
    lines.push('  classDef pending fill:#f5f5f5,stroke:#999')
    lines.push('  classDef ready fill:#e3f2fd,stroke:#1565c0')
    lines.push('  classDef running fill:#fff8e1,stroke:#f9a825')
    lines.push('  classDef completed fill:#e8f5e9,stroke:#2e7d32')
    lines.push('  classDef blocked fill:#ffebee,stroke:#c62828')
    lines.push('  classDef failed fill:#fce4ec,stroke:#ad1457')
    lines.push('  classDef skipped fill:#efebe9,stroke:#6d4c41')
    lines.push('  classDef cancelled fill:#eceff1,stroke:#546e7a')
    for (const node of definition.nodes) {
      if (!includeNode(node.id)) continue
      const status = run.nodes[node.id]?.status ?? 'pending'
      lines.push(`  class ${node.id} ${statusClass[status] ?? 'pending'}`)
    }
  }

  return `${lines.join('\n')}\n`
}

export function generateRunReport(definition, run) {
  const lines = [
    `# 工作流运行报告：${definition.title}`,
    '',
    `- 运行 ID：\`${run.runId}\``,
    `- 工作流：\`${run.workflowId}@${run.workflowVersion}\``,
    `- 模式：${run.mode}`,
    `- 状态：**${run.status}**`,
    `- 创建：${run.createdAt}`,
    `- 更新：${run.updatedAt ?? run.createdAt}`,
    `- 输入摘要：${run.inputSummary || '（无）'}`,
    '',
    '## 当前可执行节点',
    '',
    ...(run.activeNodeIds?.length ? run.activeNodeIds.map((id) => `- \`${id}\``) : ['- （无）']),
    '',
    '## 节点状态',
    '',
    '| 节点 | 状态 | 尝试 | 阻塞/错误 |',
    '| --- | --- | --- | --- |',
    ...definition.nodes.map((node) => {
      const state = run.nodes[node.id] ?? {}
      return `| \`${node.id}\` ${node.title} | ${state.status ?? 'missing'} | ${state.attempts ?? 0} | ${state.blockReason || state.error || ''} |`
    }),
    '',
    '## 资源调用',
    '',
  ]

  if (!(run.invocations ?? []).length) {
    lines.push('- （尚无调用记录）', '')
  } else {
    lines.push('| 调用 | 节点 | 资源 | 状态 | 采用 | 主流程已读 |', '| --- | --- | --- | --- | --- | --- |')
    for (const item of run.invocations) {
      lines.push(`| \`${item.invocationId}\` | \`${item.nodeId}\` | ${item.kind}:\`${item.ref}\` | ${item.status} | ${item.adoption ?? '-'} | ${item.mainRead ? 'yes' : 'no'} |`)
    }
    lines.push('')
  }

  lines.push('## 完成门禁', '')
  lines.push(`- passed=${run.completionGate?.passed ?? false}`)
  for (const check of run.completionGate?.checks ?? []) {
    lines.push(`- ${check.ok ? '✅' : '❌'} ${check.id}：${check.detail}`)
  }
  lines.push('', '## 运行图', '', '```mermaid', generateMermaid(definition, { view: 'run', run }).trim(), '```', '')
  return `${lines.join('\n')}\n`
}

export function navigationProjection(definition) {
  const nav = definition.navigation ?? {}
  const capabilityIds = new Set(nav.capabilityIds ?? [])
  for (const node of definition.nodes) {
    for (const resource of node.resources ?? []) {
      if (resource.requirement !== 'required') continue
      if (resource.kind === 'skill' || resource.kind === 'agent' || resource.kind === 'command') {
        capabilityIds.add(resource.ref)
      }
    }
  }
  const steps = definition.nodes
    .filter((node) => (definition.visualization?.simpleNodeIds ?? []).includes(node.id) || node.criticalPath !== false)
    .map((node) => node.title)
  return {
    id: `workflow-${definition.id.replace(/^wf-/, '')}`,
    title: definition.title,
    domain: definition.domain,
    status: definition.status === 'active' ? 'available' : definition.status,
    summary: nav.summary ?? definition.purpose,
    userCanSay: nav.userCanSay ?? [],
    userMustProvide: nav.userMustProvide ?? [],
    steps: steps.length ? steps : definition.nodes.map((node) => node.title),
    approvalPoints: nav.approvalPoints ?? [],
    completionEvidence: nav.completionEvidence ?? definition.outputs.map((item) => item.description),
    capabilityIds: [...capabilityIds],
    sourceRefs: [`project-workflows/definitions/${definition.id}.v${definition.version}.json`],
    executableWorkflowId: definition.id,
    executableWorkflowVersion: definition.version,
  }
}
