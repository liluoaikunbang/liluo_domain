# External author prior

Author registry: `docs/写作资产/外部风格研究/author-registry.json`.

## Purpose

Author prior is a **soft boost** when choosing among external articles—not a quality verdict on the author.

## Combined external quality score

From `style-rag-policy.json` → `externalQuality`:

```
effective = articleScoreWeight * articleUserWeight
          + authorPriorWeight * authorUserPrior
```

Defaults: 0.7 article / 0.3 author. Unrated article or author uses neutral 0.5—not zero, not high.

## User prior fields

| Field | Source |
| --- | --- |
| `userPrior.weight` | User review import only |
| `userPrior.status` | `unreviewed` \| `reviewed` |
| `derivedStatistics` | Recomputed after inventory/import (means, theme counts) |

## Article score beats author prior

When article has reviewed weight, it dominates the blend. Author prior breaks ties among similarly scored articles from the same author—not a substitute for per-article review.

## Caps

`packLimits.maxSourcesFromSameAuthor`: 1 per pack. Prevents one author dominating expression references.

## Listing authors

```bash
npm run writing:external:authors [-- --theme-domain restraint-themed|general-prose]
```

Shows display name, aliases, article IDs, review status. Unknown authors flagged from folder hints in `external-style-sources.json`.

## Hard gate

Do not forge `userPrior.weight` or mark `reviewed` without import evidence.
