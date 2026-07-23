---
name: liluo-game-content-validator
description: Run a unified read-only audit for 璃落 story outlines, maps, events, dialogues, gameplay references, assets, JSON/frontmatter, UTF-8, and existing tests. Use for 内容校验、引用审计、重复 ID、孤儿节点或改动后总检；not to auto-fix risky structures.
---

# Game Content Validator

Read [validation-rules.md](references/validation-rules.md) and [severity-levels.md](references/severity-levels.md). Run `node scripts/validate-game-content.mjs --scope changed|world|all [--world NAME] --check` at repo root.

Do not invoke the unified validator automatically for a prose-only Markdown change that leaves frontmatter, source JSON, keys, parent links and runtime references unchanged. In that case, use the directly relevant writing, originality or diff check selected by the owning workflow.

For broad scopes, check project-index freshness first; distinguish source errors from index-generator errors and never hand-edit generated indexes.

Reuse existing Node tests. Classify ERROR, WARNING and INFO. Never repair parent links, IDs, references, prose, maps or assets automatically. If scope cannot be resolved reliably, fail explicitly.

Broad audits may use `liluo_content_auditor`; builds or tests may use `liluo_validation_runner`. Deterministic scripts remain the final fact source.

Do not append documentation checks merely because the same task loaded a governance, Skill or design-memory workflow. Use the task's single deduplicated validation plan. Run `npm run docs:governance:audit` only for an explicit full audit, broad registry or documentation-structure migration, or a change that genuinely spans historical feature records; otherwise prefer the smallest relevant registry or memory validator.
