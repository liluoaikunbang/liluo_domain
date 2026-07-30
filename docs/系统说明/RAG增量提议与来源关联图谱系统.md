# RAG 增量提议与来源关联图谱系统

## 定位

所有 RAG 卡固定拥有知识与表达两个分支。分支可以是 `stub`，但不得省略。故事写入时自动做增量拆分，外部来源扫描只由用户显式发起；所有 AI 解释、证据与图边默认待确认。

## 领域与引用

故事、情节与玩法统一用 `ragRefs` 引用卡 ID。卡以 `ragDomain` 区分：`restraint-professional`（紧缚专业）、`general-craft`（通用创作机制）和 `canon`（仅项目权威事实）。外部文章不得支撑 `canon`。

## 两条内容发现线路

1. **写入前自动增量拆分**：任何故事、情节、地图事件、对话、玩法或局部设定准备写回时，调用 `liluo-rag-candidate-proposal`。它完整分析本次增量，但只把候选写入 `external-knowledge/rag-governance/registry.json` 的 `pending` 队列；默认展示 0–3 个高价值项，完整拆分可展开。
2. **用户手动补扫既有内容**：用户说“补扫全部故事 RAG”或指定世界/主线/节点时，运行 `npm run rag:rescan-stories -- --scope "…"`，再分批按同一候选规则提议；不批量改 `ragRefs`。

候选必须具备跨故事复用价值、清晰边界和未来检索价值。一次性剧情、专属事实、普通动作与无检索价值的词留在原内容层。

## 用户确认与来源待办

候选卡记录名称、领域、故事依据、适用/排除范围、近似卡、建议父卡、知识/表达骨架和未来来源问题。确认前不建卡、不写 `ragRefs`、不确认证据。确认骨架时可用：

```powershell
npm run rag:review-proposal -- --proposal <id> --action confirm --materialize
```

该动作创建双分支骨架并写入来源待办；外部资料仍未扫描。

## 按需来源关联

用户明确要求时才运行：

```powershell
npm run rag:source-scan -- --card <card-id> --source-domain restraint|general
```

默认是 dry-run。结果包含候选来源、片段定位和匹配分数，状态均为 `pending`。文章整体理解、表达观察、术语归类与文章间关系必须各自回指片段并获得用户确认。只有范围明确、可撤销的用户授权才可例外自动写入；一次确认不推断为全局许可。

## 逐段人工来源访谈

用户可用 `npm run rag:source-interview` 从外部来源抽取一个未处置分段。当前分段在 Codex 对话中完整展示；用户可关联既有 RAG、新建 RAG，或标为无价值、需上下文、需重切、排除或暂缓。指定当前来源时随机概率为该来源 40%、其他来源 60%。

确认关系通过 `npm run rag:decide-segment` 写入人工确认账本；新建 RAG 使用 `npm run rag:create-from-segment`，同轮确认名称、边界、父卡、分支和片段关系后立即可检索，但只返回用户已确认字段。旧自动关联只能运行 `npm run rag:reset-human-baseline` 生成 dry-run 审包；提交退役必须另获用户明确批准。

## RAG 图谱

游戏内入口：**旅途菜单 → 大纲 → 关联图谱 → 筛选 →「RAG 证据路径（条目→片段→来源）」**。该视图显示 `RAG → 原文片段 → 来源文章`；选中 RAG 后使用“聚焦模式”可继续看一跳路径。全图默认隐藏片段与来源，避免画布失控；候选关系不与已确认关系混同。

图谱是投影层。权威数据分别留在卡、来源目录、证据层和 RAG 治理登记中。
