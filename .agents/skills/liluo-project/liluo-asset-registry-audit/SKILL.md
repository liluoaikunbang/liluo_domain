---
name: liluo-asset-registry-audit
description: Audit src/assets/game and docs/游戏素材图片清单.md for counts, hashes, references, classification, case conflicts, and missing entries. Use for 素材清单、缺失引用、未引用素材、重复图片或路径大小写审计；not for deleting, converting, compressing, moving, or promoting candidate assets.
---

# Asset Registry Audit

Read `docs/游戏素材图片清单.md`, current asset bundles and [asset-classification.md](references/asset-classification.md). Run `node scripts/audit-game-assets.mjs --check [--exact-hash]`; use `--write-manifest` only after reviewing format impact.

Use the current assets index for broad localization, verify real paths and the authoritative manifest, and refresh the assets domain after source changes.

Remain read-only by default. Report path, size, type, references, exact duplicates and Windows case conflicts. Never alter image bytes, delete assets, install perceptual-hash dependencies or treat candidates/caches/sources as runtime finals.

Broad reference/classification review may use read-only `liluo_content_auditor`, which must never delete, move, convert, compress, or promote assets.
