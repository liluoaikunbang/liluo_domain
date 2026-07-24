# 150-Codex Hooks 与自动质量门禁系统

- 更新日期：2026-07-23
- 更新日期：2026-07-24（拆分工作流治理与命令授权分类，避免无关 pre-push 校验二次启动 Codex）
- 当前摘要：建立 Codex 生命周期 Hooks、按改动范围去重的统一门禁、本地 pre-push 与 Windows GitHub Actions CI，并以 ERROR 阻断、WARNING 报告和双格式运行报告统一收口确定性验证。

## 已实现

新增仓库级 `UserPromptSubmit`、`PreToolUse` 和 `Stop` Hooks；新增 Git 改动分类、最小命令计划、跨平台命令执行与 JSON/Markdown 报告。门禁支持 hook、changed、prepush、ci 四种模式，统一去重现有数据契约、能力静态评测、内容检查、测试、索引、素材审计与 Web 构建入口。

本地 `.githooks/pre-push` 只调用统一 prepush 门禁，GitHub Actions 在 `windows-latest`、Node 22 与 `npm ci` 后只调用统一 CI 入口。live Codex eval、浏览器回归、离线打包、Release、自动修复、自动提交和推送均未接入。

## 安全与失败边界

提示词 Hook 只拦截高置信密钥且不保存或回显提示词；工具 Hook 只拦截明确危险命令和受保护路径，不替代平台沙箱、项目批准规则或用户级策略。Stop 失败只触发一次继续处理，二次进入不会递归阻断。

门禁自身异常按 ERROR 处理，WARNING 默认不阻断。运行报告进入被忽略的 `reports/quality-gate/`，不纳入版本控制。

## 主要路径

- `.codex/hooks.json`
- `.codex/hooks/`
- `scripts/quality-gate/`
- `.githooks/pre-push`
- `.github/workflows/quality-gate.yml`
- `docs/系统说明/Codex-Hooks与自动质量门禁系统.md`

## 2026-07-23 升级：授权与执行路线收敛

将 `project:gate:changed|prepush|ci|explain` 与 `project:hooks:test` 以完整 npm script 名称登记为项目长期 allow，同时保持 `project:hooks:install`、Git 写入、网络、依赖、删除和发布逐次审批。固定验证入口首次直接走精确的沙箱外路线，普通工作区文件继续使用受控补丁，不再先制造可预见的 `.git/index.lock`、子进程或网络沙箱失败。

改动分类器现将 `.gitignore` 识别为 `build-config`，避免实际推送成功但 pre-push 报告仍因仓库配置文件显示 WARNING。成功的 `git push` 输出作为完成证据，不再默认追加一次重复联网核验。

## 2026-07-24 修复：门禁分类不再扩大命令授权校验

`scripts/tests/project-routine-governance.test.mjs` 曾被错误归类为命令授权治理变化，使普通工作流改动在 pre-push 中额外运行 `commands:approval:validate`。该校验会通过 Node 二次启动 Codex；在 Windows Store 版 Codex 的受限子进程环境中会稳定返回 `EPERM`，从而阻断与命令授权无关的推送。

现将项目工作流治理测试与 `scripts/command-approval/**`、命令授权专属测试分开分类。pre-push 继续执行实际改动需要的确定性检查，但不再因普通治理测试触发 Codex execpolicy 子进程校验。
