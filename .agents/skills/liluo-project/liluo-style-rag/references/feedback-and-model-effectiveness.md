# Feedback and model effectiveness

Style feedback closes the loop between retrieval choices and future scoring—without auto-updating Skills.

## Storage

`docs/写作资产/工作区/style-feedback.json` (append-only records per run).

## Record feedback

```bash
npm run writing:style:feedback -- --run <run-id> --choice <asset-id> [-- --rejected <id>...]
```

Links to prose run manifest under `docs/写作资产/工作区/runs/`.

## Model effectiveness dimension

Policy `externalQuality.minimumRatedUsesForModelEffect`: effectiveness weight activates only after enough user choices for `(query profile, asset, model)` tuple.

Until then: `unknownModelEffectivenessScore` (neutral 0.5).

## Weight adjustment

Scoring weights live in `project-navigation/style-rag-policy.json` → `scoring`. Sum must equal 1.

To adjust:

1. Edit policy JSON (governance-approved)
2. `npm run writing:style:validate` (includes weight sum check)
3. Re-run search on representative queries; compare explain output

Do not tune weights from a single user preference session.

## Explain before feedback

Always offer `writing:style:explain` when user asks why an asset ranked high/low. Reasons are deterministic from dimension breakdown.

## Hard gates

- Feedback does not auto-promote assets to golden
- Feedback does not auto-approve writing sheet
- Feedback does not write canon

## Deferred (V3+)

Learned reranker training from feedback logs is **not implemented**. See deferred-roadmap.md.
