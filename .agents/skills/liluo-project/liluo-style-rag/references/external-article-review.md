# External article review

External articles are **style evidence**, not canon. They enter production Style Pack only after user review.

## Inventory

```bash
npm run writing:external:inventory
```

Scans `project-navigation/external-style-sources.json` roots:

- `external-knowledge/sources/fiction-bondage` → initial `restraint-themed`
- `external-knowledge/sources/zhihu-novels` → initial `general-prose`

Rebuilds `article-registry.json` and `author-registry.json`. Counts come from the command output—do not invent totals in chat.

## List titles / authors

```bash
npm run writing:external:authors
npm run writing:external:validate
```

## Batch review workflow

1. **Export**: `npm run writing:external:review:export` → `docs/写作资产/工作区/external-review/`
2. User scores offline (per-article weight, themeDomain override, notes)
3. **Import**: `npm run writing:external:review:import -- --input <path>`
4. **Validate**: `npm run writing:external:validate`

## Article score fields (user only)

- Overall weight (typically 1–5 scale mapped to policy)
- Optional dimension notes
- `themeDomain` correction (overrides folder default)
- Review status: `unreviewed` → `reviewed` | `deferred`

Never infer scores from folder name, file length, or model preference.

## Production eligibility

Per policy: reviewed + weight ≥ minimum. `deferred` and `unreviewed` excluded from pack.

## Representation modes

Default `source-only` in registry—full text stays in source mirror; pack uses abstract/snippet per copyright rules (see copyright-and-content-leakage.md).

## Promote to production asset

Review import updates registry only. Promoting to abstract style card or golden-adjacent asset requires separate explicit user approval via asset governance—not this Skill alone.
