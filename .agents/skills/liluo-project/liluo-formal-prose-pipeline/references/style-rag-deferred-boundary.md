# StyleRAG boundary (V0 / V1 vs deferred)

## Implemented (use liluo-style-rag)

- **V0 explicit**: 0–3 user-approved `styleReferenceIds` on the formal prose contract.
- **V1 metadata**: Style Query → search/pack/explain over registries with deterministic scoring, user review gates, character budgets, and writing sheet hooks.

Formal prose gate 4 allows both paths when assets are approved and queries pass canon-leakage validation.

## Still deferred (do not implement)

- Embeddings, vector DB, chunk indexes
- Learned rerankers (V3)
- Model training on style corpus (V4)

Policy: `project-navigation/style-rag-policy.json` → `deferredModes`.

## Skill routing

| Task | Skill |
| --- | --- |
| Style query, pack, external review, writing sheet | `liluo-style-rag` |
| Reader-facing Style abstracts, review notes, audit negotiation | `liluo-natural-expression` (light) + `liluo-style-rag` |
| General fiction inspiration, expression cards, copy-risk | `liluo-external-fiction-knowledge` |
| Reader-facing RAG card body / audit revision notes | `liluo-natural-expression` (light) + `liluo-external-fiction-knowledge` |
| Draft/compare generation | `liluo-formal-prose-pipeline` |

Do not pretend `project-index` is StyleRAG. Do not auto-retrieve samples without registry approval.

Details: [deferred-roadmap.md](../../liluo-style-rag/references/deferred-roadmap.md), `docs/系统说明/Style-RAG元数据检索与文风包系统.md`.
