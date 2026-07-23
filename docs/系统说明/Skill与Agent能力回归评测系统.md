# Skill 与 Agent 能力回归评测系统

## 目的与边界

系统用于防止项目规范、Skill、Agent、规则和路由提示变化后出现能力退化。它检测漏触发、误触发、Agent 漏识别、范围扩张、错误写入目录、禁止动作、过大验证、遗漏契约/索引/文档/迁移检查，以及改名未同步。

评测不评价文学质量，不比较模型，不保存 chain-of-thought，不自动读取聊天，不调用外部自建平台，也不修改正式故事或业务代码。

## 三层结构

- 静态层：快速、确定性、无模型调用，验证全部项目能力、说明、注册表、案例 Schema、覆盖和 baseline 引用。
- live 层：本机 Codex CLI 以 `--ephemeral --sandbox read-only` 逐案例运行，只决定 Skill、Agent、文件、动作、验证和批准。
- 纠正层：由维护人员把已确认长期纠正写成独立回归案例。生成器只建待填写模板。

结构合同位于 `evals/schemas/`；注册表是 `evals/registry.json`；每个案例是 `evals/cases/` 下独立 JSON。模型输出只允许 `codex-eval-output.schema.json` 中的决策字段。

## 套件与成本

`smoke` 包含每个核心 Skill 一个正向、每个 Agent 一个正向和至少五个高风险负向；`changed` 根据 Git 变更选择目标及直接治理依赖；`full` 手动运行全部 active 案例。默认串行并设置单例超时，报告 token 使用。

普通 CI 与日常 check 只跑静态层。live 需要个人 Codex 认证且产生调用成本，不要求 CI 保存凭据。CLI 缺失或未登录时报告 `SKIPPED`，不得伪造 `PASS`。

## 评分和 baseline

required 字段必须全部命中，forbidden 任一命中即失败；写入范围不得超出允许前缀。少量合理额外只读文件不直接判失败。`PASS`、`FAIL`、`SKIPPED` 分开统计，失败报告到具体字段。

baseline 只保存案例 ID、预期评分、已确认结构化摘要、日期和目标文件哈希，不保存完整回复。只能从已通过报告中，以 `--case <id> --confirm` 单例更新；修改能力后失败时禁止直接改 baseline。

## 维护入口

完整命令和案例维护方式见 `evals/README.md` 与 `docs/技能说明/liluo-capability-regression.md`。评测 Skill 只维护评测范围与退化分析，不修改其他 Skill 的业务内容，也不自行决定长期规则。
