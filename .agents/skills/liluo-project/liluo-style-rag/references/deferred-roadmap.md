# Deferred roadmap (V2–V4)

**Do not implement** these stages unless user explicitly approves ADR revision and gap closure.

Current production: **V0 explicit** + **V1 metadata** only.

## V0 — Explicit references (shipped)

- 0–3 `styleReferenceIds` on formal prose contract
- No automatic retrieval

## V1 — Metadata RAG (shipped)

- Style Query + deterministic scoring over registries
- Style Pack with budgets and explain
- External inventory + user review import
- Writing sheet + style feedback hooks
- Policy: `implementationStage: metadata-rag`

## V2 — Embedding retrieval (deferred)

**Unlock thresholds (all required):**

- ≥50 user-reviewed external articles with stable metadata
- ≥10 approved golden samples across ≥4 scene functions
- Copyright representation policy signed off for chunk storage
- User explicit ADR approval to enable `embedding` mode in policy

Would add: chunk index, embedding model pin, hybrid metadata+vector score—not replacing user quality dimension.

## V3 — Learned reranker (deferred)

**Unlock thresholds:**

- ≥200 style feedback records with run linkage
- V2 stable for ≥30 days without leakage incidents
- Offline eval rubric for reranker A/B on blind packs

Would rerank top-K from V1/V2; still no canon in query.

## V4 — Model training (deferred)

**Unlock thresholds:**

- Legal/license review for fine-tuning on user-approved assets only
- Separate ADR for training data boundary
- No training on unreviewed external full text

Would fine-tune open-weight writers—not StyleRAG retrieval alone.

## Policy flags

`style-rag-policy.json` → `deferredModes`: `embedding`, `learned-reranker`, `model-training`.

Agents must not expose CLI flags for deferred modes.

## Related Skill

Implemented V0/V1: **liluo-style-rag**. Formal prose integration: **liluo-formal-prose-pipeline** (gate 4 updated).

General fiction inspiration remains **liluo-external-fiction-knowledge**—out of scope for StyleRAG roadmap.
