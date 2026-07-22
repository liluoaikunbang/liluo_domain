import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const soulRoot = path.join(root, 'docs/设计记忆/项目组灵魂')
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(soulRoot, file), 'utf8'))

export function validateLiteraryNames() {
  const errors = []
  const roster = readJson('team-roster.json')
  const pool = readJson('文号体系/diaolong-name-pool.json')
  const source = readJson('文号体系/source-registry.json')
  const byChapter = new Map(pool.literaryNames.map((entry) => [entry.chapter, entry]))
  if (source.sourceId !== pool.sourceId || pool.literaryNames.length !== 50) errors.push('source or chapter-count mismatch')
  const used = new Set()
  for (const member of roster.members) {
    if (!member.literaryName || !member.dutyTitle) errors.push(`missing literary identity: ${member.memberId}`)
    if ('penName' in member) errors.push(`deprecated penName remains: ${member.memberId}`)
    if (used.has(member.literaryName)) errors.push(`duplicate literary name: ${member.literaryName}`)
    used.add(member.literaryName)
    const entry = byChapter.get(member.literaryName)
    if (!entry) errors.push(`chapter missing from pool: ${member.literaryName}`)
    if (entry?.assignedMemberId !== member.memberId) errors.push(`assignment mismatch: ${member.memberId}`)
    if (member.literaryNameSource?.sourceId !== source.sourceId) errors.push(`source mismatch: ${member.memberId}`)
    const expected = member.status === 'active' ? 'active' : member.status === 'planned' ? 'reserved' : null
    if (expected && entry?.status !== expected) errors.push(`status mismatch: ${member.memberId}`)
    const signature = `${member.name}｜${member.literaryName}｜${member.dutyTitle}`
    if (!member.soulPath || !fs.existsSync(path.join(root, member.soulPath))) errors.push(`soul card missing: ${member.memberId}`)
    else if (!fs.readFileSync(path.join(root, member.soulPath), 'utf8').includes(signature)) errors.push(`soul card identity mismatch: ${member.memberId}`)
    if (member.status === 'active' && member.technicalAgent) {
      const toml = path.join(root, '.codex/agents', `${member.technicalAgent}.toml`)
      const description = path.join(root, 'docs/智能体说明', `${member.technicalAgent}.md`)
      if (!fs.existsSync(toml) || !fs.readFileSync(toml, 'utf8').includes(signature)) errors.push(`agent TOML identity mismatch: ${member.memberId}`)
      if (!fs.existsSync(description) || !fs.readFileSync(description, 'utf8').includes(signature)) errors.push(`agent description identity mismatch: ${member.memberId}`)
    }
  }
  for (const entry of pool.literaryNames.filter((item) => ['historical', 'retired'].includes(item.status))) {
    if (entry.assignedMemberId && roster.members.some((member) => member.memberId !== entry.assignedMemberId && member.literaryName === entry.chapter)) errors.push(`historical name reused: ${entry.chapter}`)
  }
  if (!fs.existsSync(path.join(soulRoot, '文号体系/README.md'))) errors.push('literary-name authority missing')
  return errors
}

export function listLiteraryNames(status) {
  return readJson('文号体系/diaolong-name-pool.json').literaryNames.filter((entry) => !status || entry.status === status)
}

const command = process.argv[2]
if (command) {
  if (command === 'validate') {
    const errors = validateLiteraryNames()
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 } else console.log('team literary names valid: 50 chapters, 9 assignments')
  } else {
    const status = command === 'available' ? 'available' : undefined
    for (const entry of listLiteraryNames(status)) console.log(`${String(entry.chapterOrder).padStart(2, '0')}\t${entry.chapter}\t${entry.status}\t${entry.assignedMemberId ?? '-'}`)
  }
}
