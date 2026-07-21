---
name: liluo-gameplay-loop-audit
description: Audit gameplay ideas against the current 2D pixel PVE RPG, converting viable competitive mechanics into developable single-player loops. Use for 玩法循环、PVE 转化、可开发性、重复玩法或最小原型审查；not for implementing code by default.
---

# Gameplay Loop Audit

Read `docs/大纲玩法总表整合规格.md`, `src/game/data/gameplay_outline/catalog.json`, story gameplay references, existing minigames, input/player state, maps and Vue/Phaser architecture. Use [gameplay-loop-rubric.md](references/gameplay-loop-rubric.md).

Use current gameplay/story/code indexes for complex localization, verify original records, and refresh affected domains after indexed-source changes.

For each idea report the 10–30 second action loop, map carrier, input, pressure, success/failure/exit, state/save effects, story/CG links, differentiation, MVP, UI/AI/map/animation/audio needs, complexity and reusable modules. Grade: 可直接进入原型、需要补充规则、事件子玩法、大型副本、高度重合、不适合当前方向. Convert PVP pressure into enemies, environment, rivals or timers instead of rejecting it solely for origin.

When needed, use `liluo_context_explorer` for existing gameplay/story requirements and `liluo_game_architecture_explorer` for current 2D pixel PVE feasibility. Do not turn ideation into a broad code survey.
