# GitHub Pages 官网 Phase 2 + Phase 3 基线审计

日期：2026-08-02

## 审计结论

本轮官网升级以复用既有 `docs/assets/readme/` 与 R2 公开图为前提，不新增生成图、不上传新图、不改动游戏运行时主流程。现有视觉资产足以支撑官网从单页海报扩展为结构化站点，但远期仍需要继续补齐每个世界、系列和角色的专属图。

## 已确认基础

- GitHub Pages 构建入口：`index.pages.html`
- Pages 构建命令：`npm run build:pages`
- Pages 输出目录：`dist-pages`
- Pages 站点 base：`/liluo_domain/`
- 当前公开图床：Cloudflare R2
- R2 public base：`https://pub-e59f87bc8db44d99af9adecc30067680.r2.dev`
- R2 manifest：`docs/assets/registry/website-r2-manifest.json`

## 内容来源

- 项目公开叙述：`README.md`、`docs/项目概览.md`、`docs/项目愿景.md`
- 官网既有素材说明：`docs/assets/readme/README.md`
- 视觉图册：`docs/readme/世界图册.md`
- 生产体系说明：`docs/readme/生产体系.md`
- 可玩证据说明：`docs/readme/可玩证据.md`
- 地图包事实：`src/game/data/maps/**/map.json`

## 可复用资产基线

- README 视觉资产：约 90 个
- 已验证实机截图：7 个
- R2 manifest 资产：19 个
- 当前官网内容注册资产：45 个

本轮仅把这些已有图整理成官网资产注册表，不把缺图位置伪造成已完成图；缺口留在后续视觉批次计划中继续补。

## 当前结构缺口

- 部分世界与系列仍复用同一组大海报、角色图或证据图，尚未形成“一世界一主视觉”的稳定资产层。
- `/game` 仍接入当前游戏入口，Pages 构建会包含较大的游戏相关 chunk；这保证入口真实，但不是最终轻量发布形态。
- R2 manifest 中存在早期命名资产，官网显示名已按当前公开命名收束，历史文件名暂不批量改名。

