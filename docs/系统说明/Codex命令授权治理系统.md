# Codex 命令授权治理系统

## 目标

在“璃落的城堡”仓库内建立“用户授权决定 → 安全审查 → 项目规则 → 文档摘要 → 回归测试”的闭环。系统减少同一低风险项目命令的重复询问，但不绕过 Codex 平台沙箱、管理员策略或用户对高风险操作的最终批准权。

## 权威与目录

- 执行规则：`.codex/rules/*.rules`，是项目内命令决策的唯一执行权威。
- 决定追踪：`.codex/approval-decisions.json`，只记录脱敏后的长期决定、来源、状态和规则位置，不直接执行命令。
- 人类说明：`docs/运行规范/Codex命令批准分级表.md`，由注册表生成的摘要区块与人工维护的边界说明组成。
- 自动化：`scripts/command-approval/`，负责保守分类、审计、登记、摘要与验证。
- 本机快照：`.local/codex-user-rules-snapshot.json`，只保存规则指纹和脱敏分类，不提交 Git。

项目规则不能保证替代客户端或管理员的批准机制。若当前 Codex 客户端只自动加载用户级规则，项目规则仍是仓库权威来源，必须通过 `codex execpolicy check` 验证；迁移到用户级必须由用户明确授权。

## 减少沙箱循环的稳定入口

常规工作不再直接散发大量 `node --test`、Python、PowerShell 和索引命令，而使用两个经过参数约束和回归测试的项目入口：

```powershell
npm run project:routine -- check
npm run project:routine -- test
npm run project:routine -- build
npm run project:routine -- index
npm run project:routine -- all
npm run project:routine -- docs
npm run project:routine -- workflow
npm run project:routine -- team-presence
npm run project:routine -- natural-expression

npm run project:skill:init -- --name liluo-example --area liluo-project --resources references,scripts
```

`project:routine` 只接受固定 profile，拒绝附加参数和任意命令。`docs` 只检查文档编码、治理注册表、设计记忆与用户命令；`workflow` 只验证聚合入口和授权边界；`team-presence` 只运行创作组目标测试与手记验证；`natural-expression` 只运行自然表达目标测试。`check`、`test`、`build`、`index`、`all` 保留给确实跨域或完整交付的任务，`all` 不得作为普通结束门禁。`project:skill:init` 只包装官方 `skill-creator`，名称必须为 `liluo-*`，目标只允许 `.agents/skills/liluo-project|writing|testing`，资源只允许 `references`、`scripts`、`assets`。

这两个精确前缀同时登记在项目规则和 Codex 客户端长期批准中。Agent 调用时应直接请求沙箱外执行已批准入口：这样内部 `codex execpolicy`、测试、构建及 `.agents` 写入不会先在沙箱内触发 `EPERM`，匹配已批准前缀时也不会再次逐条询问。这里批准的是固定 npm script，不是宽泛的 `npm`、`node`、Python 或 PowerShell。

这两个精确前缀同时进入项目 execpolicy 与当前客户端批准前缀。前者负责仓库长期规则，后者减少当前平台实际弹窗。项目规则仍不能取消管理员强制策略；但常规测试子进程和 `.agents` 脚手架不再需要每个文件、每条解释器命令单独批准。已知会创建子进程或写入受限目录的固定 profile 必须直接申请沙箱外执行；禁止先在沙箱内试跑、等待可预见的 `EPERM` 后再重试。

## 选择 profile，而不是叠加命令

- 优先选择最小 profile；一项 profile 已覆盖的子命令不再单独执行。
- 文档或 Skill 规则变化默认不运行 Web 构建。
- 未修改 roster 时不运行名单验证；未修改游戏内容时不运行内容总检。
- 只有相关文件在验证后再次变化，才重跑对应 profile。
- 已知存在无关历史问题的全量 audit 不作为普通任务结束步骤。
- 严格 RED 只服务真实缺陷复现、行为不明或高风险逻辑；小型确定性新增不进行故意失败的预跑。

目录和文本文件的普通创建/修改优先使用受控文件补丁；不为 `New-Item`、任意 `node`、任意 Python 或 PowerShell 建立宽泛 allow。网络、依赖、Git 写入、删除、发布和项目外写入继续逐次审批。

## 授权等级

| 等级 | 持久化 | 行为 |
| --- | --- | --- |
| 单次允许 | 否 | 仅执行本次，不写规则、注册表或长期文档 |
| 当前会话允许 | 否 | 仅会话内有效，最多写本机临时观察记录 |
| 项目长期允许 | 是 | 写入精确项目规则、注册表、摘要并增加验证 |
| 用户全局允许 | 仅明确授权后 | 先提示作用范围；本项目工具不直接改用户级规则 |

