import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

import { auditContextPolicies, loadPolicies, resolveContext, toPosix } from '../project-navigation/lib/context-routing.mjs'
import { validateRoster } from '../team-presence/team-presence.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(ROOT, relative), 'utf8'))
}

test('上下文策略与团队路由通过 Schema', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  const contextSchema = await readJson('schemas/workflows/context-policy.schema.json')
  const routingSchema = await readJson('schemas/workflows/team-routing.schema.json')
  const contextPolicy = await readJson('project-navigation/context-policy.json')
  const teamRouting = await readJson('project-navigation/team-routing.json')
  assert.equal(ajv.validate(contextSchema, contextPolicy), true, ajv.errorsText(ajv.errors))
  assert.equal(ajv.validate(routingSchema, teamRouting), true, ajv.errorsText(ajv.errors))
})

test('roster v3：immersive/compact/actual-call-only，无成员 personaMode', async () => {
  const roster = await readJson('docs/设计记忆/项目组灵魂/team-roster.json')
  assert.equal(roster.schemaVersion, 3)
  assert.equal(roster.defaultPersonaMode, undefined)
  assert.equal(roster.presencePolicy.personaMode, 'immersive')
  assert.equal(roster.presencePolicy.displayDensity, 'compact')
  assert.equal(roster.presencePolicy.participationPolicy, 'actual-call-only')
  assert.equal(roster.presencePolicy.formalViewRequiresInvocation, true)
  for (const member of roster.members) {
    assert.equal(Object.hasOwn(member, 'personaMode'), false, member.memberId)
  }
  assert.deepEqual(validateRoster(roster), [])
})

test('planned 成员不可路由', async () => {
  const { teamRouting, roster, contextPolicy } = await loadPolicies(ROOT)
  const planned = roster.members.find((member) => member.status === 'planned')
  assert.ok(planned?.technicalAgent)
  const result = resolveContext({
    task: '从外部题材知识中寻找适合现有节点的抽象灵感',
    paths: ['external-knowledge/**'],
    contextPolicy,
    teamRouting,
    roster
  })
  assert.equal(result.selectedAgents.some((agent) => agent.technicalAgent === planned.technicalAgent), false)
})

test('机械任务进入 solo，且不默认装载索引/外部知识/历史', async () => {
  const policies = await loadPolicies(ROOT)
  const result = resolveContext({
    task: '修正 README 中的一个错别字',
    paths: ['README.md'],
    ...policies
  })
  assert.equal(result.teamTier, 'solo')
  assert.equal(result.selectedAgents.length, 0)
  assert.ok(result.context.L0.includes('AGENTS.md'))
  assert.equal(result.context.L2.some((item) => item.includes('成员/')), false)
  assert.equal(result.context.L3Queries.some((item) => item.classId === 'project-index'), false)
  assert.equal(result.context.L3Queries.some((item) => item.classId === 'external-knowledge'), false)
})

test('正式故事段落进入 micro-consult，通常选择砚秋', async () => {
  const policies = await loadPolicies(ROOT)
  const result = resolveContext({
    task: '补写一个已有故事节点的正式段落，不新增设定',
    paths: ['src/game/data/story_outline/1-modern/sample.md'],
    ...policies
  })
  assert.equal(result.teamTier, 'micro-consult')
  assert.equal(result.selectedAgents.length, 1)
  assert.equal(result.selectedAgents[0].name, '砚秋')
  assert.ok(result.skills.includes('liluo-natural-expression') || result.skills.includes('liluo-story-outline-authoring'))
  assert.ok(result.selectedAgents[0].soulPath)
  assert.ok(result.context.L2.includes(result.selectedAgents[0].soulPath))
  assert.equal(result.context.L2.filter((item) => item.includes('docs/设计记忆/项目组灵魂/成员/')).length, 1)
})

test('跨风险组总分达到 4 时进入 council，且不超过三名', async () => {
  const policies = await loadPolicies(ROOT)
  const result = resolveContext({
    task: '统一三个世界中璃落的时间关系，并把决定写入长期规则',
    paths: ['src/game/data/story_outline/**', 'docs/系统说明/**'],
    ...policies
  })
  assert.equal(result.teamTier, 'council')
  assert.ok(result.selectedAgents.length >= 2)
  assert.ok(result.selectedAgents.length <= 3)
  const names = result.selectedAgents.map((agent) => agent.name)
  assert.ok(names.includes('言澈'))
  assert.ok(names.includes('怀月'))
})

test('同一风险组只取最高分，不重复相加', async () => {
  const policies = await loadPolicies(ROOT)
  const result = resolveContext({
    task: '补写正式段落并同时做阅读向文案质量审计',
    paths: ['src/game/data/story_outline/1-modern/sample.md'],
    ...policies
  })
  assert.equal(result.teamTier, 'micro-consult')
  assert.equal(result.selectedAgents.length, 1)
})

test('游戏架构调整首选时雨，不因需要测试自动再调凌音', async () => {
  const policies = await loadPolicies(ROOT)
  const result = resolveContext({
    task: '调整地图事件与 Pinia 状态之间的数据流',
    paths: ['src/game/**'],
    ...policies
  })
  assert.equal(result.teamTier, 'micro-consult')
  assert.equal(result.selectedAgents[0].name, '时雨')
  assert.equal(result.selectedAgents.some((agent) => agent.name === '凌音'), false)
})

test('外部知识为 query-only，可保持 solo', async () => {
  const policies = await loadPolicies(ROOT)
  const result = resolveContext({
    task: '从外部题材知识中寻找适合现有节点的抽象灵感',
    paths: ['external-knowledge/**'],
    ...policies
  })
  assert.equal(result.teamTier, 'solo')
  assert.ok(result.context.L3Queries.some((item) => item.classId === 'external-knowledge'))
  assert.ok(result.context.L3Queries[0].queryHint.includes('external:knowledge:query'))
})

test('解析结果包含理由和预算，且重复运行稳定；路径分隔符可归一化', async () => {
  const policies = await loadPolicies(ROOT)
  const first = resolveContext({
    task: '调整地图事件与 Pinia 状态之间的数据流',
    paths: ['src\\game\\systems\\foo.ts'],
    ...policies
  })
  const second = resolveContext({
    task: '调整地图事件与 Pinia 状态之间的数据流',
    paths: ['src/game/systems/foo.ts'],
    ...policies
  })
  assert.ok(first.reasons.length > 0)
  assert.ok(first.budget.maxSkills >= 1)
  assert.equal(first.teamTier, second.teamTier)
  assert.deepEqual(first.selectedAgents, second.selectedAgents)
  assert.equal(toPosix('src\\game\\a'), 'src/game/a')
})

test('只有一个 Cursor Always 规则；双端目录并存', async () => {
  const rulesDir = path.join(ROOT, '.cursor/rules')
  const names = (await readdir(rulesDir)).filter((name) => name.endsWith('.mdc'))
  let always = 0
  for (const name of names) {
    const text = await readFile(path.join(rulesDir, name), 'utf8')
    if (/^alwaysApply:\s*true\s*$/m.test(text)) always += 1
  }
  assert.equal(always, 1)
  await readFile(path.join(ROOT, '.codex/config.toml'), 'utf8')
  await readFile(path.join(ROOT, '.cursor/rules/00-project-entry.mdc'), 'utf8')
})

test('context audit 通过', async () => {
  const result = await auditContextPolicies(ROOT)
  assert.equal(result.ok, true, result.errors.join('\n'))
})
