# Style Pack contract

Authority: `schemas/workflows/style-pack.schema.json`, `docs/写作资产/模板/Style文风包模板.json`.

## Status values

| Status | Meaning |
| --- | --- |
| `ready` | Pack assembled within budget with at least one section |
| `partial` | Some sections filled; limits or assets missing |
| `awaiting-assets` | No approved assets matched; safe empty pack |
| `blocked` | Policy violation (e.g., unreviewed external forced in) |

## Sections

- `writingSheet`: rendered approved 璃落写作表 text (nullable)
- `hardRules`: merged from query + sheet
- `positiveExamples`: golden / personal snippets
- `externalReferences`: reviewed external representations only
- `calibrationPairs`: before/after expression fixes
- `modelFailureModes`, `strictBoundaries`: anti-patterns

## Budget

`characterBudget.used` / `limit` from policy `maxRawReferenceChineseCharacters` (default 1800). Truncation is deterministic; prefer higher-scored assets first.

## Selected assets audit trail

Each entry: `assetId`, `assetType`, `score`, `sourceRecordId`, `reasons[]`. Required for explain/feedback loops.

## Production gate

`production.approvedAssetsOnly` in policy:

- External articles need `userScore.status === reviewed` and weight ≥ `minimumArticleOverallWeightForProduction`
- Never auto-approve; never promote registry entry to golden without user

## Command

```bash
npm run writing:style:pack -- --query <path> [--output <path>]
```

Output may include `renderedMarkdown` for attachment to prose draft/compare prompt.
