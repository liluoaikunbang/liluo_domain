---
name: liluo-production-coverage
description: Derive conservative world and series production coverage from real 璃落 story, map, event, dialogue, gameplay, asset, entry and validation evidence. Use for 世界制作进度、系列覆盖、可玩化缺口、下一步优先级；not for manual progress scoring or claiming playability from file counts.
---

# Production Coverage

Read `docs/系统说明/世界与系列生产覆盖统计系统.md`, current index status, source JSON/Markdown, runtime registries, and [coverage-contract.md](references/coverage-contract.md). Run `npm run production:coverage` and treat its output as a derived report, never as canon.

Report world and series views across `concept`, `outline`, `productionDesign`, `skeleton`, `graybox`, `partiallyPlayable`, `playable`, and `validated`. Every positive dimension needs a cited project artifact. Do not infer runtime entry, save support, validation or playability from node/file/asset counts. When the story index is partial or stale, disclose it and verify source files.

Return current stage, evidence, gaps, risk and the smallest next upgrade. Do not add per-node permanent percentage fields. Cross-file evidence collection may use read-only 知遥 or砚秋; deterministic scripts and original sources decide the result.
