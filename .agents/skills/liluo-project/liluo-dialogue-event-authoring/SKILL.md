---
name: liluo-dialogue-event-authoring
description: Author executable 璃落 dialogues and story events with conditions, choices, state changes, items, CG, portraits, gameplay entry, exit and re-entry. Use for 对话、条件分支、剧情事件或状态驱动演出；not for prose-only fiction or map registration alone.
---

# Dialogue Event Authoring

Read `docs/系统说明/事件与对话系统.md`, `src/game/core/EventRunner.ts`, execution helpers, registry, representative map JSON/TS, interactive-fiction registry, player runtime and save schema. Read [event-authoring-checklist.md](references/event-authoring-checklist.md).

Define how the player enters, acts, branches, changes state, succeeds/fails/exits and re-enters. Reuse actual schema and resource keys; never invent IDs or overwrite state unconditionally. Keep exploration and player action central rather than reducing the game to dialogue boxes. Validate JSON, registry references, event-runner/dialogue tests and build.

For cross-file events, use `liluo_context_explorer` for story/gameplay evidence and `liluo_continuity_reviewer` when relationships or chronology are involved. Both remain read-only; the parent authors event data.
