# Skill / Agent 能力回归评测

本目录防止修改 `AGENTS.md`、Skill、Agent、规则或路由提示后，既有项目能力无意退化。它不评价文学质量，也不比较模型。

## 三层评测

1. 静态完整性：不调用模型，检查能力发现、名称、说明、注册表、Schema、案例覆盖、改名同步与 baseline 引用。
2. Codex 路由与计划：逐案例以 ephemeral、read-only 模式运行本机 Codex，只输出结构化决策。
3. 用户纠正回归：仅把用户明确确认的长期规则或维护人员确认的失败转成案例；不自动读取聊天。

案例位于 `cases/`，每个 JSON 只描述一个任务。`expected` 使用 required、allowed、forbidden 和批准预期；评分不比较完整自然语言。

## 运行范围

- `npm run evals:check`：注册表与 changed 静态门禁，默认进入 `project:routine -- check`。
- `npm run evals:static:all`：全部静态完整性。
- `npm run evals:smoke`：核心 Skill 正向、全部 Agent 正向和高风险负向。
- `npm run evals:changed`：Git 变更目标及直接治理依赖。
- `npm run evals:full`：手动运行全部 active 案例。

CI 默认只跑静态层，因为 live 评测需要个人 Codex 认证，会产生模型调用与 token 成本。live 默认串行；单例可用 `node scripts/evals/run-codex-evals.mjs --case <id>`。

## 状态与 baseline

- `PASS`：所有结构化必需字段命中，且没有 forbidden 命中或范围扩张。
- `FAIL`：路由、Agent、路径、动作、验证 profile、批准判断或执行结果不符合合同。
- `SKIPPED`：Codex CLI 不可用或未登录；不是通过。

报告写入 `evals/reports/` 且不提交。baseline 不保存整段回复，只保存已确认案例、评分、结构化摘要、日期与目标文件哈希。更新必须针对已通过案例显式确认：

```powershell
npm run evals:baseline:update -- --case <id> --confirm
```

不得用 baseline 更新掩盖真实退化。

## 增加纠正案例

```powershell
npm run evals:add-regression -- --id <id> --target <skill-or-agent> --title "<title>"
```

生成的是 `planned` 模板。人工填写独立任务和期望、同步注册表 `caseGlobs`、评审后改为 `active`。
