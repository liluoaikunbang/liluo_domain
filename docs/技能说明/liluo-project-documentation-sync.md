# liluo-project-documentation-sync

## 项目索引协作

可用 docs 索引定位记录，但三处文档来源仍需直接核验；同步完成后复用统一增量构建与验证命令。

## 用途与边界

同步功能文档、功能更新目录、界面更新记录及技能说明。未实现/未确认的游戏功能不据此伪造完成记录，也不负责 Git 提交。普通单个故事大纲完善、访谈写回、错字或元数据维护只更新权威内容与项目索引，不占用新的功能更新编号。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-project-documentation-sync/`
- reference：`documentation-contract.md`
- script：`scripts/audit-documentation-sync.mjs`（只读；`--root`、`--check`）
- 输入：实现范围、真实创建日期、当前摘要和历史记录
- 输出：三方一致的编号/标题/日期/摘要与审计结果

## 流程、限制与验证

先判断改动是否达到功能记录门槛：可玩地图/事件/对话/玩法实现、代码或系统行为变化、项目工作流或 schema、成批素材、整条主线或多节点内容重构可以登记；单节点日常大纲维护不登记。达到门槛后优先追加同一功能的既有记录，确属新功能时才审计并分配编号，保持创建日期和历史更新时间，更新目录与 updateRecords。不得覆盖历史、编造摘要或大规模重编号。审计脚本存在时运行，再执行 `npm run docs:check-encoding` 和 update-records 测试；脚本缺失必须如实报告。具体 Skill 内容由对应 Skill 负责，本文只维护文档契约。
