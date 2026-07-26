# Model routing contract

Fixed formal candidates only:

- `zhi-create-dsr1-14b` → `Zhihu-ai/Zhi-Create-DSR1-14B`
- `zhi-create-qwen3-32b` → `Zhihu-ai/Zhi-Create-Qwen3-32B`

Do not substitute Aion, Grok, other DeepSeek/Qwen sizes, closed models, or author APIs.

`productionDefault` starts as `null` with `routingStatus: awaiting-calibration`. Keep both models for evaluation. One model configured → `degraded`, not fake dual health.
