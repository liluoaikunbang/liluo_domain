# 178-GitHub Pages 官网结构化扩展

日期：2026-08-02

## 背景

此前 GitHub Pages 官网主要承担 README 海报页职责，适合快速公开展示，但不利于长期承载世界、角色、图库、可玩证据和协作入口。本次按 Phase 2 + Phase 3 方案执行，在不新增图片的前提下，先把结构、内容注册和验证底座立起来。

## 实现内容

- 新增 `src/content/site/siteData.js`，集中登记官网公开文案、世界、系列、角色、证据、路线图、开发记录、协作需求和 45 个既有图片资产。
- 新增 `src/content/site/assetResolver.js`，优先使用 R2 公开 URL，缺失时回退到本地 `docs/assets/readme/` 资产。
- 新增 `src/components/site/` 下的官网组件，统一图片、状态徽标、导航外壳和页脚。
- 新增 `src/pages/SitePage.vue`，承载首页、世界、系列、角色、图库、可玩证据、生产体系、路线图、开发记录和协作页。
- 更新 `src/router/index.js` 与 `src/readme-pages-main.js`，让 Pages 入口进入结构化官网，同时保留 `/game` 入口。
- 新增 `scripts/site/validate-site-content.mjs` 和 `site:*` npm 脚本，检查内容 id、图片路径、引用关系和必备路由。
- 更新 `index.pages.html` 的描述、canonical、OG 和 Twitter 元信息。

## 约束

- 本轮不新增生成图。
- 本轮不上传新 R2 资产。
- 官网展示名不从历史文件名推导，统一由内容注册表提供。
- 角色公开卡保留成年人声明，不新增未确认年龄角色。

## 验证

- `npm run site:content:validate` 通过。
- `npm run build:pages` 通过，Pages 入口检查通过。

## 后续

- 分批补充世界、系列、角色和游戏证据截图。
- 单独评估 `/game` 入口的轻量化或分包策略，降低 Pages 构建体积警告。

