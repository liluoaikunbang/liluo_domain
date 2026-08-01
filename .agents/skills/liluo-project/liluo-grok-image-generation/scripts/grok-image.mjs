import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { deriveSlugFromPrompt, normalizeAspectRatio, normalizeBaseUrl, normalizeCount, normalizeResolution, sanitizeSlug, timestampId } from './lib/config.mjs'
import { generateImages, probeApi } from './lib/client.mjs'
import { getGrokConfig, isGrokConfigured, loadGrokEnv } from './lib/env.mjs'
import { DEFAULT_OUTPUT_DIR, resolveUserPath, toPosixRelative } from './lib/paths.mjs'
import { getRuntimeSettings, summarizeRuntimeSettings } from './lib/runtime.mjs'

function createHelp() {
  return {
    commands: {
      status: 'Print configuration status without making a network request.',
      probe: 'Probe Grok API reachability without consuming image quota.',
      generate: 'Generate one or more images. Add --live to actually call the Grok API.',
    },
    examples: [
      'npm run grok:image:status',
      'npm run grok:image:probe -- --timeout-ms 15000 --dns-result-order ipv4first',
      'npm run grok:image:generate -- --prompt "cinematic portrait of Liluo in rain" --dry-run',
      'npm run grok:image:generate -- --live --prompt-file prompt.txt --aspect-ratio 16:9 --slug liluo-poster --model grok-imagine-image-quality',
    ],
    options: {
      common: [
        '--base-url https://api.x.ai/v1 (or loopback for local relay)',
        '--model grok-imagine-image-quality',
        '--local-proxy http://127.0.0.1:7890',
        '--dns-result-order verbatim|ipv4first|ipv6first',
      ],
      probe: [
        '--timeout-ms 10000',
      ],
      generate: [
        '--prompt "..." or --prompt-file prompt.txt',
        '--aspect-ratio 1:1|16:9|9:16|4:3|3:4|3:2|2:3',
        '--resolution auto|1024x1024',
        '--count 1-4',
        '--slug grok-image',
        '--out-dir path',
        '--timeout-ms 120000',
        '--max-attempts 3',
        '--backoff-ms 500,1500',
      ],
      modes: [
        '--dry-run',
        '--live',
      ],
    },
  }
}

export function parseArgs(argv) {
  const result = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) {
      result._.push(item)
      continue
    }
    const key = item.slice(2)
    if (['live', 'dry-run', 'help'].includes(key)) {
      result[key] = true
      continue
    }
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`)
    result[key] = value
    index += 1
  }
  return result
}

async function loadPrompt(args) {
  if (args.prompt && args['prompt-file']) throw new Error('Use either --prompt or --prompt-file, not both')
  if (args.prompt) return String(args.prompt).trim()
  if (args['prompt-file']) return (await readFile(resolveUserPath(args['prompt-file']), 'utf8')).trim()
  throw new Error('Prompt is required: provide --prompt or --prompt-file')
}

function parseIntegerAtLeast(value, label, minimum = 1) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${label} must be an integer >= ${minimum}`)
  }
  return parsed
}

function resolveIntegerOption(args, key, fallback, minimum = 1) {
  if (args[key] === undefined) return fallback
  return parseIntegerAtLeast(args[key], `--${key}`, minimum)
}

function resolveBackoffMs(args, fallback = [500, 1500]) {
  if (args['backoff-ms'] === undefined) return fallback
  const values = String(args['backoff-ms'])
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!values.length) throw new Error('--backoff-ms requires one or more comma-separated integers')
  return values.map((value) => parseIntegerAtLeast(value, '--backoff-ms', 0))
}

