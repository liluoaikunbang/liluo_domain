import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  createSchemaValidator,
  listMatchingFiles,
  loadContractRecords,
  loadSchemaRegistry,
  matchesContractSource,
  matchesPatterns
} from './lib/load-schema-registry.mjs'
import { formatSchemaErrorLine, formatSchemaErrors } from './lib/format-schema-errors.mjs'
import { validateSchemaRegistry } from './validate-schema-registry.mjs'

function parseArguments(args) {
  const options = {
    scope: 'changed',
    contractId: null,
    check: false,
    json: false
  }
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--scope') {
      options.scope = args[index + 1]
      index += 1
    } else if (argument === '--contract') {
      options.contractId = args[index + 1]
      index += 1
    } else if (argument === '--check') {
      options.check = true
    } else if (argument === '--json') {
      options.json = true
    } else if (argument === '--help') {
      options.help = true
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  if (!['changed', 'all'].includes(options.scope)) {
    throw new Error(`--scope must be changed or all, received ${options.scope}`)
  }
  if (args.includes('--scope') && !options.scope) throw new Error('--scope requires a value')
  if (args.includes('--contract') && !options.contractId) throw new Error('--contract requires an id')
  return options
}

function splitNullTerminated(value) {
  return value.split('\0').filter(Boolean).map((file) => file.replaceAll('\\', '/'))
}

function runGit(root, args) {
  const result = spawnSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error((result.stderr || `git ${args.join(' ')} failed`).trim())
  }
  return splitNullTerminated(result.stdout ?? '')
}

export function listChangedFiles(root) {
  const changed = runGit(root, ['diff', '--name-only', '-z', 'HEAD', '--'])
  const untracked = runGit(root, ['ls-files', '--others', '--exclude-standard', '-z'])
  return [...new Set([...changed, ...untracked])].sort((left, right) => left.localeCompare(right, 'en'))
}

function selectContracts(registry, options) {
  if (!options.contractId) {
    return registry.contracts.filter((contract) => options.scope === 'all' || contract.requiredInChangedGate)
  }
  const contract = registry.contracts.find((candidate) => candidate.id === options.contractId)
  if (!contract) throw new Error(`Unknown contract id: ${options.contractId}`)
  return [contract]
}

export async function validateDataContracts({
  root = path.resolve(import.meta.dirname, '..', '..'),
  scope = 'changed',
  contractId = null
} = {}) {
  const registryResult = await validateSchemaRegistry(root)
  if (!registryResult.ok) {
    return {
      ok: false,
      scope,
      contractId,
      contracts: [],
      errors: registryResult.errors.map((reason) => ({
        contractId: 'schema-registry',
        file: 'schemas/registry.json',
        pointer: '/',
        keyword: 'registry',
        reason,
        params: {}
      }))
    }
  }
  const { registry } = await loadSchemaRegistry(root)
  const { validators } = await createSchemaValidator(root, registry)
  const options = { scope, contractId }
  const contracts = selectContracts(registry, options)
  const changedFiles = scope === 'changed' && !contractId ? listChangedFiles(root) : []
  const summaries = []
  const errors = []

  for (const contract of contracts) {
    const allFiles = contract.template ? [] : await listMatchingFiles(root, contract.sourceGlobs)
    const validationSystemChanged = changedFiles.some((file) => (
      file === 'schemas/registry.json'
      || file === contract.schema
      || file.startsWith('schemas/common/')
      || file.startsWith('scripts/data-contracts/')
    ))
    const dependencyChanged = changedFiles.some((file) => (
      matchesPatterns(contract.dependencyGlobs ?? [], file)
    ))
    const files = scope === 'changed' && !contractId && !validationSystemChanged && !dependencyChanged
      ? allFiles.filter((file) => changedFiles.includes(file) && matchesContractSource(contract, file))
      : allFiles
    let recordCount = 0
    for (const file of files) {
      let records
      try {
        records = await loadContractRecords(root, contract, file)
      } catch (error) {
        errors.push({
          contractId: contract.id,
          file,
          pointer: '/',
          keyword: 'load',
          reason: error.message,
          params: {}
        })
        continue
      }
      const validate = validators.get(contract.id)
      for (const record of records) {
        recordCount += 1
        if (!validate(record)) {
          errors.push(...formatSchemaErrors(contract.id, file, validate.errors))
        }
      }
    }
    summaries.push({
      id: contract.id,
      fileCount: files.length,
      recordCount
    })
  }
  return {
    ok: errors.length === 0,
    scope,
    contractId,
    contracts: summaries,
    errors
  }
}

function printTextResult(result) {
  for (const summary of result.contracts) {
    console.log(`INFO ${summary.id}: files=${summary.fileCount} records=${summary.recordCount}`)
  }
  result.errors.forEach((error) => console.error(`ERROR ${formatSchemaErrorLine(error)}`))
  console.log(result.ok ? 'Data contracts OK.' : `Data contracts failed: ${result.errors.length} error(s).`)
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) {
      console.log('Usage: node validate-data-contracts.mjs --scope changed|all [--contract ID] [--check] [--json]')
    } else {
      const result = await validateDataContracts({
        scope: options.scope,
        contractId: options.contractId
      })
      if (options.json) console.log(JSON.stringify(result, null, 2))
      else printTextResult(result)
      if (!result.ok) process.exitCode = 1
    }
  } catch (error) {
    console.error(`ERROR ${error.message}`)
    process.exitCode = 2
  }
}
