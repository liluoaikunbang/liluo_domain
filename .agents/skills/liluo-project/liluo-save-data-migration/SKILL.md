---
name: liluo-save-data-migration
description: Audit and evolve 璃落 save schema/version, import validation and backward migrations without losing progress. Use for 存档版本、新字段、地图/事件/物品改名、旧档兼容或损坏数据；not for editing real user saves during Skill maintenance.
---

# Save Data Migration

Read `src/game/core/saveData.ts`, `saveStorage.ts`, GameView import/load paths, save tests and [save-migration-contract.md](references/save-migration-contract.md). The current game and export schemas use `version: 1`; do not assume otherwise.

Use current code/game indexes to localize the save flow, verify source behavior, and refresh affected domains after schema or identifier changes.

Design explicit version-by-version migration with original backup, validation at each step, defined defaults, unknown-field preservation/reporting and atomic failure. Never batch rewrite real localStorage, delete unknown data or swallow errors. Runtime changes require an explicit user request. Test current, previous fixture, corrupted and unknown future versions with isolated in-memory storage.

Use `liluo_game_architecture_explorer` when the save call chain is unclear and `liluo_validation_runner` after changes. Real migration and source edits remain parent-controlled and require user authority.
