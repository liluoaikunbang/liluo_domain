import { access, readFile, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const exists = (file) => access(file, constants.F_OK).then(() => true, () => false)
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

export function toPosix(value = '') {
  return String(value).replaceAll('\\', '/').replace(/^\.\//, '')
}

export function globToRegExp(pattern) {
  const posix = toPosix(pattern)
  let expression = '^'
  for (let index = 0; index < posix.length; index += 1) {
    const character = posix[index]
    if (character === '*') {
      if (posix[index + 1] === '*') {
        expression += '.*'
        index += 1
        if (posix[index + 1] === '/') index += 1
      } else {
        expression += '[^/]*'
      }
    } else if ('\\^$+?.()|{}[]'.includes(character)) {
      expression += `\\${character}`
    } else {
      expression += character
    }
  }
  return new RegExp(`${expression}$`, 'i')
}

export function matchGlob(filePath, pattern) {
  return globToRegExp(pattern).test(toPosix(filePath))
}

function specificity(pattern) {
  const posix = toPosix(pattern)
  const wildcards = (posix.match(/\*\*/g) || []).length * 2 + (posix.match(/\*/g) || []).length
  return posix.length * 10 - wildcards * 50
}

export function classifyPath(filePath, classes) {
  const posix = toPosix(filePath)
  const hits = []
  for (const entry of classes) {
    for (const pattern of entry.globs) {
      if (matchGlob(posix, pattern)) {
        hits.push({ entry, pattern, score: specificity(pattern) })
      }
    }
  }
  if (!hits.length) return null
  hits.sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id))
  const best = hits[0]
  const ties = hits.filter((hit) => hit.score === best.score && hit.entry.id !== best.entry.id)
  return { class: best.entry, pattern: best.pattern, ambiguousWith: ties.map((hit) => hit.entry.id) }
}

function anyPattern(text, patterns = []) {
  return patterns.some((pattern) => new RegExp(pattern, 'i').test(text))
}

function normalizePaths(pathsInput = []) {
  if (Array.isArray(pathsInput)) return pathsInput.flatMap((value) => String(value).split(/[,\n]/)).map((value) => toPosix(value.trim())).filter(Boolean)
  return String(pathsInput || '').split(/[,\n]/).map((value) => toPosix(value.trim())).filter(Boolean)
}

function classifyTask(task = '', paths = []) {
  const text = `${task} ${paths.join(' ')}`
  if (/错别字|错字|格式|机械/.test(task) && !/正史|架构|治理|缺口|验证|审计/.test(task)) return 'mechanical-edit'
  if (/外部|题材知识|external-knowledge/.test(text)) return 'external-reference'
  if (/架构|Pinia|数据流|模块边界/.test(text)) return 'architecture'
  if (/缺口|覆盖不足|未利用/.test(text)) return 'story-gap'
  if (/长期规则|设计记忆|治理|ADR/.test(text)) return 'governance'
  if (/故事|大纲|段落|对话|正史|时间线/.test(text)) return 'story-authoring'
  return 'general'
}

function skillSuggestions(taskClass, task = '') {
  const skills = []
  if (taskClass === 'story-authoring' || /故事|大纲|节点|段落/.test(task)) {
    skills.push('liluo-story-outline-authoring')
    if (/正式|阅读|段落|文案|表达/.test(task)) skills.push('liluo-natural-expression')
  }
  if (taskClass === 'story-gap') skills.push('liluo-story-gap-discovery')
  if (taskClass === 'architecture') skills.push('liluo-phaser-map-event-integration')
  if (taskClass === 'governance') skills.push('liluo-project-governance-memory')
  if (taskClass === 'external-reference') skills.push('liluo-external-fiction-knowledge')
  if (/创作组|沉浸|成员|委派|陪伴/.test(task)) skills.push('liluo-creative-team-presence')
  return [...new Set(skills)]
}

export async function loadPolicies(root) {
  const contextPolicy = await readJson(path.join(root, 'project-navigation/context-policy.json'))
  const teamRouting = await readJson(path.join(root, 'project-navigation/team-routing.json'))
  const roster = await readJson(path.join(root, teamRouting.roster))
  return { contextPolicy, teamRouting, roster }
}

