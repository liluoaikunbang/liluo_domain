---
id: ADR-014
status: accepted
title: Style-RAG 元数据检索与 Canon 风格隔离
date: 2026-07-26
scope: [style-rag, formal-prose, writing-assets, external-style, canon-boundary]
relatedRules: [style-rag-metadata-v1, natural-expression-default-light]
relatedSystems: [style-rag-metadata, formal-prose-pipeline, external-style-inventory, writing-sheet, natural-expression-system]
supersedes: []
relatedAdrs: [ADR-013]
---

# ADR-014：Style-RAG 元数据检索与 Canon 风格隔离

## 当前结论

启用 Style-RAG **V0 显式引用 + V1 元数据检索**：Style Query 与 Style Pack 只控制表达；确定性打分 over 已批准注册表；用户评权后的外部文章可作为 bounded 参考；空 pack 合法。Embedding / 向量库 / learned reranker / 语料训练（V2–V4）继续暂缓。

## 背景与理由

1. **Canon vs Style**：正式正文的事实门禁必须在 prose contract；若 Style 检索携带角色、地点、情节，模型会把表达参考误当 plot spec。字段级禁止 + validate 失败即停。
2. **为何 V1 metadata 而非 embedding**：已有 taxonomy、用户评权与 tier 注册表；确定性可解释、可审计、无向量依赖；在评权数据不足前 embedding 收益不确定且版权切块风险更高。
3. **文章分 > 作者 prior**：同一作者作品质量方差大；0.7/0.3  blend 保留作者 tie-break，但不替代逐篇 review。
4. **themeDomain 非质量**：文件夹初始分类（绑缚域 / 知乎域）只服务领域匹配矩阵；不得用 domain 标签代替 userQuality 或暗示「高级/低级」。
5. **生产表示与泄漏**：默认 `source-only`；pack 受汉字预算约束；未评 external 不得进生产；聊天与 Git 不粘贴整篇 copyrighted 原文。
6. **空 pack**：无 approved 资产时返回 `awaiting-assets`/`partial`，不 backfill 未审文本——避免「无参考时的伪参考」污染。
7. **与 ADR-013 关系**：正式正文仍双模型 + 工作区候选 + 用户批准写 canon；StyleRAG 只扩展 gate 4 的参考来源，不改变 canon 写入链。
8. **阅读向文案走自然表达**：Style Pack 抽象、评权旁白、写作表说明与抽查协商文案撰写/改写前应用 `liluo-natural-expression` light（见 CDR-005）；不文学化 ID/路径/CLI。

## 主要替代方案与代价

- **全自动 embedding RAG**：不可解释、版权与存储成本高；暂缓至 V2 阈值（见 deferred-roadmap）。
- **外部文章默认进 pack**：破坏用户评权；拒绝。
- **themeDomain 当质量排序**：误排 general vs restraint；拒绝。
- **Style Pack 携带 canon**：破坏 continuity 门禁；拒绝。
- **通用 external-fiction-knowledge 兼管 Style**：灵感卡与表达 pack 生命周期不同；拆 Skill。

## 重新评估条件

- 用户评权外部文章 ≥50 且 golden 覆盖 ≥4 scene functions → 可议 V2 embedding ADR
- Style feedback ≥200 条且 V2 稳定 → 可议 V3 reranker
- 独立法务/许可审查通过 → 可议 V4 training
- 用户明确要求关闭 V1 回退仅 V0

## 影响范围

- 新增 `liluo-style-rag` Skill、模板、系统说明、CLI 已有命令文档化
- 更新 `liluo-formal-prose-pipeline` gate 4 与 style-rag-deferred-boundary
- 不引入向量库依赖；不修改 `src/game` 运行时
- `project-navigation/style-rag-policy.json` 为运行时策略权威

## 关联路径

- Policy: `project-navigation/style-rag-policy.json`
- Registries: `docs/写作资产/外部风格研究/article-registry.json`, `author-registry.json`
- Sources: `external-knowledge/sources/fiction-bondage`, `external-knowledge/sources/zhihu-novels`
