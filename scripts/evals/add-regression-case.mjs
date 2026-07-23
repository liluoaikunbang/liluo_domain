import { access, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..', '..')

function parseArgs(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--id') options.id = args[++index]
    else if (arg === '--target') options.target = args[++index]
    else if (arg === '--title') options.title = args[++index]
    else throw new Error(`未知参数：${arg}`)
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.id ?? '')) throw new Error('必须提供 kebab-case 的 --id。')
  if (!options.target || !options.title) throw new Error('必须提供 --target 与 --title。')
  return options
}

const options = parseArgs(process.argv.slice(2))
const registry = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root, 'evals', 'registry.json'), 'utf8'))
const target = registry.targets.find((item) => item.name === options.target)
if (!target) throw new Error(`注册表中不存在目标：${options.target}`)
const category = target.type === 'agent' ? 'agents' : 'governance'
const output = path.join(root, 'evals', 'cases', category, `${options.id}.json`)
if (await access(output).then(() => true, () => false)) throw new Error(`案例已存在：${path.relative(root, output)}`)
const expected = {
  requiredSkills: [], allowedSkills: [], forbiddenSkills: [], requiredAgents: [], forbiddenAgents: [],
  requiredReadPaths: [], allowedReadPaths: [], requiredWritePaths: [], allowedWritePaths: [],
  forbiddenActions: ['自动提交', '自动推送'], requiredValidationProfiles: [], forbiddenValidationProfiles: ['all'],
  approvalExpectation: 'conditional',
}
const template = {
  schemaVersion: 1, id: options.id, title: options.title, targetType: target.type, target: target.name,
  status: 'planned', polarity: 'negative', mode: 'routing-plan', costTier: 'standard',
  userPrompt: '<请将已确认需要长期防回归的行为改写为独立任务，不要粘贴聊天原文>', contextFiles: [], expected,
}
await writeFile(output, `${JSON.stringify(template, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
console.log(`已创建待填写案例：${path.relative(root, output)}`)
