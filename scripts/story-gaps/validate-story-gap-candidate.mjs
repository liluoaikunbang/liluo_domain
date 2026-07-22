import fs from 'node:fs'
import process from 'node:process'
import { validateCandidateCard } from './story-gap-contract.mjs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/story-gaps/validate-story-gap-candidate.mjs <candidate.json>')
  process.exit(2)
}
const candidate = JSON.parse(fs.readFileSync(file, 'utf8'))
const errors = validateCandidateCard(candidate)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`story gap candidate valid: ${candidate.candidateId}`)
