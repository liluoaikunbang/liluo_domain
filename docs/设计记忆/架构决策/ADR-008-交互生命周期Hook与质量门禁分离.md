---
id: ADR-008
status: accepted
title: 交互生命周期 Hook 与质量门禁分离
date: 2026-07-25
scope: [codex-hooks, quality-gate, developer-experience]
relatedRules: [automatic-quality-gate-minimal-scope]
relatedSystems: [automatic-quality-gate-system]
supersedes: []
---

# ADR-008：交互生命周期 Hook 与质量门禁分离

## 当前结论

Codex 的提示提交、工具调用和任务停止 Hook 只允许做基于当前输入的确定性、常数时间策略判断。它们不得扫描工作区、读取改动范围、运行质量门禁、构建、索引、测试、联网或等待长任务；项目不注册 `Stop` Hook。仓库范围验证只通过用户或 Agent 显式触发的 `project:gate:*`、本地 pre-push 或 GitHub Actions 执行。

## 背景与理由

曾在 `Stop` 生命周期中同步运行按改动范围选择的质量门禁。该门禁会随工作区规模扩大，并可能派生多项检查，使提交后或任务收尾阶段看似成功却长时间不继续。这类阻塞发生在交互关键路径，既难以判断也会影响 Codex 与编辑器插件的基本可用性。

把验证移到显式、推送前和 CI 入口后，质量控制仍保留在可观察、可报告且预期耗时的边界；交互 Hook 则保持快速、可预测。配置回归测试要求 `.codex/hooks.json` 只保留 `PreToolUse`，防止以其他生命周期事件重新引入隐性重任务。

## 代价与重新评估

任务结束时不再自动获得完整质量报告，Agent 必须在需要验证时明确选择最小适用入口。只有平台能够提供可证明不阻塞交互、隔离执行且可取消的异步 Hook 机制，并且项目补充相应回归保护后，才可重新评估是否引入额外生命周期 Hook。