export function routeTeam({ task = '', paths = [], teamRouting, roster }) {
  const reasons = []
  const warnings = []
  const text = String(task)
  const pathList = normalizePaths(paths)
  const overrides = teamRouting.userOverrides ?? {}
  const matchedSignals = []

  for (const signal of teamRouting.signals) {
    if (signal.excludeTaskAny && anyPattern(text, signal.excludeTaskAny)) continue
    const taskHit = anyPattern(text, signal.match.taskAny || [])
    const pathHit = pathList.some((filePath) => (signal.match.pathAny || []).some((pattern) => matchGlob(filePath, pattern)))
    if (!taskHit && !pathHit) continue
    matchedSignals.push({ ...signal, taskHit, pathHit })
  }

  const byGroup = new Map()
  for (const signal of matchedSignals) {
    const current = byGroup.get(signal.riskGroup)
    if (!current || signal.score > current.score) byGroup.set(signal.riskGroup, signal)
  }
  const groupSignals = [...byGroup.values()]
  let score = groupSignals.reduce((sum, signal) => sum + signal.score, 0)
  for (const signal of groupSignals) {
    reasons.push(`signal:${signal.id}=${signal.score}(${signal.riskGroup})`)
  }

  const mechanicalOnly = groupSignals.length === 1 && groupSignals[0].riskGroup === 'mechanical'
  const forceCouncil = (overrides.councilPhrases || []).some((phrase) => text.includes(phrase))
  let expressionMode = 'immersive'
  if ((overrides.neutralPhrases || []).some((phrase) => new RegExp(phrase, 'i').test(text))) {
    expressionMode = 'neutral'
    reasons.push('user-override:neutral-expression')
  }

  let tier = teamRouting.defaults.tier
  if (mechanicalOnly && teamRouting.aggregation.mechanicalOnlyForcesSolo) {
    tier = 'solo'
    score = 0
    reasons.push('mechanical-only-forces-solo')
  } else if (forceCouncil) {
    tier = 'council'
    score = Math.max(score, 4)
    reasons.push('user-override:council')
  } else {
    for (const entry of teamRouting.tiers) {
      const max = entry.maxScore
      if (score >= entry.minScore && (max === null || score <= max)) {
        tier = entry.id
        break
      }
    }
  }

  const tierConfig = teamRouting.tiers.find((entry) => entry.id === tier)
  const activeAgents = new Set(
    (roster.members || [])
      .filter((member) => member.status === 'active' && member.technicalAgent)
      .map((member) => member.technicalAgent)
  )
  const plannedAgents = new Set(
    (roster.members || [])
      .filter((member) => member.status === 'planned' && member.technicalAgent)
      .map((member) => member.technicalAgent)
  )

  const candidateAgents = []
  for (const signal of groupSignals) {
    for (const agent of signal.preferredAgents || []) {
      if (plannedAgents.has(agent)) {
        warnings.push(`planned-agent-not-routable:${agent}`)
        continue
      }
      if (!activeAgents.has(agent)) continue
      if (!candidateAgents.includes(agent)) candidateAgents.push(agent)
    }
  }
  if (tier === 'council' && candidateAgents.length < 2) {
    for (const agent of teamRouting.agentPriority) {
      if (plannedAgents.has(agent) || !activeAgents.has(agent) || candidateAgents.includes(agent)) continue
      candidateAgents.push(agent)
      if (candidateAgents.length >= 2) break
    }
  }

  candidateAgents.sort((left, right) => {
    const leftIndex = teamRouting.agentPriority.indexOf(left)
    const rightIndex = teamRouting.agentPriority.indexOf(right)
    return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex)
  })

  const maxAgents = tierConfig?.maxAgents ?? 0
  const selectedAgents = candidateAgents.slice(0, maxAgents).map((technicalAgent) => {
    const member = roster.members.find((entry) => entry.technicalAgent === technicalAgent)
    return {
      technicalAgent,
      memberId: member?.memberId ?? null,
      name: member?.name ?? null,
      literaryName: member?.literaryName ?? null,
      dutyTitle: member?.dutyTitle ?? null,
      soulPath: member?.soulPath ?? null
    }
  })

  if (selectedAgents.length) {
    reasons.push(`selected:${selectedAgents.map((entry) => entry.name || entry.technicalAgent).join(',')}`)
  }

  return {
    teamTier: tier,
    score,
    selectedAgents,
    matchedSignals: groupSignals.map((signal) => signal.id),
    expressionMode,
    display: teamRouting.display[tier],
    reasons,
    warnings,
    presencePolicy: roster.presencePolicy ?? null
  }
}

