import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ASSET_AUDIT = 'node .agents/skills/liluo-project/liluo-asset-registry-audit/scripts/audit-game-assets.mjs --check'
const INDEX_CHANGED = 'npm run project:index:changed'

// Refresh index before check/validate so local `changed` mode does not self-fight.
const ORDER = [
  'npm run data:contracts:registry',
  'npm run project:hooks:test',
  'npm run commands:approval:test',
  'npm run commands:approval:validate',
  'npm run project:workflow:validate',
  'npm run project:routine -- workflow',
  'npm run project:routine -- writing',
  'npm run evals:check',
  'npm run evals:static:all',
  ASSET_AUDIT,
  'npm run data:contracts:check',
  'npm run data:contracts:all',
  'npm run docs:check-encoding',
  'npm run docs:governance:validate',
  'npm run docs:commands:validate',
  INDEX_CHANGED,
  'npm run project:routine -- check',
  'npm run project:routine -- test',
  'npm run project:index:validate',
  'npm run build:web',
]

const CI_COMMANDS = [
  'npm run data:contracts:registry',
  'npm run project:hooks:test',
  'npm run data:contracts:all',
  'npm run evals:static:all',
  'npm run docs:check-encoding',
  'npm run project:routine -- check',
  'npm run project:routine -- test',
  'npm run project:index:validate',
  'npm run build:web',
]

function addForDomains(selected, classification, mode) {
  const domains = new Set(classification.domains)
  const requires = new Set(classification.requires)

  if (domains.has('docs')) selected.add('npm run docs:check-encoding')
  if (requires.has('docs-governance')) {
    selected.add('npm run docs:governance:validate')
    if (classification.files.includes('docs/用户命令目录.md') || requires.has('user-command-sync')) {
      selected.add('npm run docs:commands:validate')
    }
  }
  if (requires.has('user-command-sync')) selected.add('npm run docs:commands:validate')
  if (domains.has('skills-agents-governance')) selected.add('npm run evals:check')
  if (requires.has('command-approval-tests')) {
    selected.add('npm run commands:approval:test')
    selected.add('npm run commands:approval:validate')
  }
  if (requires.has('executable-workflow-tests')) {
    selected.add('npm run project:routine -- workflow')
  }
  if (requires.has('executable-workflow-check')) {
    selected.add('npm run project:workflow:validate')
  }
  if (requires.has('writing-pipeline-tests')) {
    selected.add('npm run project:routine -- writing')
  }
  if (domains.has('schemas-data')) selected.add('npm run data:contracts:check')
  if (domains.has('schemas-data') && requires.has('game-content-check')) selected.add('npm run project:routine -- check')
  if (domains.has('story') || domains.has('maps-events-dialogues')) {
    selected.add('npm run data:contracts:check')
    selected.add('npm run project:routine -- check')
    // Local/dev gate may refresh working tree; prepush must not (cannot rewrite the commit being pushed).
    if (mode !== 'prepush') selected.add(INDEX_CHANGED)
    selected.add('npm run project:index:validate')
  }
  if (domains.has('saves')) {
    selected.add('npm run data:contracts:check')
    selected.add('npm run project:routine -- test')
  }
  if (domains.has('runtime')) {
    selected.add('npm run project:routine -- check')
    selected.add('npm run project:routine -- test')
    if (mode === 'prepush' && requires.has('web-build')) selected.add('npm run build:web')
  }
  if (domains.has('assets')) {
    selected.add(ASSET_AUDIT)
    if (mode !== 'prepush') selected.add(INDEX_CHANGED)
    selected.add('npm run project:index:validate')
  }
  if (domains.has('build-config')) {
    if (requires.has('quality-gate-tests')) selected.add('npm run project:hooks:test')
    selected.add('npm run project:routine -- check')
    selected.add('npm run project:routine -- test')
    selected.add('npm run build:web')
  }
}

export function buildGatePlan({ classification = { domains: [], files: [], requires: [] }, mode = 'changed' } = {}) {
  if (!['hook', 'changed', 'prepush', 'ci'].includes(mode)) throw new Error(`Unsupported quality-gate mode: ${mode}`)
  const selected = new Set(mode === 'ci' ? CI_COMMANDS : [])
  if (mode !== 'ci') addForDomains(selected, classification, mode)
  if (mode === 'hook') selected.delete('npm run build:web')
  // Belt-and-suspenders: never rewrite files during prepush.
  if (mode === 'prepush') selected.delete(INDEX_CHANGED)
  if (selected.has('npm run project:routine -- workflow')) selected.delete('npm run project:workflow:validate')

  const commands = ORDER.filter((command) => selected.has(command))
  const skipped = ORDER
    .filter((command) => !selected.has(command))
    .map((command) => ({
      command,
      reason: command.includes('evals:smoke')
        ? 'Live Codex evals are excluded from automatic gates.'
        : mode === 'hook' && command === 'npm run build:web'
          ? 'Hook mode never builds.'
          : mode === 'prepush' && command === INDEX_CHANGED
            ? 'Pre-push validates only; index refresh belongs in pre-commit / the same commit.'
          : 'Not required by the detected change domains.',
    }))
  return { mode, commands, skipped }
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  process.stdout.write(`${JSON.stringify(buildGatePlan({ mode: process.argv[2] ?? 'changed' }), null, 2)}\n`)
}
