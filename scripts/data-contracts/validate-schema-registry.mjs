import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  createSchemaValidator,
  listMatchingFiles,
  loadSchemaRegistry,
  resolveRepositoryPath
} from './lib/load-schema-registry.mjs'

const VALID_MODES = new Set([
  'file',
  'file-or-array-item',
  'object-values',
  'story-node',
  'map-metadata',
  'map-event',
  'markdown-asset-table'
])
const CONTRACT_FIELDS = new Set([
  'id',
  'schema',
  'sourceGlobs',
  'dependencyGlobs',
  'mode',
  'owner',
  'requiredInChangedGate',
  'allowsMissingEmbeddedSchemaVersion',
  'template'
])

export async function validateSchemaRegistry(root = path.resolve(import.meta.dirname, '..', '..')) {
  const errors = []
  const { registry } = await loadSchemaRegistry(root)
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.contracts)) {
    errors.push('schemas/registry.json must use schemaVersion 1 and contain contracts[]')
    return { ok: false, errors }
  }
  const contractIds = new Set()
  const schemaIds = new Set()
  for (const contract of registry.contracts) {
    if (!contract || typeof contract !== 'object') {
      errors.push('Every registry contract must be an object')
      continue
    }
    for (const field of [
      'id',
      'schema',
      'sourceGlobs',
      'mode',
      'owner',
      'requiredInChangedGate',
      'allowsMissingEmbeddedSchemaVersion'
    ]) {
      if (!(field in contract)) errors.push(`Contract ${contract.id ?? '<unknown>'} is missing ${field}`)
    }
    if (contractIds.has(contract.id)) errors.push(`Duplicate contract id: ${contract.id}`)
    contractIds.add(contract.id)
    const unknownFields = Object.keys(contract).filter((field) => !CONTRACT_FIELDS.has(field))
    if (unknownFields.length > 0) {
      errors.push(`Contract ${contract.id} has unknown fields: ${unknownFields.join(', ')}`)
    }
    if (typeof contract.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(contract.id)) {
      errors.push(`Contract ${contract.id ?? '<unknown>'} id must be lowercase kebab-case`)
    }
    if (typeof contract.schema !== 'string' || !contract.schema.startsWith('schemas/')) {
      errors.push(`Contract ${contract.id} schema must be a repository-relative schemas/ path`)
    }
    if (typeof contract.owner !== 'string' || contract.owner.length === 0) {
      errors.push(`Contract ${contract.id} owner must be a non-empty string`)
    }
    if (typeof contract.requiredInChangedGate !== 'boolean') {
      errors.push(`Contract ${contract.id} requiredInChangedGate must be boolean`)
    }
    if (typeof contract.allowsMissingEmbeddedSchemaVersion !== 'boolean') {
      errors.push(`Contract ${contract.id} allowsMissingEmbeddedSchemaVersion must be boolean`)
    }
    if ('template' in contract && typeof contract.template !== 'boolean') {
      errors.push(`Contract ${contract.id} template must be boolean`)
    }
    if (!VALID_MODES.has(contract.mode)) errors.push(`Contract ${contract.id} has unsupported mode ${contract.mode}`)
    if (!Array.isArray(contract.sourceGlobs) || contract.sourceGlobs.some((glob) => typeof glob !== 'string')) {
      errors.push(`Contract ${contract.id} sourceGlobs must be a string array`)
    }
    if (
      'dependencyGlobs' in contract
      && (!Array.isArray(contract.dependencyGlobs) || contract.dependencyGlobs.some((glob) => typeof glob !== 'string'))
    ) {
      errors.push(`Contract ${contract.id} dependencyGlobs must be a string array`)
    }
    try {
      const schemaPath = resolveRepositoryPath(root, contract.schema)
      const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'))
      if (!schema.$id) errors.push(`Schema ${contract.schema} is missing $id`)
      if (schemaIds.has(schema.$id)) errors.push(`Duplicate schema $id: ${schema.$id}`)
      schemaIds.add(schema.$id)
    } catch (error) {
      errors.push(`Unable to read schema ${contract.schema}: ${error.message}`)
    }
    if (!contract.template) {
      const matches = await listMatchingFiles(root, contract.sourceGlobs ?? [])
      if (matches.length === 0) errors.push(`Contract ${contract.id} sourceGlobs match no files`)
    }
  }
  if (errors.length === 0) {
    try {
      await createSchemaValidator(root, registry)
    } catch (error) {
      errors.push(`Schema compilation failed: ${error.message}`)
    }
  }
  return { ok: errors.length === 0, errors, contractCount: registry.contracts.length }
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  const result = await validateSchemaRegistry()
  if (result.ok) {
    console.log(`Schema registry OK: ${result.contractCount} contracts compiled.`)
  } else {
    result.errors.forEach((error) => console.error(`ERROR ${error}`))
    process.exitCode = 1
  }
}
