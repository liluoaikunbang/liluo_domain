import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const toPosixPath = (value) => value.replaceAll(path.sep, '/')

export function resolveRepositoryPath(root, repositoryPath) {
  const resolved = path.resolve(root, repositoryPath)
  const relative = path.relative(root, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repository root: ${repositoryPath}`)
  }
  return resolved
}

export async function readJsonFile(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function loadSchemaRegistry(root) {
  const registryPath = path.join(root, 'schemas', 'registry.json')
  const registry = await readJsonFile(registryPath)
  return { registry, registryPath }
}

function globToRegExp(pattern) {
  let expression = '^'
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    if (character === '*') {
      if (pattern[index + 1] === '*') {
        expression += '.*'
        index += 1
      } else {
        expression += '[^/]*'
      }
    } else if ('\\^$+?.()|{}[]'.includes(character)) {
      expression += `\\${character}`
    } else {
      expression += character
    }
  }
  return new RegExp(`${expression}$`)
}

async function walkFiles(directory, root, output) {
  let entries
  try {
    entries = await fs.readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(target, root, output)
    } else if (entry.isFile()) {
      output.push(toPosixPath(path.relative(root, target)))
    }
  }
}

function staticGlobDirectory(pattern) {
  const wildcardIndex = pattern.search(/[*?[]/)
  const prefix = wildcardIndex < 0 ? pattern : pattern.slice(0, wildcardIndex)
  const slashIndex = prefix.lastIndexOf('/')
  return slashIndex < 0 ? '.' : prefix.slice(0, slashIndex)
}

export async function listMatchingFiles(root, sourceGlobs) {
  const matches = new Set()
  for (const pattern of sourceGlobs) {
    const candidates = []
    const directory = resolveRepositoryPath(root, staticGlobDirectory(pattern))
    await walkFiles(directory, root, candidates)
    const matcher = globToRegExp(pattern)
    candidates.filter((candidate) => matcher.test(candidate)).forEach((candidate) => matches.add(candidate))
  }
  return [...matches].sort((left, right) => left.localeCompare(right, 'en'))
}

export function matchesPatterns(patterns, repositoryPath) {
  return patterns.some((pattern) => globToRegExp(pattern).test(repositoryPath))
}

export function matchesContractSource(contract, repositoryPath) {
  return matchesPatterns(contract.sourceGlobs, repositoryPath)
}

export async function loadSchemas(root, registry) {
  const schemaFiles = new Set([
    ...registry.contracts.map((contract) => contract.schema),
    'schemas/common/identifier.schema.json',
    'schemas/common/source-reference.schema.json'
  ])
  const schemas = []
  for (const repositoryPath of schemaFiles) {
    const filePath = resolveRepositoryPath(root, repositoryPath)
    schemas.push({ repositoryPath, schema: await readJsonFile(filePath) })
  }
  return schemas
}

export async function createSchemaValidator(root, registry) {
  const schemas = await loadSchemas(root, registry)
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: true
  })
  addFormats(ajv)
  for (const { schema } of schemas) ajv.addSchema(schema)
  const validators = new Map()
  for (const contract of registry.contracts) {
    const schema = schemas.find((candidate) => candidate.repositoryPath === contract.schema)?.schema
    const validator = schema ? ajv.getSchema(schema.$id) : null
    if (!validator) throw new Error(`Unable to compile schema for contract ${contract.id}`)
    validators.set(contract.id, validator)
  }
  return { ajv, schemas, validators }
}

const storyMarkdownCache = new Map()

async function getStoryMarkdownPaths(root) {
  if (storyMarkdownCache.has(root)) return storyMarkdownCache.get(root)
  const storyRoot = path.join(root, 'src', 'game', 'data', 'story_outline')
  const candidates = []
  await walkFiles(storyRoot, root, candidates)
  const pathsByNodeKey = new Map(
    candidates
      .filter((candidate) => candidate.endsWith('.md'))
      .map((candidate) => [path.posix.basename(candidate, '.md'), candidate])
  )
  storyMarkdownCache.set(root, pathsByNodeKey)
  return pathsByNodeKey
}

async function loadStoryNodes(root, repositoryPath) {
  const document = await readJsonFile(resolveRepositoryPath(root, repositoryPath))
  if (!Array.isArray(document.nodes)) {
    throw new Error(`${repositoryPath} must contain a nodes array`)
  }
  const series = path.basename(repositoryPath, '.json')
  const markdownPaths = await getStoryMarkdownPaths(root)
  return document.nodes.map((node) => ({
    ...node,
    schemaVersion: 1,
    series,
    nodeType: 'story-node',
    status: node.status ?? null,
    parentKey: node.parentKey ?? null,
    source: {
      kind: 'story',
      path: repositoryPath
    },
    mapRefs: Array.isArray(node.mapRefs) ? node.mapRefs : node.mapId ? [node.mapId] : [],
    eventRefs: Array.isArray(node.eventRefs) ? node.eventRefs : [],
    characterRefs: Array.isArray(node.characterRefs)
      ? node.characterRefs
      : Array.isArray(node.characters)
        ? node.characters
        : [],
    gameplayRefs: Array.isArray(node.gameplayRefs) ? node.gameplayRefs : [],
    markdownBodyRef: markdownPaths.get(node.key) ?? null
  }))
}

function extractObjectLiteral(source, repositoryPath) {
  const assignmentIndex = source.indexOf('=')
  const endIndex = source.lastIndexOf('as const')
  if (assignmentIndex < 0 || endIndex < assignmentIndex) {
    throw new Error(`Unable to locate exported object literal in ${repositoryPath}`)
  }
  const literal = source.slice(assignmentIndex + 1, endIndex).trim()
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 })
}

async function loadMapMetadata(root, repositoryPath) {
  const filePath = resolveRepositoryPath(root, repositoryPath)
  const metadata = extractObjectLiteral(await fs.readFile(filePath, 'utf8'), repositoryPath)
  const directory = path.posix.dirname(repositoryPath)
  const segments = directory.split('/')
  const world = segments.at(-2)
  const eventsPath = `${directory}/events.json`
  const dialoguesPath = `${directory}/dialogues.json`
  const mapJsonPath = `${directory}/map.json`
  const events = await readJsonFile(resolveRepositoryPath(root, eventsPath))
  const connections = Object.values(events)
    .filter((event) => event?.mapTransition?.mapId)
    .map((event) => ({
      eventId: event.eventId,
      targetMapId: event.mapTransition.mapId,
      spawnId: event.mapTransition.spawnId ?? null
    }))
  let dialogueRegistry = null
  try {
    await fs.access(resolveRepositoryPath(root, dialoguesPath))
    dialogueRegistry = dialoguesPath
  } catch {
    // Maps without dialogue data keep an explicit null registry.
  }
  return [{
    schemaVersion: 1,
    mapId: metadata.id,
    world,
    displayName: metadata.name,
    description: metadata.description ?? null,
    resourceDirectory: directory,
    mapJson: mapJsonPath,
    defaultSpawnId: metadata.defaultSpawnId,
    connections,
    eventRegistry: eventsPath,
    dialogueRegistry,
    playerScale: metadata.playerScale ?? null,
    camera: metadata.viewport?.cameraMode ? { mode: metadata.viewport.cameraMode } : null,
    minimap: metadata.viewport
      ? { adaptiveFit: metadata.viewport.smallMapAdaptiveFit ?? false }
      : null,
    worldRender: metadata.worldRender ?? null,
    worldHints: metadata.worldHints ?? []
  }]
}

function parseMarkdownAssetRows(markdown) {
  const rows = []
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith('| `src/assets/game/')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim().replace(/^`|`$/g, ''))
    if (cells.length !== 4 || !cells[0].includes('.')) continue
    const [filePath, fileName, assetType, usage] = cells
    const extension = path.posix.extname(filePath).slice(1).toLowerCase()
    const referenceStatus = /待接入|候选|制作源|参考/.test(`${assetType}${usage}`)
      ? 'candidate'
      : 'referenced'
    rows.push({
      schemaVersion: 1,
      assetId: filePath,
      filePath,
      fileName,
      assetType,
      usage,
      referenceStatus,
      fileInfo: { extension },
      provenance: {
        sourceStatus: 'not-recorded',
        licenseStatus: 'not-recorded'
      }
    })
  }
  return rows
}

