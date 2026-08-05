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

常规工作不再直接散发大量 `node --test`、Python、PowerShell 和索引命令，而使用经过参数约束和回归测试的项目入口：

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

npm run project:gate:explain
npm run project:gate:changed
npm run project:gate:prepush
npm run project:gate:ci
npm run project:hooks:test
```

`project:routine` 只接受固定 profile，拒绝附加参数和任意命令。`docs` 只检查文档编码、治理注册表、设计记忆与用户命令；`workflow` 只验证聚合入口和授权边界；`team-presence` 只运行创作组目标测试与手记验证；`natural-expression` 只运行自然表达目标测试。`check`、`test`、`build`、`index`、`all` 保留给确实跨域或完整交付的任务，`all` 不得作为普通结束门禁。`check` 不再包含 `commands:approval:validate`；该校验仅在命令授权文件或其专属测试实际变化时由质量门禁加入。`project:skill:init` 只包装官方 `skill-creator`。质量门禁入口只运行仓库内确定性检查，不运行 live eval、提交或发布，因此以各自完整 npm script 名称精确登记为项目 allow；`project:hooks:install` 会写入 `.git/config`，仍保持 prompt。

这些精确前缀登记在项目规则中；客户端已存在同一精确批准前缀时，可以减少实际弹窗。Agent 调用会派生子进程、写入忽略报告或构建产物的聚合入口时，应首次直接申请沙箱外执行，避免先在已知受限的沙箱内触发 `EPERM`。这里批准的是固定 npm script，不是宽泛的 `npm`、`node`、Python 或 PowerShell。

对“会稳定写回受管报告文件”的已知项目脚本，也按同一原则处理：如果当前环境已经多次证明其在沙箱内会因写入 `docs/assets/registry/*.json` 一类输出而返回 `EPERM`，首轮就走精确的沙箱外路线，不先制造一次失败再重试。当前已确认属于此类的命令包括：

- `npm run assets:runtime:report`
- `npm run assets:runtime:private:audit -- --write-report`
- `npm run site:visual:audit`

项目规则仍不能取消管理员强制策略，也不能自动修改用户级规则。精确入口只消除重复的项目决策，不保证所有客户端都免除平台审批。

## 低绕圈执行路线

| 动作 | 首次路线 | 原因 |
| --- | --- | --- |
| 手工维护的 authority / 直接消费者文档 | 直接 `apply_patch`，不逐文件询问 | 请求已授权任务范围内的普通编辑；包括 `.agents/**`、`.codex/agents/**`、项目 Skill、Agent、规则、配置与局部说明文档 |
| `project:routine`、质量门禁与 Hook 测试 | 精确 npm 前缀直接申请沙箱外执行 | 会派生子进程或写入忽略报告；项目决定已是 allow |
| 会重写 `docs/assets/registry/*.json` 的正式报告命令 | 首次就走精确沙箱外执行 | 当前 Windows 受限环境下已多次证实会因报告文件写入返回 `EPERM`，不先试跑一次失败 |
| 生成型写回（审计报告、注册表、索引、批量摘要、manifest） | authority 与直接消费者稳定后，末尾只运行一次正式生成器 | 这类输出不是手工正文；穿插执行会把一次同步拆成多轮 `EPERM`、重跑和重复输出 |
| `project-index/**`、报告、构建产物 | 正式生成器或构建脚本 | 禁止手工 patch 生成结果 |
| `.git` 元数据写入 | 精确 Git 命令保持 prompt，并首次走沙箱外 | `.git` 在受限环境中不可写，先试跑只会制造 `index.lock` 失败 |
| 用户已确认的正式删除 | 先校验绝对路径与删除范围，再走精确沙箱外删除 | 删除仍受平台边界保护，不能因“已知会被拦”就静默绕过用户确认 |
| 用户明确要求提交并上传 | 本地审查、暂存和提交后直接执行一次目标 `git push` | 用户请求已确认任务意图；不再用 `git ls-remote`、fetch 等额外网络预检把一次上传拆成多次确认 |
| 其他网络、依赖、删除、发布 | 精确命令保持 prompt | 需要逐次核对目标和外部副作用 |

### 文档写回先分道

所有文档类型都按同一规则处理，不只 authority 如此：

- `authority`：唯一权威源或手工维护正文，直接 patch。
- 直接消费者：技能说明、用户入口、局部摘要等仍由人维护的同步文档，跟在 authority 后直接 patch。
- 生成型写回：审计、注册表、索引、批量摘要、manifest 等派生物，不手改；等前两类稳定后末尾只跑一次正式生成器。

一项任务同时涉及三类时，固定顺序是 `authority -> 直接消费者 -> 生成型写回`。不要在 authority 刚改完时立刻穿插生成器，否则同一轮任务很容易演化成“先沙箱失败一次、再解释报错、再重跑、再补同步”的绕圈链。

不要把 Git 写命令和无关只读检查拼成一条复合 shell；这会让审批目标变得含混。明确的“提交并上传 GitHub”只授权该任务范围内的提交与目标推送，不扩大为永久 Git 或网络 allow。默认不在推送前运行 `git ls-remote`、fetch 或等价远端读取；非快进、认证和远端保护问题由 `git push` 自身安全失败并返回。`git push` 已明确返回成功时，不再为了“再确认一次”重复联网；只有输出缺失或含混时，才做一次沙箱外只读远端复查。

当某条外部 HTTPS / API 路径在 Node、CLI 或项目脚本里表现为 `fetch failed`、`UND_ERR_CONNECT_TIMEOUT`、长时间无响应，或其他明显偏向“链路没打通”而非 HTTP 状态码的错误时，优先把问题归类为“出网路径排查”，而不是立刻假定为密钥、提示词、业务参数或服务端语义错误。若本机已经运行智能模式代理、VPN 或其他网络出口，Agent 应先向用户说明可以尝试“本机 loopback 代理入口 + 必要时 IPv4 优先”的低成本诊断路线，并询问用户是否要试；只有用户同意后，才修改本地代理相关配置或重启到带代理 / DNS 选项的运行方式。除非某个工作流已经把代理入口限制为 `127.0.0.1`、`localhost` 或 `::1` 这类 loopback 地址并在其权威文档中明确记录，否则不要把凭据、提示词或其他敏感请求内容直接转发到任意未知远端代理。

## 选择 profile，而不是叠加命令

- 优先选择最小 profile；一项 profile 已覆盖的子命令不再单独执行。
- 已知会写回报告、索引或构建输出的正式生成命令，若当前环境已有稳定 `EPERM` 回放，首轮直接走正确权限路线，不在沙箱内收集一次可预见失败。
- 文档任务先判断是 `authority`、直接消费者还是生成型写回；前两类不为“求稳”提前插入审计或生成器。
- 文档或 Skill 规则变化默认不运行 Web 构建。
- 未修改 roster 时不运行名单验证；未修改游戏内容时不运行内容总检。
- 只有相关文件在验证后再次变化，才重跑对应 profile。
- 已知存在无关历史问题的全量 audit 不作为普通任务结束步骤。
- 严格 RED 只服务真实缺陷复现、行为不明或高风险逻辑；小型确定性新增不进行故意失败的预跑。

目录和文本文件的普通创建/修改优先使用受控文件补丁；“Skill/Agent/规则/配置文件”不是单独的审批类别，用户已经要求相关实现或升级时直接修改任务范围内文件，不按路径逐项征求许可。项目采用 `.codex/config.toml` 中的 `liluo-project-edit` 权限档案：继承官方 `:workspace` 基线，并显式允许常用项目源目录 `.github`、`.githooks`、`.agents`、`.codex`、`docs`、`evals`、`planning`、`public`、`schemas`、`scripts` 与 `src` 写入，避免文档、Skill、Agent、代码、测试与项目配置被逐文件重复确认。生成物、依赖、本机规则快照和 Git 元数据不因此获得直接编辑权限；`.git` 等内置保护保持不变，网络保持关闭。宿主或管理员的更严格策略仍可能覆盖项目配置，且配置变更通常需要新会话加载。不为 `New-Item`、任意 `node`、任意 Python 或 PowerShell 建立宽泛 allow。网络、依赖、Git 写入、删除、发布和项目外写入继续逐次审批。

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
