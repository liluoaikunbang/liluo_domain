# AI 协同文件与规则分层

## 当前契约

项目以普通、版本控制的权威文件作为 Cursor 与 Codex 的共同事实源；工具目录只保存本工具无法从共同来源表达的薄适配。根 `AGENTS.md` 是共同入口，上下文装载以 `project-navigation/context-policy.json` 为准；`.agents/skills/`、`docs/系统说明/`、`docs/设计记忆/`、脚本、schema 与测试保持各自的既有权威职责。

`.codex/` 只保存 Codex 的命令授权、子智能体与运行时配置；`.cursor/` 只保存 Cursor 的 MDC 规则、可选聊天命令和可选 Bugbot 上下文。两者不得互相镜像、覆盖或承担对方的运行时语法。

## 双端并存与修改边界

本项目由 Codex 与 Cursor 共同使用。**修改任一侧专属内容时，不得直接删除或覆盖另一侧的专属目录或文件以图“统一”**；必须让 `.codex/` 与 `.cursor/` 长期并存。

| 场景 | 正确做法 | 禁止做法 |
| --- | --- | --- |
| 新增 Cursor 规则 | 在 `.cursor/` 增补或更新 MDC；共用事实写入 `AGENTS.md` 等普通权威文件 | 删除 `.codex/` 规则、Agent 或授权文件 |
| 新增 Codex 授权/Agent | 在 `.codex/` 增补或更新；共用事实仍写普通权威文件 | 删除 `.cursor/` 规则或命令以“避免重复” |
| 调整共用工作流 | 先改唯一权威源（`AGENTS.md`、`docs/系统说明/`、Skill 等），再分别更新两侧必要适配 | 只改一侧适配并删掉另一侧 |
| 废弃某侧能力 | 在权威文档标记 deprecated，再分别退役该侧文件 | 用另一侧目录覆盖或清空 |

共用事实只维护一次；工具差异只留在各自适配层。若两侧都需要同一段**大段**配置，走「普通源文件 + 生成/校验脚本」路径，仍不得删除任一工具目录。

## Cursor 规则分层

`.cursor/rules/00-project-entry.mdc` 是唯一 Always 规则，只指出共同入口 `AGENTS.md`、装载策略 `project-navigation/context-policy.json`，以及专属适配边界。其余规则按文件路径自动附加：

| 规则 | 作用范围 | 职责 |
| --- | --- | --- |
| `game-architecture.mdc` | `src/game/**` | 指向游戏目录职责与可玩性边界。 |
| `content-authoring.mdc` | `src/game/data/**` | 指向内容 Skill、两类内容库与审批边界。 |
| `documentation-governance.mdc` | `docs/**` | 指向单一事实源、治理与历史分层。 |
| `verification-and-git.mdc` | 手动调用 | 提醒最小验证、Git、上下文解析和发布边界。 |

规则只保留触发条件、局部约束与权威路径，不复制 `AGENTS.md`、Skill 或系统说明的完整正文。新增 Cursor 规则应优先扩充既有作用域；只有确有独立、稳定且可按路径界定的职责时才新建文件。

## 共享与派生配置

优先级固定如下：

1. 两端直接读取同一普通权威文件。
2. 工具适配文件只引用权威路径，不复制正文。
3. 只对工具语法不可避免的短内容进行局部重复，例如 MDC front matter 或 Codex TOML 字段。

禁止为 `.cursor/` 与 `.codex/` 使用符号链接、目录联接或硬链接。它们的职责和语法不同，且 Windows 与 Git 的链接支持会增加协作者成本。

## 审批与平台边界

项目内命令授权（`.codex/rules`、`.codex/approval-decisions.json`）与 Cursor 平台智能审批是**两层**，互不替代。登记项目 allow 不能假定 Cursor 侧零弹窗。

用户已明确表示「无须重复审批」或已批准同类操作时，Agent 在同一任务内应：

1. 合并本地审查、暂存与提交，**一次**执行目标 `git push`，不为 record/commit/push 逐步重复触发同类平台审批。
2. 不因同一命令被拦而连续多次重试 Smart Mode 审批；若平台仍拦截，告知用户一次并给出可手动执行的命令。
3. 优先完成共用权威文件的修改，再分别更新 `.codex/` 与 `.cursor/` 必要适配，避免为单侧改动删除另一侧文件。

如果未来出现**大段且必须派生到两个工具的配置**，在创建或复制前必须主动提示用户：应指定一个普通、版本控制的源文件，再由仓库内生成脚本产出双端适配文件，并提供校验脚本或 CI/显式检查防止漂移。生成物必须标明“请勿手改”。未获用户确认，不新增这类生成链、双端大段副本或链接。

## 维护与验证

本契约的长期规则由 `liluo-project-governance-memory` 管理，设计理由见 `ADR-010`。新增或改变共享事实源、工具目录职责、派生配置策略时，同步更新本说明、`AGENTS.md`、相关 Cursor/Codex 适配、治理注册表、ADR 与项目索引；若改变用户可重复调用的工作流，再更新用户命令目录。

本次仅建立 Cursor 规则层；`.cursor/commands/` 和 `.cursor/BUGBOT.md` 在出现明确的重复工作流或审查需要前不创建。
