---
name: liluo-project-capability-navigation
description: Maintain the machine-readable 璃落 capability, workflow, source and gap registry; generate the full overview and concise “我现在可以做什么” action page; and recommend grounded next tasks. Use for “我现在能做什么”“下一步做什么”“同步能力和待办”“某项缺口完成了”, or after Skill, Agent, command, source, missingItems or gameplay-status changes; do not replace authoritative files or invent progress.
---

# 项目能力、缺口与行动导航

导航注册表只保存入口、状态、证据和下一步；Skill、故事、玩法、命令和待定设计仍以各自权威源为准，生成的 Markdown 不手工编辑。

## 工作模式

- 查询：读取 `docs/我现在可以做什么.md` 与相关注册表切片；用 `npm run project:navigation:next -- --time 20 --avoid map` 推荐一至三项，允许返回零项。
- 增量更新：能力、用户入口、`missingItems`、玩法关联/证据、待定设计或来源状态变化后，运行 `npm run project:navigation:changed`。
- 重扫：仅首次建设、结构性迁移或用户明确要求时运行 `npm run project:navigation:rescan -- --domain <domain>`。

## 真实性边界

故事缺口逐条从 `missingItems` 派生；玩法从 `catalogued` 起步，不能因说明存在而标实现。缺口仅在有真实文件、数据、测试或用户确认的完成证据时关闭；候选、计划和未验证代码保持开放或进行中。不得自动写入 `gameplayRefs`、故事或正式内容。

## 验证

运行 `project:navigation:check`；普通无关任务不触发导航扫描。新增 Skill/Agent 时还按 `liluo-capability-regression` 选择最小回归范围。
