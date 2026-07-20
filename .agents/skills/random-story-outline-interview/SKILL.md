---
name: random-story-outline-interview
description: Randomly select a story-outline entry from one or more project worlds, reconstruct its source JSON and Markdown context, and ask detailed inspiration-oriented questions about actionable missing metadata. Use when the user asks to randomly choose a story entry, interview them about an incomplete outline, provide context before asking questions, or repeat this workflow for urban, ancient, apocalypse, fantasy, science, Munika, or all worlds.
---

# Random Story Outline Interview

Use this workflow to turn an incomplete story node into a focused creative interview.

## Required reference

Read `docs/系统说明/故事大纲随机提问模板.md` completely before selecting an entry or drafting questions. Also follow `docs/系统说明/故事大纲条目模板.md` and the selected world's option file when the interview will be written back into the outline.

## Workflow

1. Resolve the requested world range. If the user names no world, include every source JSON under `src/game/data/story_outline/sources/`.
2. Build the candidate pool from ordinary nodes that have non-empty `missingItems`. Exclude categories, main-quest containers and withdrawn nodes unless the user explicitly includes them.
3. Select one candidate randomly. Do not repeatedly choose a convenient or familiar entry.
4. Read the selected source JSON node, its Markdown file, its direct parent, direct children and relevant sibling nodes. Read referenced gameplay entries when they affect the questions.
5. Summarize only confirmed context: world, style, maturity, hierarchy, premise, existing mechanics, characters, locations and already answered constraints.
6. Classify each missing item:
   - Prefer metadata, story structure, character motivation, relationships, entry conditions, goals, state changes, branching, endings, replay rules and concrete gameplay loops.
   - Usually skip maps, scene-image production, audio, music, sound effects, animation implementation and other assets that the user cannot conveniently specify in text.
   - Ask about an asset only when its narrative content changes the story, such as who appears in a CG or which moment it depicts.
7. Ask specific, context-bound questions using the required reference. Convert generic gaps into named decisions about this exact entry.
8. Do not write answers into project files until the user answers or explicitly asks for immediate drafting.

## Question quality gate

- State the selected entry and its useful context before asking anything.
- Ask 4–7 questions by default; combine tightly related decisions.
- Name the entry, location, character, predecessor or existing mechanic in each question when relevant.
- Explain why the decision matters or show 3–6 plausible directions that fit existing material.
- Do not present invented options as established facts.
- Do not ask for information already recoverable from project files.
- Do not ask only `请补充玩法`, `请补充地图` or similarly generic prompts.
- Preserve extensible concepts. If the user defines an area as infinite or modular, ask for stable rules and entry/exit behavior instead of forcing a complete room list.

## After the user answers

When asked to write the answers back, re-read the source node and Markdown, determine the highest honestly supported maturity, update both sources consistently, and remove only resolved missing items. Then perform a second gap audit against the updated full context. If the answers reveal narrower unresolved decisions, replace the old items with specific new `missingItems`; never treat an exhausted old list as proof that the entry is complete. Leave `missingItems` empty only when no actionable gap required by the current maturity remains. Do not promote asset-production details that belong to a later maturity, fabricate stable IDs, or invent implementation references. Run the existing story-outline tests after writing.
