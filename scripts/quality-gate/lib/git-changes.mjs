import { spawnSync } from 'node:child_process'

function runGit(root, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  })
  if (result.error) throw result.error
  if (result.status !== 0 && !allowFailure) {
    throw new Error((result.stderr || `git ${args.join(' ')} failed`).trim())
  }
  return result.status === 0 ? result.stdout ?? '' : ''
}

function parseNullTerminated(value) {
  return value.split('\0').map((file) => file.replaceAll('\\', '/')).filter(Boolean)
}

function uniqueSorted(files) {
  return [...new Set(files)].sort((left, right) => left.localeCompare(right, 'en'))
}

export function listWorkingTreeChanges(root) {
  const changed = parseNullTerminated(runGit(root, ['diff', '--name-only', '-z', 'HEAD', '--']))
  const untracked = parseNullTerminated(runGit(root, ['ls-files', '--others', '--exclude-standard', '-z']))
  return uniqueSorted([...changed, ...untracked])
}

function parsePrePushRanges(stdinText) {
  return String(stdinText)
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length >= 4)
    .map(([, localSha, , remoteSha]) => ({ localSha, remoteSha }))
}

function listNewRefChanges(root, localSha) {
  const commits = runGit(root, ['rev-list', localSha, '--not', '--remotes'])
    .split(/\r?\n/)
    .map((commit) => commit.trim())
    .filter(Boolean)
  const files = []
  for (const commit of commits) {
    files.push(...parseNullTerminated(runGit(root, [
      'diff-tree',
      '--root',
      '--no-commit-id',
      '--name-only',
      '-r',
      '-z',
      commit,
    ])))
  }
  return uniqueSorted(files)
}

function listPrePushChanges(root, stdinText) {
  const zero = /^0+$/
  const ranges = parsePrePushRanges(stdinText)
  if (ranges.length === 0) {
    const working = listWorkingTreeChanges(root)
    if (working.length > 0) return { files: working, range: 'working-tree (manual prepush)' }
    const upstream = runGit(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], { allowFailure: true }).trim()
    if (!upstream) return { files: [], range: 'HEAD (no upstream)' }
    return {
      files: parseNullTerminated(runGit(root, ['diff', '--name-only', '-z', `${upstream}..HEAD`, '--'])),
      range: `${upstream}..HEAD`,
    }
  }

  const files = []
  const descriptions = []
  for (const { localSha, remoteSha } of ranges) {
    if (zero.test(localSha)) continue
    if (zero.test(remoteSha)) {
      descriptions.push(`new-ref:${localSha}`)
      files.push(...listNewRefChanges(root, localSha))
    } else {
      descriptions.push(`${remoteSha}..${localSha}`)
      files.push(...parseNullTerminated(runGit(root, ['diff', '--name-only', '-z', `${remoteSha}..${localSha}`, '--'])))
    }
  }
  return { files: uniqueSorted(files), range: descriptions.join(', ') || 'deleted refs only' }
}

export function getGitChanges(root, mode, stdinText = '') {
  if (mode === 'ci') return { files: [], range: 'current checkout (deterministic CI plan)' }
  if (mode === 'prepush') return listPrePushChanges(root, stdinText)
  return { files: listWorkingTreeChanges(root), range: 'HEAD + untracked working tree' }
}
