# Style Query contract

Authority: `schemas/workflows/style-query.schema.json`, `docs/写作资产/模板/Style查询模板.json`, `docs/写作资产/模板/Style查询说明.md`.

## Required fields

| Field | Notes |
| --- | --- |
| `schemaVersion` | `1` |
| `queryId` | Prefix `sq-` |
| `mode` | `explicit` \| `metadata` \| `hybrid-explicit` |
| `primarySceneFunction` | From `project-navigation/style-taxonomy.json` |
| `themeDomain` | `restraint-themed` \| `general-prose` \| `mixed` \| `unknown` |

## Optional expression dimensions

POV, narrative distance, tension/action/dialogue/psychological density, information release, sentence rhythm, sensory priority, language intensity, ending mode, restraint functions (when domain allows).

## Explicit mode hooks

- `explicitReferenceIds`: 0–3 approved asset IDs (V0 path).
- `hybrid-explicit`: metadata search **plus** forced inclusion of explicit IDs.
- `excludedAssetIds`: user blocklist for this query only.

## Hard rules and model hints

- `hardRules`: max 8 short expression rules (no canon).
- `modelKnownFailureModes`: per-model expression weaknesses to down-rank bad examples.

## Validation pipeline

1. JSON schema
2. Taxonomy enum check
3. Canon leakage assert (`assertNoCanonLeakage`)
4. Policy weights sum to 1 (`validateScoringWeights`)

Invalid queries fail before `style-search` or `style-pack`.

## Linking to prose contract

Set `expression.styleQueryPath` on formal prose request. Draft/compare CLI loads query, assembles pack, attaches rendered markdown to model prompt. Facts still come from prose contract only.
