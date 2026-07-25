# Cursor 与 Codex 协同文件规划（提案）

状态：`phase-1 implemented`（2026-07-26）  
范围：让 Cursor 与 Codex 在同一仓库工作时读取相同的项目事实；当前契约见 [AI 协同文件与规则分层](../docs/系统说明/AI协同文件与规则分层.md)。

## 已确认的边界

- 根目录 `AGENTS.md` 是项目最高层的跨任务规则与路由，且 Cursor 与 Codex 都可读取它。
- `.codex/` 仅保存 Codex 的运行时适配：命令授权、子智能体、Hooks 空配置与本机配置。
- `.agents/skills/`、`docs/系统说明/`、`docs/设计记忆/`、脚本、schema 与测试是工具无关的项目知识和可验证流程；不能因引入 Cursor 而迁移或复制。
- `.cursor/rules/` 已建立；它只保存 Cursor 独有的规则适配，命令和 Bugbot 上下文仍按需新增。

## 目标目录

```text
AGENTS.md                              # 共用入口：短、稳定、工具中立
.agents/
  skills/                              # 共用的项目工作流原文（现有）
.codex/                                # Codex 专属适配（保留现状）
  agents/
  rules/
  approval-decisions.json
  config.toml
  hooks.json
.cursor/                               # Cursor 专属适配（新增）
  rules/
    00-project-entry.mdc               # Always：入口和最小共同边界
    game-architecture.mdc              # src/game/** 自动附加
    content-authoring.mdc              # 内容数据目录自动附加
    documentation-governance.mdc       # docs/**、.agents/** 自动附加
    verification-and-git.mdc           # Manual：检查、提交、发布前显式调用
  commands/
    inspect-change.md                  # 可选：只读变更检查命令
    prepare-implementation.md          # 可选：实现前的上下文读取命令
  BUGBOT.md                            # 可选：仅放 PR 审查范围与高风险项
docs/
  系统说明/
    AI协同文件与规则分层.md            # 采纳后唯一的当前契约
  设计记忆/架构决策/
    ADR-xxx-...md                      # 仅在正式采纳时记录理由
planning/
  cursor-codex-协同文件规划.md         # 本提案；采纳后可保留为迁移记录
```

## 单一事实源与适配层

| 内容 | 唯一事实源 | Codex 消费方式 | Cursor 消费方式 |
| --- | --- | --- | --- |
| 全局项目约束、目录职责、Skill 路由 | `AGENTS.md` | 原生读取 | 原生读取 |
| 可复用项目流程 | `.agents/skills/**/SKILL.md` | 原生 Skill | Cursor 规则或命令按需要求读取原文 |
| 当前系统契约和设计理由 | `docs/系统说明/`、`docs/设计记忆/` | 按 `AGENTS.md` / Skill 路由 | 同一原文，由对应 MDC 指向 |
| 确定性验证 | `package.json`、`scripts/`、测试 | 直接执行 | 直接执行，仍由用户确认终端命令 |
| Codex 命令审批与子智能体 | `.codex/**` | 原生 | 不读取、不镜像 |
| Cursor 规则、聊天命令、Bugbot 上下文 | `.cursor/**` | 不读取、不镜像 | 原生 |

`00-project-entry.mdc` 只做极短入口提示：遵循根 `AGENTS.md`，优先读取权威来源，不将索引当事实源；不再复制完整规则。其他 MDC 文件只写路径触发、适用任务和“应读取的权威文件”，不重写 Skill 或系统说明。

## MDC 作用域建议

| 文件 | 模式 | 建议 glob | 内容上限 |
| --- | --- | --- | --- |
| `00-project-entry.mdc` | Always | — | 约 30 行 |
| `game-architecture.mdc` | Auto Attached | `src/game/**` | 约 50 行 |
| `content-authoring.mdc` | Auto Attached | `src/game/data/**`, `schemas/**` | 约 50 行 |
| `documentation-governance.mdc` | Auto Attached | `docs/**`, `.agents/**`, `AGENTS.md` | 约 45 行 |
| `verification-and-git.mdc` | Manual | — | 约 50 行 |

不把所有规则设成 Always。Cursor 的项目规则会进入模型上下文；按路径拆分可避免文档、故事和 Phaser 架构规则在无关任务中相互挤占上下文。

## 连接方式：引用优先，不用文件系统链接

优先级如下：

1. **同一普通文件被两端读取**：例如根 `AGENTS.md`、Skill、系统说明、脚本。这是零复制的最佳方式。
2. **适配文件写相对路径引用**：MDC/命令只说明“先读哪个权威文件”，不复制正文；文档间用 Markdown 链接。
3. **仅对极短、工具必需的适配内容重复**：如 Cursor MDC front matter、Codex TOML/Rules 语法。重复内容只保留职责和路径，控制在几十行内。
4. **若未来有确实无法避免的大段派生配置**：以一个普通源文件为权威，用仓库内生成脚本产出两个工具的适配文件，并在 CI/显式检查中验证未漂移。生成物要标明“请勿手改”。

不建议为 `.cursor/rules` 与 `.codex/` 使用符号链接、目录联接或硬链接：它们的语法和职责不同，Windows 的创建权限与 Git checkout 行为也会增加协作者成本；更重要的是，链接会让两个工具的专属配置边界变得不清晰。只有两个工具**确实需要字节完全相同的纯文本文件**、且团队已统一启用 Git symlink 支持时，才可在评审后例外采用软链接；本项目当前没有这样的对象。

## 落地记录

1. 已新增五个精简的 `.cursor/rules/*.mdc`，只接入现有 `AGENTS.md` 与权威文档，不移动任何文件、不改 `.codex/`。
2. 已将当前契约与 ADR 写入正式文档；待用户实际在 Cursor 完成首个小任务后，再根据真实加载结果调整规则作用域。

## 不做的事

- 不新增 `.cursorrules`（Cursor 已将其标为旧格式）。
- 不把 `.codex/rules`、授权决定或子智能体复制到 Cursor。
- 不把 Cursor 记忆当成项目事实源，也不把本机 Cursor 设置提交到仓库。
- 不为兼容性重排 `src/game`、`.agents/skills` 或既有文档结构。
