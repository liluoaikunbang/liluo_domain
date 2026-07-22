import { validateNotes } from './team-presence.mjs'
const errors = validateNotes(); if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 } else console.log('team notes valid')
