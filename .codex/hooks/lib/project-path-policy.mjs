import path from 'node:path'

const PLACEHOLDER = /^(?:your[_-]?(?:api[_-]?)?key|<[^>]+>|test(?:[-_].*)?|fake(?:[-_].*)?|example(?:[-_].*)?|dummy(?:[-_].*)?|x{6,})$/i
const SECRET_PATTERNS = [
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*\b/i,
]
const PROTECTED_EDIT_PREFIXES = [
  '.git/',
  'node_modules/',
  'dist/',
  'reports/',
  'project-index/',
]

function normalize(value) {
  return String(value ?? '').trim().replaceAll('\\', '/').replace(/^\.\/+/, '')
}

function block(reason) {
  return { allowed: false, reason }
}

export function evaluatePromptSecrets(prompt = '') {
  const text = String(prompt)
  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
    return block('检测到疑似真实密钥。不要把真实密钥放入聊天或仓库；若已经暴露，请立即轮换。')
  }
  for (const match of text.matchAll(/(?:^|\n)\s*[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*["']?([^\s"'#]+)["']?/g)) {
    const value = match[1]
    if (value.length >= 16 && !PLACEHOLDER.test(value)) {
      return block('检测到 .env 风格的真实凭据赋值。不要把真实密钥放入聊天或仓库；若已经暴露，请立即轮换。')
    }
  }
  return { allowed: true }
}

function extractEditedPaths(toolInput = {}) {
  const paths = []
  for (const key of ['file_path', 'path', 'filePath']) if (toolInput[key]) paths.push(toolInput[key])
  const patch = String(toolInput.patch ?? toolInput.input ?? '')
  for (const match of patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s+(.+)$/gm)) paths.push(match[1])
  return [...new Set(paths.map(normalize).filter(Boolean))]
}

function repositoryRelativeFile(file, repositoryRoot) {
  const absolute = path.isAbsolute(file) ? path.resolve(file) : path.resolve(repositoryRoot, file)
  const root = path.resolve(repositoryRoot)
  const relative = path.relative(root, absolute)
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) return normalize(relative)
  return normalize(file)
}

function evaluateEditedPath(file, repositoryRoot) {
  const relativeFile = repositoryRelativeFile(file, repositoryRoot)
  const lower = relativeFile.toLowerCase()
  if (lower === '.env' || /\/\.env$/.test(lower)) return block('禁止直接写入 .env；请使用 .env.example 占位。')
  if (lower.endsWith('/.env.example') || lower === '.env.example') return { allowed: true }
  if (PROTECTED_EDIT_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return block(`禁止直接编辑受保护或生成路径：${relativeFile}`)
  }
  if (/\.codex\/auth\.json$/i.test(lower) || /(?:^|\/)(?:credentials|auth-token)\.(?:json|txt)$/i.test(lower)) {
    return block('禁止直接编辑本地认证文件。')
  }
  if (/(?:^|\/)(?:save-exports?|exports?\/saves?)\/.*\.json$/i.test(lower)) {
    return block('禁止直接编辑真实存档导出文件；测试 fixture 必须放在 scripts/tests 或 evals。')
  }
  return { allowed: true }
}

function hasDeleteVerb(command) {
  return /\b(?:rm|del|rmdir|remove-item)\b/i.test(command)
}

