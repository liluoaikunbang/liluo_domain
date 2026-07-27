# Canon / Style separation

StyleRAG operates on **expression metadata only**. It must never carry plot facts into retrieval or pack output.

## Forbidden in Style Query

Per `project-navigation/style-rag-policy.json` → `canonForbiddenInStyleQuery`:

- Character, location, organization, item, ability names
- Plot beats, world rules text, dialogue quotes
- API keys, absolute filesystem paths

Validation: `npm run writing:style:validate`. Leakage fails before search/pack.

## What Style Pack may contain

- Approved golden excerpts (bounded character budget)
- User-approved personal history snippets
- User-reviewed external article **representations** (abstract or short excerpt per policy—not full copyrighted text)
- Calibration pairs (before/after expression fixes)
- External abstract style cards
- Approved 璃落写作表 principles

## What Style Pack must not do

- Introduce new canon facts to the model
- Replace `immutableFacts` on the prose contract
- Write into `src/game/data/story_outline/**`, dialogues, or plot catalog

## Formal prose contract remains authoritative for facts

`canonSources`, `immutableFacts`, `forbiddenAdditions`, and `stateAfter` on the formal prose request are the fact gate. Style Query is a sibling input under `expression.styleQueryPath`, not a substitute.

## Agent check (砚秋 / 言澈)

- 砚秋: pack sections do not smuggle distinctive proper nouns from external sources.
- 言澈: query fields do not encode scene-specific canon the model could treat as facts.
