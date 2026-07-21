---
name: liluo-game-content-validator
description: Run a unified read-only audit for 璃落 story outlines, maps, events, dialogues, gameplay references, assets, JSON/frontmatter, UTF-8, and existing tests. Use for 内容校验、引用审计、重复 ID、孤儿节点或改动后总检；not to auto-fix risky structures.
---

# Game Content Validator

Read [validation-rules.md](references/validation-rules.md) and [severity-levels.md](references/severity-levels.md). Run `node scripts/validate-game-content.mjs --scope changed|world|all [--world NAME] --check` at repo root.

Reuse existing Node tests. Classify ERROR, WARNING and INFO. Never repair parent links, IDs, references, prose, maps or assets automatically. If scope cannot be resolved reliably, fail explicitly.

Broad audits may use `liluo_content_auditor`; builds or tests may use `liluo_validation_runner`. Deterministic scripts remain the final fact source.
