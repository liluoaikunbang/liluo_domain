# Copyright and content leakage

StyleRAG must not exfiltrate copyrighted full text into prompts, Git, or chat logs.

## Source mirrors

External roots are read-only mirrors:

- `external-knowledge/sources/fiction-bondage`
- `external-knowledge/sources/zhihu-novels`

Do not write normalized copies back to authoritative user directories outside the repo.

## Representation in pack

| Mode | Pack behavior |
| --- | --- |
| `source-only` | Reference ID + abstract metadata; no bulk paste |
| Abstract style card | User-approved short abstraction in `docs/写作资产/外部风格研究/抽象风格卡/` |
| Snippet | Bounded excerpt within character budget, user-approved |

Default for inventory: `source-only`. Snippets require explicit promotion.

## Character budget

Policy `maxRawReferenceChineseCharacters` caps total quoted material in one pack. Truncation is mandatory, not best-effort.

## Leakage types

1. **Canon leakage**: plot facts in Style Query (blocked by validate)
2. **Copyright leakage**: long verbatim external passages in pack or chat
3. **Credential leakage**: paths, API keys in query JSON

## Distinction from liluo-external-fiction-knowledge

That Skill handles inspiration cards and copy-risk for **plot mechanisms**. StyleRAG handles **expression references** under stricter production gates. Do not route general “类似场景” queries here.

## User-facing rule

When presenting search results, return asset IDs, titles, authors, scores, and short reasons—not multi-paragraph quotations from external files.

## Review before production

Unreviewed articles cannot enter pack. User review import is the audit trail for “this external source may be referenced in bounded form.”
