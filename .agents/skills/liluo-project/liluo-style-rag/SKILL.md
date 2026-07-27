---
name: liluo-style-rag
description: Run 璃落 Style-RAG V0/V1 metadata retrieval for formal prose—auto style selection, external article inventory, list titles/authors, score articles and author priors, restraint vs general domain matching, style pack assembly, calibration archive hooks, writing sheet lifecycle, retrieval explanation, and weight adjustment. Use for Style查询、文风包、外部文章评权、写作表、style feedback；not for general fiction inspiration RAG (use liluo-external-fiction-knowledge), embeddings, vector DB, V2–V4 learned retrieval, or writing canon.
---

# Style-RAG（元数据检索与文风包）

Read `AGENTS.md`, [style-query-contract.md](references/style-query-contract.md), and `project-navigation/style-rag-policy.json`. This is a **pipeline Skill**, not a writer Agent persona.

## Hard gates

1. **Canon / Style separation**: Style Query and Style Pack control expression only. No character names, locations, plot beats, world rules text, dialogue quotes, API keys, or absolute paths in queries.
2. **No forge scores / golden / personal**: Never invent user quality scores, golden status, or personal-history approval. Only use registry fields the user has explicitly reviewed.
3. **No V2–V4**: Embeddings, vector DB, learned rerankers, and model training are deferred. Do not implement or pretend they exist.
4. **User scores only**: Article weights and author priors come from user review import only—not from model inference or folder heuristics alone.
5. **Unreviewed cannot enter production**: External articles with `userScore.status !== reviewed` or below policy minimum weight are excluded from production Style Pack.
6. **`themeDomain` is domain, not quality**: `restraint-themed` vs `general-prose` is a match dimension, not a quality ranking. Folder classification is initial hint; user may override per article.
7. **Manual audit calibration**: When the user asks about Style-RAG accuracy, wrong tags/weights/authors, or next audit steps, run `npm run writing:gaps:remind -- --topic style-rag-audit` (or `rag-accuracy`) and offer `style-rag:audit:sample` or mixed `knowledge:audit:sample`. Before drafting or revising Style Pack abstracts, review notes, pack explanations, audit options, or other reader-facing Style-RAG text, apply `liluo-natural-expression` **light** (concrete usable wording; JSON/paths/CLI stay `off`). Qualitative judgments must not be immediately `record`ed—negotiate revision direction and drafts first. Before/while recording a fix, run `style-rag:audit:related` (or the relevant channel) and co-adjust related neighbors that need changes. Do not stop using current registries. Single audit errors must not inflate this Skill; upgrade only after policy thresholds (`project-navigation/rag-audit-policy.json`). Broader calibration of concepts/plots shares the same audit CLI but different channels.

## Workflows

### Inventory → review → import → promote

1. `npm run writing:external:inventory` — scan configured sources and rebuild article/author registries.
2. `npm run writing:external:authors` — list authors with titles and review status.
3. `npm run writing:external:review:export` — export batch review sheet for offline scoring.
4. User fills scores offline; `npm run writing:external:review:import -- --input <path>`.
5. `npm run writing:external:validate` — validate registries and policy consistency.
6. Promote approved external abstracts to production assets only after explicit user approval (via existing asset governance—not automatic).

### Style query → search / pack → feedback

1. Author Style Query from `docs/写作资产/模板/Style查询模板.json` (no canon facts).
2. `npm run writing:style:validate -- --query <path>` — schema + leakage check.
3. `npm run writing:style:query -- --query <path>` — validate and echo normalized query.
4. `npm run writing:style:search -- --query <path>` — ranked candidate assets with scores.
5. `npm run writing:style:explain -- --query <path>` — human-readable retrieval reasons.
6. `npm run writing:style:pack -- --query <path>` — assemble bounded Style Pack (may be empty / partial if no approved assets).
7. Attach pack to formal prose contract (`expression.styleQueryPath`) or pass explicit `styleReferenceIds` (V0).
8. After draft/compare, `npm run writing:style:feedback -- --run <run-id> --choice <asset-id>` — record user choice for model-effectiveness weights.

