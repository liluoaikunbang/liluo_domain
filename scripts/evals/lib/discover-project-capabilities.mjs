import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const PROJECT_SKILL_NAMES = /^(?:liluo-|random-story-outline-interview$)/

async function walk(directory, fileName) {
  const entries = await readdir(directory, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) found.push(...await walk(absolute, fileName))
    else if (entry.name === fileName) found.push(absolute)
  }
  return found
}

export function toRepoPath(root, absolute) {
  return path.relative(root, absolute).replaceAll(path.sep, '/')
}

export function parseSkillFrontmatter(source) {
  const block = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return {}
  const result = {}
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (match) result[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return result
}

export async function discoverProjectCapabilities(root) {
  const skillFiles = await walk(path.join(root, '.agents', 'skills'), 'SKILL.md')
  const allSkills = []
  for (const absolute of skillFiles) {
    const metadata = parseSkillFrontmatter(await readFile(absolute, 'utf8'))
    allSkills.push({
      name: metadata.name ?? '',
      description: metadata.description ?? '',
      path: toRepoPath(root, absolute),
      directoryName: path.basename(path.dirname(absolute)),
      openaiYamlPath: toRepoPath(root, path.join(path.dirname(absolute), 'agents', 'openai.yaml')),
      project: PROJECT_SKILL_NAMES.test(metadata.name ?? ''),
    })
  }

  const agentDirectory = path.join(root, '.codex', 'agents')
  const agents = []
  for (const entry of await readdir(agentDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.toml')) continue
    const absolute = path.join(agentDirectory, entry.name)
    const source = await readFile(absolute, 'utf8')
    const displayName = source.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1] ?? ''
    agents.push({
      name: path.basename(entry.name, '.toml'),
      displayName,
      path: toRepoPath(root, absolute),
      docPath: `docs/智能体说明/${path.basename(entry.name, '.toml')}.md`,
    })
  }

  return {
    allSkills: allSkills.sort((a, b) => a.name.localeCompare(b.name)),
    skills: allSkills.filter((skill) => skill.project).sort((a, b) => a.name.localeCompare(b.name)),
    agents: agents.sort((a, b) => a.name.localeCompare(b.name)),
  }
}
