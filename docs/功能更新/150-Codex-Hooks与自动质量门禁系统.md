# 150-Codex Hooks 与自动质量门禁系统

- 更新日期：2026-07-23
- 更新日期：2026-07-24（拆分工作流治理与命令授权分类，避免无关 pre-push 校验二次启动 Codex）
- 更新日期：2026-07-25（移除会阻塞会话收尾的 Stop Hook，质量门禁改为显式或推送前执行）
- 更新日期：2026-07-25（取消剩余 PreToolUse，项目 Hook 配置改为空，避免生命周期集成链阻塞工具调用）
- 更新日期：2026-07-28（pre-commit 自动刷新并暂存项目索引；prepush 只校验不再 index:changed，消除“推送失败再补提交”绕圈）
- 当前摘要：项目不注册 Codex 生命周期 Hook；提交时自动刷新项目索引，推送门禁只校验；按改动范围去重的统一门禁、本地 pre-push 与 Windows GitHub Actions CI 继续以 ERROR 阻断、WARNING 报告和双格式运行报告收口确定性验证。

## 已实现

初始实现曾新增仓库级 `UserPromptSubmit`、`PreToolUse` 和 `Stop` Hooks；现已全部取消，`.codex/hooks.json` 保持空配置。新增 Git 改动分类、最小命令计划、跨平台命令执行与 JSON/Markdown 报告。质量门禁通过显式的 changed、prepush、ci 模式统一去重现有数据契约、能力静态评测、内容检查、测试、索引、素材审计与 Web 构建入口。

本地 `.githooks/pre-commit` 在暂存命中索引源时自动 `project:index:changed` 并 `git add project-index/`；`.githooks/pre-push` 只调用统一 prepush 门禁且不改文件。GitHub Actions 在 `windows-latest`、Node 22 与 `npm ci` 后只调用统一 CI 入口。live Codex eval、浏览器回归、离线打包、Release、自动修复、自动提交和推送均未接入。

## 安全与失败边界

项目不以生命周期 Hook 拦截危险命令或受保护路径，改由平台沙箱、项目批准规则和 `.codex/rules` 承担对应边界。提示词扫描、工具调用前策略和 Stop 自动门禁均已移除，避免它们在对话提交、工具调度或收尾阶段阻塞 Codex；需要完整检查时显式运行质量门禁，推送时由 pre-push 执行。

复现显示，`git status --short` 与 `PreToolUse` 策略脚本本体均约 150 ms 内完成，但经 Codex 工具层返回偶发耗时约 48–50 秒；因此不再把脚本本体快等同于生命周期集成安全。后续发现工具或命令明显异常耗时，必须告知用户观察结果、核查范围和是否已解决。

门禁自身异常按 ERROR 处理，WARNING 默认不阻断。运行报告进入被忽略的 `reports/quality-gate/`，不纳入版本控制。

## 主要路径

- `.codex/hooks.json`
- `.codex/hooks/`
- `scripts/quality-gate/`
- `.githooks/pre-commit`
- `.githooks/pre-push`
- `scripts/project-index/pre-commit-refresh-index.mjs`
- `scripts/project-index/lib/index-sources.mjs`
- `.github/workflows/quality-gate.yml`
- `docs/系统说明/Codex-Hooks与自动质量门禁系统.md`

## 2026-07-28 简化：索引刷新改到 pre-commit

原先 prepush 先跑 `index:check`、后才有 `index:changed`，且 push 无法把刷新写进正在推送的提交，导致固定“失败 → 手刷索引 → 再提交 → 再推送”。现改为：命中索引源的提交由 pre-commit 自动刷新并暂存；prepush/CI 只校验；手动 `gate:changed` 仍先刷后验。

## 2026-07-23 升级：授权与执行路线收敛

将 `project:gate:changed|prepush|ci|explain` 与 `project:hooks:test` 以完整 npm script 名称登记为项目长期 allow，同时保持 `project:hooks:install`、Git 写入、网络、依赖、删除和发布逐次审批。固定验证入口首次直接走精确的沙箱外路线，普通工作区文件继续使用受控补丁，不再先制造可预见的 `.git/index.lock`、子进程或网络沙箱失败。

改动分类器现将 `.gitignore` 识别为 `build-config`，避免实际推送成功但 pre-push 报告仍因仓库配置文件显示 WARNING。成功的 `git push` 输出作为完成证据，不再默认追加一次重复联网核验。

## 2026-07-24 修复：门禁分类不再扩大命令授权校验

`scripts/tests/project-routine-governance.test.mjs` 曾被错误归类为命令授权治理变化，使普通工作流改动在 pre-push 中额外运行 `commands:approval:validate`。该校验会通过 Node 二次启动 Codex；在 Windows Store 版 Codex 的受限子进程环境中会稳定返回 `EPERM`，从而阻断与命令授权无关的推送。

现将项目工作流治理测试与 `scripts/command-approval/**`、命令授权专属测试分开分类。pre-push 继续执行实际改动需要的确定性检查，但不再因普通治理测试触发 Codex execpolicy 子进程校验。
