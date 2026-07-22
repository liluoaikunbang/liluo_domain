import { validateRoster } from './team-presence.mjs'
const errors = validateRoster(); if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 } else console.log('team roster valid')
