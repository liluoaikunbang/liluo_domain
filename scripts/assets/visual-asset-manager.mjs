import { createHash, createHmac } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { getR2Config, isR2Configured, loadAssetEnv } from './lib/env.mjs'
import {
  DEFAULT_MANIFEST_FILE,
  DEFAULT_STAGING_DIR,
  ROOT,
  resolveRepoPath,
  toRepoRelative,
} from './lib/paths.mjs'

const DEFAULT_VARIANTS = Object.freeze({
  large: { maxWidth: 2400 },
  medium: { maxWidth: 1600 },
  thumb: { maxWidth: 640 },
})

const DEFAULT_MANAGED_ROOTS = Object.freeze([
  'website',
  'game',
  'generated',
  'thumbnails',
])

function usage() {
  return [
    'Usage:',
    '  node scripts/assets/visual-asset-manager.mjs status',
    '  node scripts/assets/visual-asset-manager.mjs prepare [--manifest <path>] [--asset <id>]',
    '  node scripts/assets/visual-asset-manager.mjs upload [--manifest <path>] [--asset <id>] [--live]',
    '  node scripts/assets/visual-asset-manager.mjs prune [--manifest <path>] [--live]',
  ].join('\n')
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = {
    command,
    assetIds: [],
    manifest: DEFAULT_MANIFEST_FILE,
    live: false,
  }

  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index]
    if (item === '--asset') {
      options.assetIds.push(rest[index + 1])
      index += 1
      continue
    }
    if (item === '--manifest') {
      options.manifest = rest[index + 1]
      index += 1
      continue
    }
    if (item === '--live') {
      options.live = true
      continue
    }
    throw new Error(`Unknown argument: ${item}`)
  }

  if (!options.command) throw new Error(usage())
  return options
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex')
}

function hmac(key, data, encoding = undefined) {
  return createHmac('sha256', key).update(data).digest(encoding)
}

