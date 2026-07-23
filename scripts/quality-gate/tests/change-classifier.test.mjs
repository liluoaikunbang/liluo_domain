import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import { classifyChanges } from '../classify-changes.mjs'

const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/change-domains.json', import.meta.url), 'utf8'))

for (const [file, domain] of cases) {
  test(`${file} is classified as ${domain}`, () => {
    assert.ok(classifyChanges([file]).domains.includes(domain))
  })
}

test('classification is stable, normalized and de-duplicated', () => {
  const result = classifyChanges(['docs\\README.md', 'docs/README.md'])
  assert.deepEqual(result.files, ['docs/README.md'])
  assert.deepEqual([...result.domains].sort(), result.domains)
})
