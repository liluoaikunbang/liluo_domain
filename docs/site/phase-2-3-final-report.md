# GitHub Pages 官网 Phase 2 + Phase 3 执行报告

日期：2026-08-02

## 执行摘要

本轮已按“尽量复用已有图片、暂不新增图”的边界，把璃落宇宙 GitHub Pages 官网从单页项目海报扩展为结构化站点。官网现在具备首页、世界、系列、角色、图库、可玩证据、生产体系、路线图、开发记录和协作入口。

## 主要改动

- 新增官网内容注册表：`src/content/site/siteData.js`
- 新增图片解析层：`src/content/site/assetResolver.js`
- 新增官网组件：`src/components/site/ResponsiveImage.vue`、`StatusBadge.vue`、`SiteShell.vue`
- 新增官网页面：`src/pages/SitePage.vue`
- 扩展路由：`/worlds`、`/characters`、`/gallery`、`/evidence`、`/production`、`/roadmap`、`/devlog`、`/collab`
- 新增校验脚本：`scripts/site/validate-site-content.mjs`
- 更新 Pages HTML 元信息：`index.pages.html`
- 新增站点维护与复核文档：`docs/site/`

## 验证结果

```text
npm run site:content:validate
ok: true
assetCount: 45
worldCount: 6
seriesCount: 6
evidenceCount: 7
requiredRouteCount: 23
```

`npm run build:pages` 已通过，并完成 Pages 入口检查。

## 已知风险

- Vite 构建仍提示部分 chunk 超过 500 kB，主要来自当前 `/game` 真实入口及既有游戏依赖。这个问题不影响本轮官网可用性，但后续若要做公开官网性能优化，应单独拆分 `/game` 的发布策略。
- 当前部分世界、系列和角色图仍在复用 README 阶段资产；后续新图可以按维护手册逐批登记。

## 未执行项

- 未生成新图片。
- 未上传新 R2 资产。
- 未推送 GitHub、未触发线上 Pages 发布。

