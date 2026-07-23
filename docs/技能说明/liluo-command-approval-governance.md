# liluo-command-approval-governance

## 用途与入口

用于区分单次、会话、项目长期和用户全局授权，把明确的项目长期决定安全写入精确规则、决定注册表与人类摘要，并审计 Codex TUI “始终允许”产生的用户级规则变化。

- Skill：`.agents/skills/liluo-project/liluo-command-approval-governance/`
- 执行规则：`.codex/rules/*.rules`
- 决定注册表：`.codex/approval-decisions.json`
- 系统说明：`docs/系统说明/Codex命令授权治理系统.md`
- 摘要：`docs/运行规范/Codex命令批准分级表.md`
- 脚本：`scripts/command-approval/command-approval.mjs`

## 触发与边界

用户说“这个项目以后都允许”“每次都问”“以后禁止”“撤销长期允许”“检查刚才始终允许的规则”“检查过宽规则”时触发。单次或当前会话授权不持久化；全局规则只生成审查建议，除非用户另行明确授权修改项目外的用户配置。

`allow` 仅接受精确、稳定、低风险的项目 npm script。网络、Git 写入、依赖、删除、上传、发行、项目外目录、凭据、未知二进制、解释器和复杂 shell 保持 `prompt` / `forbidden`。Skill 不改变平台沙箱、管理员策略或更严格规则。

常规执行入口优先收敛为 `npm run project:routine -- check|test|build|index|all`；项目 Skill 脚手架优先使用 `npm run project:skill:init -- ...`。两者有固定动作/参数白名单和正反测试，不等同于允许宽泛解释器。调用方应直接以沙箱外执行请求使用这两个已长期批准的精确前缀，避免先失败再重试。

## 流程与数据

解析决定与范围 → 检查敏感信息和过宽前缀 → 与现有严格规则比较 → 更新 managed 项目规则 → upsert/supersede 注册表 → 重生成批准分级表 → 单元测试 → `codex execpolicy check` 正反命中。

TUI 审计使用受限字面解析器，不执行 `.rules` 内容。快照只保存指纹、脱敏 pattern、decision、分类和处理状态，默认位于已忽略的 `.local/codex-user-rules-snapshot.json`；首次审计仅建立基线，除非明确要求报告既有规则。

## 输入输出与命令

- 输入：自然语言决定、精确命令 pattern、理由、命令类别；审计时输入用户规则文件路径。
- 输出：授权分类、项目规则、决定历史、生成摘要、TUI 新增/删除分类和 execpolicy 验证结果。

```powershell
npm run commands:approval:classify -- --text "这个项目以后允许" --command "npm run docs:check-encoding"
npm run commands:approval:record -- --scope project --decision allow --command "npm run docs:check-encoding" --reason "项目内只读检查"
npm run commands:approval:retire -- --scope project --command "npm run docs:check-encoding" --reason "用户撤销长期决定"
npm run commands:approval:audit -- --input "$env:USERPROFILE\.codex\rules\default.rules"
npm run commands:approval:list
npm run commands:approval:test
npm run commands:approval:validate
```

撤销长期 allow 时对同一 pattern 登记 `prompt` 或 `forbidden`，旧条目标为 `superseded`，不删除历史。用户级原规则的删除始终是单独的待授权动作。

## 相邻职责

本 Skill 管单条授权决定与规则维护；整体权限模式、项目/全局边界、网络默认值或 Git 策略变化交 `liluo-project-governance-memory` 并检查 ADR；功能文档和索引同步交各自维护 Skill。
