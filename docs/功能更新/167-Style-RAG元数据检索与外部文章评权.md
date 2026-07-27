# 167 - Style-RAG 元数据检索、外部文章评权与文风包

- **创建时间**：2026-07-26
- **更新时间**：2026-07-26

## 摘要

建立 Style-RAG V0（显式 `styleReferenceIds`）与 V1（离线元数据检索 + Style Pack），并接入外部紧缚/知乎文章增量清单与用户 0–5 评权。Embedding、向量库、learned reranker 与模型训练仍登记为 V2–V4 缺口。

## 内容

- 策略与标签：`project-navigation/style-rag-policy.json`、`style-taxonomy.json`、`external-style-sources.json`
- 外部清单：扫描 `external-knowledge/sources/fiction-bondage`（restraint-themed）与 `zhihu-novels`（general-prose）；文章/作者 registry；分批评权导出导入
- 检索与文风包：`writing:style:*` / `writing:external:*` CLI；Canon 与 Style 分区提示
- Skill：`liluo-style-rag`；写作表 `docs/写作资产/璃落写作表/`（awaiting-assets）
- 与 `liluo-formal-prose-pipeline` 集成：可选 `--style-pack` / Style Query；仍禁止未评审外部文章进入生产

## 边界

- 不扫描故事目录；不伪造黄金正文/个人旧作/用户评分
- 紧缚/非紧缚仅为适用域，不直接定质量
- 通用虚构灵感 RAG 仍用 `liluo-external-fiction-knowledge`，与 Style-RAG 隔离
