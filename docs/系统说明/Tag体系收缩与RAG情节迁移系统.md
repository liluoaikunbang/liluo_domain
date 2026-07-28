# Tag 体系收缩与 RAG / 情节迁移系统

## 职责边界

- 情节回答“发生了什么”，权威源为 `src/game/data/plot_outline/catalog.json`。
- 紧缚 RAG 回答“这个概念、状态或结构是什么”，权威源为 `external-knowledge/cards/`。
- 玩法回答“玩家能做什么、系统如何响应”，权威源为玩法注册表。
- Style-RAG 回答“如何表达”，不承担事实、事件或交互规则。

普通 Tag、紧缚 Tag 及其图谱泳道已经退役。故事节点以 `plotRefs`、`ragRefs`、`gameplayRefs` 建立显式关系；`storyTags` 仅保留世界内栏目与故事风格职责。节点界面上的「紧缚 RAG 标签」是由 `ragRefs` 派生的一级标题（上位类别优先），不另存平行字段。

大纲访谈每次必问「设置紧缚 RAG 标签」（CDR-009）：用户确认后查找或新建骨架卡，写入 `ragRefs`；stub/缺正文同步进入该节点 `missingItems`。

## 情节类型

情节使用 `plotKind`：

- `ordinary`：不以紧缚过程或其后果为核心。
- `restraint`：紧缚过程、状态变化或脱困构成主要事件。
- `mixed`：普通事件推进与紧缚事件同为不可删减的主干。

旧 `isBondagePlot`、`tags` 与 `bondageTags` 不得重新写入。一个旧条目可拆成多个情节、RAG 或玩法目标。

## 无来源 RAG 骨架卡

稳定但暂时没有可靠来源的概念允许先建骨架卡。骨架卡必须同时满足：

- `contentStatus: "stub"`
- `evidenceStatus: "missing"`
- `sourceRefs: []`
- 摘要只说明概念边界和迁移来源，不补写未经证实的细节。

查询会对骨架卡降权；它们可以被发现和引用，但不能自动视为已完成知识。补齐来源后，必须经过紧缚知识卡验证，再提升内容与证据状态。访谈确认但库中不存在的稳定概念，应立即按本规则建骨架卡并挂到故事 `ragRefs`，同时在故事节点登记补卡 `missingItems`。

## 紧缚 RAG 两级结构与回查

紧缚 RAG 使用 `ragLayer` 区分 `category`（上位类别）与 `concept`（具体概念），具体概念通过 `parentCardIds` 指向上位类别。例如“挠痒”下挂“挠痒-山药汁”和“挠痒-蚊子”。校验器必须拒绝不存在的父卡、上位类别反挂父级以及没有父级的具体概念。

骨架卡补写前先回查已索引原文，再读取命中位置的准确行段。只有原文直接介绍该概念时才写摘要和 `sourceRefs`；同名词、比喻、普通提及或语境不明的命中一律不算可靠依据。实在没有介绍的条目继续留空，并在关联图谱中显示为内容缺口。

## 迁移与回滚

`npm run migration:tag-rag:dry-run` 生成
`project-workflows/runs/tag-rag-restructure-v1.dry-run.json`。清单逐项保存旧 ID、旧名称、旧层级、迁移类型、新 ID、受影响故事/情节和处理状态，是本轮回滚与审计依据。

正式主数据不保存旧 Tag 字段或空迁移壳。若需回滚，只能根据清单恢复到独立审查分支，不能在现行故事、情节或图谱中重新启用旧字段。

## 图谱关系

图谱只投影显式来源关系：

- 故事 → 情节：`plotRefs`
- 故事 → RAG：`ragRefs`
- 故事 → 玩法：`gameplayRefs`
- 情节 → RAG：情节条目的 `ragRefs`

`tag`、`bondage_tag`、`tagged_with`、`bondage_tagged_with` 均为非法退役类型；校验器遇到它们必须失败。
