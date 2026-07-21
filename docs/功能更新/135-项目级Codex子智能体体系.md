# 项目级 Codex 子智能体体系

创建时间：2026-07-21

当前摘要：创建五个专业 Agent，建立只读调查、主 Codex 统一写入与受控验证模式，并保留供应商中立的迁移能力。

## 更新时间记录

- 2026-07-21：创建五个项目级专业 Agent、六份供应商中立说明，建立只读调查、主 Codex 统一写入、受控验证的协作模式，并为适用的项目 Skills 增加按需委派路由。

## 实现思路

项目知识、工作流和确定性验证继续保存在 `AGENTS.md`、Skills、文档、schema、脚本和测试中；`.codex/` 只承担当前工具的 Agent 名称、触发描述、权限与角色映射。四个调查/审查 Agent 为只读，验证 Agent 仅允许测试命令需要的临时输出，正式文件默认由主 Codex 单点写入。

## 相关路径

- `.codex/config.toml`
- `.codex/agents/`
- `docs/智能体说明/`
- `.agents/skills/liluo-project/`
- `AGENTS.md`

## 安全与迁移

本次没有引入外部 API、MCP、Agents SDK、后台服务或运行时智能体。通用角色合同采用供应商中立写法，未来迁移时只需转换 `.codex/` 适配配置，其余项目资产可直接复用。

## 验证

- 使用 Python 标准库 `tomllib` 解析项目配置与五个 Agent TOML。
- 检查名称唯一性、文件名、权限、必填字段、ASCII nickname、禁用配置和路径引用。
- 运行项目 Skill 验证、文档同步审计、更新记录测试、UTF-8 检查与 `git diff --check`。
