import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { getR2Config, isR2Configured, loadAssetEnv } from '../assets/lib/env.mjs'
import { runCli } from '../assets/visual-asset-manager.mjs'

const ONE_PIXEL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yX2cAAAAASUVORK5CYII='

function createManifest(sourcePath) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-08-01',
    managedRoots: ['website', 'game'],
    assets: [
      {
        id: 'hero-test',
        title: 'Hero Test',
        sourcePath,
        collection: 'website',
        group: 'hero',
        type: 'concept',
        source: 'gpt-image-2',
        status: 'queued',
        remoteDir: 'website/hero/liluo-universe',
        slug: 'portal-hero-v01',
      },
    ],
  }
}

async function fakePrepare(asset, options = {}) {
  const outputDir = path.join(options.stageDir, asset.remoteDir, asset.slug)
  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, 'large.webp'), 'large', 'utf8')
  await writeFile(path.join(outputDir, 'medium.webp'), 'medium', 'utf8')
  await writeFile(path.join(outputDir, 'thumb.webp'), 'thumb', 'utf8')
  return {
    sourcePath: asset.sourcePath,
    sourceSha256: 'fake-source-hash',
    outputDir,
    sourceWidth: 1200,
    sourceHeight: 800,
    variants: {
      large: {
        path: path.join(outputDir, 'large.webp'),
        width: 1200,
        height: 800,
        sizeBytes: 111,
        contentType: 'image/webp',
      },
      medium: {
        path: path.join(outputDir, 'medium.webp'),
        width: 900,
        height: 600,
        sizeBytes: 88,
        contentType: 'image/webp',
      },
      thumb: {
        path: path.join(outputDir, 'thumb.webp'),
        width: 480,
        height: 320,
        sizeBytes: 44,
        contentType: 'image/webp',
      },
    },
  }
}

test('asset env loader derives endpoint from account id', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'asset-env-'))
  const envFile = path.join(dir, '.env.assets.local')
  await writeFile(envFile, 'LILUO_ASSET_R2_ACCOUNT_ID=acct123\nLILUO_ASSET_R2_ACCESS_KEY_ID=test-key\nLILUO_ASSET_R2_SECRET_ACCESS_KEY=secret\n', 'utf8')

  const env = await loadAssetEnv({ envFilePath: envFile })
  const config = getR2Config(env.values)
  assert.equal(config.endpoint, 'https://acct123.r2.cloudflarestorage.com')
  assert.equal(isR2Configured(config), true)

  await rm(dir, { recursive: true, force: true })
})

test('prepare command stages webp variants without needing network', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'asset-prepare-'))
  const sourcePath = path.join(dir, 'hero.png')
  const manifestPath = path.join(dir, 'manifest.json')
  await writeFile(sourcePath, Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'))
  await writeFile(manifestPath, JSON.stringify(createManifest(sourcePath), null, 2), 'utf8')

  const payload = await runCli(['prepare', '--manifest', manifestPath], {
    stageDir: path.join(dir, 'stage'),
    envFilePath: path.join(dir, 'missing.env'),
    prepareImpl: fakePrepare,
  })

  assert.equal(payload.command, 'prepare')
  assert.equal(payload.assetCount, 1)
  assert.match(payload.assets[0].variants.large.stagedPath, /large\.webp$/)

  await rm(dir, { recursive: true, force: true })
})

test('upload live writes public urls back to manifest using mocked fetch', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'asset-upload-'))
  const sourcePath = path.join(dir, 'hero.png')
  const manifestPath = path.join(dir, 'manifest.json')
  const envFile = path.join(dir, '.env.assets.local')
  await writeFile(sourcePath, Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'))
  await writeFile(manifestPath, JSON.stringify(createManifest(sourcePath), null, 2), 'utf8')
  await writeFile(envFile, [
    'LILUO_ASSET_R2_ACCOUNT_ID=acct123',
    'LILUO_ASSET_R2_ACCESS_KEY_ID=test-key',
    'LILUO_ASSET_R2_SECRET_ACCESS_KEY=test-secret',
    'LILUO_ASSET_R2_PUBLIC_BASE_URL=https://assets.example.com',
  ].join('\n'), 'utf8')

  const requests = []
  const payload = await runCli(['upload', '--manifest', manifestPath, '--live'], {
    stageDir: path.join(dir, 'stage'),
    envFilePath: envFile,
    prepareImpl: fakePrepare,
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), headers: init.headers })
      return new Response('', { status: 200, headers: { etag: '"etag-test"' } })
    },
  })

  assert.equal(payload.mode, 'live')
  assert.equal(requests.length, 3)
  assert.equal(String(requests[0].headers.authorization).startsWith('AWS4-HMAC-SHA256 '), true)

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  assert.equal(manifest.assets[0].status, 'published')
  assert.equal(manifest.assets[0].published.variants.large.url, 'https://assets.example.com/website/hero/liluo-universe/portal-hero-v01/large.webp')

  await rm(dir, { recursive: true, force: true })
})

