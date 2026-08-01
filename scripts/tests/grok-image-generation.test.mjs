import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { detectImageExtension, generateImages } from '../../.agents/skills/liluo-project/liluo-grok-image-generation/scripts/lib/client.mjs'
import { getGrokConfig, isGrokConfigured, loadGrokEnv } from '../../.agents/skills/liluo-project/liluo-grok-image-generation/scripts/lib/env.mjs'
import { DEFAULT_OUTPUT_DIR } from '../../.agents/skills/liluo-project/liluo-grok-image-generation/scripts/lib/paths.mjs'
import { createLauncherPlan, getRuntimeSettings } from '../../.agents/skills/liluo-project/liluo-grok-image-generation/scripts/lib/runtime.mjs'
import { runCli } from '../../.agents/skills/liluo-project/liluo-grok-image-generation/scripts/grok-image.mjs'

const ONE_PIXEL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yX2cAAAAASUVORK5CYII='

test('env loader uses defaults and keeps secrets out of status', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'grok-env-'))
  const envFile = path.join(dir, '.env.grok-image.local')
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\nIGNORED_KEY=nope\n', 'utf8')

  const env = await loadGrokEnv({ envFilePath: envFile })
  const config = getGrokConfig(env.values)
  assert.equal(config.baseUrl, 'https://api.x.ai/v1')
  assert.equal(config.model, 'grok-imagine-image-quality')
  assert.equal(config.apiKey, 'test-key')
  assert.equal(isGrokConfigured(config), true)
  assert.equal(env.warnings.some((item) => item.includes('IGNORED_KEY')), true)

  await rm(dir, { recursive: true, force: true })
})

test('status reports unconfigured when key is absent', async () => {
  const payload = await runCli(['status'], {
    envFilePath: path.join(os.tmpdir(), 'missing-grok-env.local'),
  })
  assert.equal(payload.status, 'unconfigured')
  assert.equal(payload.hasApiKey, false)
  assert.equal(payload.baseUrl, 'https://api.x.ai/v1')
  assert.equal(payload.runtime.useEnvProxy, false)
})

test('status accepts safe cli overrides for model and runtime', async () => {
  const payload = await runCli([
    'status',
    '--base-url',
    'http://127.0.0.1:8787/v1',
    '--model',
    'grok-image-debug',
    '--local-proxy',
    'http://127.0.0.1:7890',
    '--dns-result-order',
    'ipv6first',
  ], {
    envFilePath: path.join(os.tmpdir(), 'missing-grok-env.local'),
  })

  assert.equal(payload.baseUrl, 'http://127.0.0.1:8787/v1')
  assert.equal(payload.model, 'grok-image-debug')
  assert.equal(payload.runtime.localProxyUrl, 'http://127.0.0.1:7890')
  assert.equal(payload.runtime.dnsResultOrder, 'ipv6first')
})

test('generate dry-run plans output without network', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'grok-dry-'))
  const envFile = path.join(dir, '.env.grok-image.local')
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\n', 'utf8')

  const payload = await runCli([
    'generate',
    '--prompt',
    'cinematic portrait of Liluo in rain',
    '--aspect-ratio',
    '16:9',
    '--count',
    '1',
  ], {
    envFilePath: envFile,
  })

  assert.equal(payload.mode, 'dry-run')
  assert.equal(payload.configured, true)
  assert.equal(payload.request.aspectRatio, '16:9')
  assert.match(payload.plannedOutputDir, /liluo-grok-images/)

  await rm(dir, { recursive: true, force: true })
})

test('generate dry-run exposes safe cli overrides in request plan', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'grok-dry-override-'))
  const envFile = path.join(dir, '.env.grok-image.local')
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\n', 'utf8')

  const payload = await runCli([
    'generate',
    '--prompt',
    'concept art of Liluo under crimson rain',
    '--base-url',
    'http://127.0.0.1:8787/v1',
    '--model',
    'grok-image-debug',
    '--resolution',
    '1024x1024',
    '--count',
    '2',
    '--dry-run',
  ], {
    envFilePath: envFile,
  })

  assert.equal(payload.mode, 'dry-run')
  assert.equal(payload.request.baseUrl, 'http://127.0.0.1:8787/v1')
  assert.equal(payload.request.model, 'grok-image-debug')
  assert.equal(payload.request.resolution, '1024x1024')
  assert.equal(payload.request.count, 2)

  await rm(dir, { recursive: true, force: true })
})

