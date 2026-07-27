# 知识检索校准（RAG + Style-RAG + 细节概念 + 情节）

渐进式质量改进闭环，**不阻塞**现有索引与查询使用。

```text
现有 RAG / Style-RAG / 概念种子 / 情节目录正常使用
  → 真实使用中人工抽查（RAG 默认只抽知识卡）
  → 卡审：描述 / 存在价值 / 分层（定性评价先协商改向）
  → 查关联邻居（*:audit:related）
  → 主条目与需要改的关联项一并修正（用户确认后再落盘）
  → 记录错误与人工修正（含 relatedAdjustments）
  → 重复问题才升级 Skill
  → 新版 Skill 仅重建/校验受影响范围
  → 后续抽查验证
```

## 目录

| 路径 | 用途 |
| --- | --- |
| `registry.json` | 抽查记录索引与模式组 |
| `records/rag/` | 普通 RAG 抽查 JSON |
| `records/style-rag/` | Style-RAG 抽查 JSON |
| `records/concept/` | 细节概念抽查 JSON |
| `records/plot/` | 情节抽查 JSON |
| `batches/` | 抽样批次导出（Markdown/JSON） |
| `rebuild-logs/` | 受影响重建 dry-run / 执行日志 |
| `templates/` | 记录模板 |

策略：`project-navigation/rag-audit-policy.json`  
类别：`project-navigation/rag-audit-categories.json`

## Skill 升级阈值（摘要）

单次错误**不得**立即膨胀 Skill。仅当：

1. 用户明确要求「以后都这样 / 写入规范」；或
2. 同类错误在 ≥3 条彼此独立抽查中重复；或
3. 触及正史/来源/连续性/版权/索引结构的严重问题；或
4. 已有错误示例、正确示例与可验证抽象规则。

## 命令

见 `docs/用户命令目录.md` 与 `npm run rag|style-rag|concept|plot:audit:*` / `*:audit:related` / `knowledge:audit:sample`。

硬规则：改一处时必须检查关联项；有需要补充或调整的，与主条目一并处理。
