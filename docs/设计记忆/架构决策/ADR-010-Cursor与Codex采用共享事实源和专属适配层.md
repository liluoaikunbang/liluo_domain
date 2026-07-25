---
id: ADR-010
status: accepted
title: Cursor 与 Codex 采用共享事实源和专属适配层
date: 2026-07-26
scope: [ai-collaboration, cursor-rules, codex-configuration, derived-configuration]
relatedRules: [ai-shared-authority-and-derived-config]
relatedSystems: [ai-collaboration-file-layering, governance-memory-system]
---

# ADR-010：Cursor 与 Codex 采用共享事实源和专属适配层

## 当前结论

Cursor 与 Codex 共同读取根 `AGENTS.md`、项目 Skill、系统说明、设计记忆、脚本、schema 和测试；`.cursor/` 与 `.codex/` 分别只保存各自工具所需的薄适配。禁止用文件系统链接或完整正文复制将两个专属目录绑定在一起。

出现大段、必须双端派生的配置前，必须先提示用户采用一个普通源文件，以及生成双端适配和校验其一致性的脚本；只有用户确认后才建立该生成链。

## 背景与理由

Codex 已有 `.codex/` 下的授权和子智能体适配，而 Cursor 使用 `.cursor/rules/*.mdc` 的作用域与元数据。两套格式的职责不同，直接复制会产生漂移，符号链接也会把 Windows 权限、Git checkout 和工具语法差异暴露给协作者。

将稳定项目知识留在普通版本控制文件中，使两端可直接读取同一事实；将工具差异压缩为短适配文件，既避免重复，也保留各工具必要的原生能力。大段派生配置属于例外，应在用户了解生成与维护成本后再引入，并以可验证的生成链控制漂移。

## 主要替代方案与代价

- 将全部规则复制为 Cursor 与 Codex 两份：短期直观，但会快速漂移，放弃。
- 使用软链接、目录联接或硬链接：要求两个文件语义相同，且跨 Windows/Git 协作成本高，放弃。
- 只保留一个工具的专有目录：不能利用另一工具的原生规则能力，放弃。

该方案要求适配文件保持克制，并在新增大段派生配置前先征得用户确认；这是用少量前置判断换取长期一致性。

## 重新评估条件

若 Cursor 与 Codex 均支持同一种稳定、版本控制且可按路径加载的通用规则格式，或团队统一了跨平台链接与生成物治理策略，可重新评估是否收敛适配层。
