# Writing sheet lifecycle

璃落写作表 is the **user-approved expression constitution**—principles and patterns backed by evidence assets.

## Paths

| Stage | Path |
| --- | --- |
| Current (production) | `docs/写作资产/璃落写作表/current.json` |
| Draft | `docs/写作资产/璃落写作表/drafts/draft-latest.json` |
| History | `docs/写作资产/璃落写作表/versions/<timestamp>.json` |

## Status flow

```
awaiting-assets → draft → approved
```

- **awaiting-assets**: no evidence or no user approval; pack omits writing sheet section
- **draft**: CLI draft written; not yet production
- **approved**: `approvedByUser: true`; rendered into Style Pack

## Evidence priority

Default order in sheet JSON:

1. golden-approved
2. calibration-pair
3. personal-history
4. external-article-high-score (reviewed only)
5. external-style-card

External articles **cannot alone** define 璃落文风. Approval fails if `evidenceAssetIds` is empty or external-only without golden/calibration anchor (CLI enforces).

## Commands

```bash
npm run writing:style:sheet:draft [-- --from-registry]
npm run writing:style:sheet:approve -- --user-approved [-- --draft-path <path>]
```

Approve requires explicit `--user-approved` flag—never implicit.

## Sheet content fields

- `principles[]`: short expression rules
- `preferredPatterns[]` / `avoidedPatterns[]`
- `evidenceAssetIds[]`: traceability
- `notes`: human context

## Integration

Approved sheet → `renderWritingSheetText()` → Style Pack `sections.writingSheet`. Updates do not auto-sync to Skills or ADR; use governance when principles change project-wide.

## Calibration archive hook

New calibration pairs may trigger sheet draft suggestion after ≥3 approved pairs in same category—user still must approve sheet explicitly.
