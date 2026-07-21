# liluo-project-documentation-sync

## 用途与边界

同步功能文档、功能更新目录、界面更新记录及技能说明。未实现/未确认的游戏功能不据此伪造完成记录，也不负责 Git 提交。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-project-documentation-sync/`
- reference：`documentation-contract.md`
- script：`scripts/audit-documentation-sync.mjs`（只读；`--root`、`--check`）
- 输入：实现范围、真实创建日期、当前摘要和历史记录
- 输出：三方一致的编号/标题/日期/摘要与审计结果

## 流程、限制与验证

先审计编号，再创建或追加文档，保持创建日期和历史更新时间，更新目录与 updateRecords。不得覆盖历史、编造摘要或大规模重编号。运行审计脚本、`npm run docs:check-encoding` 和 update-records 测试。具体 Skill 内容由对应 Skill 负责，本文只维护文档契约。
