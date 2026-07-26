# 可执行工作流交互大图（少用）

日常看：`project-workflows/generated/<wf-id>/PROCESS.md`（静态 Mermaid）。

本目录仅在用户明确要求「动态大图 / 交互图」时使用。数据随 **重大修改后的 generate** 更新，不会在每次 validate 时重写。

```bash
npm run project:workflow:generate -- --workflow <id>   # 或 generate:all
npm run project:workflow:viewer:build                  # 仅刷新 viewer 数据时
```

然后浏览器打开 `index.html`。`data.js` 为生成物，勿手改。