function encodePathPart(value) {
  return encodeURIComponent(value).replace(/[!'()*]/gu, (match) => `%${match.charCodeAt(0).toString(16).toUpperCase()}`)
}

function encodeQueryPart(value) {
  return encodeURIComponent(value).replace(/[!'()*]/gu, (match) => `%${match.charCodeAt(0).toString(16).toUpperCase()}`)
}

function canonicalUri(bucket, objectKey = '') {
  const segments = [bucket, ...objectKey.split('/').filter(Boolean)]
  return `/${segments.map((part) => encodePathPart(part)).join('/')}`
}

function canonicalQueryString(query = {}) {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeQueryPart(key)}=${encodeQueryPart(String(value))}`)
    .join('&')
}

function normalizeManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.assets)) {
    throw new Error('Asset manifest must contain an assets array')
  }
  return manifest
}

async function readManifest(manifestPath) {
  const absolute = resolveRepoPath(manifestPath)
  const data = JSON.parse(await readFile(absolute, 'utf8'))
  return {
    absolutePath: absolute,
    document: normalizeManifest(data),
  }
}

function selectAssets(manifest, assetIds) {
  if (!assetIds.length) return manifest.assets
  const selected = manifest.assets.filter((asset) => assetIds.includes(asset.id))
  const missing = assetIds.filter((assetId) => !selected.some((asset) => asset.id === assetId))
  if (missing.length) throw new Error(`Unknown asset ids: ${missing.join(', ')}`)
  return selected
}

function ensureAssetShape(asset) {
  const required = ['id', 'title', 'sourcePath', 'remoteDir', 'slug', 'type', 'source', 'status']
  for (const field of required) {
    if (!asset[field]) throw new Error(`Asset ${asset.id || '<unknown>'} is missing required field: ${field}`)
  }
}

function getVariantSpec(asset) {
  return {
    ...DEFAULT_VARIANTS,
    ...(asset.variants ?? {}),
  }
}

function getRemoteKey(asset, variantName) {
  return `${asset.remoteDir}/${asset.slug}/${variantName}.webp`
}

function getManagedRoots(manifest) {
  const roots = Array.isArray(manifest.managedRoots) ? manifest.managedRoots : DEFAULT_MANAGED_ROOTS
  const normalized = roots
    .map((root) => String(root || '').trim().replace(/^\/+|\/+$/gu, ''))
    .filter(Boolean)

  return normalized.length ? [...new Set(normalized)] : [...DEFAULT_MANAGED_ROOTS]
}

function getStageDir(asset, options = {}) {
  const root = options.stageDir ?? DEFAULT_STAGING_DIR
  return resolveRepoPath(path.join(root, asset.remoteDir, asset.slug))
}

function getPythonCommand() {
  return process.env.LILUO_ASSET_PYTHON || 'python'
}

function runPython(args) {
  const result = spawnSync(getPythonCommand(), args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, PYTHONUTF8: '1' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Python command failed')
  return result.stdout
}

async function sha256File(filePath) {
  return sha256Hex(await readFile(filePath))
}

export async function buildPreparedAsset(asset, options = {}) {
  ensureAssetShape(asset)
  const sourcePath = resolveRepoPath(asset.sourcePath, { allowTmp: false })
  const stageDir = getStageDir(asset, options)
  await mkdir(stageDir, { recursive: true })
  const variants = getVariantSpec(asset)
  const scriptPath = resolveRepoPath('scripts/assets/prepare-visual-asset.py', { allowTmp: false })
  const stdout = runPython([
    scriptPath,
    '--input',
    sourcePath,
    '--output-dir',
    stageDir,
    '--large-width',
    String(variants.large.maxWidth),
    '--medium-width',
    String(variants.medium.maxWidth),
    '--thumb-width',
    String(variants.thumb.maxWidth),
  ])
  const payload = JSON.parse(stdout)

  return {
    sourcePath,
    sourceSha256: await sha256File(sourcePath),
    outputDir: stageDir,
    sourceWidth: payload.sourceWidth,
    sourceHeight: payload.sourceHeight,
    variants: payload.variants,
  }
}

function buildPublicUrl(baseUrl, objectKey) {
  if (!baseUrl) return ''
  return `${baseUrl.replace(/\/+$/u, '')}/${objectKey}`
}

function signS3Request(config, options = {}) {
  const method = options.method || 'GET'
  const objectKey = options.objectKey || ''
  const body = options.body ?? Buffer.alloc(0)
  const contentType = options.contentType || ''
  const query = options.query || {}
  const extraHeaders = options.headers || {}
  const url = new URL(`${config.bucket}${objectKey ? `/${objectKey}` : ''}`, `${config.endpoint}/`)
  const canonicalQuery = canonicalQueryString(query)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/gu, '')
  const shortDate = amzDate.slice(0, 8)
  const payloadHash = sha256Hex(body)
  const headers = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...extraHeaders,
  }
  if (contentType) headers['content-type'] = contentType
  const headerKeys = Object.keys(headers).sort()
  const canonicalHeaders = headerKeys.map((key) => `${key}:${String(headers[key]).trim()}\n`).join('')
  const signedHeaders = headerKeys.join(';')
  const canonicalRequest = [
    method,
    canonicalUri(config.bucket, objectKey),
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')
  const credentialScope = `${shortDate}/${config.region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, shortDate)
  const regionKey = hmac(dateKey, config.region)
  const serviceKey = hmac(regionKey, 's3')
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = hmac(signingKey, stringToSign, 'hex')

  return {
    url,
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  }
}

async function uploadPreparedAsset(config, asset, prepared, fetchImpl = fetch) {
  const uploaded = {}
  for (const [variantName, variant] of Object.entries(prepared.variants)) {
    const objectKey = getRemoteKey(asset, variantName)
    const filePath = resolveRepoPath(variant.path)
    const body = await readFile(filePath)
    const request = signS3Request(config, {
      method: 'PUT',
      objectKey,
      body,
      contentType: variant.contentType,
    })
    const response = await fetchImpl(request.url, {
      method: 'PUT',
      headers: request.headers,
      body,
    })
    if (!response.ok) {
      const snippet = await response.text()
      throw new Error(`Upload failed for ${asset.id}/${variantName}: HTTP ${response.status} ${snippet.slice(0, 200)}`)
    }
    uploaded[variantName] = {
      key: objectKey,
      url: buildPublicUrl(config.publicBaseUrl, objectKey),
      width: variant.width,
      height: variant.height,
      sizeBytes: variant.sizeBytes,
      contentType: variant.contentType,
      etag: response.headers.get('etag') || '',
    }
  }
  return uploaded
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&amp;/gu, '&')
}

function extractXmlTagValues(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'gu')
  return [...xml.matchAll(pattern)].map((match) => decodeXmlEntities(match[1]))
}

function parseListBucketXml(xml) {
  const keys = extractXmlTagValues(xml, 'Key')
  const truncated = extractXmlTagValues(xml, 'IsTruncated')[0] === 'true'
  const nextContinuationToken = extractXmlTagValues(xml, 'NextContinuationToken')[0] || ''
  return {
    keys,
    truncated,
    nextContinuationToken,
  }
}

async function listObjectsForPrefix(config, prefix, fetchImpl = fetch) {
  const keys = []
  let continuationToken = ''

  while (true) {
    const request = signS3Request(config, {
      method: 'GET',
      query: {
        'list-type': '2',
        prefix,
        ...(continuationToken ? { 'continuation-token': continuationToken } : {}),
      },
    })
    const response = await fetchImpl(request.url, {
      method: 'GET',
      headers: request.headers,
    })
    if (!response.ok) {
      const snippet = await response.text()
      throw new Error(`List objects failed for prefix ${prefix}: HTTP ${response.status} ${snippet.slice(0, 200)}`)
    }
    const payload = parseListBucketXml(await response.text())
    keys.push(...payload.keys)
    if (!payload.truncated) break
    continuationToken = payload.nextContinuationToken
    if (!continuationToken) throw new Error(`List objects response for prefix ${prefix} was truncated without a continuation token`)
  }

  return keys
}

async function listManagedObjects(config, managedRoots, fetchImpl = fetch) {
  const objectKeys = new Set()
  for (const root of managedRoots) {
    const listed = await listObjectsForPrefix(config, `${root}/`, fetchImpl)
    for (const key of listed) objectKeys.add(key)
  }
  return [...objectKeys].sort()
}

function collectExpectedKeys(manifest) {
  const keys = new Set()
  for (const asset of manifest.assets) {
    ensureAssetShape(asset)
    for (const variantName of Object.keys(getVariantSpec(asset))) {
      keys.add(getRemoteKey(asset, variantName))
    }
  }
  return [...keys].sort()
}

async function deleteObject(config, objectKey, fetchImpl = fetch) {
  const request = signS3Request(config, {
    method: 'DELETE',
    objectKey,
  })
  const response = await fetchImpl(request.url, {
    method: 'DELETE',
    headers: request.headers,
  })
  if (!response.ok) {
    const snippet = await response.text()
    throw new Error(`Delete failed for ${objectKey}: HTTP ${response.status} ${snippet.slice(0, 200)}`)
  }
}

function applyPublishedMetadata(asset, config, prepared, uploaded) {
  asset.status = 'published'
  asset.published = {
    bucket: config.bucket,
    endpoint: config.endpoint,
    publicBaseUrl: config.publicBaseUrl,
    sourceSha256: prepared.sourceSha256,
    sourceWidth: prepared.sourceWidth,
    sourceHeight: prepared.sourceHeight,
    stagedFrom: toRepoRelative(prepared.outputDir),
    lastUploadedAt: new Date().toISOString().slice(0, 10),
    variants: uploaded,
  }
}

async function writeManifest(manifestPath, manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

function summarizeAssets(assets, preparedById = {}) {
  return assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    sourcePath: asset.sourcePath,
    remoteDir: asset.remoteDir,
    slug: asset.slug,
    status: asset.status,
    variants: Object.fromEntries(
      Object.keys(getVariantSpec(asset)).map((variantName) => [
        variantName,
        {
          key: getRemoteKey(asset, variantName),
          stagedPath: preparedById[asset.id]?.variants?.[variantName]?.path
            ? toRepoRelative(resolveRepoPath(preparedById[asset.id].variants[variantName].path))
            : '',
          url: asset.published?.variants?.[variantName]?.url || '',
        },
      ]),
    ),
  }))
}

