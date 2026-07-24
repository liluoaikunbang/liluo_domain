# 146-Codex 命令授权反馈、持久化与规范闭环

- 创建日期：2026-07-22
- 更新日期：2026-07-22（建立项目命令规则、决定注册、TUI 审计与回归验证）
- 更新日期：2026-07-23（补齐常规命令覆盖，新增受限聚合入口与客户端精确前缀）
- 更新日期：2026-07-23（增加最小验证 profile、验证预算与一次成功执行规则）
- 更新日期：2026-07-23（将多 Skill 检查改为统一候选清单去重，纯正文与局部治理不再触发级联审计）
- 更新日期：2026-07-24（明确上传请求的任务授权边界，移除推送前默认远端预检）
- 更新日期：2026-07-24（将任务范围内的 Skill、Agent 与项目配置编辑纳入普通仓库写入，不再逐文件询问）
- 更新日期：2026-07-24（显式覆盖常用项目源目录，默认可写范围以源码、文档、脚本、测试与配置为主，仅保留敏感或生成路径受限）
- 当前状态：已完成自动化、execpolicy 与当前客户端精确前缀沙箱外回归
- 当前摘要：建立四级授权与精确规则，并以非叠加验证预算、固定最小 profile 和受限聚合入口减少重复检查、无信息 RED 与沙箱失败重试。

## 本次实现

建立“用户授权决定 → 安全审查 → 项目规则 → 文档摘要 → 回归测试”闭环，区分单次、会话、项目长期和用户全局范围。明确的项目长期 allow/prompt/forbidden 可在同一任务自动同步；模糊范围、危险 allow、过宽解释器和复杂 shell 会停止或降为更严格决策。

新增项目 `.codex/rules/`、批准决定注册表、命令授权治理 Skill 与确定性脚本。TUI 审计只读用户级 `.rules`，以脱敏本机快照识别变化，不执行规则文件、不自动修改或删除用户配置。

2026-07-23 回放前一轮真实审批后确认：项目规则只覆盖少量检查，构建、索引写回、Node 测试子进程与 Skill 初始化没有稳定命中。为此新增 `project:routine` 五模式和受限 `project:skill:init`，同时登记项目 execpolicy 与客户端精确批准前缀。Agent 直接以沙箱外执行请求调用已批准入口，避免先在沙箱内触发子进程 `EPERM` 再重试；仍不放宽任意解释器、删除、网络、依赖、Git 写入和发布。

同日根据真实 token 与命令回放进一步收窄流程：严格 RED 只用于回归缺陷、行为不明和高风险逻辑；普通任务默认一项目标验证和至多一项相关综合验证。`project:routine` 新增 `docs`、`workflow`、`team-presence`、`natural-expression` 固定 profile，避免小改动被迫运行无关测试、完整构建或已知无关旧问题的审计。

后续真实写作校准发现，多个 Skill 即使各自只要求少量检查，机械相加后仍会形成 frontmatter、内容、手记、文档、治理与索引的级联验证。现在所有检查先合并去重，再按真实变化面选择一个目标检查；只有另一项覆盖不同实质风险且会影响完成结论时才增加综合检查。纯正文和局部治理分别跳过不相关的结构审计与历史全量审计。

2026-07-24 根据真实上传回放继续收敛：用户明确要求“提交并上传 GitHub”时，该请求已确认本次任务范围内的提交与目标推送意图。完成本地审查后直接执行一次目标 `git push`，不再默认运行 `git ls-remote`、fetch 或等价远端预检；非快进、认证或分支保护问题由推送自身安全失败。平台对外部写入仍可能要求最终确认，项目规则不将其静默升级为永久 Git 或网络 allow。

同日进一步定位到默认 `workspace-write` 会把仓库内 `.agents` 与 `.codex` 递归保护为只读，导致修改项目 Skill、Agent 或配置时再次触发权限确认。项目现通过 `.codex/config.toml` 使用精确的 `liluo-project-edit` permission profile：继承官方 `:workspace` 基线，仅覆盖 `.agents` 与 `.codex` 为可写，继续保留 `.git` 等内置保护并关闭网络。Agent 规则同步明确：实现、修改、修复、重构或同步请求本身已经授权任务范围内普通编辑，不得逐文件再问。

同日根据文档同步中的真实反馈，把权限表达从“继承工作区后补几个目录”改为“常用项目源目录显式可写”。`liluo-project-edit` 现在覆盖源码、文档、脚本、测试、规范、项目配置、Skill、Agent 与 GitHub 工作流；生成物、依赖、本机快照、Git 元数据、网络、删除、发布和项目外文件继续受限。这不能覆盖宿主或管理员的更严格限制。

## 主要路径

- `.codex/rules/`
- `.codex/config.toml`
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
- 2026-07-23：新增四个最小 profile；固定模式与非法附加参数由聚合入口测试覆盖，普通任务不再默认运行 `all`。
- 治理、文档、编码、Skill、项目索引与 Web 构建结果见本次交付记录。
