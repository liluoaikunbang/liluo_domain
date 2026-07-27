# Restraint vs general domain

`themeDomain` classifies **subject domain for style matching**, not writing quality.

## Values

| Value | Typical source |
| --- | --- |
| `restraint-themed` | `external-knowledge/sources/fiction-bondage` |
| `general-prose` | `external-knowledge/sources/zhihu-novels` |
| `mixed` | User override when article spans both |
| `unknown` | Unclassified; matches nothing in production |

## Initial classification

Folder-based per `project-navigation/external-style-sources.json`. Inventory assigns default domain; user may override on review import.

## Match matrix

Policy `themeDomainMatch` maps query domain → asset domain → multiplier (0.0–1.0).

Examples:

- Query `restraint-themed` + asset `restraint-themed` → 1.0
- Query `restraint-themed` + asset `general-prose` → 0.4 (weak match, not forbidden)
- Query `unknown` → no domain match credit

## Not a quality score

High match on `restraint-themed` does **not** mean “better prose.” Quality enters via `userQuality` and golden tiers only.

## Query authoring

Set `themeDomain` on Style Query to match the **expression task**, not the world's plot genre alone. A daily scene in a restraint-heavy game may still use `general-prose` if the beat is ordinary dialogue—user decides.

## Scoring weight

`themeDomain` dimension weight ≈ 0.08 in policy—meaningful for retrieval diversity, not dominant over scene function or user quality.

## Agent note (知遥)

When user asks “which domain should I pick,” cite folder default + beat type; never rank authors by domain label.
