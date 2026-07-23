# 能力回归评测合同

权威系统说明是 `docs/系统说明/Skill与Agent能力回归评测系统.md`；本文件只保留执行合同。

1. 静态层不调用模型，校验能力、说明、注册表、案例、覆盖与 baseline 引用。
2. live 层逐案例运行 `codex exec --ephemeral --sandbox read-only`，必须使用输出 Schema，不忽略用户配置，不使用危险沙箱。
3. 评分只比较结构化决策。required 全命中，forbidden 任一命中即失败；写入范围不得超出允许前缀。
4. smoke 只包含核心正向、全部 Agent 正向和至少五项高风险负向；changed 只覆盖 Git 变更目标与直接治理依赖；full 手动运行全部 active 案例。
5. 报告目录不提交。CLI 或登录不可用时记为 SKIPPED；不得伪造 PASS。
6. baseline 只能从已通过报告中，以 `--case <id> --confirm` 单例确认更新。
7. 回归模板不读取聊天；只有已确认的长期纠正才能人工填写并启用。
