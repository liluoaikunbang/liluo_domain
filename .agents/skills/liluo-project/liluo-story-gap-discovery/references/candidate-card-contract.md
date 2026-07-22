# Candidate card contract

Each card uses a unique `gap-candidate-*` ID, candidate status, node/series/world scope, title, gap types and path/key/index evidence. Include a concise core idea, story functions, project adaptation (`world`, `characters`, `locations`, `gameplay`, `maps`, `events`, `cgOpportunities`, `stateChanges`), differences from existing content, external abstractions and source refs, six 1–5 scores, estimated scope and approval options.

Scores: higher `projectFit`, `gapCoverage`, `novelty`, and `productionFeasibility` are better; higher `continuityRisk` and `sourceDependenceRisk` are worse. Rank for fit + coverage + novelty + feasible cost + low risks, not external frequency.

Do not force irrelevant fields, copy source prose, omit evidence/differentiation/scope, or mix candidate status with formal story-node status. Validate persisted cards with `validateCandidateCard` from `scripts/story-gaps/story-gap-contract.mjs`.