function normalizeCliBaseUrl(value) {
  if (value === undefined) return null
  const apiRoot = normalizeBaseUrl(value).apiRoot
  const host = new URL(apiRoot).hostname.toLowerCase()
  if (!['api.x.ai', 'localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('CLI --base-url only allows api.x.ai or loopback hosts')
  }
  return apiRoot
}

function resolveConfig(args, values) {
  const overriddenBaseUrl = normalizeCliBaseUrl(args['base-url'])
  return getGrokConfig({
    ...values,
    LILUO_GROK_IMAGE_BASE_URL: overriddenBaseUrl ?? values.LILUO_GROK_IMAGE_BASE_URL,
    LILUO_GROK_IMAGE_MODEL: args.model ?? values.LILUO_GROK_IMAGE_MODEL,
  })
}

function chooseOutputRoot(args) {
  return resolveUserPath(args['out-dir'] ?? DEFAULT_OUTPUT_DIR)
}

function baseFileName(args, prompt, createdAt) {
  const slug = sanitizeSlug(args.slug ?? deriveSlugFromPrompt(prompt))
  return `${timestampId(createdAt)}-${slug}`
}

async function runStatus(args = {}, options = {}) {
  const env = await loadGrokEnv(options)
  const config = resolveConfig(args, env.values)
  return {
    command: 'status',
    status: isGrokConfigured(config) ? 'configured' : 'unconfigured',
    envFilePresent: Boolean(env.sourceFile),
    hasApiKey: Boolean(config.apiKey),
    baseUrl: config.baseUrl,
    model: config.model,
    defaultOutputDir: DEFAULT_OUTPUT_DIR,
    runtime: summarizeRuntimeSettings(getRuntimeSettings(args, env.values)),
    warnings: env.warnings,
  }
}

async function runProbe(args = {}, options = {}) {
  const env = await loadGrokEnv(options)
  const config = resolveConfig(args, env.values)
  const requestMs = resolveIntegerOption(args, 'timeout-ms', options.requestMs ?? 10000)
  const result = await probeApi({
    config,
    fetchImpl: options.fetchImpl,
    requestMs,
  })
  return {
    command: 'probe',
    probeStatus: result.ok ? 'reachable' : 'reachable-with-http-error',
    configured: isGrokConfigured(config),
    runtime: summarizeRuntimeSettings(getRuntimeSettings(args, env.values)),
    warnings: env.warnings,
    ...result,
  }
}

async function runGenerate(args, options = {}) {
  if (args.live && args['dry-run']) throw new Error('Use either --live or --dry-run, not both')
  const env = await loadGrokEnv(options)
  const config = resolveConfig(args, env.values)
  const prompt = await loadPrompt(args)
  const createdAt = new Date().toISOString()
  const aspectRatio = normalizeAspectRatio(args['aspect-ratio'])
  const resolution = normalizeResolution(args.resolution)
  const count = normalizeCount(args.count)
  const outputRoot = chooseOutputRoot(args)
  const fileBase = baseFileName(args, prompt, createdAt)
  const requestMs = resolveIntegerOption(args, 'timeout-ms', options.requestMs ?? 120000)
  const maxAttempts = resolveIntegerOption(args, 'max-attempts', options.maxAttempts ?? 3)
  const backoffMs = resolveBackoffMs(args, options.backoffMs ?? [500, 1500])

  if (!args.live) {
    return {
      command: 'generate',
      mode: 'dry-run',
      configured: isGrokConfigured(config),
      prompt,
      request: {
        baseUrl: config.baseUrl,
        model: config.model,
        aspectRatio,
        resolution,
        count,
      },
      runtime: summarizeRuntimeSettings(getRuntimeSettings(args, env.values)),
      plannedOutputDir: toPosixRelative(outputRoot),
      plannedBaseName: fileBase,
      warnings: env.warnings,
    }
  }

  const result = await generateImages({
    prompt,
    config,
    aspectRatio,
    resolution,
    count,
    fetchImpl: options.fetchImpl,
    requestMs,
    maxAttempts,
    backoffMs,
  })

  await mkdir(outputRoot, { recursive: true })
  const written = []
  for (const image of result.images) {
    const suffix = result.images.length === 1 ? '' : `-${String(image.index + 1).padStart(2, '0')}`
    const filename = `${fileBase}${suffix}${image.extension}`
    const absolute = path.join(outputRoot, filename)
    await writeFile(absolute, image.bytes)
    written.push({
      index: image.index,
      path: toPosixRelative(absolute),
      extension: image.extension,
      sha256: image.sha256,
      bytes: image.bytes.length,
    })
  }

  const manifestPath = path.join(outputRoot, `${fileBase}.manifest.json`)
  const manifest = {
    command: 'generate',
    mode: 'live',
    createdAt: result.createdAt,
    provider: result.provider,
    endpointHostSummary: result.endpointHostSummary,
    request: {
      ...result.request,
      prompt,
    },
    revisedPrompt: result.revisedPrompt,
    files: written,
    responseMetadata: result.responseMetadata,
    warnings: env.warnings,
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  return {
    ...manifest,
    manifestPath: toPosixRelative(manifestPath),
  }
}

export async function runCli(argv, options = {}) {
  const args = parseArgs(argv)
  const [command = args.help ? 'help' : ''] = args._
  if (!command || command === 'help') return createHelp()
  if (command === 'status') return runStatus(args, options)
  if (command === 'probe') return runProbe(args, options)
  if (command === 'generate') return runGenerate(args, options)
  throw new Error(`Unknown command: ${command}`)
}

async function main() {
  try {
    const payload = await runCli(process.argv.slice(2))
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${JSON.stringify({
      error: error.message,
      code: error.code ?? null,
    }, null, 2)}\n`)
    process.exitCode = 1
  }
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  await main()
}
