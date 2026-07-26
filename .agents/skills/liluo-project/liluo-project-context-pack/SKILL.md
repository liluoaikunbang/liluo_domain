---
name: liluo-project-context-pack
description: Build a gitignored descriptive context pack for uploading to other AIs. Use for 项目上下文打包、导出给其他AI分析、描述性资料压缩包；not for offline game release or packaging runtime code/assets.
---

# Project Context Pack

## Token rule (hard)

1. **Do not** read `AGENTS.md`, `catalog.json`, `LINK-STATE.json`, `PACK-MANIFEST.json`, `FILE-LIST.txt`, or any file under `.local/project-context-pack/staging/`.
2. **Do not** read `references/pack-contract.md` unless changing the packer itself.
3. Run exactly: `npm run project:context-pack` (add `--dry-run` or `--keep-previous` only if the user asked).
4. Reply from the command JSON only: archive path, size, copied/unchanged/removed/orphan counts, catalog delta, pruned zips.

## Behavior (script does this; you do not re-implement)

- Catalog: delete missing, dedupe, probe only uncovered watch children for new entries.
- Sync via `LINK-STATE` (mtime+size); prune staging orphans; keep only `*-latest.zip` unless `--keep-previous`.
- Exclude runtime code, assets, `map.json`, external `sources/` corpora, and `docs/功能更新/` history.

## Boundaries

Not for offline release (`liluo-offline-release-pipeline`). Never commit `.local/project-context-pack/`. Never upload unless the user asks after the pack exists.
