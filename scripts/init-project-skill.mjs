import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const ALLOWED_AREAS = new Set(['liluo-project', 'writing', 'testing'])
const ALLOWED_RESOURCES = new Set(['references', 'scripts', 'assets'])

function argsMap(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) throw new Error(`不支持的位置参数：${item}`)
    const key = item.slice(2)
    if (key === 'dry-run') {
      result.dryRun = true
      continue
    }
    if (!['name', 'area', 'resources'].includes(key)) throw new Error(`不支持的参数：--${key}`)
    if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`--${key} 缺少值`)
    result[key] = argv[index + 1]
    index += 1
  }
  return result
}

export function validateProjectSkillInitRequest(input = {}) {
  const name = String(input.name ?? '').trim()
  const area = String(input.area ?? 'liluo-project').trim()
  const resources = String(input.resources ?? 'references')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!/^liluo-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)) throw new Error('Skill 名称必须以 liluo- 开头并使用小写 kebab-case。')
  if (!ALLOWED_AREAS.has(area)) throw new Error('area 仅允许 liluo-project、writing 或 testing。')
  if (resources.length === 0 || resources.some((resource) => !ALLOWED_RESOURCES.has(resource))) {
    throw new Error('resources 仅允许 references、scripts、assets。')
  }
  return { name, area, resources }
}

export function initializeProjectSkill(request, options = {}) {
  const root = options.root ?? path.resolve(import.meta.dirname, '..')
  const python = options.python ?? 'python'
  const initScript = options.initScript ?? path.join(
    os.homedir(),
    '.codex',
    'skills',
    '.system',
    'skill-creator',
    'scripts',
    'init_skill.py',
  )
  if (!existsSync(initScript)) throw new Error(`找不到官方 skill-creator：${initScript}`)

  const targetRoot = path.join(root, '.agents', 'skills', request.area)
  const targetDirectory = path.join(targetRoot, request.name)
  if (existsSync(targetDirectory)) throw new Error(`目标 Skill 已存在：${targetDirectory}`)

  const result = spawnSync(python, [
    initScript,
    request.name,
    '--path',
    targetRoot,
    '--resources',
    request.resources.join(','),
  ], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PYTHONUTF8: '1' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`skill-creator failed with exit code ${result.status}`)
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  const options = argsMap(process.argv.slice(2))
  const request = validateProjectSkillInitRequest(options)
  if (options.dryRun) console.log(JSON.stringify({ valid: true, dryRun: true, request }, null, 2))
  else initializeProjectSkill(request)
}