export function resolveContext({ task = '', paths = [], contextPolicy, teamRouting, roster }) {
  const pathList = normalizePaths(paths)
  const taskClass = classifyTask(task, pathList)
  const team = routeTeam({ task, paths: pathList, teamRouting, roster })
  const skills = skillSuggestions(taskClass, task).slice(0, contextPolicy.budget.maxSkills)
  const L0 = contextPolicy.classes.filter((entry) => entry.loadMode === 'always').flatMap((entry) => entry.globs)
  const L1 = []
  const L2 = []
  const L3Queries = []
  const L4Excluded = []
  const reasons = [...team.reasons]
  const warnings = [...team.warnings]

  for (const filePath of pathList) {
    const classified = classifyPath(filePath, contextPolicy.classes)
    if (!classified) {
      warnings.push(`unclassified-path:${filePath}`)
      continue
    }
    if (classified.ambiguousWith.length) warnings.push(`ambiguous-class:${filePath}:${classified.class.id}|${classified.ambiguousWith.join('|')}`)
    const { layer, loadMode, id } = classified.class
    if (loadMode === 'always') {
      if (!L0.includes(filePath)) L0.push(filePath)
      continue
    }
    if (layer === 'L4' || loadMode === 'never-default') {
      L4Excluded.push({ path: filePath, classId: id, reason: 'never-default' })
      reasons.push(`exclude-L4:${filePath}`)
      continue
    }
    if (layer === 'L3' || loadMode === 'query-only' || loadMode === 'query-or-small-direct') {
      if (loadMode === 'query-only' || id === 'external-knowledge' || id === 'project-index') {
        L3Queries.push({
          path: filePath,
          classId: id,
          queryHint: id === 'external-knowledge'
            ? 'npm run external:knowledge:query -- "<topic>"'
            : id === 'project-index'
              ? 'npm run project:index:query -- "<topic>"'
              : 'npm run project:navigation:list'
        })
        reasons.push(`query-only:${filePath}`)
      } else {
        L3Queries.push({ path: filePath, classId: id, queryHint: 'small-direct-or-query' })
      }
      continue
    }
    if (layer === 'L1') {
      if (loadMode === 'runtime-only') {
        reasons.push(`runtime-only-adapter:${filePath}`)
        continue
      }
      L1.push(filePath)
      continue
    }
    if (layer === 'L2') {
      if (loadMode === 'selected-agent-only') {
        const allowed = new Set(team.selectedAgents.flatMap((agent) => [agent.soulPath, `docs/智能体说明/${agent.technicalAgent}.md`].filter(Boolean)))
        if ([...allowed].some((allowedPath) => matchGlob(filePath, allowedPath) || toPosix(filePath) === toPosix(allowedPath))) {
          L2.push(filePath)
        } else {
          warnings.push(`soul-card-not-selected:${filePath}`)
        }
        continue
      }
      L2.push(filePath)
    }
  }

  for (const skill of skills) {
    L2.push(`.agents/skills/liluo-project/${skill}/SKILL.md`)
  }
  if (team.teamTier !== 'solo') {
    L2.push('project-navigation/team-routing.json')
    for (const agent of team.selectedAgents) {
      if (agent.soulPath) L2.push(agent.soulPath)
      L2.push(`docs/智能体说明/${agent.technicalAgent}.md`)
    }
  }

  const unique = (items) => [...new Set(items.map(toPosix))]
  const trimmedL2 = unique(L2).slice(0, contextPolicy.budget.maxEvidenceFiles)
  if (unique(L2).length > trimmedL2.length) warnings.push('budget-trimmed:L2')

  return {
    taskClass,
    context: {
      L0: unique(L0).slice(0, Math.max(contextPolicy.budget.maxAlwaysFiles, 2)),
      L1: unique(L1).slice(0, contextPolicy.budget.maxPathAttachedFiles),
      L2: trimmedL2,
      L3Queries,
      L4Excluded
    },
    skills,
    teamTier: team.teamTier,
    selectedAgents: team.selectedAgents,
    expressionMode: team.expressionMode,
    display: team.display,
    reasons: unique(reasons),
    budget: contextPolicy.budget,
    warnings: unique(warnings),
    presencePolicy: team.presencePolicy
  }
}

async function walk(root, directory, predicate) {
  const target = path.join(root, directory)
  if (!await exists(target)) return []
  const entries = await readdir(target, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => {
    const child = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(root, child, predicate)
    return predicate(entry.name, child) ? [toPosix(child)] : []
  }))).flat()
}

function extractLongParagraphs(text, minLength = 180) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter((block) => block.length >= minLength)
}

