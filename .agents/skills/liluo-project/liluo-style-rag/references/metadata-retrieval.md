# Metadata retrieval (V1)

V1 StyleRAG is **deterministic metadata scoring** over approved asset registries—not semantic search.

## Asset sources

| Type | Registry / path |
| --- | --- |
| Golden approved | `docs/写作资产/registry.json` |
| Personal history | same registry, tier `personal-history` |
| Calibration pairs | `docs/写作资产/修改对照/` |
| External articles | `docs/写作资产/外部风格研究/article-registry.json` |
| External style cards | `docs/写作资产/外部风格研究/抽象风格卡/` |
| Writing sheet | `docs/写作资产/璃落写作表/current.json` |

## Scoring dimensions

Weights from `project-navigation/style-rag-policy.json` → `scoring`:

- Scene function, POV, narrative distance, tension, densities, information release, sentence rhythm, world type
- **`themeDomain`**: domain match only (see restraint-general-domain.md)
- **`userQuality`**: from user review import only
- **`modelEffectiveness`**: from style feedback after ≥ minimum rated uses
- **`assetQuality`**: registry tier (golden > calibration > personal > external)

## Selection rules

- `minimumScore`, `diversityPenalty`, per-source caps in `packLimits`
- Max one source per work / author in a single pack
- Missing metadata fields score 0 for that dimension (not guessed)

## Commands

```bash
npm run writing:style:search -- --query <path>
npm run writing:style:explain -- --query <path>
```

Explain output lists dimension contributions and exclusion reasons (unreviewed, below weight floor, canon leakage risk, budget exceeded).

## Empty results

No approved assets → pack status `awaiting-assets` or `partial`. This is success, not error. Do not backfill with unreviewed external text.
