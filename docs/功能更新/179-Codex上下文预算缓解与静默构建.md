# 179-Codex上下文预算缓解与静默构建

日期：2026-08-02

## 更新时间记录

- 2026-08-02：首次将 `build:web` 与 `build:pages` 收口到 `--logLevel warn`，削减 Vite 成功构建的大体积资源清单输出。
- 2026-08-02：继续补上查询与审阅侧的低输出策略：批次、registry、prompt 与索引核对默认先看统计、`--limit`、`--fields` 与少量样本，不直接打印整批 JSON、整份 prompt 或大段重叠输出。
- 2026-08-02：补上 Windows 中文文档查阅链路的稳定读法：新增 UTF-8 分段读取脚本，并明确脏工作区诊断先看 `git diff --stat`，不默认展开多文件 diff 正文。

## 背景

项目内 Codex 会话在长任务中仍会出现异常高 token 消耗。已确认的放大源不止构建输出，还包括宽范围命中、整份大文件预读、整批 prompt/registry 直接打印、脏工作区里的多文件大 diff 正文，以及同一问题并行返回大段重叠输出的工具调用。与此同时，Windows 默认读取/显示链路如果继续使用 bare `Get-Content`，还会把正常 UTF-8 文档误表现成乱码，进一步拖慢诊断。

## 本次调整

- 将 `package.json` 中的 `build:web` 改为 `vite build --logLevel warn`。
- 将 `package.json` 中的 `build:pages` 改为 `vite build --mode pages --logLevel warn`，保留后续 `validate-pages-build` 检查。
- 将 `.github/workflows/pages.yml` 中的 `actions/checkout`、`actions/setup-node`、`actions/upload-pages-artifact` 升到当前官方推荐主版本，减少 GitHub Actions 的 Node 20 弃用提示风险。
- 将本轮观察和缓解写回 `docs/运行规范/未解决问题/Codex会话提交异常与上下文预算问题.md`。
- 将 `AGENTS.md` 与 `docs/系统说明/项目知识索引系统.md` 补成统一的低输出默认：批次、registry、prompt 与索引核对先看 counts、`--limit`、`--fields` 与 1–3 条样本，再开定向原文；不默认打印整批 JSON、整份 prompt 或并行大段重叠输出。
- 新增 `scripts/docs/read-utf8-slice.mjs`，固定按 UTF-8 分段读取中文文档、注册表和 JSON 片段，减少 Windows 代码页导致的乱码与一次性全文输出。
- 将 `AGENTS.md` 与 `docs/系统说明/Windows命令与UTF-8编码规范.md` 补成统一默认：Windows 下读取中文文档优先使用 UTF-8 分段读取脚本；脏工作区分析先看 `git diff --stat`、定向 `rg` 或单文件片段，不默认直接展开多文件 diff 正文。

## 结果

- 构建失败和 warning 仍可见，便于排错。
- 常规成功构建不再把几百条资源体积清单全部写进终端，显著降低 Codex 会话上下文膨胀速度。
- 常规核对任务不再默认把整批 prompt、整份 registry 或长文件前数百行一次性塞进会话，进一步降低非构建场景下的 token 暴涨风险。
- 中文文档查阅不再依赖 Windows PowerShell 的默认代码页去“碰运气”，UTF-8 文件是否正常由显式 UTF-8 读取决定，明显降低反复乱码带来的无效往返。
- 诊断脏工作区时不再默认把多文件 diff 正文整段灌进会话，能把真正需要打开的内容压缩到更小范围。
- Pages workflow 与 GitHub 官方当前示例更接近，后续因旧 action 运行时产生平台级弃用提示的概率更低。
- 这属于项目内缓解，不等同于已定位平台根因；若同会话仍叠加大范围索引、重型检查和远端监控，仍可能再次触发预算问题。

## 验证

- `npm run build:web`
- `npm run build:pages`
- `node scripts/docs/read-utf8-slice.mjs docs/系统说明/Windows命令与UTF-8编码规范.md --start 1 --count 20`
- `npm run docs:governance:audit`
