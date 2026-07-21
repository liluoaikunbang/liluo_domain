---
name: liluo-project-documentation-sync
description: Synchronize 璃落 feature docs, 功能更新目录, updateRecords.js, and 技能说明 while preserving dates and IDs. Use after confirmed feature work, Skill documentation changes, record audits, or duplicate-number fixes; not to document untested features or commit Git.
---

# Project Documentation Sync

Read `AGENTS.md` and [documentation-contract.md](references/documentation-contract.md). Inspect all three record sources before choosing an ID.

Use the current docs index to localize records when helpful; after documentation changes run the shared incremental index update and validation rather than maintaining a separate index.

1. Preserve creation dates and all update history; append only the current change.
2. Keep one unique numeric ID, title, creation date and current summary across document, catalog and update record.
3. Never invent a summary, change a creation date, overwrite history or mass-renumber unrelated records.
4. Keep records newest-first and stable for equal dates.
5. Do not create a feature-update number for an ordinary single story-outline edit, interview write-back, typo fix, metadata adjustment, or other routine content maintenance. Keep those changes in their authoritative content files and refresh the project index only.
6. Create or extend a feature-update record when the work implements playable maps/events/dialogues/gameplay, changes code or system behavior, establishes a project workflow or schema, delivers a meaningful asset batch, restructures a full main-line/content batch, or otherwise materially affects multiple content nodes. Prefer appending to the existing related record when the change extends the same feature.
7. Run `node scripts/audit-documentation-sync.mjs --check` when the script exists, plus the encoding check and update-record test. If the documented audit script is absent, report it instead of claiming it passed.
8. Never commit or push automatically.
