import { spawn } from 'node:child_process';
import { access, copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const offlineBuildDir = join(projectRoot, 'dist-offline');
const releaseDir = join(projectRoot, 'release');
const launcherSourceDir = join(projectRoot, 'scripts', 'release', 'launcher');

function assertSafeTag(tag) {
  if (!tag || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(tag)) {
    throw new Error('发布标签只能包含字母、数字、点、下划线和连字符，且不能包含路径。');
  }
}

export function parseReleaseArguments(args) {
  let tag = '';
  let dryRun = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dry-run') dryRun = true;
    else if (argument === '--tag') {
      tag = args[index + 1] ?? '';
      index += 1;
    } else if (argument.startsWith('--tag=')) tag = argument.slice('--tag='.length);
    else throw new Error(`未知参数：${argument}`);
  }
  if (!tag) throw new Error('缺少必需参数 --tag，例如：--tag v1.2.3');
  assertSafeTag(tag);
  return { tag, dryRun };
}

export function createArchiveName(projectName, versionOrTag) {
  assertSafeTag(versionOrTag);
  const safeProjectName = projectName.replace(/[^A-Za-z0-9._-]+/g, '-');
  return `${safeProjectName}-${versionOrTag}-offline.zip`;
}

export function createReleaseCommands(tag, archivePath) {
  assertSafeTag(tag);
  return {
    inspect: ['release', 'view', tag],
    upload: ['release', 'upload', tag, archivePath, '--clobber'],
    create: ['release', 'create', tag, archivePath, '--verify-tag', '--title', tag, '--generate-notes'],
  };
}

export function createBuildCommand(platform, commandShell = 'cmd.exe') {
  return platform === 'win32'
    ? { command: commandShell, args: ['/d', '/s', '/c', 'npm run build:offline'] }
    : { command: 'npm', args: ['run', 'build:offline'] };
}

function extractHtmlReferences(html) {
  return [...html.matchAll(/\b(?:src|href)=(['"])(.*?)\1/gi)].map((match) => match[2]);
}

export async function validateOfflineBuild(buildDir = offlineBuildDir) {
  const entryFile = join(buildDir, 'index.html');
  const html = await readFile(entryFile, 'utf8').catch(() => {
    throw new Error(`离线入口不存在：${entryFile}`);
  });
  const problems = [];
  for (const launcherPath of ['启动游戏.bat', join('launcher', 'start-game.ps1')]) {
    try {
      await access(join(buildDir, launcherPath));
    } catch {
      problems.push(`离线启动器不存在：${launcherPath}`);
    }
  }
  if (/<script\b[^>]*\btype=(['"])module\1/i.test(html)) {
    problems.push('入口仍包含 type="module"，不能保证通过 file:// 运行');
  }
  if (/\bcrossorigin(?:\s|=|>)/i.test(html)) {
    problems.push('入口仍包含 crossorigin，可能触发 file:// 本地资源 CORS 限制');
  }
  const localReferences = [];
  for (const reference of extractHtmlReferences(html)) {
    if (/^(?:data:|#)/i.test(reference)) continue;
    if (/^(?:https?:)?\/\//i.test(reference)) {
      problems.push(`入口包含远程资源：${reference}`);
      continue;
    }
    if (reference.startsWith('/')) {
      problems.push(`入口包含绝对部署路径：${reference}`);
      continue;
    }
    const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const target = resolve(buildDir, cleanReference);
    const relativeTarget = relative(resolve(buildDir), target);
    if (relativeTarget.startsWith('..') || isAbsolute(relativeTarget)) {
      problems.push(`入口引用越出构建目录：${reference}`);
      continue;
    }
    try {
      await access(target);
      localReferences.push(reference);
    } catch {
      problems.push(`入口引用不存在：${reference}`);
    }
  }
  if (problems.length > 0) throw new Error(`离线产物校验失败：\n- ${problems.join('\n- ')}`);
  const files = await readdir(buildDir, { recursive: true, withFileTypes: true });
  return {
    entryFile,
    fileCount: files.filter((entry) => entry.isFile()).length,
    localReferenceCount: localReferences.length,
  };
}

export async function stageOfflineLauncher(buildDir = offlineBuildDir) {
  const launcherDir = join(buildDir, 'launcher');
  await mkdir(launcherDir, { recursive: true });
  await copyFile(join(launcherSourceDir, '启动游戏.bat'), join(buildDir, '启动游戏.bat'));
  await copyFile(join(launcherSourceDir, 'start-game.ps1'), join(launcherDir, 'start-game.ps1'));
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: false,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolvePromise({ code, stdout, stderr }));
  });
}

async function runRequired(command, args, options = {}) {
  const result = await run(command, args, options);
  if (result.code !== 0) {
    const details = result.stderr.trim();
    throw new Error(`命令执行失败（退出码 ${result.code}）：${command} ${args.join(' ')}${details ? `\n${details}` : ''}`);
  }
}

async function readPackageMetadata() {
  return JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
}

async function buildAndArchive(versionOrTag) {
  const packageMetadata = await readPackageMetadata();
  const buildCommand = createBuildCommand(process.platform, process.env.ComSpec ?? 'cmd.exe');
  await runRequired(buildCommand.command, buildCommand.args);
  await stageOfflineLauncher();
  const validation = await validateOfflineBuild();
  await mkdir(releaseDir, { recursive: true });
  const archiveName = createArchiveName(packageMetadata.name, versionOrTag);
  const archivePath = join(releaseDir, archiveName);
  await runRequired('tar', ['-a', '-c', '-f', archivePath, '-C', offlineBuildDir, '.']);
  const archiveStats = await stat(archivePath);
  if (archiveStats.size === 0) throw new Error(`压缩包为空：${archivePath}`);
  await runRequired('tar', ['-t', '-f', archivePath], { capture: true });
  console.log(`离线网页：${relative(projectRoot, validation.entryFile)}`);
  console.log(`用户入口：${relative(projectRoot, join(offlineBuildDir, '启动游戏.bat'))}`);
  console.log(`构建文件：${validation.fileCount} 个`);
  console.log(`发行压缩包：${relative(projectRoot, archivePath)}（${(archiveStats.size / 1024 / 1024).toFixed(2)} MB）`);
  return archivePath;
}

async function packageOffline() {
  const packageMetadata = await readPackageMetadata();
  await buildAndArchive(`v${packageMetadata.version}`);
}

async function releaseOffline(args) {
  const { tag, dryRun } = parseReleaseArguments(args);
  const archivePath = await buildAndArchive(tag);
  const relativeArchivePath = relative(projectRoot, archivePath).replaceAll('\\', '/');
  const commands = createReleaseCommands(tag, relativeArchivePath);
  if (dryRun) {
    console.log(`Dry run：将发布 ${relativeArchivePath} 到 GitHub Release ${tag}，未访问 GitHub。`);
    return;
  }
  await runRequired('gh', ['auth', 'status']);
  const existingRelease = await run('gh', commands.inspect, { capture: true });
  if (existingRelease.code === 0) await runRequired('gh', commands.upload);
  else await runRequired('gh', commands.create);
  console.log(`已上传到 GitHub Release：${tag}`);
}

async function main() {
  const [action, ...args] = process.argv.slice(2);
  if (action === 'package') return packageOffline();
  if (action === 'release') return releaseOffline(args);
  throw new Error('用法：offline-release.mjs <package|release> [--tag <tag>] [--dry-run]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
