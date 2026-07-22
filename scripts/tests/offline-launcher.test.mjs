import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { stageOfflineLauncher } from '../release/offline-release.mjs';

const launcherUrl = new URL('../release/launcher/start-game.ps1', import.meta.url);
const batchUrl = new URL('../release/launcher/启动游戏.bat', import.meta.url);

test('Windows launcher is local-only and protects the release root', async () => {
  const launcher = await readFile(launcherUrl, 'utf8');
  const batch = await readFile(batchUrl, 'utf8');

  assert.match(batch, /powershell(?:\.exe)?/i);
  assert.match(batch, /start-game\.ps1/i);
  assert.match(launcher, /IPAddress\]::Loopback/);
  assert.match(launcher, /GetFullPath/);
  assert.match(launcher, /OrdinalIgnoreCase/);
  assert.match(launcher, /Start-Process/);
  assert.match(launcher, /NoBrowser/);
  assert.doesNotMatch(launcher, /0\.0\.0\.0|IPAddress\]::Any/);
});

test('Windows launcher serves the packaged entry and assets over loopback HTTP', {
  skip: process.platform !== 'win32'
}, async (context) => {
  const buildDir = join(tmpdir(), `liluo-launcher-http-${process.pid}-${Date.now()}`);
  await mkdir(join(buildDir, 'assets'), { recursive: true });
  await writeFile(join(buildDir, 'index.html'), '<title>璃落启动器测试</title>');
  await writeFile(join(buildDir, 'assets', 'app.js'), 'globalThis.liluoReady=true;');
  await stageOfflineLauncher(buildDir);

  const child = spawn('powershell.exe', [
    '-NoLogo',
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', join(buildDir, 'launcher', 'start-game.ps1'),
    '-NoBrowser'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  context.after(() => child.kill());

  const gameUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('启动器未及时输出本机地址')), 10000);
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/LILUO_URL=(http:\/\/127\.0\.0\.1:\d+\/)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`启动器提前退出：${code}`)));
  });

  const entryResponse = await fetch(gameUrl);
  assert.equal(entryResponse.status, 200);
  assert.match(await entryResponse.text(), /璃落启动器测试/);

  const scriptResponse = await fetch(new URL('assets/app.js', gameUrl));
  assert.equal(scriptResponse.status, 200);
  assert.match(scriptResponse.headers.get('content-type'), /text\/javascript/);
  assert.match(await scriptResponse.text(), /liluoReady/);

  const missingResponse = await fetch(new URL('missing.txt', gameUrl));
  assert.equal(missingResponse.status, 404);
});
