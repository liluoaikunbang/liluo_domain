# liluo-project-documentation-sync

## 项目索引协作

可用 docs 索引定位记录，但三处文档来源仍需直接核验；同步完成后复用统一增量构建与验证命令。

## 用途与边界

同步功能文档、功能更新目录、界面更新记录及项目专属/用户可调用技能说明。未实现/未确认的游戏功能不据此伪造完成记录，也不负责 Git 提交。普通单个故事大纲完善、访谈写回、错字、内部元数据或通用执行纪律 Skill 的措辞和触发收窄不占用新的功能更新编号。

**不会自动运行**：本 Skill 不是生命周期 Hook。实质变更后由主智能体在完成前主动加载；可用 `npm run docs:governance:audit` 核对三方编号，新增用户可调用 Skill/工作流时另跑 `npm run docs:commands:validate`。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-project-documentation-sync/`
- reference：`documentation-contract.md`
它是 `liluo-project-governance-memory` 的下游机械同步工具：负责功能编号、功能文档、目录、`updateRecords.js` 和 Skill 说明的一致性，不负责判断持久性、选择权威文档或记录 ADR/CDR。新增用户可调用工作流时还需同步用户命令目录，并用 `docs:commands:validate` 确认每个项目 Skill 名称已以反引号出现在目录中；治理系统变化纳入任务统一验证候选，不自动追加全量治理审计。
- 输入：实现范围、真实创建日期、当前摘要和历史记录
- 输出：三方一致的编号/标题/日期/摘要与审计结果

## 流程、限制与验证

先判断改动是否达到功能记录门槛：可玩地图/事件/对话/玩法实现、代码或系统行为变化、项目工作流或 schema、成批素材、整条主线或多节点内容重构可以登记；单节点日常大纲维护和 Skill 内部文字整理不登记。达到门槛后优先追加同一功能的既有记录，确属新功能时才审计并分配编号，保持创建日期和历史更新时间，更新目录与 updateRecords。不得覆盖历史、编造摘要或大规模重编号。只运行任务统一验证计划选中的最小记录校验；用户入口或项目 Skill 变更时必须包含 `docs:commands:validate`。只有广泛结构迁移或明确要求时才做全量治理审计。文档同步不默认触发 Web 构建，也不反复探测已知不存在的脚本。具体 Skill 内容由对应 Skill 负责，本文只维护文档契约。
