(() => {
  const data = window.__WORKFLOW_VIEWER_DATA__
  if (!data) {
    document.getElementById('panelBody').textContent = '缺少 data.js。请先运行 npm run project:workflow:viewer:build'
    return
  }

  const svg = document.getElementById('graph')
  const panelBody = document.getElementById('panelBody')
  const modeSelect = document.getElementById('modeSelect')
  const workflowSelect = document.getElementById('workflowSelect')
  const detailSelect = document.getElementById('detailSelect')
  const runSelect = document.getElementById('runSelect')
  const generatedAt = document.getElementById('generatedAt')

  generatedAt.textContent = `生成于 ${data.generatedAt || ''}`

  const state = {
    mode: 'flow',
    workflowId: data.workflows[0]?.id || '',
    detail: 'detail',
    runId: '',
    transform: { x: 40, y: 40, k: 1 },
    selectedId: null,
    draggingCanvas: false,
    lastPointer: null,
  }

  for (const workflow of data.workflows) {
    const option = document.createElement('option')
    option.value = workflow.id
    option.textContent = `${workflow.title} (${workflow.id})`
    workflowSelect.appendChild(option)
  }
  workflowSelect.value = state.workflowId

  function refreshRunOptions() {
    runSelect.innerHTML = '<option value="">（仅定义）</option>'
    const runs = data.runs.filter((run) => run.workflowId === state.workflowId)
    for (const run of runs) {
      const option = document.createElement('option')
      option.value = run.runId
      option.textContent = `${run.runId} · ${run.status}`
      runSelect.appendChild(option)
    }
    if (![...runSelect.options].some((item) => item.value === state.runId)) state.runId = ''
    runSelect.value = state.runId
  }

  function currentWorkflow() {
    return data.workflows.find((item) => item.id === state.workflowId)
  }

  function currentRun() {
    return data.runs.find((item) => item.runId === state.runId) || null
  }

  function wrapText(text, max = 16) {
    const chars = [...String(text || '')]
    if (chars.length <= max) return [String(text || '')]
    const lines = []
    for (let index = 0; index < chars.length; index += max) {
      lines.push(chars.slice(index, index + max).join(''))
      if (lines.length >= 2) {
        if (index + max < chars.length) lines[1] = `${lines[1].slice(0, max - 1)}…`
        break
      }
    }
    return lines
  }

  function ensureDefs() {
    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      defs.innerHTML = `
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#5b6575"></path>
        </marker>`
      svg.appendChild(defs)
    }
  }

  function clearGraph() {
    ensureDefs()
    ;[...svg.querySelectorAll('g.scene')].forEach((node) => node.remove())
  }

  function applyTransform() {
    const scene = svg.querySelector('g.scene')
    if (!scene) return
    const { x, y, k } = state.transform
    scene.setAttribute('transform', `translate(${x},${y}) scale(${k})`)
  }

  function selectNode(id, payload) {
    state.selectedId = id
    svg.querySelectorAll('.node-card.selected').forEach((node) => node.classList.remove('selected'))
    const card = svg.querySelector(`[data-id="${CSS.escape(id)}"] .node-card`)
    if (card) card.classList.add('selected')
    renderPanel(payload)
  }

  function renderPanel(payload) {
    if (!payload) {
      panelBody.innerHTML = '<span class="muted">选择一个节点或资源。</span>'
      return
    }
    if (payload.kind === 'workflow') {
      panelBody.innerHTML = `
        <div><span class="badge workflow">workflow</span><strong>${escapeHtml(payload.title)}</strong></div>
        <p>${escapeHtml(payload.purpose || '')}</p>
        <h3>元数据</h3>
        <ul>
          <li>ID：<code>${escapeHtml(payload.id)}</code></li>
          <li>版本：<code>${escapeHtml(payload.version)}</code></li>
          <li>领域：${escapeHtml(payload.domain)}</li>
          <li>成熟度：${escapeHtml(payload.maturity)}</li>
          <li>维护 Skill：<code>${escapeHtml(payload.ownerSkill)}</code></li>
        </ul>
        <h3>节点数</h3>
        <p>${payload.nodes.length}</p>`
      return
    }
    if (payload.kind === 'resource') {
      panelBody.innerHTML = `
        <div><span class="badge ${escapeHtml(payload.resourceKind)}">${escapeHtml(payload.resourceKind)}</span><strong>${escapeHtml(payload.ref)}</strong></div>
        <h3>引用位置</h3>
        <ul>${payload.uses.map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join('')}</ul>
        <h3>出现于流程</h3>
        <ul>${payload.workflowIds.map((id) => `<li><code>${escapeHtml(id)}</code></li>`).join('')}</ul>`
      return
    }
    const status = payload.status ? `<span class="badge">${escapeHtml(payload.status)}</span>` : ''
    panelBody.innerHTML = `
      <div>${status}<strong>${escapeHtml(payload.title)}</strong></div>
      <p>${escapeHtml(payload.why || '')}</p>
      <h3>节点</h3>
      <ul>
        <li>ID：<code>${escapeHtml(payload.id)}</code></li>
        <li>类型：${escapeHtml(payload.type)}｜阶段：${escapeHtml(payload.stage)}</li>
        <li>责任：${escapeHtml(payload.actor)}｜风险：${escapeHtml(payload.risk)}</li>
      </ul>
      <h3>动作</h3>
      <ul>${(payload.actions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>（无）</li>'}</ul>
      <h3>资源</h3>
      <ul>${(payload.resources || []).map((item) => `<li><span class="badge ${escapeHtml(item.kind)}">${escapeHtml(item.kind)}</span><code>${escapeHtml(item.ref)}</code> · ${escapeHtml(item.requirement)}${item.selfExecutionAllowed === false ? ' · 禁止主 Agent 替代' : ''}</li>`).join('') || '<li>（无）</li>'}</ul>
      ${payload.run ? `<h3>本次运行</h3><ul>
        <li>状态：${escapeHtml(payload.run.status)}</li>
        <li>尝试：${escapeHtml(String(payload.run.attempts ?? 0))}</li>
        <li>阻塞：${escapeHtml(payload.run.blockReason || '无')}</li>
        <li>采用：${escapeHtml(payload.run.adoption || '-')}</li>
      </ul>` : ''}
      ${payload.invocations?.length ? `<h3>调用记录</h3><ul>${payload.invocations.map((item) => `<li><code>${escapeHtml(item.ref)}</code> · ${escapeHtml(item.status)} · 采用 ${escapeHtml(item.adoption || '-')}</li>`).join('')}</ul>` : ''}`
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  }

  function createScene() {
    const scene = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    scene.classList.add('scene')
    svg.appendChild(scene)
    return scene
  }

  function addNode(scene, spec) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.classList.add('graph-node', ...(spec.classNames || []))
    group.dataset.id = spec.id
    group.setAttribute('transform', `translate(${spec.x},${spec.y})`)

    const card = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    card.classList.add('node-card', ...(spec.status ? [`status-${spec.status}`] : []))
    if (spec.pulse) card.classList.add('pulse')
    card.setAttribute('width', String(spec.width))
    card.setAttribute('height', String(spec.height))
    card.setAttribute('x', String(-spec.width / 2))
    card.setAttribute('y', String(-spec.height / 2))
    group.appendChild(card)

    const lines = wrapText(spec.title, spec.maxChars || 14)
    lines.forEach((line, index) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.classList.add('node-title')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('y', String(-6 + index * 15 - (lines.length - 1) * 7))
      text.textContent = line
      group.appendChild(text)
    })

    if (spec.subtitle) {
      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      sub.classList.add('node-sub')
      sub.setAttribute('text-anchor', 'middle')
      sub.setAttribute('y', String(spec.height / 2 - 12))
      sub.textContent = spec.subtitle
      group.appendChild(sub)
    }

    group.addEventListener('click', (event) => {
      event.stopPropagation()
      selectNode(spec.id, spec.payload)
    })
    scene.appendChild(group)
    return { x: spec.x, y: spec.y, width: spec.width, height: spec.height }
  }

  function addEdge(scene, from, to, options = {}) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.classList.add('edge', ...(options.classNames || []))
    const startX = from.x
    const startY = from.y + from.height / 2
    const endX = to.x
    const endY = to.y - to.height / 2
    const midY = (startY + endY) / 2
    path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`)
    scene.appendChild(path)
    if (options.label) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.classList.add('edge-label')
      label.setAttribute('x', String((startX + endX) / 2 + 6))
      label.setAttribute('y', String(midY))
      label.textContent = options.label
      scene.appendChild(label)
    }
  }

  function layoutFlow() {
    clearGraph()
    const workflow = currentWorkflow()
    if (!workflow) return
    const run = currentRun()
    const scene = createScene()
    const simpleIds = new Set(workflow.visualization?.simpleNodeIds || workflow.nodes.map((node) => node.id))
    const nodes = state.detail === 'simple'
      ? workflow.nodes.filter((node) => simpleIds.has(node.id))
      : workflow.nodes
    const nodeIds = new Set(nodes.map((node) => node.id))

    const stages = []
    for (const node of nodes) {
      let stage = stages.find((item) => item.id === node.stage)
      if (!stage) {
        stage = { id: node.stage, nodes: [] }
        stages.push(stage)
      }
      stage.nodes.push(node)
    }

    const positions = new Map()
    const colWidth = 220
    const rowHeight = 120
    const stageGap = 70
    let offsetY = 40

    stages.forEach((stage) => {
      const width = Math.max(stage.nodes.length, 1) * colWidth + 40
      const height = 130
      const band = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      band.classList.add('stage-band')
      band.setAttribute('x', '20')
      band.setAttribute('y', String(offsetY))
      band.setAttribute('width', String(width))
      band.setAttribute('height', String(height))
      scene.appendChild(band)

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.classList.add('stage-label')
      label.setAttribute('x', '36')
      label.setAttribute('y', String(offsetY + 22))
      label.textContent = stage.id
      scene.appendChild(label)

      stage.nodes.forEach((node, index) => {
        const x = 120 + index * colWidth
        const y = offsetY + 78
        const status = run?.nodes?.[node.id]?.status
        const box = addNode(scene, {
          id: node.id,
          x,
          y,
          width: 180,
          height: 64,
          title: node.title,
          subtitle: status || node.type,
          status,
          pulse: status === 'ready' || status === 'running',
          payload: {
            ...node,
            status,
            run: run?.nodes?.[node.id],
            invocations: (run?.invocations || []).filter((item) => item.nodeId === node.id),
          },
        })
        positions.set(node.id, box)
      })
      offsetY += height + stageGap
    })

    if (state.detail === 'detail') {
      let resourceIndex = 0
      for (const node of nodes) {
        const origin = positions.get(node.id)
        if (!origin) continue
        const resources = (node.resources || []).filter((item) => item.requirement === 'required' && (item.kind === 'skill' || item.kind === 'agent' || item.kind === 'approval'))
        resources.forEach((resource, index) => {
          const id = `${node.id}::${resource.kind}::${resource.ref}`
          const x = origin.x + 210
          const y = origin.y + index * 56
          const box = addNode(scene, {
            id,
            x,
            y,
            width: 170,
            height: 46,
            title: resource.ref.replace(/^skill-/, '').replace(/^agent-/, ''),
            subtitle: resource.kind,
            classNames: ['resource-node', resource.kind],
            maxChars: 18,
            payload: {
              kind: 'resource',
              resourceKind: resource.kind,
              ref: resource.ref,
              uses: [`${workflow.id}:${node.id}`],
              workflowIds: [workflow.id],
            },
          })
          addEdge(scene, origin, box, { classNames: ['resource'] })
          resourceIndex += 1
        })
      }
      void resourceIndex
    }

    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue
      if (state.detail === 'simple' && edge.when !== 'success' && !edge.label) continue
      const from = positions.get(edge.from)
      const to = positions.get(edge.to)
      if (!from || !to) continue
      addEdge(scene, from, to, {
        label: edge.label || edge.when,
      })
    }

    applyTransform()
    renderPanel({
      kind: 'workflow',
      ...workflow,
    })
  }

  function layoutOverview() {
    clearGraph()
    const scene = createScene()
    const positions = new Map()
    const workflows = data.workflows
    const skills = data.overview.skills
    const agents = data.overview.agents

    workflows.forEach((workflow, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(workflows.length, 1) - Math.PI / 2
      const x = 420 + Math.cos(angle) * 180
      const y = 320 + Math.sin(angle) * 140
      const box = addNode(scene, {
        id: workflow.id,
        x,
        y,
        width: 190,
        height: 70,
        title: workflow.title,
        subtitle: workflow.id,
        classNames: ['workflow-node'],
        payload: { kind: 'workflow', ...workflow },
      })
      positions.set(workflow.id, box)
    })

    skills.forEach((skill, index) => {
      const x = 120
      const y = 80 + index * 70
      const box = addNode(scene, {
        id: skill.id,
        x,
        y,
        width: 170,
        height: 50,
        title: skill.id.replace(/^skill-/, ''),
        subtitle: 'skill',
        classNames: ['resource-node', 'skill'],
        maxChars: 18,
        payload: {
          kind: 'resource',
          resourceKind: 'skill',
          ref: skill.id,
          uses: [],
          workflowIds: skill.workflowIds,
        },
      })
      positions.set(skill.id, box)
      for (const workflowId of skill.workflowIds) {
        const target = positions.get(workflowId)
        if (target) addEdge(scene, box, target, { classNames: ['resource'] })
      }
    })

    agents.forEach((agent, index) => {
      const x = 760
      const y = 80 + index * 70
      const box = addNode(scene, {
        id: agent.id,
        x,
        y,
        width: 170,
        height: 50,
        title: agent.id.replace(/^agent-/, ''),
        subtitle: 'agent',
        classNames: ['resource-node', 'agent'],
        maxChars: 18,
        payload: {
          kind: 'resource',
          resourceKind: 'agent',
          ref: agent.id,
          uses: [],
          workflowIds: agent.workflowIds,
        },
      })
      positions.set(agent.id, box)
      for (const workflowId of agent.workflowIds) {
        const target = positions.get(workflowId)
        if (target) addEdge(scene, box, target, { classNames: ['resource'] })
      }
    })

    applyTransform()
    panelBody.innerHTML = `
      <div><span class="badge workflow">overview</span><strong>能力总览</strong></div>
      <p>左 Skill、中工作流、右 Agent。点击任意节点可查看引用关系；双击工作流可进入单流程图。</p>
      <ul>
        <li>工作流：${workflows.length}</li>
        <li>Skill 引用：${skills.length}</li>
        <li>Agent 引用：${agents.length}</li>
      </ul>`

    svg.querySelectorAll('.workflow-node').forEach((node) => {
      node.addEventListener('dblclick', () => {
        state.mode = 'flow'
        state.workflowId = node.dataset.id
        modeSelect.value = 'flow'
        workflowSelect.value = state.workflowId
        refreshRunOptions()
        updateControlVisibility()
        render()
      })
    })
  }

  function updateControlVisibility() {
    const flow = state.mode === 'flow'
    document.getElementById('workflowLabel').style.display = flow ? '' : 'none'
    document.getElementById('detailLabel').style.display = flow ? '' : 'none'
    document.getElementById('runLabel').style.display = flow ? '' : 'none'
  }

  function render() {
    if (state.mode === 'overview') layoutOverview()
    else layoutFlow()
  }

  function fit() {
    const scene = svg.querySelector('g.scene')
    if (!scene) return
    const box = scene.getBBox()
    const width = svg.clientWidth || 1200
    const height = svg.clientHeight || 800
    const padding = 48
    const scale = Math.min((width - padding * 2) / Math.max(box.width, 1), (height - padding * 2) / Math.max(box.height, 1), 1.4)
    state.transform.k = Math.max(0.35, scale)
    state.transform.x = (width - box.width * state.transform.k) / 2 - box.x * state.transform.k
    state.transform.y = (height - box.height * state.transform.k) / 2 - box.y * state.transform.k
    applyTransform()
  }

  modeSelect.addEventListener('change', () => {
    state.mode = modeSelect.value
    updateControlVisibility()
    render()
    fit()
  })
  workflowSelect.addEventListener('change', () => {
    state.workflowId = workflowSelect.value
    refreshRunOptions()
    render()
    fit()
  })
  detailSelect.addEventListener('change', () => {
    state.detail = detailSelect.value
    render()
  })
  runSelect.addEventListener('change', () => {
    state.runId = runSelect.value
    render()
  })
  document.getElementById('fitBtn').addEventListener('click', fit)
  document.getElementById('resetBtn').addEventListener('click', () => {
    state.transform = { x: 40, y: 40, k: 1 }
    applyTransform()
  })

  svg.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.graph-node')) return
    state.draggingCanvas = true
    state.lastPointer = { x: event.clientX, y: event.clientY }
    svg.classList.add('dragging')
    svg.setPointerCapture(event.pointerId)
  })
  svg.addEventListener('pointermove', (event) => {
    if (!state.draggingCanvas || !state.lastPointer) return
    const dx = event.clientX - state.lastPointer.x
    const dy = event.clientY - state.lastPointer.y
    state.transform.x += dx
    state.transform.y += dy
    state.lastPointer = { x: event.clientX, y: event.clientY }
    applyTransform()
  })
  const endDrag = (event) => {
    state.draggingCanvas = false
    state.lastPointer = null
    svg.classList.remove('dragging')
    if (event && svg.hasPointerCapture?.(event.pointerId)) svg.releasePointerCapture(event.pointerId)
  }
  svg.addEventListener('pointerup', endDrag)
  svg.addEventListener('pointercancel', endDrag)
  svg.addEventListener('wheel', (event) => {
    event.preventDefault()
    const rect = svg.getBoundingClientRect()
    const mx = event.clientX - rect.left
    const my = event.clientY - rect.top
    const factor = event.deltaY < 0 ? 1.1 : 0.9
    const next = Math.min(2.8, Math.max(0.25, state.transform.k * factor))
    const scale = next / state.transform.k
    state.transform.x = mx - (mx - state.transform.x) * scale
    state.transform.y = my - (my - state.transform.y) * scale
    state.transform.k = next
    applyTransform()
  }, { passive: false })

  refreshRunOptions()
  // Prefer example run if present
  const example = data.runs.find((run) => run.workflowId === state.workflowId)
  if (example) {
    state.runId = example.runId
    runSelect.value = example.runId
  }
  updateControlVisibility()
  render()
  requestAnimationFrame(fit)
})()
