import { presenceFor, readState } from './team-presence.mjs'
const state = readState()
const result = presenceFor(state?.lastActivity, new Date(), state?.reunionShown ?? false)
console.log(JSON.stringify({ ...result, lastTopics: state?.lastTopics ?? [], lastActiveMembers: state?.lastActiveMembers ?? [] }, null, 2))
