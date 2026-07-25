---
id: ADR-009
status: accepted
title: 取消项目级 Codex 生命周期 Hook
date: 2026-07-25
scope: [codex-hooks, developer-experience, tool-lifecycle]
relatedRules: [automatic-quality-gate-minimal-scope, abnormal-tool-latency-disclosure]
relatedSystems: [automatic-quality-gate-system, governance-memory-system]
supersedes: [ADR-008]
---

# ADR-009：取消项目级 Codex 生命周期 Hook

## 当前结论

项目的 `.codex/hooks.json` 保持空 Hook 配置，不注册 `PreToolUse`、`UserPromptSubmit`、`Stop` 或其他 Codex 生命周期 Hook。平台沙箱、`.codex/rules`、Agent 的危险操作检查、显式 `project:gate:*`、本地 pre-push 和 GitHub Actions 分别保留原有职责。

## 背景与理由

已复现短命令和策略脚本本体均在约 150 ms 内完成，但其经过 Codex 工具层返回却偶发耗时约 48–50 秒。等待发生在客户端/插件调度、生命周期 Hook 与 PowerShell 工具的交互链中，而非 Git、构建、工作区扫描或质量门禁本体。剩余的 `PreToolUse` 覆盖 Bash、补丁与直接编辑等高频操作，会让独立 Codex 与编辑器插件共同暴露于此风险。

生命周期 Hook 位于每次交互的关键路径；即使脚本逻辑为常数时间，也无法保证集成层不会阻塞。移除项目唯一仍会介入每次工具交互的机制，是最小、可逆且可验证的修复。需要较长时间的验证继续在显式、pre-push 或 CI 边界执行，其中推送时约 48 秒的 pre-push 加 Web 构建属于预期耗时，不能与此次交互异常混为一谈。

## 运行观察与重新评估

若工具或命令耗时明显偏离命令本体，或无预期地持续约 30 秒以上，Agent 必须主动向用户报告并说明是否已解决。只有平台提供可证明不阻塞交互、隔离执行且可取消的生命周期机制，并补充专门回归保护后，才可重新评估引入项目 Hook。
