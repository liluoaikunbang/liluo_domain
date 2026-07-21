---
name: liluo-story-outline-graph-maintenance
description: Safely insert, move, split, merge, rename, or repair 璃落 story-tree parentKey links with dry-run validation. Use for 移动节点、插入节点、改父节点、side 分支、断链、循环或重复 key；not for prose-only authoring.
---

# Story Outline Graph Maintenance

Read `AGENTS.md`, affected source JSON/Markdown and [graph-operation-rules.md](references/graph-operation-rules.md). Use `scripts/outline-graph-ops.mjs` for summaries and validation.

1. Capture key count, target, parent, direct children and Markdown paths.
2. Default to moving only the named node. For `A → C`, insert B as `A → B → C`.
3. With multiple direct children and unspecified chain, stop and ask.
4. Produce a dry-run diff before an explicit reviewed patch; operate by stable key.
5. Recount and check duplicates, missing parents, cycles, lost keys and paths.
6. Never delete unspecified nodes or infer `branchLayout: side`.