“以后”但未说明项目或所有项目时视为范围不明；项目专用 npm script 即使措辞模糊，也只能建议项目级，不得推断为全局。

## 决策与安全边界

决策为 `allow`、`prompt`、`forbidden`。多条规则同时匹配时以 Codex 执行策略的最严格结果为准。

### 始终执行

- 将长期项目决定收敛为最小字面前缀。
- 每条关键规则记录 `justification`，并以相邻注释和测试声明 `match` / `not_match` 样例。
- 新规则运行 `codex execpolicy check` 的正反样例。
- 单次和会话授权不持久化。
- 不保存 token、密码、凭据、私有参数或完整敏感命令。

### 必须暂停或保持 prompt

- 网络、上传、Git 写入、依赖变更、正式文件删除、项目外写入、系统权限、凭据、未知二进制。
- 任意解释器或 shell wrapper、带变量/通配符/重定向的复杂 shell。
- 无法确定项目或全局范围、无法构造安全前缀、与既有 `forbidden` 或管理员规则冲突。
- `git push/commit/reset/clean/rebase`、`npm install/update`、`npx`、`curl/wget` 等不得自动转为永久 allow。

### 永不执行

- 不自动修改或删除 `~/.codex/rules/default.rules`。
- 不把 `npm`、`npm run`、`node`、`python`、`powershell`、`cmd`、`bash`、`git` 等宽前缀写成推荐 allow。
- 不因一次批准扩大到相邻命令，也不以项目规则覆盖更严格策略。

## 用户决定处理流程

1. 解析用户意图、决策和作用范围。
2. 单次/会话决定直接返回非持久化结果。
3. 长期决定检查敏感信息、危险类别、过宽前缀与已有更严格规则。
4. 项目级安全决定更新精确 `.rules`、批准注册表和文档摘要。
5. 全局决定只生成建议；修改用户级配置需另有明确授权。
6. 运行单元测试、注册表验证和 `codex execpolicy check`。

用户明确说“以后这个项目都允许”“每次都问”或“以后禁止”时，该表达本身已授权修改项目规范，不再追问是否写入。触及上述暂停条件时仍须停止并说明原因。

## TUI “始终允许”审计

审计命令只读指定的用户规则文件，用受限解析器提取 `prefix_rule` 的 pattern、decision 和指纹，与本机快照比较，再分类为 `project-specific`、`safe-global`、`overbroad`、`dangerous` 或 `unknown`。它不执行规则文件、不保存无关正文、不修改用户级规则。

项目专用新增规则会得到“收敛到项目级”的建议；过宽或危险规则只报告最小化建议。首次审计建立基线时默认不把全部旧规则报告为新增。

## 注册表生命周期

长期决定状态支持 `active`、`review-required`、`superseded`、`retired`、`rejected`。相同 pattern 与作用范围不会重复建项；改变决策时旧条目转为 `superseded`，新条目通过 `supersedes` 追踪。撤销 allow 时优先改为 `prompt` 或退休，不删除历史。

## 命令与测试

```powershell
npm run project:routine -- check
npm run project:routine -- test
npm run project:routine -- build
npm run project:routine -- index
npm run project:routine -- all
npm run project:routine -- docs
npm run project:routine -- workflow
npm run project:routine -- team-presence
npm run project:routine -- natural-expression
npm run project:skill:init -- --name liluo-example --area liluo-project --resources references,scripts
npm run commands:approval:classify -- --text "这个项目以后允许" --command "npm run docs:check-encoding"
npm run commands:approval:audit -- --input "$env:USERPROFILE\.codex\rules\default.rules"
npm run commands:approval:list
npm run commands:approval:validate
npm run commands:approval:test
```

登记命令只接受精确 token pattern（普通命令可用 `--command`，含空格 token 才使用 JSON `--pattern`）；全局规则、危险 allow、未知副作用和过宽 allow 会拒绝写入。测试使用 fixture，不读取或修改真实用户规则。

## 完成标准

- 四级授权、三种决策、范围不明和危险边界都有确定性测试。
- 项目规则、批准注册表、TUI 差异审计、撤销/supersede 和文档摘要可重复运行。
- 精确命令命中而相似/附加危险命令不误命中。
- 所有 `.rules` 均通过当前 `codex execpolicy check`。
- `project:routine` 与 `project:skill:init` 的允许规则、参数拒绝和 Windows npm 子进程调用通过回归测试。
- 系统不会自动改用户级规则，也不会把临时批准永久化。
