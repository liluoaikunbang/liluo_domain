import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROUTINE_PLANS = Object.freeze({
  docs: Object.freeze([
    { id: 'docs:check-encoding', command: 'npm', args: ['run', 'docs:check-encoding'] },
    { id: 'docs:governance:validate', command: 'npm', args: ['run', 'docs:governance:validate'] },
    { id: 'docs:memory:validate', command: 'npm', args: ['run', 'docs:memory:validate'] },
    { id: 'docs:commands:validate', command: 'npm', args: ['run', 'docs:commands:validate'] },
  ]),
  workflow: Object.freeze([
    { id: 'project-routine-governance', command: process.execPath, args: ['--test', 'scripts/tests/project-routine-governance.test.mjs'] },
  ]),
  'team-presence': Object.freeze([
    { id: 'team-presence-test', command: process.execPath, args: ['--test', 'scripts/tests/team-presence.test.mjs'] },
    { id: 'team-notes-validate', command: process.execPath, args: ['scripts/team-presence/validate-team-notes.mjs'] },
  ]),
  'natural-expression': Object.freeze([
    { id: 'natural-expression-test', command: process.execPath, args: ['--test', 'scripts/tests/natural-expression.test.mjs'] },
  ]),
  check: Object.freeze([
    { id: 'docs:check-encoding', command: 'npm', args: ['run', 'docs:check-encoding'] },
    { id: 'docs:governance:validate', command: 'npm', args: ['run', 'docs:governance:validate'] },
    { id: 'docs:memory:validate', command: 'npm', args: ['run', 'docs:memory:validate'] },
    { id: 'docs:commands:validate', command: 'npm', args: ['run', 'docs:commands:validate'] },
    { id: 'project:index:check', command: 'npm', args: ['run', 'project:index:check'] },
    { id: 'data:contracts:check', command: 'npm', args: ['run', 'data:contracts:check'] },
    { id: 'evals:check', command: 'npm', args: ['run', 'evals:check'] },
    { id: 'game:content:validate', command: 'npm', args: ['run', 'game:content:validate'] },
  ]),
  test: Object.freeze([
    { id: 'commands:approval:test', command: 'npm', args: ['run', 'commands:approval:test'] },
    { id: 'content:production:test', command: 'npm', args: ['run', 'content:production:test'] },
    { id: 'project-routine-governance', command: process.execPath, args: ['scripts/tests/project-routine-governance.test.mjs'] },
    { id: 'update-records', command: process.execPath, args: ['--test', 'scripts/tests/update-records.test.mjs'] },
    { id: 'story-outline-frontmatter', command: process.execPath, args: ['scripts/tests/story-outline-frontmatter.test.mjs'] },
  ]),
  index: Object.freeze([
    { id: 'project:index:build', command: 'npm', args: ['run', 'project:index:build'] },
    { id: 'project:index:validate', command: 'npm', args: ['run', 'project:index:validate'] },
  ]),
  build: Object.freeze([
    { id: 'build:web', command: 'npm', args: ['run', 'build:web'] },
  ]),
})

export function resolveRoutinePlan(mode = 'check', extraArgs = []) {
  if (extraArgs.length > 0) throw new Error('项目常规模式不接受附加参数。')
  if (mode === 'all') return ['index', 'check', 'test', 'build'].flatMap((name) => ROUTINE_PLANS[name])
  const plan = ROUTINE_PLANS[mode]
  if (!plan) throw new Error(`不支持的项目常规模式：${mode}。仅允许 docs、workflow、team-presence、natural-expression、check、test、index、build、all。`)
  return [...plan]
}

export function resolveNpmInvocation(args, options = {}) {
  const npmExecPath = options.npmExecPath ?? process.env.npm_execpath
  const nodeExecutable = options.nodeExecutable ?? process.execPath
  if (!npmExecPath) throw new Error('project:routine 必须由 npm run 启动，当前缺少 npm_execpath。')
  return { command: nodeExecutable, args: [npmExecPath, ...args] }
}

export function runRoutinePlan(plan, options = {}) {
  const cwd = options.cwd ?? path.resolve(import.meta.dirname, '..')
  for (const step of plan) {
    console.log(`\n[project:routine] ${step.id}`)
    const invocation = step.command === 'npm'
      ? resolveNpmInvocation(step.args, options)
      : { command: step.command, args: step.args }
    const result = spawnSync(invocation.command, invocation.args, { cwd, stdio: 'inherit', shell: false })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`${step.id} failed with exit code ${result.status}`)
  }
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  const [mode = 'check', ...extraArgs] = process.argv.slice(2)
  runRoutinePlan(resolveRoutinePlan(mode, extraArgs))
}