test('upload live fails closed when public base url is missing', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'asset-upload-fail-'))
  const sourcePath = path.join(dir, 'hero.png')
  const manifestPath = path.join(dir, 'manifest.json')
  const envFile = path.join(dir, '.env.assets.local')
  await writeFile(sourcePath, Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'))
  await writeFile(manifestPath, JSON.stringify(createManifest(sourcePath), null, 2), 'utf8')
  await writeFile(envFile, [
    'LILUO_ASSET_R2_ACCOUNT_ID=acct123',
    'LILUO_ASSET_R2_ACCESS_KEY_ID=test-key',
    'LILUO_ASSET_R2_SECRET_ACCESS_KEY=test-secret',
  ].join('\n'), 'utf8')

  await assert.rejects(
    () => runCli(['upload', '--manifest', manifestPath, '--live'], {
      stageDir: path.join(dir, 'stage'),
      envFilePath: envFile,
      prepareImpl: fakePrepare,
    }),
    /PUBLIC_BASE_URL/,
  )

  await rm(dir, { recursive: true, force: true })
})

test('prune dry-run reports remote keys not referenced by current manifest', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'asset-prune-dry-run-'))
  const sourcePath = path.join(dir, 'hero.png')
  const manifestPath = path.join(dir, 'manifest.json')
  const envFile = path.join(dir, '.env.assets.local')
  await writeFile(sourcePath, Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'))
  await writeFile(manifestPath, JSON.stringify(createManifest(sourcePath), null, 2), 'utf8')
  await writeFile(envFile, [
    'LILUO_ASSET_R2_ACCOUNT_ID=acct123',
    'LILUO_ASSET_R2_ACCESS_KEY_ID=test-key',
    'LILUO_ASSET_R2_SECRET_ACCESS_KEY=test-secret',
  ].join('\n'), 'utf8')

  const payload = await runCli(['prune', '--manifest', manifestPath], {
    envFilePath: envFile,
    fetchImpl: async (url, init) => {
      assert.equal(init.method, 'GET')
      const prefix = new URL(String(url)).searchParams.get('prefix')
      if (prefix === 'website/') {
        return new Response([
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<ListBucketResult>',
          '<IsTruncated>false</IsTruncated>',
          '<Contents><Key>website/hero/liluo-universe/portal-hero-v01/large.webp</Key></Contents>',
          '<Contents><Key>website/hero/liluo-universe/portal-hero-v01/medium.webp</Key></Contents>',
          '<Contents><Key>website/hero/liluo-universe/portal-hero-v01/thumb.webp</Key></Contents>',
          '<Contents><Key>website/hero/liluo-universe/old-slug-v00/large.webp</Key></Contents>',
          '</ListBucketResult>',
        ].join(''), { status: 200 })
      }
      if (prefix === 'game/') {
        return new Response('<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>', { status: 200 })
      }
      throw new Error(`Unexpected prefix: ${prefix}`)
    },
  })

  assert.equal(payload.command, 'prune')
  assert.equal(payload.mode, 'dry-run')
  assert.equal(payload.staleObjectCount, 1)
  assert.deepEqual(payload.staleObjects, ['website/hero/liluo-universe/old-slug-v00/large.webp'])

  await rm(dir, { recursive: true, force: true })
})

test('prune live deletes stale remote keys after listing managed roots', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'asset-prune-live-'))
  const sourcePath = path.join(dir, 'hero.png')
  const manifestPath = path.join(dir, 'manifest.json')
  const envFile = path.join(dir, '.env.assets.local')
  await writeFile(sourcePath, Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'))
  await writeFile(manifestPath, JSON.stringify(createManifest(sourcePath), null, 2), 'utf8')
  await writeFile(envFile, [
    'LILUO_ASSET_R2_ACCOUNT_ID=acct123',
    'LILUO_ASSET_R2_ACCESS_KEY_ID=test-key',
    'LILUO_ASSET_R2_SECRET_ACCESS_KEY=test-secret',
  ].join('\n'), 'utf8')

  const deleted = []
  const payload = await runCli(['prune', '--manifest', manifestPath, '--live'], {
    envFilePath: envFile,
    fetchImpl: async (url, init) => {
      if (init.method === 'GET') {
        const prefix = new URL(String(url)).searchParams.get('prefix')
        if (prefix === 'website/') {
          return new Response([
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<ListBucketResult>',
            '<IsTruncated>false</IsTruncated>',
            '<Contents><Key>website/hero/liluo-universe/portal-hero-v01/large.webp</Key></Contents>',
            '<Contents><Key>website/hero/liluo-universe/portal-hero-v01/medium.webp</Key></Contents>',
            '<Contents><Key>website/hero/liluo-universe/portal-hero-v01/thumb.webp</Key></Contents>',
            '<Contents><Key>website/hero/liluo-universe/old-slug-v00/thumb.webp</Key></Contents>',
            '</ListBucketResult>',
          ].join(''), { status: 200 })
        }
        if (prefix === 'game/') {
          return new Response('<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>', { status: 200 })
        }
      }

      if (init.method === 'DELETE') {
        deleted.push(String(url))
        return new Response('', { status: 200 })
      }

      throw new Error(`Unexpected request: ${init.method} ${String(url)}`)
    },
  })

  assert.equal(payload.mode, 'live')
  assert.equal(payload.staleObjectCount, 1)
  assert.equal(deleted.length, 1)
  assert.match(deleted[0], /website\/hero\/liluo-universe\/old-slug-v00\/thumb\.webp$/)

  await rm(dir, { recursive: true, force: true })
})
