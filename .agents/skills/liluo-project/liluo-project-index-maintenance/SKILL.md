---
name: liluo-project-index-maintenance
description: Build, check, query, validate, repair, or upgrade the 璃落 project knowledge index. Use for 建立项目知识索引、更新或重建索引、检查过期、刷新领域索引、查询索引、修复格式、升级 schema 或重新生成反向引用；not for ordinary single-file edits or prose discussion.
---

# Project Index Maintenance

Read `AGENTS.md`, `project-index/INDEX.md`, [index-contract.md](references/index-contract.md), and only the workflow reference needed for the request.

## Query first

1. Run `npm run project:index:check`.
2. When current or partial with the requested domain current, use `npm run project:index:query -- ...`.
3. Open the smallest authoritative source set returned by the query before making factual judgments or edits.
4. If stale, use the index only to locate candidates and report that status.

## Update after changes

Inspect the Git change scope, use [update-decision.md](references/update-decision.md), then run `npm run project:index:changed` and `npm run project:index:validate`. Check for unexpectedly large generated diffs. Never hand-edit generated index JSON.

Index authoritative Markdown under `docs/设计记忆/` and `docs/规范治理/` through the existing docs domain. Treat registries and accepted ADR/CDR as navigable project records; do not treat temporary audit output as authority or add a parallel governance index.

After an approved story-gap candidate is formally written, refresh the affected story/graph and any gameplay/game/docs domains. Do not add transient analysis or `planning/story-gaps/` candidates to the formal story index unless a future planning domain is explicitly designed.

Index authoritative Markdown under `docs/设计记忆/` and `docs/规范治理/` through the existing docs domain. Treat registries and accepted ADR/CDR as navigable project records; do not treat temporary audit output as authority or add a parallel governance index.

Use `npm run project:index:build` for schema/generator upgrades, broad moves, ID-system or relation-format changes, corruption, or an explicit full rebuild. Run build twice when determinism matters.

## Boundaries

Treat source JSON, Markdown, code, registries, assets and system docs as authoritative. Do not invent entities, delete sources, install search/vector services, call external models for summaries, start background services, commit temporary results, or commit/push Git. Read [query-guide.md](references/query-guide.md) for supported filters and compact output.
