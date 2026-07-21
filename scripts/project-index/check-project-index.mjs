import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { compareSourceSnapshot, fileHash } from './lib/core.mjs'
const repoRoot = path.resolve(import.meta.dirname, '../..'); const statusPath = path.join(repoRoot, 'project-index/status.json')
if (!fs.existsSync(statusPath)) { console.error('Project index is missing. Run npm run project:index:build'); process.exit(2) }
const status = JSON.parse(fs.readFileSync(statusPath, 'utf8')); const current = {}
for (const relative of Object.keys(status.sourceSnapshot ?? {})) if (fs.existsSync(path.join(repoRoot, relative))) current[relative] = fileHash(path.join(repoRoot, relative))
// Detect new supported sources by comparing against a dry rebuild is intentionally delegated to changed build; Git catches newly added files here.
const changes = compareSourceSnapshot(status.sourceSnapshot, current)
const isSupportedSource = (relative) => relative.startsWith('docs/') && relative.endsWith('.md')
  || relative.startsWith('src/assets/game/')
  || relative.startsWith('src/game/data/story_outline/') && ['.json', '.md'].some((extension) => relative.endsWith(extension))
  || relative === 'src/game/data/gameplay_outline/catalog.json'
  || relative.startsWith('src/game/data/maps/') && ['.json', '.js', '.ts'].some((extension) => relative.endsWith(extension))
  || relative.startsWith('src/game/data/interactive_fictions/') && ['.json', '.js', '.ts'].some((extension) => relative.endsWith(extension))
  || relative === 'src/game/data/registry.ts'
  || relative.startsWith('src/game/') && ['.js', '.ts', '.vue'].some((extension) => relative.endsWith(extension))
try { const output = (await import('node:child_process')).execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: repoRoot, encoding: 'utf8' }); for (const line of output.split(/\r?\n/)) { const relative = line.slice(3).replaceAll('\\', '/'); if (relative && isSupportedSource(relative) && !(relative in status.sourceSnapshot)) changes.added.push(relative) } } catch {}
changes.added = [...new Set(changes.added)].sort(); const stale = Object.values(changes).some((items) => items.length)
if (stale || !['current', 'partial'].includes(status.status)) { console.error(`Project index is stale: ${JSON.stringify(changes)}\nRun npm run project:index:changed`); process.exit(1) }
console.log(`Project index is ${status.status}; ${Object.keys(current).length} source hashes match.`)