### Writing sheet

1. `npm run writing:style:sheet:draft` — draft from approved evidence assets.
2. User reviews; `npm run writing:style:sheet:approve -- --user-approved` — promote to `docs/写作资产/璃落写作表/current.json`.
3. Approved sheet may appear in Style Pack `writingSheet` section; external articles alone cannot define 璃落文风.

### Audit → skill gate → affected rebuild

1. `npm run style-rag:audit:sample -- --mode low-confidence --batch-size 8`
2. User reviews batch under `docs/知识检索校准/batches/`
3. `npm run style-rag:audit:record -- --asset <ea-...> --issue ... --correct ... --category ...`
4. `npm run style-rag:audit:status`
5. Only if upgrade gate passes and user approves abstract rules: update Skill, then `npm run style-rag:rebuild:affected` (dry-run) → `--commit`

## Commands

Style retrieval:

```bash
npm run writing:style:validate -- --query <path>
npm run writing:style:query -- --query <path>
npm run writing:style:search -- --query <path>
npm run writing:style:pack -- --query <path>
npm run writing:style:explain -- --query <path>
npm run writing:style:feedback -- --run <run-id> --choice <asset-id>
npm run writing:style:sheet:draft
npm run writing:style:sheet:approve -- --user-approved
npm run writing:style:test
```

External inventory:

```bash
npm run writing:external:inventory
npm run writing:external:authors
npm run writing:external:review:export
npm run writing:external:review:import -- --input <path>
npm run writing:external:validate
```

Inventories and counts are produced by `writing:external:inventory`; do not invent article counts in chat.

## Source paths

| Domain | Root |
| --- | --- |
| restraint-themed | `external-knowledge/sources/fiction-bondage` |
| general-prose (zhihu) | `external-knowledge/sources/zhihu-novels` |

Registries: `docs/写作资产/外部风格研究/article-registry.json`, `author-registry.json`. Policy: `project-navigation/style-rag-policy.json`.

## Team (via `project-navigation/team-routing.json`)

- **砚秋**：文风包泄漏、表达边界、外部引用是否越界进入正文提示。
- **言澈**：Style Query 是否夹带 canon 事实；正式正文连续性不受影响。
- **怀月**：写作表/评权/ADR 与资产治理的长期记忆同步。
- **知遥**：注册表、来源路径、清单命令输出核验。
- **凌音**：`writing:style:test` 与 registry validate 结果。

Only invoke members on real calls per `liluo-creative-team-presence`; default tier is solo.

## Integration with formal prose

- V0 **explicit**: 0–3 `styleReferenceIds` on prose contract (unchanged).
- V1 **metadata**: `expression.styleQueryPath` → search/pack → attach rendered pack to draft/compare.
- Still **no embeddings / vector DB**. Empty pack is valid when no approved assets match.
- After user approves prose, use `liluo-formal-prose-pipeline` golden/calibration flows—not StyleRAG auto-promote.

## References

- [canon-style-separation.md](references/canon-style-separation.md)
- [style-query-contract.md](references/style-query-contract.md)
- [metadata-retrieval.md](references/metadata-retrieval.md)
- [style-pack-contract.md](references/style-pack-contract.md)
- [external-article-review.md](references/external-article-review.md)
- [external-author-prior.md](references/external-author-prior.md)
- [restraint-general-domain.md](references/restraint-general-domain.md)
- [copyright-and-content-leakage.md](references/copyright-and-content-leakage.md)
- [writing-sheet-lifecycle.md](references/writing-sheet-lifecycle.md)
- [feedback-and-model-effectiveness.md](references/feedback-and-model-effectiveness.md)
- [deferred-roadmap.md](references/deferred-roadmap.md)

System docs: `docs/系统说明/Style-RAG元数据检索与文风包系统.md`, `docs/系统说明/外部文章清单与用户评权系统.md`, `docs/系统说明/璃落写作表与文风资产生命周期.md`, `docs/系统说明/Style-RAG用户操作指南.md`.
