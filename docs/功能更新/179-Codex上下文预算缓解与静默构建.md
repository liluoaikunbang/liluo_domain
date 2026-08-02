# 179-Codex上下文预算缓解与静默构建

日期：2026-08-02

## 背景

项目内 Codex 会话在长任务中仍会出现异常高 token 消耗，且已确认一次主要放大源来自构建输出：Vite 在 `build:web`、`build:pages` 与 pre-push 相关流程里会逐项打印大量图片、音频、字体和 chunk 体积，单次输出即可达到上万 token。

## 本次调整

- 将 `package.json` 中的 `build:web` 改为 `vite build --logLevel warn`。
- 将 `package.json` 中的 `build:pages` 改为 `vite build --mode pages --logLevel warn`，保留后续 `validate-pages-build` 检查。
- 将 `.github/workflows/pages.yml` 中的 `actions/checkout`、`actions/setup-node`、`actions/upload-pages-artifact` 升到当前官方推荐主版本，减少 GitHub Actions 的 Node 20 弃用提示风险。
- 将本轮观察和缓解写回 `docs/运行规范/未解决问题/Codex会话提交异常与上下文预算问题.md`。

## 结果

- 构建失败和 warning 仍可见，便于排错。
- 常规成功构建不再把几百条资源体积清单全部写进终端，显著降低 Codex 会话上下文膨胀速度。
- Pages workflow 与 GitHub 官方当前示例更接近，后续因旧 action 运行时产生平台级弃用提示的概率更低。
- 这属于项目内缓解，不等同于已定位平台根因；若同会话仍叠加大范围索引、重型检查和远端监控，仍可能再次触发预算问题。

## 验证

- `npm run build:web`
- `npm run build:pages`
- `npm run docs:governance:audit`
