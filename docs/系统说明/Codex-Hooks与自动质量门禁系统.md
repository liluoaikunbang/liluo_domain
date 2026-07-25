# Codex Hooks 与自动质量门禁系统

本系统是仓库内确定性质量检查的统一入口。它把 Codex 生命周期轻量拦截、本地推送前门禁和 GitHub Actions 持续集成接到同一套改动分类、计划生成与报告逻辑上；完整规则以本文为权威来源。

## 三层门禁

| 层级 | 入口 | 作用 | 明确不做 |
| --- | --- | --- | --- |
| Codex Hook | `.codex/hooks.json` | 工具调用前拦截明确危险操作 | 不扫描提示词、不在任务停止时运行门禁、不复制 Skill 或业务验证 |
| 本地 pre-push | `.githooks/pre-push` | 按准备推送的提交范围运行必要检查、测试与构建；ERROR 阻止推送 | 不安装依赖，不改文件，不上传内容 |
| GitHub Actions | `.github/workflows/quality-gate.yml` | 在 Windows、Node 22 和干净 checkout 上运行全部确定性基础合同 | 不运行 live eval、Playwright、离线打包或 Release |

GitHub Actions 只能检查已经推送的提交；真正能在推送发生前阻断的是本地 pre-push。仓库文件不能自行开启远端分支保护，建议在 GitHub 网页把 `Quality Gate` 设置为 `main` 的 required status check。

## 改动分类与命令选择

`scripts/quality-gate/classify-changes.mjs` 接收 Git 文件列表，稳定输出 `domains`、`files`、`requires` 和 `warnings`。一个文件可以进入多个领域；`build-gate-plan.mjs` 合并所需命令后按固定顺序去重。

| 领域 | 典型范围 | 最小验证 |
| --- | --- | --- |
| `docs` | README、AGENTS、`docs/**` | 文档编码；治理目录、注册表、用户命令或功能记录变化时追加相应治理检查 |
| `skills-agents-governance` | `.agents/**`、Agent、Codex rules、批准注册表与授权治理脚本 | `evals:check`；授权治理改动追加自身 test/validate，不自动运行 live eval |
| `schemas-data` | `schemas/**`、游戏 JSON/YAML | 数据契约；游戏内容数据再进入项目 check |
| `story` | 故事源、Markdown 与注册表 | 数据契约、项目 check、索引增量与验证 |
| `maps-events-dialogues` | 地图、事件、对话、互动小说与注册表 | 数据契约、项目 check、索引增量与验证 |
| `saves` | 存档代码、版本、迁移、导入导出与 Schema | 数据契约与现有项目测试 |
| `runtime` | `src/game/**` 运行时代码 | 项目 check 与 tests；构建面仅在 pre-push/CI 追加 Web build |
| `assets` | `src/assets/game/**` | 现有素材审计、索引增量与验证 |
| `build-config` | package、Vite、TS、`.gitignore`、GitHub workflow 与门禁自身 | 项目 check、tests 与 Web build；Hook 模式始终移除 build |
| `index-source` | 被项目索引消费的权威源 | 作为索引影响标记，由具体内容领域决定最小索引命令 |

多领域命令顺序是：静态结构与注册表、数据契约、文档编码、内容和代码 check、tests、索引增量与验证、build。同一命令每次计划只出现一次，不默认运行 `project:routine -- all`。

“工作流治理测试”与“命令授权治理”是两个独立范围。只有 `scripts/command-approval/**`、批准注册表/规则及其专属测试变化时，才运行 `commands:approval:test` 与 `commands:approval:validate`；普通 `project-routine`、Skill、文档或质量门禁测试不能被误归类为命令授权变更，更不能因此要求在 Node 子进程中二次启动 Codex。

## 模式与报告

- `changed`：开发者手动检查当前工作区，输出完整报告。
- `prepush`：优先读取 Git pre-push 标准输入中的本地/远端引用；手动运行时检查当前工作区。
- `ci`：不依赖改动分类裁剪，运行确定性基础合同、静态能力完整性、项目 check/tests、文档编码、索引验证与 Web build。

