---
name: liluo-character-arc-and-relationship-memory
description: Validate and maintain evidence-backed long-term character growth and relationship changes for 璃落. Use for 角色弧光、关系阶段、长期能力代价、跨章节变化记忆；not for transient emotions, speculative canon or runtime save migration.
---

# Character Arc and Relationship Memory

Read `docs/系统说明/角色成长与关系长期记忆系统.md`, `src/game/data/story_outline/long-term-memory.json`, the cited story sources, and [memory-contract.md](references/memory-contract.md). Use the project index for location only and verify every claim in original sources.

Only persist a change when it is lasting, scoped to a world/series/cross-world continuity, has an effective story position, and cites formal evidence. Record character and relationship changes separately. Preserve core constants and intentional cross-world differences. Reject scene-only mood, temporary hostility, guessed motives, proposed candidates and external reference material.

Run `npm run character:memory:validate` for a proposed record and the content-production tests. If a change also needs runtime persistence, route the schema work to `$liluo-save-data-migration`; this Skill does not silently change `GameSaveData` or real saves. Complex contradiction review may use read-only 言澈; the parent writes accepted records.
