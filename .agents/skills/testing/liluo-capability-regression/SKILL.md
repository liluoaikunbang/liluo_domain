---
name: liluo-capability-regression
description: Run and maintain the 璃落 Skill / Agent capability regression system after Skill, Agent, AGENTS.md, rule, registry, or routing-prompt changes. Use to select static, changed, smoke, or full evaluation scope; diagnose structured routing regressions; or turn an explicitly confirmed long-term correction into a case. Do not modify another capability's business behavior or invent long-term rules.
---

# 璃落 Skill / Agent 能力回归

先读 [evaluation-contract.md](references/evaluation-contract.md) 和 `evals/README.md`。评测只判断路由、计划、边界与验证选择，不评价文学质量，也不比较模型。

## 选择最小范围

- 只改案例、Schema、注册表或评测脚本：运行 `npm run evals:check` 和评测定向测试。
- 修改一个 Skill 或 Agent：先静态检查，再运行 `npm run evals:changed` 或 `--target <name>`。
- 修改 AGENTS.md、规则或跨能力路由：运行 changed；需要发布前抽查时运行 smoke。
- `full` 只用于手动全量审查，不进入普通提交默认门禁。

Codex CLI 缺失或未登录时必须报告 `SKIPPED`，不得生成伪结果。默认串行，不启动浏览器、服务或大量并发实例。

## 分析退化

按失败字段定位：Skill / Agent 漏选或误选、读取与写入范围、禁止动作、验证 profile、批准判断。比较结构化字段，不比较完整自然语言，不保存 chain-of-thought。先判断是目标行为退化、案例合同错误，还是 CLI / 认证导致的跳过。

禁止用 baseline 更新掩盖失败。只有案例已由维护人员确认通过，才可显式运行 `npm run evals:baseline:update -- --case <id> --confirm`。

## 新增纠正案例

只有用户明确确认长期规则，或维护人员明确决定把失败转为回归测试时，才运行：

```powershell
npm run evals:add-regression -- --id <id> --target <skill-or-agent> --title "<title>"
```

脚本只创建 `planned` 模板；不读取聊天，不保存聊天原文。人工填写、评审并改为 `active` 后，同步目标 `caseGlobs`，再运行静态检查。

本 Skill 不修改其他 Skill 的业务内容，不自行决定新的长期规范，不从失败直接修改正式故事或业务代码。行为修改仍交给对应 Skill；长期规则仍由 `liluo-project-governance-memory` 决定。
