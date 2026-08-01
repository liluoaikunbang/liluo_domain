import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGrokEnv } from './lib/env.mjs'
import { createLauncherPlan, getRuntimeSettings } from './lib/runtime.mjs'
import { parseArgs } from './grok-image.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TARGET_SCRIPT = path.join(HERE, 'grok-image.mjs')

async function main() {
  const argv = process.argv.slice(2)
  const args = parseArgs(argv)
  const env = await loadGrokEnv()
  const runtime = getRuntimeSettings(args, env.values)
  const launch = createLauncherPlan(runtime, TARGET_SCRIPT, argv)
  const result = spawnSync(process.execPath, launch.nodeArgs, {
    cwd: process.cwd(),
    env: launch.env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  process.exitCode = result.status ?? 0
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    error: error.message,
    code: error.code ?? null,
  }, null, 2)}\n`)
  process.exitCode = 1
})
