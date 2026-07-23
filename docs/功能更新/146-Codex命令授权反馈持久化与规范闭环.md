# 146-Codex 命令授权反馈、持久化与规范闭环

- 创建日期：2026-07-22
- 更新日期：2026-07-22（建立项目命令规则、决定注册、TUI 审计与回归验证）
- 更新日期：2026-07-23（补齐常规命令覆盖，新增受限聚合入口与客户端精确前缀）
- 当前状态：已完成自动化、execpolicy 与当前客户端精确前缀沙箱外回归

## 本次实现

建立“用户授权决定 → 安全审查 → 项目规则 → 文档摘要 → 回归测试”闭环，区分单次、会话、项目长期和用户全局范围。明确的项目长期 allow/prompt/forbidden 可在同一任务自动同步；模糊范围、危险 allow、过宽解释器和复杂 shell 会停止或降为更严格决策。

新增项目 `.codex/rules/`、批准决定注册表、命令授权治理 Skill 与确定性脚本。TUI 审计只读用户级 `.rules`，以脱敏本机快照识别变化，不执行规则文件、不自动修改或删除用户配置。

2026-07-23 回放前一轮真实审批后确认：项目规则只覆盖少量检查，构建、索引写回、Node 测试子进程与 Skill 初始化没有稳定命中。为此新增 `project:routine` 五模式和受限 `project:skill:init`，同时登记项目 execpolicy 与客户端精确批准前缀。Agent 直接以沙箱外执行请求调用已批准入口，避免先在沙箱内触发子进程 `EPERM` 再重试；仍不放宽任意解释器、删除、网络、依赖、Git 写入和发布。

## 主要路径

- `.codex/rules/`
- `.codex/approval-decisions.json`
- `scripts/command-approval/`
- `scripts/project-routine.mjs`
- `scripts/init-project-skill.mjs`
- `.agents/skills/liluo-project/liluo-command-approval-governance/`
- `docs/系统说明/Codex命令授权治理系统.md`
- `docs/运行规范/Codex命令批准分级表.md`

## 关键边界

项目规则不等于 Full Access，也不替代平台沙箱、管理员强制规则或外部目录授权。Git 写入、网络、依赖、删除和发行默认保持 prompt；强制推送为 forbidden；宽泛 `npm`、`node`、PowerShell 等不会进入 allow。规则的 `match` / `not_match` 通过注释与真实 execpolicy 正反用例维护。

## 验证记录

- 授权分类、范围、过宽/危险规则、TUI 解析、快照差异和 supersede 单元测试通过。
- 当前 Codex `execpolicy check` 验证：文档编码检查 allow、普通 push prompt、force push forbidden、npm install prompt、外部 Skill fetch prompt。
- 2026-07-23：`project:routine` 与 `project:skill:init` 精确 allow；聚合模式、非法附加参数、Skill 名称/区域/资源限制和 Windows npm 子进程调用均有回归测试。
- 2026-07-23：当前客户端使用已批准 `project:routine` 前缀一次完成索引、治理/内容检查、测试和 Web 构建，过程未拆分为子命令审批；索引新源检测也已与实际索引器边界对齐。
- 治理、文档、编码、Skill、项目索引与 Web 构建结果见本次交付记录。
