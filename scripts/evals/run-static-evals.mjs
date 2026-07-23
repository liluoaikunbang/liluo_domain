import path from 'node:path'
import { validateEvalSystem } from './validate-eval-registry.mjs'

function parseArgs(args) {
  const options = { scope: 'changed', json: false }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--scope') options.scope = args[++index]
    else if (arg === '--json') options.json = true
    else throw new Error(`未知参数：${arg}`)
  }
  if (!['changed', 'all'].includes(options.scope)) throw new Error('--scope 仅允许 changed 或 all。')
  return options
}

const options = parseArgs(process.argv.slice(2))
const result = await validateEvalSystem(path.resolve(import.meta.dirname, '..', '..'), { scope: options.scope })
if (options.json) console.log(JSON.stringify(result))
else {
  console.log(`[evals:static] scope=${options.scope} targets=${result.counts.targets} cases=${result.counts.cases}`)
  for (const error of result.errors) console.error(`FAIL ${error.check}: ${JSON.stringify(error)}`)
  for (const warning of result.warnings) console.warn(`WARN ${warning.check}: ${warning.message ?? JSON.stringify(warning)}`)
  console.log(result.pass ? 'PASS static capability integrity' : `FAIL ${result.errors.length} static capability checks`)
}
if (!result.pass) process.exitCode = 1
