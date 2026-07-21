---
name: liluo-story-outline-authoring
description: Create, expand, or template-refactor a specified 璃落 story node while synchronizing source JSON and Markdown. Use for 新增故事条目、完善大纲、灵感升级、补齐地图事件玩法状态；not for random interviews, graph-only moves, audits, or map implementation.
---

# Story Outline Authoring

Read `AGENTS.md`, the outline template, target world option, source node, Markdown, parent, direct children and real referenced material. Read [maturity-decision.md](references/maturity-decision.md) and [authoring-checklist.md](references/authoring-checklist.md).

1. Reconstruct confirmed context and choose the highest honestly supported maturity.
2. Ask only for decisions affecting world, primary tag, player flow, gameplay, states, branches or resources.
3. Never use fake IDs, `无`, `待定`, filler, or copy a world candidate library.
4. Synchronize JSON and one Markdown file; verify key, title, filename, world, parentKey and missingItems.
5. Do not restructure relatives unless requested; route graph work to `$liluo-story-outline-graph-maintenance`.
6. Run story tests and `$liluo-game-content-validator`; preserve data and report exact failures.
