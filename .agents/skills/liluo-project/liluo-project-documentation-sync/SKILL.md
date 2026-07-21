---
name: liluo-project-documentation-sync
description: Synchronize 璃落 feature docs, 功能更新目录, updateRecords.js, and 技能说明 while preserving dates and IDs. Use after confirmed feature work, Skill documentation changes, record audits, or duplicate-number fixes; not to document untested features or commit Git.
---

# Project Documentation Sync

Read `AGENTS.md` and [documentation-contract.md](references/documentation-contract.md). Inspect all three record sources before choosing an ID.

1. Preserve creation dates and all update history; append only the current change.
2. Keep one unique numeric ID, title, creation date and current summary across document, catalog and update record.
3. Never invent a summary, change a creation date, overwrite history or mass-renumber unrelated records.
4. Keep records newest-first and stable for equal dates.
5. Run `node scripts/audit-documentation-sync.mjs --check`, encoding check and update-record test.
6. Never commit or push automatically.
