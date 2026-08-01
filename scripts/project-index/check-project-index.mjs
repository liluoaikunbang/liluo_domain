import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { compareSourceSnapshot, fileHash } from './lib/core.mjs'
import { isIndexedSourcePath } from './lib/index-sources.mjs'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const statusPath = path.join(repoRoot, 'project-index/status.json')
if (!fs.existsSync(statusPath)) {
  console.error('项目索引缺失。请先运行：npm run project:index:build')
  process.exit(2)
}
const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'))
const current = {}
for (const relative of Object.keys(status.sourceSnapshot ?? {})) {
  if (fs.existsSync(path.join(repoRoot, relative))) {
    current[relative] = fileHash(path.join(repoRoot, relative))
  }
}
// Detect new supported sources by comparing against a dry rebuild is intentionally delegated to changed build; Git catches newly added files here.
const changes = compareSourceSnapshot(status.sourceSnapshot, current)
try {
  const output = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  for (const line of output.split(/\r?\n/)) {
    const statusCode = line.slice(0, 2)
    if (statusCode.includes('D') && statusCode !== '??') continue
    const relative = line.slice(3).replaceAll('\\', '/')
    if (relative && isIndexedSourcePath(relative) && !(relative in status.sourceSnapshot)) {
      changes.added.push(relative)
    }
  }
} catch {
  // ignore git probe failures; hash snapshot still applies
}
changes.added = [...new Set(changes.added)].sort()
const stale = Object.values(changes).some((items) => items.length)
if (stale || !['current', 'partial'].includes(status.status)) {
  console.error(
    [
      `项目索引已过期：${JSON.stringify(changes)}`,
      '请把刷新结果写进同一次提交后再推送（不要指望 push 门禁就地修好）：',
      '1) 若已启用 .githooks/pre-commit：重新 git commit，hook 会自动 npm run project:index:changed 并暂存 project-index/',
      '2) 手动：npm run project:index:changed && git add project-index && git commit',
    ].join('\n')
  )
  process.exit(1)
}
console.log(`Project index is ${status.status}; ${Object.keys(current).length} source hashes match.`)
