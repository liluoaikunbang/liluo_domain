# Codex 命令批准分级表

本表是 `.codex/rules/*.rules` 与 `.codex/approval-decisions.json` 的人类可读摘要；规则文件是执行权威，注册表负责决定历史。本表不授予平台权限。

## 分级原则

- `allow`：仅用于精确、稳定、低风险的项目命令。
- `prompt`：网络、Git 写入、依赖、删除、发布、项目外访问和其他有副作用操作。
- `forbidden`：项目默认禁止的明显危险形式；用户若要改变，必须明确修改长期规范。
- 单次和当前会话允许不进入本表。用户级规则不会由项目脚本自动修改或删除。

## 当前有效决定

<!-- BEGIN GENERATED APPROVAL DECISIONS -->
| 精确前缀 | 决策 | 范围 | 类别 | 理由 |
| --- | --- | --- | --- | --- |
| `npm run project:hooks:install` | prompt | project | git-protection | 安装本地 Hook 会写入当前仓库 .git/config，必须保留精确审批 |
| `npm run project:gate:explain` | allow | project | project-quality-gate | 固定质量门禁入口仅执行仓库内确定性检查；参数由项目脚本约束，不运行 live eval，不提交或发布 |
| `npm run project:hooks:test` | allow | project | project-quality-gate | 固定质量门禁入口仅执行仓库内确定性检查；参数由项目脚本约束，不运行 live eval，不提交或发布 |
| `npm run project:routine` | allow | project | project-routine | 受测试的固定项目检查、测试、构建与索引模式，拒绝任意附加命令 |
| `npm run project:skill:init` | allow | project | project-skill-scaffold | 受限包装官方 skill-creator，仅允许 liluo 项目 Skill 名称、固定区域与资源类型 |
| `npm run project:gate:prepush` | allow | project | project-quality-gate | 固定质量门禁入口仅执行仓库内确定性检查；参数由项目脚本约束，不运行 live eval，不提交或发布 |
| `npm run project:gate:changed` | allow | project | project-quality-gate | 固定质量门禁入口仅执行仓库内确定性检查；参数由项目脚本约束，不运行 live eval，不提交或发布 |
| `npm install` | prompt | project | dependency-and-network | 依赖与供应链变更继续逐次审批 |
| `npm run project:gate:ci` | allow | project | project-quality-gate | 固定质量门禁入口仅执行仓库内确定性检查；参数由项目脚本约束，不运行 live eval，不提交或发布 |
| `git push --force` | forbidden | project | git-protection | 项目默认禁止强制推送 |
| `git push` | prompt | project | git-protection | Git 远端写入继续逐次审批，不从一次允许升级 |
| `npm run docs:check-encoding` | allow | project | project-validation | 项目内只读编码检查，属于可重复低风险验证 |
<!-- END GENERATED APPROVAL DECISIONS -->

## 典型替代方式

- 宽泛 `npm run` 改为具体 `npm run <script>`。
- 任意 `node` / `python` / PowerShell 脚本保持审批；稳定项目动作优先包装成受测试的 npm script。
- 删除先做只读范围检查；Git 写入、网络和发布保持审批。

完整边界与维护流程见 [Codex 命令授权治理系统](../系统说明/Codex命令授权治理系统.md)。
