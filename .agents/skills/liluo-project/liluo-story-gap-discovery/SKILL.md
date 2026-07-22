---
name: liluo-story-gap-discovery
description: Discover evidence-backed gaps, repeated functions, underused gameplay, scene/character/state/visual opportunities, and optional external-fiction patterns in a 璃落 story node, series, or world; return ranked original candidate cards for user approval. Use for 大纲缺口、补充候选、系列重复、未覆盖玩法/地图/CG/关系、外部模式灵感或世界级内容盘点；not when a complete user-authored plot only needs formal writing, for existing-fact lookup, or for unrelated code/map/save/asset work.
---

# Story Gap Discovery

Read root `AGENTS.md`, project-index status and the smallest relevant story/graph/gameplay/game/assets records. Verify every important claim in the original source. Read [analysis-modes.md](references/analysis-modes.md), [gap-taxonomy.md](references/gap-taxonomy.md), [candidate-card-contract.md](references/candidate-card-contract.md), [approval-workflow.md](references/approval-workflow.md), [retrieval-budget.md](references/retrieval-budget.md), and [originality-rules.md](references/originality-rules.md) only as required by the task.

## Run the workflow

1. Choose `node`, `series`, or `world` mode. Do not broaden scope silently.
2. Check `npm run project:index:check`; query the smallest `story`, `graph`, `gameplay`, `game`, `assets`, and `docs` slices needed. Treat indexes as navigation and open original files.
3. Reconstruct existing coverage before proposing gaps: target, up to two parents, direct children, at most three relevant siblings, necessary characters/world rules/gameplay/maps/events/CG links, reverse references, `missingItems`, and similar functions.
4. Separate confirmed gaps, possible gaps, intentional brevity, production deferral, and repeated story functions. Frequency alone never proves a gap.
5. Form an initial gap hypothesis before external retrieval. Use external mode `off` unless the user requests it or project evidence lacks differentiated patterns; default external mode is `light` when used. Read [retrieval-budget.md](references/retrieval-budget.md).
6. Query abstract external cards before short source previews through `$liluo-external-fiction-knowledge`; return to project canon and test fit, continuity, differentiation, gameplay causality, production scope, and source dependence.
7. Produce only the mode's highest-value ranked candidate cards. Cite repository paths, stable keys or index records for gap evidence. Explain why each candidate differs from existing content and why it is worth adding.
8. Stop for user approval. Do not edit story JSON/Markdown, create nodes, move the tree, or treat a candidate as canon.
9. After approval, update candidate state. Hand accepted candidates to `$liluo-story-outline-authoring`; use `$random-story-outline-interview` for unresolved high-value choices. Only the main Codex writes formal sources.
10. After formal writing, run continuity/gameplay/content checks, external copy-risk checking for externally informed long text, then refresh and validate the project index.

## Divide responsibilities

- Skill: scope, mode, retrieval budget, orchestration, candidate presentation, approval and downstream routing.
- `liluo_story_gap_analyst` / 星弥（故事缺口）: read-only evidence analysis, repeated-function detection, external pattern abstraction, candidate cards, ranking and risk.
- Main Codex / 璃落: user intent, final scope, truthful Agent attribution, approvals, formal writes, validation and synchronization.

Persist candidates under `planning/story-gaps/` only when the user explicitly requests saving. Never save analysis logs or long source passages. Use `scripts/story-gaps/story-gap-contract.mjs` and its tests for deterministic contracts.
