---
name: liluo-executable-workflow
description: Run mature 璃落 tasks from machine-readable workflow JSON with per-node briefs, required Skill/Agent evidence, adoption checks, and fail-closed completion gates. Use for 可执行工作流、流程演练、节点任务书、主线重构工作流、漏调用门禁 or when a repeated multi-Skill/Agent process needs auditability; not for one-off tiny edits, open brainstorming, or replacing authoritative content Skills.
---

# 可执行工作流运行时

权威说明见 [机器可读工作流与可视化执行规范系统](../../../../docs/系统说明/机器可读工作流与可视化执行规范系统.md)。定义真源在 `project-workflows/definitions/`，运行记录在 `project-workflows/runs/`（默认不提交临时日志）。

## 何时使用 / 何时跳过

**使用（完整路径）**：成熟、会重复、易漏步骤、多 Skill/Agent、触达正式源、需展示或审计的任务。

**简化路径**：一次性小修、开放讨论、尚未稳定的探索——继续用对应专项 Skill/普通 Agent，不要强行建工作流。

**轻量查询**：`npm run project:workflow:list`。

## 任务介绍与静态图（默认）

介绍文档：`project-workflows/generated/<wf-id>/PROCESS.md`（文首含 Mermaid 概览）。

**不要频繁重生成。** 规则：

| 情况 | 做什么 |
| --- | --- |
| 日常校验 / Skill 正文小改 | `npm run project:workflow:validate`（只检查定义、引用、生成物是否过期，**不写文件**） |
| 重大修改定义（节点/边/必需资源/门禁/输入输出） | 改完后显式 `npm run project:workflow:generate -- --workflow <id>` 或 `--all` |
| 用户点名要交互大图 | 再 `viewer:build` 并打开 viewer |

生成物过期时 validate 会失败并提示 generate，而不是每次静默重写。

## 标准执行顺序

1. list / 读 registry  
2. create-run（默认 dry-run）  
3. brief → 按任务书调用资源并 record-invocation  
4. complete-node；缺证据则 blocked  
5. finish  

## 简化命令

| 目的 | 命令 |
| --- | --- |
| 校验（不重生成） | `npm run project:workflow:validate` |
| 重大修改后重生成介绍/图 | `npm run project:workflow:generate -- --workflow <id>` |
| 全部重生成 | `npm run project:workflow:generate:all` |
| 交互大图（少用） | `npm run project:workflow:viewer:build` |

## 完成前

- 缺证据不得声称完成；dry-run 不得写成已迁移  
- 重大改定义后才 generate；改导航时 `project:navigation:changed`  
- 验证：`project:routine -- workflow` 或最小 `project:workflow:validate`  
- 介绍流程指向 PROCESS.md；仅用户明确要求时打开 viewer  
