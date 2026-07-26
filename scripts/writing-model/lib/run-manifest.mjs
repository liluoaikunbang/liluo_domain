import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { WORKSPACE_ROOT, repoPath, toPosixRelative } from './paths.mjs'
import { redactValue } from './redaction.mjs'

export function createRunId() {
  return `wr-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8)}`
}

export function createCompareGroupId() {
  return `cg-${randomUUID().slice(0, 10)}`
}

export async function ensureWorkspace() {
  const root = repoPath(WORKSPACE_ROOT)
  await mkdir(path.join(root, 'runs'), { recursive: true })
  await mkdir(path.join(root, 'drafts'), { recursive: true })
  await mkdir(path.join(root, 'requests'), { recursive: true })
  await mkdir(path.join(root, 'compare'), { recursive: true })
  await mkdir(path.join(root, 'debug'), { recursive: true })
  return root
}

export async function writeJsonSafe(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(redactValue(value), null, 2)}\n`, 'utf8')
}

export async function writeTextSafe(filePath, text) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, text, 'utf8')
}

export function buildRunManifest(result) {
  return {
    schemaVersion: 1,
    runId: result.runId,
    modelProfile: result.modelProfile,
    servedModel: result.servedModel,
    provider: result.provider,
    createdAt: result.createdAt,
    requestContractId: result.requestContractId,
    parameters: result.parameters,
    mode: result.mode,
    endpointHostSummary: result.endpointHostSummary ?? null,
    styleReferenceIds: result.styleReferenceIds ?? [],
    inputSources: result.inputSources ?? [],
    workspacePaths: result.workspacePaths ?? {},
    usage: result.usage,
    reasoningStored: false,
    warnings: result.warnings ?? [],
    responseMetadata: result.responseMetadata ?? {},
    compareGroupId: result.compareGroupId ?? null,
    blindLabel: result.blindLabel ?? null,
  }
}

export async function persistRunArtifacts(result, options = {}) {
  await ensureWorkspace()
  const draftPath = repoPath(WORKSPACE_ROOT, 'drafts', `${result.runId}.md`)
  const manifestPath = repoPath(WORKSPACE_ROOT, 'runs', `${result.runId}.json`)
  await writeTextSafe(draftPath, result.draft)
  const workspacePaths = {
    draft: toPosixRelative(draftPath),
    manifest: toPosixRelative(manifestPath),
  }
  if (options.debugRawPath) {
    workspacePaths.rawResponse = toPosixRelative(options.debugRawPath)
  }
  const withPaths = { ...result, workspacePaths, reasoningStored: false }
  const manifest = buildRunManifest(withPaths)
  await writeJsonSafe(manifestPath, manifest)
  return { ...withPaths, manifest }
}

export function assertNotCanonPath(relativePath) {
  const forbidden = [
    'src/game/data/story_outline/',
    'src/game/data/plot_outline/',
    'src/game/data/maps/',
  ]
  const normalized = relativePath.split('\\').join('/')
  if (forbidden.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error(`禁止写入正式 canon 路径：${normalized}`)
  }
}
