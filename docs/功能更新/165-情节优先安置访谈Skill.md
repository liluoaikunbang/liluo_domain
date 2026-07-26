# 165-情节优先安置访谈 Skill

创建时间：2026-07-26

当前摘要：新增从情节库抽取或指定情节、按世界偏向对照大纲建议主线/支线落点、批准后再聚焦访谈的薄 Skill；并让项目 Skill 变更强制校验用户命令目录。

## 更新时间记录

- 2026-07-26：补强用户命令同步门禁——项目 Skill 变更与文档审计都会校验 `docs/用户命令目录.md`，避免只改 Skill 时漏登入口。
- 2026-07-26：新增 `liluo-plot-placement-interview`、情节安置提问模板、用户命令与导航工作流，并与大纲优先随机访谈明确分界。

## 实现思路

现有能力已覆盖「节点找未用情节」「已定落点写入」「大纲节点随机访谈」，但缺少情节优先的完整链路。新增薄编排 Skill，复用既有提问与写回合同，不另造访谈体系。

落点批准是硬门禁：未批准前不写大纲、不更新 `usedBy`。`worldBiases` 非空时优先在对应世界检索；默认扩充既有节点，仅在需要独立可玩范围或用户要求时建议新建子节点。

## 相关路径

- `.agents/skills/liluo-project/liluo-plot-placement-interview/`
- `docs/系统说明/情节安置提问模板.md`
- `docs/技能说明/liluo-plot-placement-interview.md`
- `docs/用户命令目录.md`
- `scripts/project-navigation/project-navigation.mjs`
- `evals/cases/skills/plot-placement-interview-*.json`

## 验证

- `node scripts/tests/validate-project-skills.mjs`
- `npm run docs:commands:validate`
- `npm run docs:governance:audit`
- `npm run project:navigation:changed`
- `npm run project:navigation:check`
- `npm run docs:check-encoding`
- `node --test scripts/quality-gate/tests/gate-plan.test.mjs`
