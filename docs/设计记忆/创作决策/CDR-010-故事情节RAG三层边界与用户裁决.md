---
id: CDR-010
status: accepted
title: 故事—情节—RAG 三层边界与用户裁决
date: 2026-07-28
scope: [story, plot, rag, governance, migration]
relatedRules: [story-plot-rag-layer-boundary]
relatedWorlds: [all]
supersedes: []
sourceStatus: user-confirmed
---

# CDR-010：故事—情节—RAG 三层边界与用户裁决

## 当前结论

正式内容按三层治理：

1. **RAG**：可跨故事复用的知识/表达单元；  
2. **情节**：一次性叙事发生；可未安置、不完整；  
3. **故事**：已正式安置的叙事容器，可含多个情节并引用 RAG。

完成度与标题形态不决定层级。同一旧条目允许拆成 RAG + 情节。用户是最终裁决者；AI 只审计与建议。未确认不得创建正式 RAG、删除/改写情节类型、改故事引用或伪装图谱迁移完成。迁移必须回写真实主数据并保留来源、映射与回滚路径。不得恢复退役 Tag 作为中间层。

## 背景与理由

Tag→RAG 迁移后，旧情节库仍混有职业壳、概念名词与真实事件。若继续用「长短/完整度」分类，会把可复用知识误当情节，或把具体发生误迁入 RAG。需要固定边界与逐条确认门禁。

## 代价与重新评估

短期内会出现骨架 RAG、归档情节 ID 与确认队列维护成本。若未来引入非紧缚通用 RAG 域，须另立审批，不得静默改 domain。批量确认仅在用户显式选择批次且排除 uncertain/冲突项时允许。