每次运行覆盖生成 `reports/quality-gate/latest.json` 和 `latest.md`。报告目录被 Git 忽略，只保留 `.gitkeep`。报告记录模式、Git 范围、领域、命令、跳过原因、ERROR、WARNING、耗时和最终状态，不记录提示词、密钥、认证文件、真实存档或构建包。

- `ERROR`：验证失败或门禁自身异常；命令返回非零，pre-push/CI 阻断。
- `WARNING`：范围无法完全分类或存在非阻断问题；报告但默认不阻断。
- `INFO`：执行范围、计数和耗时等记录。

## Codex Hooks 策略

### 生命周期性能边界（强制）

提示提交、工具调用和任务停止等 Codex 生命周期 Hook 处在用户交互关键路径。它们只能依据当前 Hook 输入进行确定性、常数时间的策略判断；不得遍历工作区、读取 Git 改动范围、运行质量门禁、构建、索引、测试、联网或等待其他长任务。项目不得注册 `Stop` Hook，也不得借 `UserPromptSubmit`、`PreToolUse` 或未来生命周期事件变相执行这些工作。

需要仓库范围判断或可能耗时的验证，必须由用户或 Agent 显式运行 `project:gate:*`，或由本地 pre-push、GitHub Actions 执行。新增生命周期 Hook 前，必须在 `project:hooks:test` 中证明其配置未扩大交互关键路径；此边界的理由与重新评估条件见 [ADR-008](../设计记忆/架构决策/ADR-008-交互生命周期Hook与质量门禁分离.md)。

`PreToolUse` 分别匹配 `Bash`、`apply_patch`、`Edit` 和 `Write`。Shell 侧只拦截明确危险的整仓丢弃、强制清理、强制推送、仓库根目录或关键目录递归删除、直接改写 `.git/`、读取认证文件、输出密钥变量，以及把 `.env` 或认证文件加入 Git。普通单文件 `git restore` 和明确临时测试目录删除允许继续。

直接编辑侧保护 `.git/**`、`node_modules/**`、`dist/**`、`reports/**`、`.env`、本地认证、真实存档导出和 `project-index/**` 生成结果。`.env.example`、测试假密钥 fixture 和正式索引生成命令仍允许。提示词不再由项目 Hook 扫描，任务结束也不再自动运行质量门禁；完整检查只通过显式的 `project:gate:*` 或本地 pre-push 执行。Hooks 是额外防护层，不替代平台沙箱、审批系统或现有 `.codex/rules`，也不声称绝对安全。

### 工作区性能边界

`.vscode/settings.json` 只对本项目的 VS Code 文件监听和全文搜索排除 `node_modules`、Git 元数据、构建/发行包、报告及其他本地生成目录；不排除 `src/assets`、正式内容或权威文档。它不改变 Git 跟踪、Codex 的文件权限、质量门禁或构建输入，只避免编辑器在提交和会话切换时为无关生成物建立观察与搜索索引。

## 常用命令

```powershell
npm run project:hooks:install
npm run project:hooks:test
npm run project:gate:explain
npm run project:gate:changed
npm run project:gate:prepush
npm run project:gate:ci
```

安装命令只在当前仓库设置 `core.hooksPath=.githooks`，不修改用户级 Git 配置。可用 `git config --local --get core.hooksPath` 核验。

`project:gate:changed|prepush|ci|explain` 与 `project:hooks:test` 已按完整 npm script 名称登记为项目长期 allow；它们只执行确定性检查。由于运行时会派生子进程或写入被忽略的报告，Agent 应首次就按精确前缀走沙箱外执行，不先制造可预见的权限失败。`project:hooks:install` 会写 `.git/config`，因此仍逐次审批。

Git 原生 `git push --no-verify` 可以临时绕过本地 pre-push，但只应在已经明确知道失败原因、愿意承担推送后由 CI 继续阻断的情况下使用；它不会绕过 GitHub Actions 或分支保护。

CI 不运行 live Codex eval，因为普通 GitHub runner 没有也不应保存个人 Codex 登录态或 OpenAI API key，模型结果也不是这层确定性基础门禁的一部分。live smoke/full 继续保留为明确手动工作流。