test('generate live writes images and manifest without leaking api key', async () => {
  const dir = path.join(DEFAULT_OUTPUT_DIR, 'test-live')
  const envDir = await mkdtemp(path.join(os.tmpdir(), 'grok-live-env-'))
  const envFile = path.join(envDir, '.env.grok-image.local')
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\n', 'utf8')

  const payload = await runCli([
    'generate',
    '--live',
    '--prompt',
    'hero key art for Liluo, windswept hair, rain-soaked neon alley',
    '--out-dir',
    dir,
    '--slug',
    'hero-key-art',
  ], {
    envFilePath: envFile,
    fetchImpl: async () =>
      new Response(JSON.stringify({
        created: 123,
        data: [{ b64_json: ONE_PIXEL_PNG_BASE64, revised_prompt: 'polished prompt' }],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  })

  assert.equal(payload.mode, 'live')
  assert.equal(payload.files.length, 1)
  assert.equal(detectImageExtension(Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64')), '.png')
  const manifest = JSON.parse(await readFile(path.join(dir, path.basename(payload.manifestPath)), 'utf8'))
  assert.equal(JSON.stringify(manifest).includes('test-key'), false)
  assert.equal(JSON.stringify(manifest).includes('Bearer '), false)

  for (const file of payload.files) {
    await rm(file.path.replace(/\//g, path.sep), { force: true })
  }
  await rm(payload.manifestPath.replace(/\//g, path.sep), { force: true })
  await rm(dir, { recursive: true, force: true })
  await rm(envDir, { recursive: true, force: true })
})

test('generate live applies cli retry overrides', async () => {
  const dir = path.join(DEFAULT_OUTPUT_DIR, 'test-live-retry')
  const envDir = await mkdtemp(path.join(os.tmpdir(), 'grok-live-retry-env-'))
  const envFile = path.join(envDir, '.env.grok-image.local')
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\n', 'utf8')

  let attempts = 0
  await assert.rejects(
    () => runCli([
      'generate',
      '--live',
      '--prompt',
      'retry override test',
      '--out-dir',
      dir,
      '--max-attempts',
      '1',
      '--backoff-ms',
      '0',
      '--timeout-ms',
      '2500',
    ], {
      envFilePath: envFile,
      fetchImpl: async () => {
        attempts += 1
        return new Response(JSON.stringify({ error: 'server busy' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        })
      },
    }),
    /HTTP 500/,
  )
  assert.equal(attempts, 1)

  await rm(dir, { recursive: true, force: true })
  await rm(envDir, { recursive: true, force: true })
})

test('runtime settings only allow loopback proxy and produce launcher flags', async () => {
  const settings = getRuntimeSettings({}, {
    LILUO_GROK_IMAGE_LOCAL_PROXY_URL: 'http://127.0.0.1:7890',
    LILUO_GROK_IMAGE_DNS_RESULT_ORDER: 'ipv4first',
  })
  assert.equal(settings.useEnvProxy, true)
  assert.equal(settings.localProxyUrl, 'http://127.0.0.1:7890')
  assert.equal(settings.dnsResultOrder, 'ipv4first')

  const launch = createLauncherPlan(settings, 'target-script.mjs', ['probe'])
  assert.deepEqual(launch.nodeArgs, ['--use-env-proxy', '--dns-result-order=ipv4first', 'target-script.mjs', 'probe'])
  assert.equal(launch.env.HTTPS_PROXY, 'http://127.0.0.1:7890')
  assert.equal(launch.env.HTTP_PROXY, 'http://127.0.0.1:7890')
})

test('runtime settings reject non-loopback proxy endpoints', async () => {
  assert.throws(
    () => getRuntimeSettings({}, { LILUO_GROK_IMAGE_LOCAL_PROXY_URL: 'http://10.0.0.2:7890' }),
    /Local proxy must stay on loopback/,
  )
})

test('cli base-url rejects non-xai remote hosts', async () => {
  await assert.rejects(
    () => runCli(['status', '--base-url', 'https://example.com/v1'], {
      envFilePath: path.join(os.tmpdir(), 'missing-grok-env.local'),
    }),
    /only allows api\.x\.ai or loopback hosts/,
  )
})

test('generateImages surfaces network failures with actionable context', async () => {
  await assert.rejects(
    () =>
      generateImages({
        prompt: 'test prompt',
        config: {
          apiKey: 'test-key',
          baseUrl: 'https://api.x.ai/v1',
          model: 'grok-imagine-image-quality',
        },
        fetchImpl: async () => {
          const error = new TypeError('fetch failed')
          error.cause = { code: 'ETIMEDOUT', message: 'connect ETIMEDOUT api.x.ai:443' }
          throw error
        },
      }),
    (error) => {
      assert.equal(error.code, 'NETWORK_ERROR')
      assert.match(error.message, /api\.x\.ai/)
      assert.match(error.message, /ETIMEDOUT/)
      return true
    },
  )
})

test('probe returns reachability details without consuming image quota', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'grok-probe-'))
  const envFile = path.join(dir, '.env.grok-image.local')
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\nLILUO_GROK_IMAGE_LOCAL_PROXY_URL=http://127.0.0.1:7890\nLILUO_GROK_IMAGE_DNS_RESULT_ORDER=ipv4first\n', 'utf8')

  const payload = await runCli(['probe'], {
    envFilePath: envFile,
    fetchImpl: async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      }),
  })

  assert.equal(payload.command, 'probe')
  assert.equal(payload.probeStatus, 'reachable')
  assert.equal(payload.status, 200)
  assert.equal(payload.runtime.useEnvProxy, true)
  assert.equal(payload.runtime.localProxyUrl, 'http://127.0.0.1:7890')
  assert.equal(payload.runtime.dnsResultOrder, 'ipv4first')

  await rm(dir, { recursive: true, force: true })
})

test('probe uses cli endpoint overrides', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'grok-probe-cli-'))
  const envFile = path.join(dir, '.env.grok-image.local')
  await writeFile(envFile, 'LILUO_GROK_IMAGE_API_KEY=test-key\n', 'utf8')

  let requestedUrl = null
  const payload = await runCli([
    'probe',
    '--base-url',
    'http://127.0.0.1:8787/v1',
    '--timeout-ms',
    '2500',
  ], {
    envFilePath: envFile,
    fetchImpl: async (url) => {
      requestedUrl = String(url)
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      })
    },
  })

  assert.equal(requestedUrl, 'http://127.0.0.1:8787/v1/models')
  assert.equal(payload.endpointHostSummary, 'http://127.0.0.1:8787/v1/models')

  await rm(dir, { recursive: true, force: true })
})
