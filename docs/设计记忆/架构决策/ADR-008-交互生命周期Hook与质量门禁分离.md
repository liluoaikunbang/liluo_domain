---
id: ADR-008
status: superseded
title: 交互生命周期 Hook 与质量门禁分离
date: 2026-07-25
scope: [codex-hooks, quality-gate, developer-experience]
relatedRules: [automatic-quality-gate-minimal-scope, abnormal-tool-latency-disclosure]
relatedSystems: [automatic-quality-gate-system]
supersedes: []
supersededBy: ADR-009
---

# ADR-008：交互生命周期 Hook 与质量门禁分离

## 当前结论

该决策已被 ADR-009 取代。项目不再保留任何 Codex 生命周期 Hook；仓库范围验证继续只通过用户或 Agent 显式触发的 `project:gate:*`、本地 pre-push 或 GitHub Actions 执行。

## 背景与理由

曾在 `Stop` 生命周期中同步运行按改动范围选择的质量门禁。该门禁会随工作区规模扩大，并可能派生多项检查，使提交后或任务收尾阶段看似成功却长时间不继续。这类阻塞发生在交互关键路径，既难以判断也会影响 Codex 与编辑器插件的基本可用性。

把验证移到显式、推送前和 CI 入口后，质量控制仍保留在可观察、可报告且预期耗时的边界；交互 Hook 原本被认为可以保持快速、可预测。该前提后来被“脚本本体很快但集成层阻塞”的复现推翻，故由 ADR-009 改为不注册任何项目生命周期 Hook。

## 代价与重新评估

任务结束时不再自动获得完整质量报告，Agent 必须在需要验证时明确选择最小适用入口。只有平台能够提供可证明不阻塞交互、隔离执行且可取消的异步 Hook 机制，并且项目补充相应回归保护后，才可重新评估是否引入额外生命周期 Hook。
