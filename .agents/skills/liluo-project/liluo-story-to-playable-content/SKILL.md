---
name: liluo-story-to-playable-content
description: Convert one approved 璃落 story node into an evidence-backed production plan, executable skeleton, scoped implementation, or validation report. Use for 故事转可玩、制作清单、灰盒骨架、从大纲落地地图事件对话；not for bulk conversion or unapproved story rewriting.
---

# Story to Playable Content

Read `AGENTS.md`, `docs/系统说明/故事大纲到可玩内容转化系统.md`, the target JSON/Markdown, `src/game/data/story_outline/long-term-memory.json`, relevant runtime sources, and [playable-contract.md](references/playable-contract.md). Use the current index only to locate evidence, then verify original files.

Choose exactly one mode: `plan`, `skeleton`, `implement`, or `validate`. Run `npm run content:playable:plan -- --story-key <key>` before skeleton or implementation. Never invent IDs, batch-convert unrelated nodes, or treat a Markdown field as runtime support without checking the parser, registry and save contract.

- `plan`: return references, gaps, MVP, state contract, risks and work order; no runtime write.
- `skeleton`: create only the smallest schema-valid map/event/dialogue/test skeleton authorized by the user.
- `implement`: orchestrate existing map, dialogue/event, gameplay, save and asset Skills; keep player movement and exploration central.
- `validate`: run source gate, route checks, targeted tests, build and content/index validation; report manual browser checks separately.

Formal writes must pass `docs/系统说明/正式项目内容来源与版权写入门槛.md`. After lasting character or relationship changes, route them through `$liluo-character-arc-and-relationship-memory`. Use existing read-only 知遥/时雨/言澈/砚秋 only when cross-file evidence warrants it; the parent owns writes.
