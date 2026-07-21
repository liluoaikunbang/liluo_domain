---
name: liluo-story-outline-authoring
description: Create, expand, or template-refactor a specified 璃落 story node while synchronizing source JSON and Markdown. Use for 新增故事条目、完善大纲、灵感升级、补齐地图事件玩法状态；not for random interviews, graph-only moves, audits, or map implementation.
---

# Story Outline Authoring

Read `AGENTS.md`, the outline template, target world option, source node, Markdown, parent, direct children and real referenced material. Read [maturity-decision.md](references/maturity-decision.md) and [authoring-checklist.md](references/authoring-checklist.md).

1. Reconstruct confirmed context and choose the highest honestly supported maturity.
2. Ask only for decisions affecting world, primary tag, player flow, gameplay, states, branches or resources.
3. Never use fake IDs, `无`, filler, or copy a world candidate library.
4. When the user says an inspiration is not figured out, "待定" or "待做", preserve only the confirmed direction and register the unresolved decision as a concrete `missingItems` entry. Do not complete it, promote it into established plot, add an appearance/reference, or invent implementation details. Treat "待定" as workflow state, not filler prose.
5. Synchronize JSON and one Markdown file; verify key, title, filename, world, parentKey and missingItems.
6. Do not restructure relatives unless requested; route graph work to `$liluo-story-outline-graph-maintenance`.
7. Run story tests and `$liluo-game-content-validator`; preserve data and report exact failures.
8. Before asking any question that may lead to outline write-back, or before making a user-authorized outline change that still requires a story decision, search `src/game/data/plot_outline/catalog.json` for unused entries and unresolved portions of partially used entries that plausibly match the confirmed world, characters, locations, conflict or player flow. Include real matches as concise optional choices in the same question, naming the plot entry and why it may fit. Do not add irrelevant candidates merely to fill options. Never insert one automatically or describe an unresolved portion as established plot.
9. After explicit adoption, synchronize the story, append its real key to `usedBy`, and set `usageStatus` to `partial` or `used`. Keep causally linked setup and payoff in one entry. Register new unresolved fragments with the next stable ID, `isUsed: false`, `usageStatus: unused` and empty `usedBy`.
10. Format plot titles as `主要人物-短情节名`. Omit the default protagonist 璃落; list at most three other main characters and append `等` when more exist. Preserve stable keys in `usedBy`; format each matching `usedByLabels` value as `世界名-主线名-节点名` in Chinese.
11. Record every appearing character, including 璃落, in `characters`. Keep ordinary `tags` free-form. Populate `bondageTags` only with existing confirmed tags that describe this plot itself; never inherit a tag merely because an applied story node has it, and never invent a bondage tag.
