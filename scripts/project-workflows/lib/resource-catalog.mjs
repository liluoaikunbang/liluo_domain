import { access, readdir, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { ROOT, toPosix } from './paths.mjs'

const exists = (file) => access(file, constants.F_OK).then(() => true, () => false)

async function walk(directory, predicate) {
  if (!await exists(directory)) return []
  const entries = await readdir(directory, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) found.push(...await walk(absolute, predicate))
    else if (predicate(entry.name, absolute)) found.push(absolute)
  }
  return found
}

function parseFrontmatter(source) {
  const block = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return {}
  const result = {}
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (match) result[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return result
}

/** 与 project-navigation / evals 一致的稳定资源 ID。 */
export function skillCapabilityId(name) {
  return `skill-${name}`
}

export function agentCapabilityId(tomlBasename) {
  return `agent-${tomlBasename.replaceAll('_', '-')}`
}

export function commandCapabilityId(scriptName) {
  return `command-${scriptName.replaceAll(':', '-')}`
}

export async function loadResourceCatalog(root = ROOT) {
  const skills = new Map()
  for (const absolute of await walk(path.join(root, '.agents', 'skills'), (name) => name === 'SKILL.md')) {
    const meta = parseFrontmatter(await readFile(absolute, 'utf8'))
    if (!meta.name) continue
    const id = skillCapabilityId(meta.name)
    skills.set(id, {
      id,
      kind: 'skill',
      name: meta.name,
      path: toPosix(path.relative(root, absolute)),
      status: 'available',
    })
  }

  const agents = new Map()
  for (const absolute of await walk(path.join(root, '.codex', 'agents'), (name) => name.endsWith('.toml'))) {
    const basename = path.basename(absolute, '.toml')
    const id = agentCapabilityId(basename)
    agents.set(id, {
      id,
      kind: 'agent',
      name: basename,
      path: toPosix(path.relative(root, absolute)),
      status: 'available',
    })
  }

  const commands = new Map()
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  for (const name of Object.keys(packageJson.scripts ?? {})) {
    const id = commandCapabilityId(name)
    commands.set(id, {
      id,
      kind: 'command',
      name,
      path: 'package.json',
      status: 'available',
    })
  }

  return { skills, agents, commands, root }
}

export async function resolveResourceRef(catalog, kind, ref) {
  if (kind === 'skill') {
    const id = ref.startsWith('skill-') ? ref : skillCapabilityId(ref)
    return catalog.skills.get(id) ?? null
  }
  if (kind === 'agent') {
    const normalized = ref.startsWith('agent-')
      ? ref
      : agentCapabilityId(ref.replaceAll('-', '_').includes('_') ? ref : ref.replaceAll('-', '_'))
    // Accept both agent-liluo-content-auditor and liluo_content_auditor
    if (catalog.agents.has(normalized)) return catalog.agents.get(normalized)
    if (ref.startsWith('agent-')) {
      const snake = ref.slice('agent-'.length).replaceAll('-', '_')
      return catalog.agents.get(agentCapabilityId(snake)) ?? null
    }
    const kebab = agentCapabilityId(ref)
    if (catalog.agents.has(kebab)) return catalog.agents.get(kebab)
    const snake = ref.replaceAll('-', '_')
    return catalog.agents.get(agentCapabilityId(snake)) ?? null
  }
  if (kind === 'command') {
    const id = ref.startsWith('command-') ? ref : commandCapabilityId(ref.replace(/^npm run\s+/, ''))
    return catalog.commands.get(id) ?? null
  }
  if (kind === 'script' || kind === 'doc' || kind === 'schema' || kind === 'hook') {
    const absolute = path.resolve(catalog.root, ref)
    const relative = path.relative(catalog.root, absolute)
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null
    if (!await exists(absolute)) return null
    return {
      id: ref,
      kind,
      name: ref,
      path: toPosix(relative),
      status: 'available',
    }
  }
  if (kind === 'approval' || kind === 'tool') {
    return {
      id: ref,
      kind,
      name: ref,
      path: null,
      status: 'declared',
    }
  }
  return null
}
