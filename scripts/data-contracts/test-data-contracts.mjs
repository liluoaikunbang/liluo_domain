import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { createSchemaValidator, loadSchemaRegistry } from './lib/load-schema-registry.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')

async function loadFixtures(directory) {
  const fixtureRoot = path.join(root, 'schemas', 'tests', directory)
  const names = (await fs.readdir(fixtureRoot)).filter((name) => name.endsWith('.json')).sort()
  return Promise.all(names.map(async (name) => ({
    name,
    data: JSON.parse(await fs.readFile(path.join(fixtureRoot, name), 'utf8'))
  })))
}

export async function testDataContracts() {
  const { registry } = await loadSchemaRegistry(root)
  const { validators } = await createSchemaValidator(root, registry)
  const validFixtures = await loadFixtures('valid')
  const invalidFixtures = await loadFixtures('invalid')
  const results = []

  for (const contract of registry.contracts) {
    const valid = validFixtures.filter((fixture) => fixture.name.startsWith(`${contract.id}.`))
    const invalid = invalidFixtures.filter((fixture) => fixture.name.startsWith(`${contract.id}.`))
    assert.ok(valid.length >= 1, `${contract.id} requires at least one valid fixture`)
    assert.ok(invalid.length >= 2, `${contract.id} requires at least two invalid fixtures`)
    const validate = validators.get(contract.id)
    for (const fixture of valid) {
      assert.equal(validate(fixture.data), true, `${fixture.name} should pass: ${JSON.stringify(validate.errors)}`)
    }
    for (const fixture of invalid) {
      assert.equal(validate(fixture.data), false, `${fixture.name} should fail`)
    }
    results.push({ id: contract.id, valid: valid.length, invalid: invalid.length })
  }

  assert.ok(
    invalidFixtures.some((fixture) => fixture.name === 'save-data-v1.future-version.json'),
    'save fixtures must cover an unknown future version'
  )
  assert.ok(
    invalidFixtures.some((fixture) => fixture.name === 'save-data-v1.corrupt-version.json'),
    'save fixtures must cover a corrupt version type'
  )
  assert.ok(
    invalidFixtures.some((fixture) => fixture.name === 'map-event.invalid-trigger.json'),
    'event fixtures must cover an invalid discriminator'
  )
  return results
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
}

if (isMainModule()) {
  try {
    const results = await testDataContracts()
    results.forEach((result) => {
      console.log(`PASS ${result.id}: valid=${result.valid} invalid=${result.invalid}`)
    })
    console.log(`Data contract fixtures OK: ${results.length} contracts.`)
  } catch (error) {
    console.error(`FAIL ${error.message}`)
    process.exitCode = 1
  }
}
