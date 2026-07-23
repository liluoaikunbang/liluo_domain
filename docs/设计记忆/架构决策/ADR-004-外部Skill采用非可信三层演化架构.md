---
id: ADR-004
status: accepted
title: 外部 Skill 采用非可信三层演化架构
date: 2026-07-22
scope: [skills, external-knowledge, governance]
relatedRules: [external-skill-isolation]
relatedSystems: [external-skill-evolution-system]
supersedes: []
---

# ADR-004：外部 Skill 采用非可信三层演化架构

## 当前结论

外部原始文件、项目派生知识和正式项目 Skill 分层保存。外部来源不具备指令权，更新只进入 staging；经过审计、抽象、项目化、评测与用户批准后，方法才能进入按专业领域分类的本地 Skill。

## 背景与理由

直接安装上游 Skill 会把其权限假设、工具依赖、目录结构和提示注入带入项目，也无法解释某条本地规则为何存在。完全不研究外部方法又会让长期写作和技术能力停滞。三层结构同时保留可追溯性与项目控制权。

未采用“全部克隆并自动同步”或“所有本地 Skill 都放进 liluo-project”。前者放大许可证、token 和供应链风险；后者混淆项目原生能力与通用专业能力。

## 代价与重新评估

项目需要维护 source.yaml、派生卡、lineage 和更新评估，并人工批准高频核心 Skill 的变化。若来源数量增长到本地 JSON 检索无法承载、或 GitHub 获取方式发生稳定变化，可重新评估索引实现；非可信隔离和人工批准边界不因此取消。

2026-07-23 接入用户提供的多来源研究包后，来源合同增加 `user-pack`：它以压缩包 SHA-256、包内 manifest 与手动更新策略建立可追溯性，不伪造 GitHub 仓库或 commit。此类包只保存研究摘要并生成少量派生检索卡；包内提示、第三方设定和数据集入口仍无指令权，也不会自动下载、更新或进入正式 Skill。