export async function auditContextPolicies(root) {
  const errors = []
  const warnings = []
  const { contextPolicy, teamRouting, roster } = await loadPolicies(root)
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  const contextSchema = await readJson(path.join(root, 'schemas/workflows/context-policy.schema.json'))
  const routingSchema = await readJson(path.join(root, 'schemas/workflows/team-routing.schema.json'))
  const validateContext = ajv.compile(contextSchema)
  const validateRouting = ajv.compile(routingSchema)
  if (!validateContext(contextPolicy)) {
    for (const issue of validateContext.errors || []) errors.push(`context-policy-schema:${issue.instancePath || '/'} ${issue.message}`)
  }
  if (!validateRouting(teamRouting)) {
    for (const issue of validateRouting.errors || []) errors.push(`team-routing-schema:${issue.instancePath || '/'} ${issue.message}`)
  }

  const knownLayers = new Set(['L0', 'L1', 'L2', 'L3', 'L4'])
  const knownLoad = new Set(contextSchema.$defs.classEntry.properties.loadMode.enum)
  const knownEdit = new Set(contextSchema.$defs.classEntry.properties.editMode.enum)
  const classIds = new Set()
  for (const entry of contextPolicy.classes) {
    if (classIds.has(entry.id)) errors.push(`duplicate-class:${entry.id}`)
    classIds.add(entry.id)
    if (!knownLayers.has(entry.layer)) errors.push(`unknown-layer:${entry.id}`)
    if (!knownLoad.has(entry.loadMode)) errors.push(`unknown-loadMode:${entry.id}`)
    if (!knownEdit.has(entry.editMode)) errors.push(`unknown-editMode:${entry.id}`)
    if (['project-index', 'external-knowledge', 'history'].includes(entry.id) && (entry.loadMode === 'always' || entry.loadMode === 'path-or-explicit')) {
      errors.push(`forbidden-default-load:${entry.id}`)
    }
    if ((entry.role === 'generated-index' || entry.role === 'generated-output' || entry.role === 'pack-metadata') && entry.editMode !== 'generator-only') {
      errors.push(`generated-must-be-generator-only:${entry.id}`)
    }
    for (const pattern of entry.globs) {
      if (!pattern.includes('*')) {
        const absolute = path.join(root, pattern)
        if (!await exists(absolute)) warnings.push(`missing-literal-path:${pattern}`)
      }
    }
  }

  const alwaysClasses = contextPolicy.classes.filter((entry) => entry.loadMode === 'always')
  const alwaysHasAgents = alwaysClasses.some((entry) => entry.globs.includes('AGENTS.md'))
  if (!alwaysHasAgents) errors.push('AGENTS.md-must-be-unique-always-entry')
  if (alwaysClasses.filter((entry) => entry.globs.includes('AGENTS.md')).length !== 1) errors.push('AGENTS.md-always-class-count')

  for (const key of Object.values(contextPolicy.budget)) {
    if (!Number.isInteger(key) || key < 1) errors.push('budget-must-be-positive-integer')
  }

  if (roster.defaultPersonaMode !== undefined) errors.push('legacy-defaultPersonaMode-present')
  if (!roster.presencePolicy) errors.push('missing-presencePolicy')
  else {
    if (roster.presencePolicy.personaMode !== 'immersive') errors.push('default-personaMode-must-be-immersive')
    if (roster.presencePolicy.displayDensity !== 'compact') errors.push('default-displayDensity-must-be-compact')
    if (roster.presencePolicy.participationPolicy !== 'actual-call-only') errors.push('participationPolicy-must-be-actual-call-only')
    if (!roster.presencePolicy.formalViewRequiresInvocation) errors.push('formalViewRequiresInvocation-must-be-true')
  }
  if (roster.schemaVersion !== 3) errors.push('roster-schemaVersion-must-be-3')
  for (const member of roster.members || []) {
    if (Object.hasOwn(member, 'personaMode')) errors.push(`member-personaMode-forbidden:${member.memberId}`)
    if (member.status === 'planned' && teamRouting.signals.some((signal) => (signal.preferredAgents || []).includes(member.technicalAgent))) {
      // planned agents may exist in roster but must not be preferred as routable defaults without active status; warn if explicitly preferred
      warnings.push(`planned-member-listed-in-signal:${member.technicalAgent}`)
    }
  }

  const cursorRulesDir = path.join(root, '.cursor/rules')
  const codexDir = path.join(root, '.codex')
  if (!await exists(cursorRulesDir)) warnings.push('optional-missing:.cursor/rules')
  else {
    const ruleFiles = (await readdir(cursorRulesDir)).filter((name) => name.endsWith('.mdc'))
    let alwaysCount = 0
    for (const name of ruleFiles) {
      const text = await readFile(path.join(cursorRulesDir, name), 'utf8')
      if (/^alwaysApply:\s*true\s*$/m.test(text)) alwaysCount += 1
    }
    if (alwaysCount > 1) errors.push(`cursor-always-rules:${alwaysCount}`)
    if (alwaysCount === 0) warnings.push('cursor-always-rules:0')
  }
  if (!await exists(codexDir)) warnings.push('optional-missing:.codex')
  if (await exists(cursorRulesDir) && await exists(codexDir)) {
    // both present — required coexistence
  } else if (await exists(path.join(root, '.cursor')) && await exists(codexDir)) {
    // ok
  }

  const adapterDirs = ['.cursor', '.codex']
  for (const adapter of adapterDirs) {
    const adapterRoot = path.join(root, adapter)
    if (!await exists(adapterRoot)) continue
    const files = await walk(root, adapter, (name) => /\.(mdc|md|toml|json)$/i.test(name))
    const authoritySamples = [
      await readFile(path.join(root, 'AGENTS.md'), 'utf8').catch(() => ''),
      await readFile(path.join(root, 'docs/系统说明/AI协同文件与规则分层.md'), 'utf8').catch(() => '')
    ]
    const authorityParagraphs = authoritySamples.flatMap((text) => extractLongParagraphs(text, 220))
    for (const file of files) {
      const text = await readFile(path.join(root, file), 'utf8')
      const adapterParagraphs = extractLongParagraphs(text, 220)
      for (const paragraph of adapterParagraphs) {
        if (authorityParagraphs.some((authority) => authority.includes(paragraph) || paragraph.includes(authority))) {
          errors.push(`adapter-copies-shared-authority:${file}`)
        }
      }
      if (contextPolicy.classes.some((entry) => entry.role === 'tool-adapter' && entry.globs.some((pattern) => matchGlob(file, pattern)))) {
        // registered as tool adapter — ok
      }
    }
  }

  const toolAdapterClass = contextPolicy.classes.find((entry) => entry.id === 'tool-adapters')
  if (!toolAdapterClass || toolAdapterClass.role !== 'tool-adapter' || toolAdapterClass.editMode !== 'tool-specific') {
    errors.push('tool-adapters-must-not-be-shared-authority')
  }

  // Conflict scans in key docs
  const docsToScan = [
    'docs/系统说明/璃落创作组人格与项目陪伴系统.md',
    '.agents/skills/liluo-project/liluo-creative-team-presence/references/token-budget.md',
    '.agents/skills/liluo-project/liluo-creative-team-presence/SKILL.md',
    'docs/设计记忆/项目组灵魂/表达模式.md'
  ]
  for (const relative of docsToScan) {
    const absolute = path.join(root, relative)
    if (!await exists(absolute)) continue
    const text = await readFile(absolute, 'utf8')
    if (/默认\s*`?subtle`?|Default to `subtle`|默认 subtle/i.test(text)) errors.push(`doc-default-subtle:${relative}`)
    if (/(?:^|[^\u4e00-\u9fff])immersive[^\n]{0,40}(?:默认)?多人对话|(?:把|将)immersive[^\n]{0,20}等同[^\n]{0,20}多人对话|默认多人对话/.test(text)
      && !/不等于[^\n]{0,12}多人对话|不是[^\n]{0,12}多人对话|≠\s*多人对话/.test(text)) {
      errors.push(`doc-immersive-as-multi-dialogue:${relative}`)
    }
    if (/未调用[^\n]{0,30}正式观点|未调用成员可以形成正式/.test(text)) errors.push(`doc-uncalled-formal-view:${relative}`)
  }

  for (const member of roster.members || []) {
    if (member.status !== 'planned') continue
    if (teamRouting.agentPriority.includes(member.technicalAgent) && member.technicalAgent) {
      // allowed in priority list only if resolve filters by active; still warn if signals prefer them
    }
  }

  if (!(await exists(path.join(root, teamRouting.roster)))) errors.push(`missing-roster:${teamRouting.roster}`)

  return { ok: errors.length === 0, errors, warnings, counts: { classes: contextPolicy.classes.length, signals: teamRouting.signals.length } }
}
