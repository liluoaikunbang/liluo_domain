# Maintenance guide

1. Confirm the machine-local `source-sync.local.json` points to the available authoritative directory. Do not commit this absolute-path file.
2. For ordinary additions/edits/deletes/renames run `external:knowledge:update`. It hashes the authoritative tree, copies only additions/modifications/renames into the managed mirror, automatically propagates ordinary deletions only inside the mirror, and then reuses unchanged source segments while rebuilding global keyword/tag indexes truthfully.
3. If deletion exceeds 20% of managed mirror files, stop on the automatic safety block and inspect `sync-status.json`; never bypass it merely to make validation pass.
4. Run `external:knowledge:validate`, inspect `reports/source-quality.json` and `reports/duplicate-report.json`, then execute representative queries.
5. Use `external:knowledge:build` after schema/segmentation/index-format changes, bulk moves, corruption, or explicit request.
6. Never hand-edit generated indexes to hide parser defects. Fix the generator and rebuild.
7. For format upgrades, update schemas, generator, tests, system documentation and feature records together.