export async function runCli(argv, options = {}) {
  const args = parseArgs(argv)
  const env = await loadAssetEnv({ envFilePath: options.envFilePath })
  const config = getR2Config(env.values)
  const manifestPath = options.manifestPath ?? args.manifest
  const manifestData = await readManifest(manifestPath)
  const supportsAssetSelection = args.command === 'prepare' || args.command === 'upload' || args.command === 'status'
  if (!supportsAssetSelection && args.assetIds.length) {
    throw new Error(`${args.command} does not support --asset`)
  }
  const assets = supportsAssetSelection ? selectAssets(manifestData.document, args.assetIds) : manifestData.document.assets

  if (args.command === 'status') {
    return {
      command: 'status',
      configured: isR2Configured(config),
      sourceFile: env.sourceFile ? toRepoRelative(env.sourceFile) : null,
      bucket: config.bucket,
      endpoint: config.endpoint,
      publicBaseUrl: config.publicBaseUrl,
      assetCount: manifestData.document.assets.length,
      selectedAssetCount: assets.length,
      warnings: env.warnings,
    }
  }

  if (args.command === 'prune') {
    if (!isR2Configured(config)) {
      throw new Error('R2 is not fully configured. Fill .env.assets.local before pruning bucket assets.')
    }
    const managedRoots = getManagedRoots(manifestData.document)
    const remoteObjectKeys = await listManagedObjects(config, managedRoots, options.fetchImpl ?? fetch)
    const expectedKeys = collectExpectedKeys(manifestData.document)
    const expectedSet = new Set(expectedKeys)
    const staleObjects = remoteObjectKeys.filter((objectKey) => !expectedSet.has(objectKey))

    if (args.live) {
      for (const objectKey of staleObjects) {
        await deleteObject(config, objectKey, options.fetchImpl ?? fetch)
      }
    }

    return {
      command: 'prune',
      mode: args.live ? 'live' : 'dry-run',
      configured: true,
      manifestPath: toRepoRelative(manifestData.absolutePath),
      managedRoots,
      expectedObjectCount: expectedKeys.length,
      remoteObjectCount: remoteObjectKeys.length,
      staleObjectCount: staleObjects.length,
      staleObjects,
      warnings: env.warnings,
    }
  }

  if (args.command !== 'prepare' && args.command !== 'upload') {
    throw new Error(usage())
  }

  const prepareImpl = options.prepareImpl ?? buildPreparedAsset
  const preparedById = {}
  for (const asset of assets) {
    preparedById[asset.id] = await prepareImpl(asset, { stageDir: options.stageDir })
  }

  if (args.command === 'prepare') {
    return {
      command: 'prepare',
      configured: isR2Configured(config),
      manifestPath: toRepoRelative(manifestData.absolutePath),
      assetCount: assets.length,
      assets: summarizeAssets(assets, preparedById),
      warnings: env.warnings,
    }
  }

  if (!args.live) {
    return {
      command: 'upload',
      mode: 'dry-run',
      configured: isR2Configured(config),
      manifestPath: toRepoRelative(manifestData.absolutePath),
      assetCount: assets.length,
      assets: summarizeAssets(assets, preparedById),
      warnings: env.warnings,
    }
  }

  if (!isR2Configured(config)) {
    throw new Error('R2 is not fully configured. Fill .env.assets.local before live upload.')
  }
  if (!config.publicBaseUrl) {
    throw new Error('LILUO_ASSET_R2_PUBLIC_BASE_URL is required before live upload so the manifest can store public URLs.')
  }

  for (const asset of assets) {
    const uploaded = await uploadPreparedAsset(config, asset, preparedById[asset.id], options.fetchImpl ?? fetch)
    applyPublishedMetadata(asset, config, preparedById[asset.id], uploaded)
  }
  await writeManifest(manifestData.absolutePath, manifestData.document)

  return {
    command: 'upload',
    mode: 'live',
    configured: true,
    manifestPath: toRepoRelative(manifestData.absolutePath),
    assetCount: assets.length,
    assets: summarizeAssets(assets, preparedById),
    warnings: env.warnings,
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  try {
    const payload = await runCli(process.argv.slice(2))
    console.log(JSON.stringify(payload, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