function targetsRepositoryRoot(command, repositoryRoot) {
  if (!hasDeleteVerb(command)) return false
  const normalized = command.replaceAll('\\', '/')
  const root = normalize(path.resolve(repositoryRoot)).replace(/\/+$/, '')
  const parent = normalize(path.dirname(path.resolve(repositoryRoot))).replace(/\/+$/, '')
  const exactTarget = [root, parent].filter(Boolean).some((target) => {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`${escaped}/?(?:["']|\\s|$)`, 'i').test(normalized)
  })
  const dotTarget = /\b(?:rm|rmdir|del)\b[^\r\n]*(?:\s|["'])(?:\.\.?)(?:["']|\s|$)/i.test(normalized)
    || /\bRemove-Item\b[^\r\n]*(?:-LiteralPath|-Path)\s+["']?(?:\.\.?)["']?(?:\s|$)/i.test(normalized)
  return exactTarget || dotTarget
}

function deletesCriticalDirectory(command) {
  if (!hasDeleteVerb(command)) return false
  const lower = command.replaceAll('\\', '/').toLowerCase()
  const recursive = /\b(?:rm\s+-[a-z]*r|rmdir\s+\/s|del\s+\/s|remove-item\b[^\r\n]*-(?:recurse|r)[\s-])/i.test(command)
  if (!recursive) return false
  return ['src', 'docs', '.agents', '.codex', 'schemas', 'evals']
    .some((directory) => new RegExp(`(?:^|[\\s"'=])(?:\\./)?${directory}/?(?:[\\s"']|$)`, 'i').test(lower))
}

function evaluateShell(command, repositoryRoot) {
  const lower = command.toLowerCase()
  const normalizedLower = lower.replaceAll('\\', '/')
  if (/\bgit\s+reset\s+--hard\b/i.test(command)) return block('禁止 git reset --hard。')
  if (/\bgit\s+clean\s+-[a-z]*f[a-z]*d|\bgit\s+clean\s+-[a-z]*d[a-z]*f/i.test(command)) return block('禁止 git clean 的强制目录清理。')
  if (/\bgit\s+push\b[^\r\n]*(?:--force(?:-with-lease)?|-f)(?:\s|$)/i.test(command)) return block('禁止强制推送。')
  if (/\bgit\s+checkout\s+--\s+\.(?:\s|$)/i.test(command)) return block('禁止丢弃整个工作区的 git checkout -- .。')
  if (/\bgit\s+restore\s+\.(?:\s|$)/i.test(command)) return block('禁止丢弃整个工作区的 git restore .。')
  if (targetsRepositoryRoot(command, repositoryRoot)) return block('禁止递归删除仓库根目录或上级目录。')
  if (deletesCriticalDirectory(command)) return block('禁止清空整个项目关键目录。')
  if (/(?:~|%userprofile%|\$home)[/\\]\.codex[/\\]auth\.json/i.test(command)) return block('禁止读取或输出 Codex 登录文件。')
  if (
    /\b(?:echo|write-output|printenv|set)\b[^\r\n]*(?:OPENAI_API_KEY|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY|API_KEY|ACCESS_TOKEN)/i.test(command)
    || /\bGet-ChildItem\s+Env:/i.test(command)
  ) return block('禁止输出环境中的密钥变量。')
  if (/\bgit\s+add\b[^\r\n]*(?:^|[\s"'])(?:\.env|.*\/\.env|.*auth\.json)(?:[\s"']|$)/i.test(command)) {
    return block('禁止将 .env 或认证文件加入 Git。')
  }
  if (
    normalizedLower.includes('.git/')
    && /\b(?:set-content|out-file|add-content|copy-item|move-item|remove-item|rm|del|rmdir)\b|[>]/i.test(command)
  ) return block('禁止直接改写 .git/。')
  return { allowed: true }
}

export function evaluateToolRequest(input = {}, repositoryRoot = process.cwd()) {
  const toolName = String(input.tool_name ?? input.toolName ?? '')
  const toolInput = input.tool_input ?? input.toolInput ?? {}
  if (/^(?:Bash|Shell|shell_command)$/i.test(toolName)) {
    return evaluateShell(String(toolInput.command ?? toolInput.cmd ?? ''), repositoryRoot)
  }
  if (/^(?:apply_patch|Edit|Write)$/i.test(toolName)) {
    for (const file of extractEditedPaths(toolInput)) {
      const result = evaluateEditedPath(file, repositoryRoot)
      if (!result.allowed) return result
    }
  }
  return { allowed: true }
}
