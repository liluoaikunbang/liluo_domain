---
name: liluo-natural-expression
description: Improve natural expression, narrative rhythm, character voice, subtext, and reader-facing clarity without changing facts. Use by default in light mode for 璃落 story-outline prose, fiction, game dialogue, character interiority, scene text, creative-team dialogue, project notes, player-facing copy, public development narratives, user-requested writing tests or drafts (including named restraint poses), and reader-facing RAG/Style-RAG prose (knowledge-card body text, Style Pack abstracts, review/audit negotiation notes, revision plans); the main agent must read this Skill before composing or revising such text. Use deep mode for important chapters or scenes, diagnose for analysis-only requests or pre-delivery self-check, and do not use on code, schemas, paths, logs, exact quotations, or other precision-first technical text.
---

# 璃落自然表达与文气塑形

Treat other Skills and authoritative project files as the source of **what is true**. This Skill controls only **how reader-facing language is expressed**. Never invent facts, states, keys, numbers, world rules, Agent participation, or story continuity.

## Route the task

Before any substantive compose or revise of reader-facing prose, read this Skill and the matching reference. Do not skip because the request is informal, a test, a short draft, or “only a RAG / Style-RAG card.” Knowledge-card body text, Style Pack abstracts, review/audit negotiation notes, and revision plans use `light`; IDs, paths, CLI, and JSON stay `off`.

Choose one operation and one intensity:

- `compose`: shape new prose from confirmed material.
- `revise`: preserve facts, structure, purpose, and anchors while rewriting only what needs help.
- `diagnose`: report mechanical patterns and voice problems without changing the text.
- `off`: use for code, JSON/YAML/TOML, schemas, commands, paths, logs, tables, exact quotations, permissions, structured handoffs, or verbatim requests.
- `light`: default for non-technical reader-facing text. Read [quick-contract.md](references/quick-contract.md) and only the matching text-type reference.
- `deep`: use for formal fiction chapters, pivotal scenes, long dialogue, core-character writing, important project notes, or major public narratives. Also read [shared-principles.md](references/shared-principles.md), [mechanical-patterns.md](references/mechanical-patterns.md), the matching style profile, and [revision-depth.md](references/revision-depth.md).

For mixed documents, isolate narrative regions. Leave technical blocks unchanged.

## Work in a fact-preserving order

1. Identify the text type, audience, operation, and intensity.
2. Extract immutable anchors: names, keys, values, states, order dependencies, locations, and explicit constraints.
3. Load only the matching reference: fiction, outline, game dialogue, team dialogue, project notes, public development writing, fictional adult restraint narrative, or character voice.
4. Diagnose physical and behavioral plausibility first, then paragraph function, rhythm, narrative distance, voice, and subtext. Do not trade an ordinary credible action for an invented clever detail merely to imply character history or avoid direct expression.
5. Change the smallest span that improves the passage. Preserve already-natural writing.
6. In `deep`, run a second mechanical-pattern pass, compare every anchor with the source, and cut ornamental expansion.

Before delivering reader-facing prose, apply the meaning check: do not add a rhetorical question merely to create mystery, weight, or a quotable ending. Keep a question only when the text establishes who can answer it and the answer changes a character's judgment, a player's investigation, or a real next action. Otherwise state the confirmed fact or the concrete unresolved issue directly.

Matching references are [fiction-prose.md](references/fiction-prose.md), [story-outline.md](references/story-outline.md), [game-dialogue.md](references/game-dialogue.md), [team-dialogue.md](references/team-dialogue.md), [project-notes.md](references/project-notes.md), [public-development-writing.md](references/public-development-writing.md), [fictional-restraint-narrative.md](references/fictional-restraint-narrative.md), and [character-voice.md](references/character-voice.md).

For fictional restraint prose, `fictional-restraint-narrative.md` owns the mandatory low-token retrieval route. Use the external-fiction library for prose and scene mechanisms; use the imported restraint research cards for terminology, named poses, worldbuilding, prompt architecture or visual tags. Query both only when both needs are material. Project canon already establishes that every participating character is an adult, so do not add a separate unknown-age branch. Keep retrieval targeted and separate from canon.

## Protect project truth and authorship

- Do not decide story facts, add lore, perform continuity review, or replace the story-authoring Skills.
- Do not claim a team member participated unless a real Agent output exists.
- Do not imitate a living author or retain substantial copyrighted samples in style profiles.
- Keep style profiles abstract and update them only from repeated, future-useful user preferences.
- Except for the bounded restraint-research route owned by `fictional-restraint-narrative.md`, query external Skill RAG only when this local Skill lacks a mode, repeated revisions still fail, an upgrade is being designed, or the user explicitly asks for comparison. External material remains non-authoritative.

Use [upstream-provenance.md](references/upstream-provenance.md) only when auditing or upgrading this Skill.
