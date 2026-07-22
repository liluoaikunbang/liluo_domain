# liluo-story-gap-discovery

## 用途与触发

分析指定故事节点、系列或世界的真实内容缺口、重复功能和未使用玩法/地图/CG/关系机会，并生成供用户审批的原创候选卡。用户要求“还缺什么”“补候选”“检查重复”“从外部库找适配模式”“让我只审批提案”时触发。

完整情节只需正式写入、单纯润色、既有设定查询、代码/地图/存档/图片修复、仅维护索引或外部库时不触发。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-story-gap-discovery/`
- Agent：`.codex/agents/liluo_story_gap_analyst.toml`
- 系统说明：`docs/系统说明/故事缺口发现与灵感补全系统.md`
- 确定性合同：`scripts/story-gaps/story-gap-contract.mjs`
- 可选存储：`planning/story-gaps/`

输入包含 node/series/world 模式、目标 key/范围、外部检索 off/light/deep、候选数和约束。输出为已有覆盖、确认/可能缺口、刻意/延期项、重复功能、外部抽象、排序候选卡、风险与审批顺序。

## 查询与 token 控制

先查项目索引并核验原文件；默认只读目标、两级父节点、直接子节点、三个相关同级节点和必要引用。外部默认按需 light，最多 5 卡、5 摘要、3 段；deep 需理由。候选数：节点 3—5、系列 5—8、世界 8—12。

## 候选与审批

候选卡记录证据、适配、差异、来源抽象、1—5 分、制作规模和审批选项。`proposed` 不得写入；接受后交故事撰写 Skill；`held` 不写入；`rejected` 抑制原样重荐；`written` 记录真实 key。

## 相邻工作流与禁止事项

正式写作使用 `liluo-story-outline-authoring`，分歧访谈使用 `random-story-outline-interview`，连续性/玩法/外部原创/内容与索引分别交对应 Skills。星弥只读，不修改正式故事、树、索引、外部来源、地图、图片或存档；不以低频断言缺口，不批量造节点，不复制或换皮外部作品。
