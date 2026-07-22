import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('.')
const rosterPath = path.join(root, 'docs/设计记忆/项目组灵魂/team-roster.json')
const poolPath = path.join(root, 'docs/设计记忆/项目组灵魂/文号体系/diaolong-name-pool.json')
const sourcePath = path.join(root, 'docs/设计记忆/项目组灵魂/文号体系/source-registry.json')

test('雕龙文号来源、篇名池与 roster 保持一致', () => {
  const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'))
  const pool = JSON.parse(fs.readFileSync(poolPath, 'utf8'))
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  assert.equal(source.sourceId, 'classical-wenxin-diaolong')
  assert.equal(source.author, '刘勰')
  assert.equal(pool.sourceId, source.sourceId)
  assert.equal(pool.literaryNames.length, 50)
  assert.deepEqual(pool.literaryNames.map((entry) => entry.chapterOrder), Array.from({ length: 50 }, (_, index) => index + 1))
  assert.equal(new Set(pool.literaryNames.map((entry) => entry.chapter)).size, 50)
  const poolByChapter = new Map(pool.literaryNames.map((entry) => [entry.chapter, entry]))
  const assigned = roster.members.filter((member) => ['active', 'planned'].includes(member.status))
  assert.equal(new Set(assigned.map((member) => member.literaryName)).size, assigned.length)
  for (const member of assigned) {
    assert.ok(member.literaryName, `${member.memberId} 缺少 literaryName`)
    assert.ok(member.dutyTitle, `${member.memberId} 缺少 dutyTitle`)
    assert.equal(member.penName, undefined, `${member.memberId} 不应继续定义 penName`)
    assert.equal(member.literaryNameSource?.sourceId, source.sourceId)
    assert.equal(member.literaryNameSource?.chapter, member.literaryName)
    assert.equal(poolByChapter.get(member.literaryName)?.assignedMemberId, member.memberId)
    assert.equal(poolByChapter.get(member.literaryName)?.status, member.status === 'active' ? 'active' : 'reserved')
  }
})

test('九个首批文号采用核验后的规范写法', () => {
  const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'))
  const actual = Object.fromEntries(roster.members.map((member) => [member.name, `${member.literaryName}｜${member.dutyTitle}`]))
  assert.deepEqual(actual, {
    璃落: '神思｜总枢', 知遥: '宗经｜寻迹', 言澈: '正纬｜经纬', 时雨: '熔裁｜机枢',
    砚秋: '指瑕｜衡鉴', 凌音: '程器｜验行', 怀月: '序志｜藏忆', 书晴: '事类｜拾影', 星弥: '隐秀｜补阙'
  })
})
