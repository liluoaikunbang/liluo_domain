---
name: liluo-external-fiction-knowledge
description: Query, build, incrementally update, validate, and originality-check the 璃落 external fiction reference library. Use for 外部小说素材、参考小说灵感、文学表达、类似场景、画面结构、虚构状态、题材模式、表达卡、外部语料更新/重建/过期检查或直接照搬风险检查；not for canonical project facts, ordinary code changes, internal project-index maintenance, or unrelated image work.
---

# 外部虚构题材知识库

Read root `AGENTS.md`, `external-knowledge/INDEX.md`, and only the reference files needed for the request.

## Query and creation

1. Run `npm run external:knowledge:check`; stop and report `error`, and update when `stale`.
2. Query cards or segments with `npm run external:knowledge:query -- ...`; return IDs, repository-relative sources and line ranges, not long quotations.
3. Read only the minimum original lines needed to verify an abstraction.
4. Extract general mechanisms; remove source names, proprietary terms, distinctive dialogue and complete event order.
5. Read the smallest relevant canonical domains through `project-index/INDEX.md`, then verify authoritative files.
6. Recompose for the current 璃落 world, character, map, event and gameplay constraints. Never treat external results as canon.
7. Before writing formal story/event/scene/CG/state content, run `npm run external:knowledge:copy-check -- --input <file>` and rewrite medium/high-risk passages.
8. Keep the user-facing plot catalog simple: external cards and source refs stay backstage; write only the original recomposed result into the formal plot/story fields unless an audit explicitly requests provenance.

## Maintenance

- Treat the directory configured in `external-knowledge/source-sync.local.json` as the machine-local authoritative source and `sources/fiction-bondage/` as its managed repository mirror. Never write back to the authoritative directory.
- New or changed sources: run `external:knowledge:update`; it first hashes and synchronizes only changed files, automatically removes managed mirror files absent upstream, then performs source-level incremental indexing. It aborts before deletion when the removal ratio exceeds 20%.
- Use `external:knowledge:sync` only when mirror synchronization without indexing is explicitly needed. Inspect `sync-status.json` and `sync-manifest.json` for the exact plan.
- Schema, segmentation, corrupt index, bulk moves, or explicit rebuild: run `external:knowledge:build`, then `validate`, `check`, targeted queries and tests.
- Never edit, normalize, rename, move, or delete the authoritative source to satisfy an index check. Duplicate files remain sources and are only reported.
- `card-rules.json` defines deterministic term and plot-pattern candidates. Add or refine rules there, require evidence groups and multiple independent sources where practical, then rebuild; do not hard-code source prose into cards.
- Generated cards remain `candidate` until explicit review; cards contain abstractions and traceable refs, never copied prose.

Read [knowledge-contract.md](references/knowledge-contract.md) for scope/data guarantees, [originality-rules.md](references/originality-rules.md) for formal writing, [card-types.md](references/card-types.md) when authoring cards, [query-guide.md](references/query-guide.md) for CLI usage, and [maintenance-guide.md](references/maintenance-guide.md) for rebuilds/upgrades.
