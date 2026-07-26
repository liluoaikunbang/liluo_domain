# Pack contract

## Goal

Produce the smallest high-signal archive that lets another AI understand 璃落的城堡: rules, docs, indexes, workflows, and content catalogs — not Phaser/Vue implementation.

## Two layers

1. **Catalog** (`scripts/project-context-pack/catalog.json`, committed): which formal trees/files belong in the pack.
2. **Link state** (`.local/project-context-pack/LINK-STATE.json`, gitignored): maps each formal source path to its staging copy with `mtimeMs` + `size`.

## Every pack run (no full rescan mode)

1. Catalog: remove missing paths; dedupe same-path / covered-by-parent / auto-parent-with-specific-child; probe only uncovered `watchParents` children for additions.
2. Resolve file list from catalog entries (filesystem walk of listed trees only).
3. Link sync: copy new/changed, delete removed staging files, skip unchanged.
4. Write `PACK-MANIFEST.json` + update `liluo-project-context-latest.zip`.
5. Delete other `*.zip` in the output directory unless `--keep-previous` was requested.

Never re-score already catalogued entries. Never wipe staging for a “full rebuild” unless the user manually deletes `.local/project-context-pack/`.

## Hard excludes

Runtime code trees, binary assets, tilemap `map.json`, external fiction full corpora, build/output dirs, and the pack output directory itself.

## User-facing report

Report archive path, link-state path, catalog added/removed/deduped, and files copied/unchanged/removed.