export async function loadContractRecords(root, contract, repositoryPath) {
  if (contract.mode === 'story-node') return loadStoryNodes(root, repositoryPath)
  if (contract.mode === 'map-metadata') return loadMapMetadata(root, repositoryPath)
  if (contract.mode === 'file') return [await readJsonFile(resolveRepositoryPath(root, repositoryPath))]
  if (contract.mode === 'object-values') {
    const document = await readJsonFile(resolveRepositoryPath(root, repositoryPath))
    return Object.values(document)
  }
  if (contract.mode === 'map-event') {
    const document = await readJsonFile(resolveRepositoryPath(root, repositoryPath))
    const metaPath = `${path.posix.dirname(repositoryPath)}/meta.ts`
    const metadata = extractObjectLiteral(
      await fs.readFile(resolveRepositoryPath(root, metaPath), 'utf8'),
      metaPath
    )
    const mapId = metadata.id
    return Object.values(document).map((event) => ({ ...event, schemaVersion: 1, mapId }))
  }
  if (contract.mode === 'markdown-asset-table') {
    return parseMarkdownAssetRows(await fs.readFile(resolveRepositoryPath(root, repositoryPath), 'utf8'))
  }
  if (contract.mode === 'file-or-array-item') {
    const document = await readJsonFile(resolveRepositoryPath(root, repositoryPath))
    return Array.isArray(document) ? document : [document]
  }
  throw new Error(`Unsupported contract mode: ${contract.mode}`)
}
