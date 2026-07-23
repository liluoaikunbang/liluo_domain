# 145-外部 Skill 来源库、项目能力演化与自然表达系统

- 创建日期：2026-07-22
- 更新日期：2026-07-23（依据真实写作反馈补入动作、物体反馈与空间连续性的可信度门禁）
- 更新日期：2026-07-22（完成三层来源库、更新工具、自然表达 Skill 与治理同步）
- 当前状态：已通过自动化验证；自然表达质量仍需在后续真实写作中持续校准

## 本次实现

建立外部 Skill 原始层、派生 RAG 层与正式项目 Skill 层。首批正式准入 5 个许可证明确来源，另将 20 个已核验 HEAD 的候选留在待准入清单；实现 catalog、校验、到期检查、staging 获取、trackedPaths diff、风险评估、维护和查询命令，保证更新不会自动修改正式 Skill。

新增 `writing/liluo-natural-expression`，支持 compose/revise/diagnose 与 off/light/deep，覆盖小说、大纲、游戏对话、项目组对话、手记、公开开发叙事和虚构成年束缚题材，并通过事实锚点保护 key、数值和状态。

2026-07-23 根据真实写作校准补入“可信度先于文气”：具体动作需要通过起始姿态、人物动作、物体反馈与实际后果的连续推演；不再为了表现人物熟悉、聪明或有经历而临时制造缺乏依据的操作技巧，并新增伪具体性诊断与合同回归 fixture。

## 主要路径

- `external-knowledge/sources/skill/`
- `external-knowledge/derived/skill/`
- `external-knowledge/staging/skill/`
- `scripts/external-skills/`
- `.agents/skills/writing/liluo-natural-expression/`
- `docs/系统说明/外部Skill来源库与项目能力演化系统.md`
- `docs/系统说明/璃落自然表达与文气塑形系统.md`

## 关键边界

外部 `SKILL.md` 全部作为非可信数据；未执行上游脚本，未自动安装 MCP/API，未覆盖本地 Skill，未修改正式故事、地图、图片或存档。用户候选中的 OpenAI `develop-web-game` 路径在当前 HEAD 不存在，因此没有生成虚假来源快照。

## 验证记录

- 外部 Skill 合同测试：8 项通过。
- 自然表达路由、锚点与可信度合同测试：5 项通过。
- catalog：5 个正式来源、9 张派生卡、7 个上游 Skill 条目。
- staging 更新演练：0 新增、0 修改、0 删除，无虚假 diff；评估建议 `ignore`。
- Skill、治理、文档、编码、项目索引与 Web 构建验证见最终任务记录。
