# liluo-capability-regression

## 用途与触发

用于 Skill、Agent、`AGENTS.md`、规则、注册表或路由提示变化后的能力回归。可选择静态、changed、smoke、full 范围，分析结构化失败，并把已确认长期纠正转成案例。

## 路径、输入与输出

Skill 位于 `.agents/skills/testing/liluo-capability-regression/`。权威合同在 `docs/系统说明/Skill与Agent能力回归评测系统.md`；实现位于 `evals/` 和 `scripts/evals/`。

输入是变更范围、目标或案例 ID；输出为 PASS、FAIL、SKIPPED、失败字段、baseline 差异和 token 概览。报告只保存在被 Git 忽略的 `evals/reports/`。

## 流程与限制

先运行静态检查，再按最小范围运行 live。live 只读、ephemeral、串行，不启动浏览器或服务。新增纠正案例必须先获得长期确认；生成器不读聊天。baseline 只允许对已通过单例显式确认更新。

本 Skill 不修改其他 Skill 业务内容、不自行创设长期规则、不因失败改正式故事，也不把 SKIPPED 当 PASS。治理决定交给 `liluo-project-governance-memory`，业务修复交给对应 Skill。

## 验证

运行能力评测定向单元测试、`npm run evals:check`、故障注入、评分器 forbidden 命中负例，以及至少一个可用时的 live smoke 单例。
