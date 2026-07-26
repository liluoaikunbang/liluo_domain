---
name: liluo-project-documentation-sync
description: Synchronize 璃落 feature docs, 功能更新目录, updateRecords.js, and project/user-facing 技能说明 while preserving dates and IDs. Use after material feature, workflow, schema, behavior, or user-facing Skill changes, and before claiming such a task complete; do not skip because docs feel optional. Do not trigger for wording-only Skill edits, internal metadata, typo fixes, or routine content maintenance.
---

# Project Documentation Sync

Read `AGENTS.md` and [documentation-contract.md](references/documentation-contract.md). Inspect all three record sources before choosing an ID.

**Trigger reminder:** this Skill is not a lifecycle Hook. After material system/Skill/schema/user-entry changes, the main agent must load it before the final report. Path-attached Cursor rule `documentation-governance.mdc` only reminds; it does not rewrite files.

Use the current docs index to localize records when helpful; after documentation changes run the shared incremental index update and validation rather than maintaining a separate index.

1. Preserve creation dates and all update history; append only the current change.
2. Keep one unique ID, title, creation date and current summary across document, catalog and update record. Historical twin IDs may use `NNN-a` / `NNN-b`.
3. Never invent a summary, change a creation date, overwrite history or mass-renumber unrelated records.
4. Keep records newest-first and stable for equal dates.
5. Do not create a feature-update number for an ordinary single story-outline edit, interview write-back, typo fix, metadata adjustment, or other routine content maintenance. Keep those changes in their authoritative content files and refresh the project index only.
6. Create or extend a feature-update record when the work implements playable maps/events/dialogues/gameplay, changes code or system behavior, establishes a project workflow or schema, delivers a meaningful asset batch, restructures a full main-line/content batch, or otherwise materially affects multiple content nodes. Prefer appending to the existing related record when the change extends the same feature.
7. Run only the validators directly affected by the synchronized records (`docs:governance:audit` when IDs/catalog/records changed). When the change adds or renames a user-invokable project Skill/workflow, or edits `docs/用户命令目录.md`, also run `npm run docs:commands:validate` so missing catalog entries fail closed. Do not probe a documented script known to be absent, and do not run a Web build for documentation-only changes.
8. Never commit or push automatically.

This Skill is the mechanical downstream of `liluo-project-governance-memory`. It does not decide whether a requirement is persistent, choose a rule authority, or create ADR/CDR rationale. For a new user-facing workflow, also synchronize `docs/用户命令目录.md` and verify with `docs:commands:validate`. Add only the smallest governance validator selected by the task's deduplicated verification plan; reserve the full governance audit for broad structural changes or an explicit audit request.
