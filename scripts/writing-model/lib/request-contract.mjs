import { readFile } from 'node:fs/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { repoPath } from './paths.mjs'

export async function loadFormalProseRequest(filePath) {
  const absolute = pathIsAbsolute(filePath) ? filePath : repoPath(filePath)
  const data = JSON.parse(await readFile(absolute, 'utf8'))
  const validation = await validateFormalProseRequest(data)
  if (!validation.ok) {
    const error = new Error(`写作合同校验失败：\n${validation.errors.join('\n')}`)
    error.code = 'INVALID_REQUEST_CONTRACT'
    error.errors = validation.errors
    throw error
  }
  return { data, absolutePath: absolute }
}

export async function validateFormalProseRequest(data) {
  const schema = JSON.parse(await readFile(repoPath('schemas/workflows/formal-prose-request.schema.json'), 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  const ok = validate(data)
  const errors = ok ? [] : (validate.errors ?? []).map((item) => `${item.instancePath || '/'} ${item.message}`)
  if (Array.isArray(data?.canonSources)) {
    for (const source of data.canonSources) {
      if (/^[A-Za-z]:\\/.test(source) || source.startsWith('/')) {
        errors.push(`canonSources 不得使用绝对路径：${source}`)
      }
    }
  }
  if (JSON.stringify(data).includes('API_KEY') || JSON.stringify(data).toLowerCase().includes('bearer ')) {
    errors.push('合同不得包含 API Key 或 Bearer Token')
  }
  return { ok: errors.length === 0, errors }
}

export function buildChatMessages(contract, styleSnippets = []) {
  const lines = [
    '你是璃落项目的正式正文候选生成器。只输出 Markdown 正文，不要解释，不要标题（除非合同允许）。',
    '不得改写 immutableFacts，不得新增 forbiddenAdditions 中禁止的组织、能力、物品、关系或世界规则。',
    '',
    `目的：${contract.purpose}`,
    `世界：${contract.scene.world}`,
    `地点：${contract.scene.location}`,
    `时间：${contract.scene.time}`,
    `视角：${contract.scene.pov}`,
    `叙事焦点：${contract.scene.narrativeFocus}`,
    `场景目标：${contract.scene.goal}`,
    `目标字数：${contract.expression.targetChineseCharacters.min}-${contract.expression.targetChineseCharacters.max}`,
    '',
    '不可变事实：',
    ...contract.immutableFacts.map((item) => `- ${item}`),
    '',
    '必备节拍：',
    ...(contract.scene.requiredBeats.length ? contract.scene.requiredBeats.map((item) => `- ${item}`) : ['- （无）']),
    '',
    '禁止新增：',
    ...(contract.scene.forbiddenAdditions.length ? contract.scene.forbiddenAdditions.map((item) => `- ${item}`) : ['- （无）']),
  ]
  if (styleSnippets.length) {
    lines.push('', '显式文风参考（用户/主智能体指定，非自动检索）：')
    for (const snippet of styleSnippets) {
      lines.push(`--- ${snippet.id} ---`, snippet.text.slice(0, 1200))
    }
  }
  return [
    { role: 'system', content: '你只生成符合合同的中文小说正文候选。不写入项目正式文件。' },
    { role: 'user', content: lines.join('\n') },
  ]
}

function pathIsAbsolute(filePath) {
  return /^[A-Za-z]:[\\/]/.test(filePath) || filePath.startsWith('/') || filePath.startsWith('\\\\')
}
