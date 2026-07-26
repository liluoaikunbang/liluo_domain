# Credential onboarding

User creates `.env.writing.local` from `.env.writing.example` with six variables. Never commit keys. Never paste tokens into chat. Before live health/draft/compare, user wakes Hugging Face Inference Endpoints to Running (default both models). After Running, wait ~5 minutes then run `npm run writing:models:status` and `npm run writing:models:health -- --live --model both` (prefer background delay). Full steps: `docs/系统说明/写作模型API配置与用户操作指南.md`.
