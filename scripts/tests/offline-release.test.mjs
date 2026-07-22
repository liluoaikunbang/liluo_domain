import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createArchiveName,
  createBuildCommand,
  createReleaseCommands,
  parseReleaseArguments,
  stageOfflineLauncher,
  validateOfflineBuild,
} from '../release/offline-release.mjs';

async function writeLauncherFixture(buildDir) {
  await mkdir(join(buildDir, 'launcher'), { recursive: true });
  await writeFile(join(buildDir, '启动游戏.bat'), '@echo off\r\n');
  await writeFile(join(buildDir, 'launcher', 'start-game.ps1'), 'Write-Host ready\n');
}

test('offline Vite build keeps assets separate and emits a classic-script bundle', async () => {
  const config = await readFile(new URL('../../vite.config.mjs', import.meta.url), 'utf8');

  assert.match(config, /outDir:\s*'dist-offline'/);
  assert.match(config, /assetsInlineLimit:\s*0/);
  assert.match(config, /format:\s*'iife'/);
  assert.match(config, /inlineDynamicImports:\s*true/);
  assert.match(config, /crossorigin/g);
  assert.doesNotMatch(config, /viteSingleFile/);
});

test('release arguments require an explicit valid tag', () => {
  assert.deepEqual(parseReleaseArguments(['--tag', 'v1.2.3']), {
    tag: 'v1.2.3',
    dryRun: false,
  });
  assert.deepEqual(parseReleaseArguments(['--tag=v1.2.3', '--dry-run']), {
    tag: 'v1.2.3',
    dryRun: true,
  });
  assert.throws(() => parseReleaseArguments([]), /--tag/);
  assert.throws(() => parseReleaseArguments(['--tag', '../bad']), /标签/);
});

test('archive names are filesystem-safe and identify offline builds', () => {
  assert.equal(createArchiveName('liluo_domain', 'v1.2.3'), 'liluo_domain-v1.2.3-offline.zip');
  assert.throws(() => createArchiveName('liluo_domain', 'release/latest'), /标签/);
});

test('offline build validation accepts classic relative entry references', async () => {
  const buildDir = join(tmpdir(), `liluo-offline-valid-${process.pid}-${Date.now()}`);
  await mkdir(join(buildDir, 'assets'), { recursive: true });
  await writeFile(join(buildDir, 'index.html'), '<link rel="stylesheet" href="./assets/app.css"><script defer src="./assets/app.js"></script>');
  await writeFile(join(buildDir, 'assets', 'app.css'), 'body{}');
  await writeFile(join(buildDir, 'assets', 'app.js'), 'globalThis.appReady=true;');
  await writeLauncherFixture(buildDir);

  const result = await validateOfflineBuild(buildDir);
  assert.equal(result.entryFile, join(buildDir, 'index.html'));
  assert.equal(result.localReferenceCount, 2);
});

test('offline build validation requires the one-click launcher', async () => {
  const buildDir = join(tmpdir(), `liluo-offline-no-launcher-${process.pid}-${Date.now()}`);
  await mkdir(buildDir, { recursive: true });
  await writeFile(join(buildDir, 'index.html'), '<title>璃落</title>');

  await assert.rejects(() => validateOfflineBuild(buildDir), /启动游戏\.bat|start-game\.ps1/);
});

test('launcher staging copies both Windows launcher files into the build', async () => {
  const buildDir = join(tmpdir(), `liluo-offline-launcher-${process.pid}-${Date.now()}`);
  await mkdir(buildDir, { recursive: true });

  await stageOfflineLauncher(buildDir);

  assert.match(await readFile(join(buildDir, '启动游戏.bat'), 'utf8'), /start-game\.ps1/);
  assert.match(await readFile(join(buildDir, 'launcher', 'start-game.ps1'), 'utf8'), /127\.0\.0\.1/);
});

test('offline build validation rejects module, absolute, remote, and missing references', async () => {
  const buildDir = join(tmpdir(), `liluo-offline-invalid-${process.pid}-${Date.now()}`);
  await mkdir(buildDir, { recursive: true });
  await writeFile(join(buildDir, 'index.html'), '<script type="module" crossorigin src="/domain/app.js"></script><img src="https://example.com/a.png">');

  await assert.rejects(() => validateOfflineBuild(buildDir), /type="module"|crossorigin|绝对部署路径|远程资源|不存在/);
});

test('release command plan verifies tags and never pushes source', () => {
  assert.deepEqual(createReleaseCommands('v1.2.3', 'release/liluo_domain-v1.2.3-offline.zip'), {
    inspect: ['release', 'view', 'v1.2.3'],
    upload: ['release', 'upload', 'v1.2.3', 'release/liluo_domain-v1.2.3-offline.zip', '--clobber'],
    create: ['release', 'create', 'v1.2.3', 'release/liluo_domain-v1.2.3-offline.zip', '--verify-tag', '--title', 'v1.2.3', '--generate-notes'],
  });
});

test('Windows builds invoke npm through the native command shell', () => {
  assert.deepEqual(createBuildCommand('win32', 'C:\\Windows\\System32\\cmd.exe'), {
    command: 'C:\\Windows\\System32\\cmd.exe',
    args: ['/d', '/s', '/c', 'npm run build:offline'],
  });
  assert.deepEqual(createBuildCommand('linux'), {
    command: 'npm',
    args: ['run', 'build:offline'],
  });
});
