---
name: liluo-rag-source-association
description: 用户显式要求时，为指定紧缚或通用 RAG 卡扫描外部文章候选、片段和关系，并以 dry-run 审包等待确认；不自动确认证据或图边。
---

# RAG 来源关联扫描

仅在用户明确要求扫描来源、关联文章、建立某卡证据路径或补充 RAG 图谱时使用。先读 `liluo-external-fiction-knowledge`；Style-RAG 仍只处理表达资产。

1. 明确目标卡、来源域和范围。`restraint-professional` 默认扫描紧缚小说；`general-craft` 默认扫描知乎普通小说；`canon` 不得扫描外部来源。
2. 先 dry-run：

```powershell
npm run rag:source-scan -- --card "<card-id>" --source-domain restraint|general
```

3. 输出文章/片段候选、命中理由、缺口和不确定项。文章整体理解、表达观察、术语归类和文章间关系均为 `pending`，必须回指片段。
4. 只有用户明确确认一项或一批时，才允许写入证据、文章关系或图谱主视图。除非用户设立范围明确、可撤销的自动许可，不得跳过确认。
5. 关联图谱的“RAG 证据路径（条目→片段→来源）”筛选只展示已投影路径；候选关系默认不与已确认关系混同。
