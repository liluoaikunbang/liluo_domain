import { spawnSync } from 'node:child_process'

export function resolveCommandInvocation(command, options = {}) {
  const parts = command.trim().split(/\s+/)
  if (parts[0] === 'npm') {
    const npmExecPath = options.npmExecPath ?? process.env.npm_execpath
    const platform = options.platform ?? process.platform
    if (npmExecPath) return { executable: process.execPath, args: [npmExecPath, ...parts.slice(1)] }
    if (platform === 'win32') {
      return {
        executable: options.comSpec ?? process.env.ComSpec ?? 'cmd.exe',
        args: ['/d', '/s', '/c', 'npm', ...parts.slice(1)],
      }
    }
    return { executable: 'npm', args: parts.slice(1) }
  }
  if (parts[0] === 'node') return { executable: process.execPath, args: parts.slice(1) }
  throw new Error(`Unsupported quality-gate command: ${command}`)
}

export function runCommand(command, { cwd, quiet = false } = {}) {
  const startedAt = Date.now()
  const invocation = resolveCommandInvocation(command)
  const result = spawnSync(invocation.executable, invocation.args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  })
  if (!quiet && result.stdout) process.stdout.write(result.stdout)
  if (!quiet && result.stderr) process.stderr.write(result.stderr)
  return {
    command,
    exitCode: result.error ? null : result.status,
    durationMs: Date.now() - startedAt,
    ok: !result.error && result.status === 0,
    error: result.error?.message ?? (result.status === 0 ? null : `exit code ${result.status}`),
  }
}
