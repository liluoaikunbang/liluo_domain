import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DATA_EXTENSION = /\.(json|ya?ml)$/i
const RUNTIME_EXTENSION = /\.(?:[cm]?[jt]s|vue)$/i

function normalizeFile(file) {
  return String(file).trim().replaceAll('\\', '/').replace(/^\.\/+/, '')
}

function isStory(file) {
  return file.startsWith('src/game/data/story_outline/')
    || /src\/game\/data\/.*story.*registry/i.test(file)
}

function isMapEventDialogue(file) {
  return file.startsWith('src/game/data/maps/')
    || file.startsWith('src/game/data/events/')
    || file.startsWith('src/game/data/dialogues/')
    || file.startsWith('src/game/data/interactive_fictions/')
    || file === 'src/game/data/registry.ts'
}

function isSave(file) {
  const lower = file.toLowerCase()
  return lower.startsWith('schemas/') && lower.includes('save')
    || lower.startsWith('src/game/') && /(?:save|storage|migration)/.test(lower)
}

function isIndexSource(file) {
  return file.startsWith('docs/')
    || file.startsWith('src/assets/game/')
    || isStory(file)
    || file === 'src/game/data/gameplay_outline/catalog.json'
    || isMapEventDialogue(file)
    || file.startsWith('src/game/') && RUNTIME_EXTENSION.test(file)
}

export function classifyChanges(inputFiles = []) {
  const files = [...new Set(inputFiles.map(normalizeFile).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'))
  const domains = new Set()
  const requires = new Set()
  const warnings = []

  for (const file of files) {
    const fileDomains = new Set()
    const isCommandApprovalGovernance = file.startsWith('scripts/command-approval/')
      || [
        'scripts/tests/command-approval-governance.test.mjs',
        'scripts/tests/project-routine-governance.test.mjs',
      ].includes(file)
    const isDocs = file === 'README.md' || file === 'AGENTS.md' || file.startsWith('docs/')
    const isStructuredData = file.startsWith('schemas/')
      || file.startsWith('src/game/data/') && DATA_EXTENSION.test(file)
    const isPureGameData = file.startsWith('src/game/data/') && (DATA_EXTENSION.test(file) || file.endsWith('.md'))
    const isBuildConfig = [
      '.gitattributes',
      '.gitignore',
      '.npmrc',
      '.nvmrc',
      'package.json',
      'package-lock.json',
    ].includes(file)
      || /^vite\.config\./.test(file)
      || /^tsconfig[^/]*\.json$/.test(file)
      || file.startsWith('.github/')
      || file.startsWith('.codex/hooks')
      || file.startsWith('.githooks/')
      || file.startsWith('scripts/quality-gate/')

    if (isDocs) fileDomains.add('docs')
    if (
      file.startsWith('.agents/')
      || file.startsWith('.codex/agents/')
      || file.startsWith('.codex/rules/')
      || file === '.codex/approval-decisions.json'
      || isCommandApprovalGovernance
    ) fileDomains.add('skills-agents-governance')
    if (isStructuredData) fileDomains.add('schemas-data')
    if (isStory(file)) fileDomains.add('story')
    if (isMapEventDialogue(file)) fileDomains.add('maps-events-dialogues')
    if (isSave(file)) fileDomains.add('saves')
    if (file.startsWith('src/game/') && RUNTIME_EXTENSION.test(file) && !isPureGameData) fileDomains.add('runtime')
    if (file.startsWith('src/assets/game/')) fileDomains.add('assets')
    if (isBuildConfig) fileDomains.add('build-config')
    if (isIndexSource(file)) fileDomains.add('index-source')

    if (
      file.endsWith('.vue')
      || /src\/game\/(?:scenes|views|stores|core)\//.test(file)
      || /src\/game\/(?:main|index|registry)\.[cm]?[jt]s$/.test(file)
    ) requires.add('web-build')
    if (
      file === 'docs/用户命令目录.md'
      || file === 'docs/功能更新目录.md'
      || file.startsWith('docs/规范治理/')
      || file === 'src/game/data/global/updateRecords.js'
    ) requires.add('docs-governance')
    if (file.startsWith('src/game/data/') && DATA_EXTENSION.test(file)) requires.add('game-content-check')
    if (
      file.startsWith('.codex/hooks')
      || file.startsWith('.githooks/')
      || file.startsWith('scripts/quality-gate/')
    ) requires.add('quality-gate-tests')
    if (isCommandApprovalGovernance) requires.add('command-approval-tests')

    for (const domain of fileDomains) domains.add(domain)
    if (fileDomains.size === 0 && !file.startsWith('project-index/') && !file.startsWith('reports/')) {
      warnings.push(`Unclassified path: ${file}`)
    }
  }

  return {
    domains: [...domains].sort(),
    files,
    requires: [...requires].sort(),
    warnings: [...new Set(warnings)].sort(),
  }
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  const result = classifyChanges(process.argv.slice(2))
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}
