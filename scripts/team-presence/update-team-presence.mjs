import { readState, writeState } from './team-presence.mjs'
const args = Object.fromEntries(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.replace(/^--/, '').split('='); return [key, rest.join('=')] }))
const old = readState() ?? {}
writeState({ ...old, schemaVersion: 1, lastActivity: new Date().toISOString(), lastTopics: args.topic ? [args.topic] : old.lastTopics ?? [], lastActiveMembers: args.members ? args.members.split(',') : old.lastActiveMembers ?? [], milestone: args.milestone ?? null, reunionShown: false })
console.log(JSON.stringify({ updated: true, statePath: '.local/team-presence-state.json' }, null, 2))
