import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const rosterPath = path.join(root, 'docs/设计记忆/项目组灵魂/team-roster.json')
const statePath = path.join(root, '.local/team-presence-state.json')
const sourceStatuses = new Set(['user-confirmed', 'user-implied-persistent', 'agent-proposed', 'team-discussed', 'pending-approval', 'superseded'])

function readPresencePolicy() {
  try {
    const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'))
    return roster.presencePolicy ?? {
      personaMode: 'immersive',
      displayDensity: 'compact',
      participationPolicy: 'actual-call-only',
      formalViewRequiresInvocation: true
    }
  } catch {
    return {
      personaMode: 'immersive',
      displayDensity: 'compact',
      participationPolicy: 'actual-call-only',
      formalViewRequiresInvocation: true
    }
  }
}

function readDefaultPersonaMode() {
  const mode = readPresencePolicy().personaMode
  return mode === 'neutral' || mode === 'subtle' || mode === 'immersive' ? mode : 'immersive'
}

export function readDisplayDensity() {
  return readPresencePolicy().displayDensity === 'expanded' ? 'expanded' : 'compact'
}

export function resolvePersonaMode(request = '', fallback = readDefaultPersonaMode()) {
  if (/只要专业结果|neutral|不要人格|仅结果/.test(request)) return 'neutral'
  if (/subtle|克制模式|克制表达/.test(request)) return 'subtle'
  if (/沉浸模式|immersive/.test(request)) return 'immersive'
  return fallback
}

export function canAttributeFormalView({ agentCalled = false, reportReceived = false } = {}) {
  return agentCalled && reportReceived
}

export function hasUserInstructionAuthority(source) {
  return source === 'user'
}

export function formatLiluoDirection(summary, { source, approved = false } = {}) {
  if (!approved || !hasUserInstructionAuthority(source)) return null
  const normalized = String(summary ?? '').replace(/\s+/g, ' ').trim()
  return normalized ? `【璃落指出：${normalized}】` : null
}

export function thoughtStatus({ source, approved = false } = {}) {
  if (approved && source === 'user') return 'user-confirmed'
  if (source === 'team') return approved ? 'user-confirmed' : 'team-discussed'
  return approved ? 'pending-approval' : 'agent-proposed'
}

export function presenceFor(lastActivity, now = new Date(), reunionShown = false) {
  if (!lastActivity) return { status: 'normal', daysSinceLastActivity: null, shouldShowPresence: false, recommendedMode: readDefaultPersonaMode(), initialized: false }
  const lastTime = new Date(lastActivity).getTime()
  if (!Number.isFinite(lastTime)) return { status: 'normal', daysSinceLastActivity: null, shouldShowPresence: false, recommendedMode: readDefaultPersonaMode(), initialized: false, error: 'invalid-last-activity' }
  const days = Math.max(0, Math.floor((now.getTime() - lastTime) / 86400000))
  const status = days <= 7 ? 'normal' : days <= 30 ? 'returning' : days <= 90 ? 'reunion' : 'long-reunion'
  return { status, daysSinceLastActivity: days, shouldShowPresence: status !== 'normal' && !reunionShown, recommendedMode: readDefaultPersonaMode(), initialized: true }
}

export function validateRoster(roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'))) {
  const errors = []
  if (roster.schemaVersion !== 3) errors.push('roster schemaVersion must be 3')
  if (roster.defaultPersonaMode !== undefined) errors.push('legacy defaultPersonaMode must be removed')
  const policy = roster.presencePolicy
  if (!policy) errors.push('missing presencePolicy')
  else {
    if (policy.personaMode !== 'immersive') errors.push('presencePolicy.personaMode must default to immersive')
    if (policy.displayDensity !== 'compact') errors.push('presencePolicy.displayDensity must default to compact')
    if (policy.participationPolicy !== 'actual-call-only') errors.push('presencePolicy.participationPolicy must be actual-call-only')
    if (policy.formalViewRequiresInvocation !== true) errors.push('presencePolicy.formalViewRequiresInvocation must be true')
    if (policy.uncalledMemberDisplay !== 'none') errors.push('presencePolicy.uncalledMemberDisplay must be none')
  }
  const unique = (key) => roster.members.map((m) => m[key]).filter(Boolean).filter((v, i, a) => a.indexOf(v) !== i)
  for (const key of ['memberId', 'name', 'technicalAgent']) for (const value of new Set(unique(key))) errors.push(`duplicate ${key}: ${value}`)
  const agentIds = new Set(fs.readdirSync(path.join(root, '.codex/agents')).filter((f) => f.endsWith('.toml')).map((f) => f.slice(0, -5)))
  const mainMembers = roster.members.filter((member) => member.status === 'active' && member.technicalAgent === null)
  if (mainMembers.length !== 1 || mainMembers[0]?.memberId !== 'liluo') errors.push('main Codex must map uniquely to active member liluo')
  for (const member of roster.members) {
    if (Object.hasOwn(member, 'personaMode')) errors.push(`member must not define personaMode: ${member.memberId}`)
    if (member.gender !== 'adult-woman') errors.push(`invalid gender: ${member.memberId}`)
    if (!member.literaryName || !member.dutyTitle || member.penName) errors.push(`invalid literary identity: ${member.memberId}`)
    if (member.status === 'active' && member.technicalAgent && !agentIds.has(member.technicalAgent)) errors.push(`missing active agent: ${member.technicalAgent}`)
    if (member.status === 'active' && (!member.soulPath || path.isAbsolute(member.soulPath) || !fs.existsSync(path.join(root, member.soulPath)))) errors.push(`invalid soul path: ${member.memberId}`)
  }
  return errors
}

export function validateNotes() {
  const dir = path.join(root, 'docs/设计记忆/项目组灵魂/项目组手记')
  const ids = new Set(); const errors = []
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const id = text.match(/^id:\s*(.+)$/m)?.[1]
    const source = text.match(/^sourceStatus:\s*(.+)$/m)?.[1]
    if (!id || ids.has(id)) errors.push(`missing or duplicate note id: ${file}`); else ids.add(id)
    if (!sourceStatuses.has(source)) errors.push(`invalid source status: ${file}`)
    if (text.includes('【璃落指出：') && source !== 'user-confirmed') errors.push(`Liluo direction requires user-confirmed source: ${file}`)
    if (text.length > 12000) errors.push(`note is suspiciously long: ${file}`)
  }
  return errors
}

export function readState() { return fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null }
export function writeState(next) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true })
  const temp = `${statePath}.tmp`
  const backup = `${statePath}.bak`
  fs.writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  if (!fs.existsSync(statePath)) return fs.renameSync(temp, statePath)
  if (fs.existsSync(backup)) fs.rmSync(backup)
  fs.renameSync(statePath, backup)
  try { fs.renameSync(temp, statePath); fs.rmSync(backup) } catch (error) { if (fs.existsSync(backup)) fs.renameSync(backup, statePath); throw error }
}
