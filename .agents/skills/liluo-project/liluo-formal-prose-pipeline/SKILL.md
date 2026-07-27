---
name: liluo-formal-prose-pipeline
description: Run the 璃落 open-weight dual-model formal prose pipeline with writing contracts, mock/live OpenAI-compatible calls, workspace drafts, natural-expression checks, user approval, golden/calibration archival, and gap reminders. Use for 正式正文、双模型对照、写作模型 API、个人旧作导入、黄金正文归档、修改对照、模型校准或 pin；Style Pack / 外部评权走 liluo-style-rag；not for ordinary one-line polish (use liluo-natural-expression) or letting external models write canon.
---

# 正式正文写作管线

Read `AGENTS.md` and [model-routing-contract.md](references/model-routing-contract.md). This is a **pipeline Skill**, not a writer Agent persona.

## Hard gates

1. External models never write `src/game/data/story_outline/**`, `plot_outline/**`, dialogues, world bible, or other runtime canon.
2. Drafts land only under `docs/写作资产/工作区/`.
3. Single draft requires explicit `--model dsr1|qwen3`. Dual calls only via `compare` / `--model both`.
4. Style references: V0 explicit `styleReferenceIds` (0–3) and/or V1 metadata Style Pack via `liluo-style-rag` (`expression.styleQueryPath`). Still **no embeddings, vector DB, or automatic unapproved retrieval**. Unreviewed external assets cannot enter production pack.
5. Live network calls require explicit `--live`. Routine/CI/evals must stay mock/static.
6. Before any live health / draft / compare: remind the user to wake HF Inference Endpoints to **Running**. After the user confirms Running (default: both DSR1 and Qwen3), **wait ~5 minutes** then run `writing:models:health -- --live --model both` (or the single model they named). Prefer a background delay so the user can do other work; report when done. Do not treat 503 as a credential or model-swap problem; do not start paid cloud endpoints on the user's behalf.
7. When the user asks about adult/erotic refusal, uncensored writers, or adding a third writing model: read `docs/写作资产/模型归档/pending-candidates.json` and remind open gap `gap-writing-model-adult-uncensored-candidate`. Do **not** silently swap production dual models or pretend the pending candidate is already wired.
8. Before claiming related capability is ready, query open gaps via `npm run writing:gaps:remind -- --topic <topic>`.

## Generate prose

1. Load relevant story/continuity Skills; verify canon facts.
2. Author a formal prose request from `docs/写作资产/模板/正式正文写作合同模板.json`.
3. If the user did not pick a model, ask once or use the current approved routing policy (`productionDefault` may be null → must ask). Never silent dual-call.
4. Run `npm run writing:prose:draft -- --model <dsr1|qwen3> [--live] --contract <path>` or `writing:prose:compare`.
5. Run `liluo-natural-expression` (deep for formal fiction). Optionally consult 砚秋/言澈 only on real calls.
6. Present candidates; wait for user choice/edit/approval.
7. Only after approval, use existing story/dialogue Skills to write canon; then `npm run writing:golden:sync -- --source <canon-path> --commit` unless the user excludes style recommendation.

## Import / archive

- Personal history: ownership confirmation, register metadata, never auto-promote to golden.
- Golden archive: user approval only; keep model run, contract, edit notes, hash.
- Calibration pair: keep before+after; never auto-update Skill on a single pair. Suggest upgrade only after ≥3 independent approved pairs of the same issue category, or on explicit user rule request / safety-critical single case. Upgrade still goes through governance + documentation sync.

## Credentials

Do not ask users to paste tokens into chat. Point to [credential-onboarding.md](references/credential-onboarding.md) and `docs/系统说明/写作模型API配置与用户操作指南.md`. Create `.env.writing.local` locally from `.env.writing.example`.

## References

- [prose-request-contract.md](references/prose-request-contract.md)
- [asset-governance.md](references/asset-governance.md)
- [calibration-loop.md](references/calibration-loop.md)
- [evaluation-rubric.md](references/evaluation-rubric.md)
- [model-archive-contract.md](references/model-archive-contract.md)
- [style-rag-deferred-boundary.md](references/style-rag-deferred-boundary.md)
