# GitHub Pages 官网维护手册

日期：2026-08-02

## 结构

- 官网内容数据：`src/content/site/siteData.js`
- 官网图片解析：`src/content/site/assetResolver.js`
- 官网公共组件：`src/components/site/`
- 官网页面：`src/pages/SitePage.vue`
- Pages 专用入口：`src/readme-pages-main.js`
- Pages HTML 模板：`index.pages.html`
- 内容校验脚本：`scripts/site/validate-site-content.mjs`

## 常用命令

```bash
npm run site:content:validate
npm run build:pages
npm run site:build
```

`site:content:validate` 只检查官网内容注册、图片路径、引用关系和必备路由。`build:pages` 负责实际 Pages 构建，并继续运行已有 Pages 入口检查。

## 新增图片流程

1. 先把图片放入既有公开素材流程，优先复用 `docs/assets/readme/` 或 R2 manifest。
2. 在 `src/content/site/siteData.js` 的 `assets` 中登记 id、用途、alt、尺寸、路径或 R2 URL。
3. 把资产 id 挂到对应世界、系列、角色、证据或生产步骤。
4. 运行 `npm run site:content:validate`。
5. 需要发布时再运行 `npm run build:pages`。

## 不做的事

- 不从文件名自动生成官网展示文案。
- 不把缺失图写成“已完成”。
- 不在官网里新增与项目事实不一致的世界、角色或玩法状态。
- 不把游戏主体验改成纯资料站；官网只负责公开展示与协作入口。

