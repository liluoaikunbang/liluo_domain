import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { auditContextPolicies, loadPolicies, resolveContext } from './lib/context-routing.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const now = () => new Date().toISOString()
const exists = (file) => access(file, constants.F_OK).then(() => true, () => false)
const readJson = async (file, fallback = null) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== null) return fallback
    throw error
  }
}
const stableId = (...values) => `${values.join('-').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')}-${createHash('sha1').update(values.join('\0')).digest('hex').slice(0, 10)}`
const sortById = (items) => [...items].sort((left, right) => left.id.localeCompare(right.id, 'en'))

async function walk(root, directory, predicate) {
  const target = path.join(root, directory)
  if (!await exists(target)) return []
  const entries = await readdir(target, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => {
    const child = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(root, child, predicate)
    return predicate(entry.name, child) ? [child] : []
  }))).flat()
}

function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  return Object.fromEntries(match[1].split(/\r?\n/).map((line) => line.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean).map(([, key, value]) => [key, value.trim().replace(/^['"]|['"]$/g, '')]))
}

function gapFromMissingItem(node, item) {
  const [category = '待办', subject = node.title, description = item] = item.split('｜')
  return { id: stableId('story-gap', node.key, category, subject), title: `${node.title}·${subject.replace(/^.*?·/, '')}`, domain: category === '玩法' ? 'gameplay' : category === '地图' ? 'map' : 'story', origin: 'story-missing-item', status: 'open', priority: 'untriaged', description, sourceRefs: [`story-key:${node.key}`, node.markdownPath], completionCriteria: [], nextAction: category === '玩法' ? '确认玩家活动后筛选可落地玩法候选。' : '围绕这一项进行一次聚焦确认或撰写。', relatedCapabilityIds: category === '玩法' ? ['skill-liluo-gameplay-loop-audit', 'skill-liluo-story-gap-discovery'] : ['skill-liluo-story-outline-authoring'], firstSeenAt: null, lastSeenAt: null, resolvedAt: null }
}

async function writeJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }

export async function scanNavigation(root = ROOT) {
  const nav = path.join(root, 'project-navigation'); await mkdir(nav, { recursive: true })
  const previous = new Map(((await readJson(path.join(nav, 'gaps.json'), { gaps: [] })).gaps ?? []).map((gap) => [gap.id, gap]))
  const capabilities = []
  for (const file of await walk(root, '.agents/skills', (name) => name === 'SKILL.md')) {
    const meta = frontmatter(await readFile(path.join(root, file), 'utf8')); if (!meta.name) continue
    capabilities.push({ id: `skill-${meta.name}`, kind: 'skill', title: meta.name, domain: meta.name.startsWith('liluo-') ? 'project' : 'general', status: 'available', summary: meta.description ?? '', sourceRefs: [file] })
  }
  for (const file of await walk(root, '.codex/agents', (name) => name.endsWith('.toml'))) {
    const text = await readFile(path.join(root, file), 'utf8'); const fallback = path.basename(file, '.toml'); const name = text.match(/^name\s*=\s*"(.+)"/m)?.[1] ?? fallback; const description = text.match(/^description\s*=\s*"(.+)"/m)?.[1] ?? ''
    capabilities.push({ id: `agent-${fallback.replaceAll('_', '-')}`, kind: 'agent', title: name, domain: 'project', status: 'available', summary: description, sourceRefs: [file] })
  }
  const packageJson = await readJson(path.join(root, 'package.json'))
  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) if (/^(project:|story:|game:|docs:|external:|external-skills:|data:contracts:|evals:|team:|writing:)/.test(name)) capabilities.push({ id: `command-${name.replaceAll(':', '-')}`, kind: 'command', title: `npm run ${name}`, domain: name.split(':')[0], status: 'available', summary: String(command), sourceRefs: ['package.json'] })
  const gaps = []
  for (const node of await readJson(path.join(root, 'project-index/story/missing-items.json'), [])) for (const item of node.missingItems ?? []) { const derived = gapFromMissingItem(node, item); const prior = previous.get(derived.id); gaps.push({ ...derived, ...prior, status: prior?.status === 'completed' && !prior.completionEvidence ? 'needs-review' : prior?.status ?? derived.status, lastSeenAt: now() }) }
  for (const gap of (await readJson(path.join(nav, 'manual-gaps.json'), { gaps: [] })).gaps ?? []) gaps.push({ ...gap, ...previous.get(gap.id), originRef: 'project-navigation/manual-gaps.json', derivedFrom: 'manual-gaps', lastSeenAt: now() })
  for (const [id, gap] of previous) if (!gaps.some((entry) => entry.id === id) && gap.origin === 'story-missing-item') gaps.push({ ...gap, status: gap.status === 'completed' ? 'completed' : 'needs-review', lastSeenAt: now() })
  const catalog = await readJson(path.join(root, 'src/game/data/gameplay_outline/catalog.json'), { entries: [] }); const gameplay = (catalog.entries ?? []).map((item) => ({ id: item.id, title: item.title, categoryId: item.categoryId, status: 'catalogued', sourceRefs: ['src/game/data/gameplay_outline/catalog.json'], storyRefs: [] }))
  const plotCatalog = await readJson(path.join(root, 'src/game/data/plot_outline/catalog.json'), { entries: [] })
  const plots = plotCatalog.entries ?? []
  const plotCounts = { total: plots.length, unused: plots.filter((entry) => entry.usageStatus === 'unused' || !entry.isUsed).length, partial: plots.filter((entry) => entry.usageStatus === 'partial').length, bondageUnused: plots.filter((entry) => entry.isBondagePlot && (entry.usageStatus === 'unused' || !entry.isUsed)).length }
  const workflows = [{ id: 'workflow-task-recommendation', title: '按时间与兴趣推荐下一步', domain: 'navigation', status: 'available', summary: '从未阻塞的真实缺口中推荐可完成任务。', userCanSay: ['我只有20分钟，今天能做什么？', '今天不想画地图，推荐一个能推进项目的任务。'], userMustProvide: ['可用时间、偏好或想避开的领域（可选）'], steps: ['筛选未阻塞缺口', '说明用户输入与完成影响', '返回一至三项任务或明确无可推荐项'], approvalPoints: [], completionEvidence: ['用户选择并推进其中一项任务'], capabilityIds: ['skill-liluo-project-capability-navigation'], sourceRefs: ['project-navigation/workflows.json'] }, { id: 'workflow-story-gap-to-outline', title: '从故事缺口到正式大纲', domain: 'story', status: 'available', summary: '先提出候选、取得批准，再写回故事来源。', userCanSay: ['分析这个节点还缺什么', '完善这个故事节点'], userMustProvide: ['目标节点或缺口'], steps: ['核验 missingItems', '提出候选', '用户批准', '写回并最小验证'], approvalPoints: ['候选转为正式故事前'], completionEvidence: ['来源 JSON/Markdown 与验证结果'], capabilityIds: ['skill-liluo-story-gap-discovery', 'skill-liluo-story-outline-authoring'], sourceRefs: ['docs/用户命令目录.md'] }, { id: 'workflow-story-to-playable', title: '从故事节点到可玩内容', domain: 'production', status: 'available', summary: '把已确认故事转为地图、事件、对话和验证范围。', userCanSay: ['把这个故事节点转成可玩计划', '实现这个节点的最小可玩版本'], userMustProvide: ['已确认的故事节点'], steps: ['核验故事', '选择生产模式', '产出计划或实现', '运行对应验证'], approvalPoints: ['新玩法关联或扩大制作范围前'], completionEvidence: ['正式数据/代码与验证'], capabilityIds: ['skill-liluo-story-to-playable-content'], sourceRefs: ['docs/用户命令目录.md'] }]
  workflows.push(
    { id: 'workflow-zhihu-fiction-ingest', title: '从知乎小说扩充外部 RAG', domain: 'knowledge', status: 'available', summary: '下载用户给出的知乎小说，隔离保存并建立可检索的非正式参考。', userCanSay: ['下载这个知乎小说链接并存入 RAG', '把这个知乎回答作为灵感来源收进外部小说素材'], userMustProvide: ['知乎文章、回答或专栏链接'], steps: ['检查知识库状态', '下载到 staging', '导入 external-fiction RAG', '检索验证'], approvalPoints: ['遇到登录或 Cookie 时'], completionEvidence: ['导入路径与可检索结果'], capabilityIds: ['skill-liluo-zhihu-novel-ingest'], sourceRefs: ['docs/用户命令目录.md'] },
    { id: 'workflow-bondage-rag-expansion', title: '用紧缚小说扩充紧缚元素 RAG', domain: 'knowledge', status: 'available', summary: '把用户有权提供的外部紧缚小说作为非正式参考，抽象检索紧缚元素与叙事机制。', userCanSay: ['把这篇紧缚小说收进紧缚元素 RAG', '从紧缚小说里找某种元素的抽象参考'], userMustProvide: ['可处理的来源链接或文件，以及希望检索的元素'], steps: ['确认来源与非正典边界', '导入或查询外部知识', '返回抽象卡与来源定位', '需要正式写入时再做原创重组'], approvalPoints: ['外部来源导入与任何正式内容采用前'], completionEvidence: ['来源状态与可检索抽象卡'], capabilityIds: ['skill-liluo-external-fiction-knowledge'], sourceRefs: ['docs/用户命令目录.md'] },
    { id: 'workflow-unused-plot-audit', title: '盘点未应用情节库', domain: 'story', status: 'available', summary: '筛出未使用或仅部分使用的情节，按当前世界、人物、地点和玩家流程给出适配候选。', userCanSay: ['列出情节库中还没应用过的情节', '给这个节点找几个未用情节库候选'], userMustProvide: ['目标世界、节点或筛选偏好（可选）'], steps: ['读取情节库 usageStatus', '核验目标节点的已确认事实', '筛出真实匹配条目', '展示可审批选项'], approvalPoints: ['将候选写入大纲前'], completionEvidence: ['用户选择或明确暂不采用'], capabilityIds: ['skill-liluo-story-gap-discovery', 'skill-liluo-story-outline-authoring'], sourceRefs: ['src/game/data/plot_outline/catalog.json'] },
    { id: 'workflow-plot-placement-interview', title: '从情节库安置并访谈', domain: 'story', status: 'available', summary: '从情节库抽取未用或指定情节，按世界偏向对照大纲建议主线/支线落点，批准后再聚焦提问并写回。', userCanSay: ['随机抽一个未用情节，看适合加到哪', '把 plot-xxx 对照大纲，建议主线还是支线，再问我', '按都市偏向找一个未用情节安置并访谈'], userMustProvide: ['指定情节、世界偏向或随机偏好（可选）'], steps: ['选取情节条目', '按世界偏向提出落点', '用户批准落点', '聚焦访谈', '写回大纲并更新 usedBy'], approvalPoints: ['落点写入与访谈开始前'], completionEvidence: ['批准落点、访谈写回与情节引用同步'], capabilityIds: ['skill-liluo-plot-placement-interview', 'skill-liluo-story-outline-authoring'], sourceRefs: ['src/game/data/plot_outline/catalog.json', 'docs/系统说明/情节安置提问模板.md'] },
    { id: 'workflow-plot-to-outline', title: '把情节候选补充进大纲', domain: 'story', status: 'available', summary: '用户确认某个情节候选后，写入最贴近的既有节点并同步情节库使用状态。', userCanSay: ['把 plot-xxx 作为候选给这个节点看看', '采用这个情节补充到大纲'], userMustProvide: ['目标节点与明确采用/调整决定'], steps: ['核验候选与目标适配', '用户批准', '同步故事 JSON/Markdown', '更新 plot usedBy 与 usageStatus', '最小验证'], approvalPoints: ['必须先明确采用'], completionEvidence: ['故事来源与情节库引用同步'], capabilityIds: ['skill-liluo-story-outline-authoring'], sourceRefs: ['src/game/data/plot_outline/catalog.json'] },
    { id: 'workflow-formal-prose-pipeline', title: '开放权重正式正文写作', domain: 'writing', status: 'available', summary: '按写作合同调用 DSR1/Qwen3 生成工作区候选，经自然表达检查与用户批准后再写入正式内容。', userCanSay: ['用写作模型写正式正文候选', 'DSR1 和 Qwen3 对照这段', '检查写作模型 API', '归档黄金正文或修改对照'], userMustProvide: ['场景事实或写作合同；live 时需本地 .env.writing.local'], steps: ['核验正史', '填写合同', '显式选模型或对照', '工作区候选', '自然表达检查', '用户批准', '故事 Skill 写入并同步黄金资产'], approvalPoints: ['写入正式内容前', 'live 调用前'], completionEvidence: ['工作区 run manifest 与用户批准记录'], capabilityIds: ['skill-liluo-formal-prose-pipeline', 'skill-liluo-natural-expression'], sourceRefs: ['docs/系统说明/开放权重双模型写作管线.md', 'project-navigation/writing-models.json'] }
  )
  // Merge machine-readable executable workflows (authoritative under project-workflows/).
  try {
    const { loadAllDefinitions } = await import('../project-workflows/lib/registry.mjs')
    const { navigationProjection } = await import('../project-workflows/lib/generate-docs.mjs')
    const existingIds = new Set(workflows.map((item) => item.id))
    for (const { definition } of await loadAllDefinitions(root)) {
      if (definition.status !== 'active') continue
      const item = navigationProjection(definition)
      if (existingIds.has(item.id)) {
        const index = workflows.findIndex((entry) => entry.id === item.id)
        workflows[index] = { ...workflows[index], ...item, status: item.status ?? workflows[index].status }
      } else {
        workflows.push(item)
        existingIds.add(item.id)
      }
    }
  } catch {
    // Executable workflow projection is optional during bootstrap.
  }
  const sources = [
    { id: 'source-skills', type: 'repository-file', title: '项目 Skills', status: 'current', location: '.agents/skills/', checkedAt: now() },
    { id: 'source-agents', type: 'repository-file', title: '项目 Agents', status: 'current', location: '.codex/agents/', checkedAt: now() },
    { id: 'source-story-missing-items', type: 'generated-index', title: '故事缺口派生索引', status: 'current', location: 'project-index/story/missing-items.json', checkedAt: now() },
    { id: 'source-gameplay-catalog', type: 'repository-file', title: '玩法目录', status: 'current', location: 'src/game/data/gameplay_outline/catalog.json', checkedAt: now() },
    { id: 'source-plot-catalog', type: 'repository-file', title: '情节库', status: 'current', location: 'src/game/data/plot_outline/catalog.json', checkedAt: now() },
    { id: 'source-executable-workflows', type: 'repository-file', title: '可执行工作流定义', status: 'current', location: 'project-workflows/definitions/', checkedAt: now() },
    { id: 'source-context-policy', type: 'repository-file', title: '上下文装载策略', status: 'current', location: 'project-navigation/context-policy.json', checkedAt: now() },
    { id: 'source-team-routing', type: 'repository-file', title: '创作组路由策略', status: 'current', location: 'project-navigation/team-routing.json', checkedAt: now() },
    { id: 'source-writing-models', type: 'repository-file', title: '开放权重写作模型注册表', status: 'current', location: 'project-navigation/writing-models.json', checkedAt: now() },
    { id: 'source-writing-assets', type: 'repository-file', title: '写作资产注册表', status: 'current', location: 'docs/写作资产/registry.json', checkedAt: now() }
  ]
  const status = { schemaVersion: 1, scannedAt: now(), counts: { capabilities: capabilities.length, workflows: workflows.length, gaps: gaps.length, gameplay: gameplay.length, plots: plotCounts } }
  await Promise.all([writeJson(path.join(nav, 'capabilities.json'), { schemaVersion: 1, capabilities: sortById(capabilities) }), writeJson(path.join(nav, 'workflows.json'), { schemaVersion: 1, workflows: sortById(workflows) }), writeJson(path.join(nav, 'gaps.json'), { schemaVersion: 1, gaps: sortById(gaps) }), writeJson(path.join(nav, 'gameplay-coverage.json'), { schemaVersion: 1, gameplay: sortById(gameplay) }), writeJson(path.join(nav, 'sources.json'), { schemaVersion: 1, sources: sortById(sources) }), writeJson(path.join(nav, 'status.json'), status)])
  return { capabilities, workflows, gaps, gameplay, sources, status }
}

export async function loadNavigation(root = ROOT) { const nav = path.join(root, 'project-navigation'); return { capabilities: (await readJson(path.join(nav, 'capabilities.json'))).capabilities, workflows: (await readJson(path.join(nav, 'workflows.json'))).workflows, gaps: (await readJson(path.join(nav, 'gaps.json'))).gaps, gameplay: (await readJson(path.join(nav, 'gameplay-coverage.json'))).gameplay, sources: (await readJson(path.join(nav, 'sources.json'))).sources, status: await readJson(path.join(nav, 'status.json')) } }
export function recommend(gaps, options = {}) { const minutes = Number.parseInt(options.time ?? '20', 10); const avoid = new Set(String(options.avoid ?? '').split(',').filter(Boolean)); return gaps.filter((gap) => gap.status === 'open' && !avoid.has(gap.domain) && (!options.domain || gap.domain === options.domain)).sort((a, b) => `${a.priority}:${a.title}`.localeCompare(`${b.priority}:${b.title}`, 'zh-CN')).slice(0, minutes <= 10 ? 1 : 3) }
export async function buildOverviewDocs(root = ROOT) { const data = await loadNavigation(root); const recommended = recommend(data.gaps, { time: 20 }); const count = (predicate) => data.gaps.filter(predicate).length; const short = ['# 我现在可以做什么', '', `> 自动生成于 ${data.status.scannedAt}。来源为 project-navigation 注册表；正式事实仍以各权威文件为准。`, '', '## 今天推荐', '', ...(recommended.length ? recommended.map((gap, index) => `${index + 1}. **${gap.title}**（${gap.domain}）\n   - 下一步：${gap.nextAction ?? gap.description}\n   - 你可以直接说：“${gap.domain === 'gameplay' ? `帮我回答「${gap.title}」这条玩法缺口` : `帮我推进「${gap.title}」`}”。`) : ['当前没有满足条件的未阻塞任务。']), '', '## 按时间开始', '', '- **5—10 分钟**：`从当前故事缺口里随机问我一个可在10分钟回答的问题。`', '- **20—40 分钟**：`找一个已经有大纲、只差玩法循环的节点。`', '- **1—2 小时**：`把这个故事节点转成可玩计划。`', '', '## 你还可以直接说', '', ...data.workflows.flatMap((workflow) => workflow.userCanSay.map((phrase) => `- “${phrase}”`)), '', '## 目前最需要注意', '', `- 开放故事/地图/玩法缺口：${count((gap) => gap.status === 'open')}`, `- 玩法目录已收录：${data.gameplay.length} 项；未因目录存在而标记为已实现。`, '- 候选、计划与未验证代码不会自动关闭缺口。', '']; const overview = ['# 项目能力、缺口与行动总览', '', `> 自动生成于 ${data.status.scannedAt}。此文档是导航生成物，不替代 Skill、故事、玩法或命令的权威来源。`, '', '## 当前规模', '', `- 能力：${data.capabilities.length}`, `- 工作流：${data.workflows.length}`, `- 动态缺口：${data.gaps.length}（开放 ${count((gap) => gap.status === 'open')}）`, `- 玩法目录覆盖：${data.gameplay.length}（均从 catalogued 起步）`, '', '## 工作流', '', ...data.workflows.flatMap((workflow) => [`### ${workflow.title}`, '', workflow.summary, '', ...workflow.userCanSay.map((phrase) => `- 可以说：“${phrase}”`), '']), '## 缺口按领域', '', ...Object.entries(data.gaps.filter((gap) => gap.status !== 'completed').reduce((groups, gap) => { (groups[gap.domain] ??= []).push(gap); return groups }, {})).sort(([a], [b]) => a.localeCompare(b, 'zh-CN')).flatMap(([domain, gaps]) => [`### ${domain}（${gaps.length}）`, '', ...gaps.map((gap) => `- ${gap.title}：${gap.nextAction ?? gap.description}`), '']), '## 来源状态', '', ...data.sources.map((source) => `- ${source.title}：${source.status}（${source.location}）`), '']; await Promise.all([writeFile(path.join(root, 'docs/我现在可以做什么.md'), short.join('\n'), 'utf8'), writeFile(path.join(root, 'docs/项目能力、缺口与行动总览.md'), overview.join('\n'), 'utf8')]); return { recommended: recommended.length } }

export async function buildDocs(root = ROOT) {
  await buildOverviewDocs(root)
  const data = await loadNavigation(root)
  const plots = data.status.counts.plots ?? { total: 0, unused: 0, partial: 0, bondageUnused: 0 }
  const lines = [
    '# 我现在可以做什么', '',
    '不用先理解项目系统。选一件你现在想做的事，直接把下面的话发给我即可。', '',
    '## 1. 我想给故事加点新东西', '',
    '从情节库里挑适合当前世界或节点的内容；先给你选项，你决定后才补进大纲。', '',
    '- “给《某节点》找 3 个还没用过的情节。”',
    '- “列出适合浮光掠影的未用紧缚情节。”',
    '- “随机抽一个未用情节，看适合加到哪，再问我。”',
    '- “把 plot-xxx 对照大纲，建议主线还是支线，再问我。”',
    '- “我采用 plot-xxx，把它补充到这个节点。”', '',
    '## 2. 我不知道故事下一步该补什么', '',
    '从现有大纲里找真正缺的内容，给你几个可选方向，而不是替你定剧情。', '',
    '- “分析《某节点》还缺什么，给我 3 个选项。”',
    '- “随机问我一个十分钟能回答的故事问题。”', '',
    '## 3. 我想找小说当灵感资料', '',
    '可以把你提供的小说或知乎链接收进“参考资料库”，以后按题材、桥段或紧缚元素检索；它们不会直接变成正式剧情。', '',
    '- “下载这个知乎小说链接，作为灵感资料保存。”',
    '- “把这篇紧缚小说收进参考资料库，以后帮我找其中的紧缚元素。”',
    '- “从参考资料里找‘逃脱前留下线索’的写法思路，不要照搬原文。”', '',
    '## 4. 我已经有一个想法，想看看能不能用', '',
    '把想法放进指定节点、世界或角色关系中核验；合适时给你说明放在哪里最自然。', '',
    '- “这个桥段能放进《某节点》吗？”',
    '- “这个想法适合哪条主线？先不要写入。”', '',
    '## 5. 我想把故事做成能玩的内容', '',
    '把已确认剧情转成玩法、地图、事件和对话的最小计划。', '',
    '- “给《某节点》想 3 个能实际做出来的玩法。”',
    '- “把《某节点》做成最小可玩计划。”',
    '- “给这张地图接入 NPC、传送和事件。”', '',
    '## 6. 我只想找一件现在就能做的事', '',
    '- “我有 20 分钟，推荐一件能推进项目的事。”',
    '- “今天不想画地图，推荐别的。”', '',
    '---', '',
    `情节库当前有 ${plots.total} 条：${plots.unused} 条尚未使用，${plots.partial} 条只用了一部分；其中 ${plots.bondageUnused} 条是尚未使用的紧缚情节。`,
    '外部小说、未确认候选和情节库条目都不会自动写入正式大纲。', ''
  ]
  await writeFile(path.join(root, 'docs/我现在可以做什么.md'), lines.join('\n'), 'utf8')
  return { actions: 6 }
}
export async function validateNavigation(root = ROOT) {
  const errors = []
  const nav = path.join(root, 'project-navigation')
  for (const name of ['registry.json', 'capabilities.json', 'workflows.json', 'gaps.json', 'gameplay-coverage.json', 'sources.json', 'status.json', 'context-policy.json', 'team-routing.json', 'writing-models.json', 'manual-gaps.json']) {
    if (!await exists(path.join(nav, name))) errors.push(`missing project-navigation/${name}`)
  }
  if (errors.length) return { ok: false, errors }
  const data = await loadNavigation(root)
  const ids = new Set()
  for (const entry of [...data.capabilities, ...data.workflows, ...data.gaps]) {
    if (ids.has(entry.id)) errors.push(`duplicate id ${entry.id}`)
    ids.add(entry.id)
    for (const ref of entry.sourceRefs ?? []) if (!ref.startsWith('story-key:') && !ref.endsWith('.zip') && !await exists(path.join(root, ref))) errors.push(`missing source ${ref} for ${entry.id}`)
  }
  for (const file of await walk(root, '.agents/skills', (name) => name === 'SKILL.md')) {
    const name = frontmatter(await readFile(path.join(root, file), 'utf8')).name
    if (name && !data.capabilities.some((entry) => entry.id === `skill-${name}`)) errors.push(`unregistered skill ${name}`)
  }
  for (const node of await readJson(path.join(root, 'project-index/story/missing-items.json'), [])) {
    for (const item of node.missingItems ?? []) {
      const id = gapFromMissingItem(node, item).id
      if (!data.gaps.some((gap) => gap.id === id)) errors.push(`missing story gap ${id}`)
    }
  }
  for (const item of (await readJson(path.join(root, 'src/game/data/gameplay_outline/catalog.json'), { entries: [] })).entries ?? []) {
    if (!data.gameplay.some((entry) => entry.id === item.id)) errors.push(`missing gameplay coverage ${item.id}`)
  }
  return { ok: errors.length === 0, errors, counts: data.status.counts }
}

export async function resolveProjectContext(root = ROOT, options = {}) {
  const policies = await loadPolicies(root)
  return resolveContext({
    task: options.task ?? '',
    paths: options.paths ?? [],
    ...policies
  })
}

export async function checkContextPolicies(root = ROOT) {
  return auditContextPolicies(root)
}

function args(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value.startsWith('--')) options[value.slice(2)] = argv[index + 1]?.startsWith('--') ? true : argv[++index] ?? true
    else (options._ ??= []).push(value)
  }
  return options
}

async function main() {
  const [command = 'check'] = process.argv.slice(2)
  const options = args(process.argv.slice(3))
  if (['scan', 'changed', 'rescan'].includes(command)) {
    await scanNavigation()
    await buildDocs()
    const result = await validateNavigation()
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
    return
  }
  if (command === 'build') {
    await buildDocs()
    return
  }
  if (command === 'check') {
    const result = await validateNavigation()
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
    return
  }
  if (command === 'context') {
    const result = await resolveProjectContext(ROOT, options)
    console.log(JSON.stringify(result, null, 2))
    return
  }
  if (command === 'context-check') {
    const result = await checkContextPolicies(ROOT)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
    return
  }
  if (command === 'next' || command === 'list') {
    const data = await loadNavigation()
    const result = command === 'next'
      ? recommend(data.gaps, options)
      : data.gaps.filter((gap) => (!options.domain || gap.domain === options.domain) && (!options.status || gap.status === options.status))
    console.log(JSON.stringify(result, null, 2))
    return
  }
  throw new Error(`Unknown project navigation command: ${command}`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(`ERROR ${error.message}`); process.exitCode = 1 })
