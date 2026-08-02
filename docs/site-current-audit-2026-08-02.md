# 官网现状审计（2026-08-02）

## 本轮核对范围

- 当前仓库中的官网路由：/、/worlds、/worlds/munika、/worlds/fuguang、/worlds/jitu、/worlds/chenhuan、/worlds/zhoufu、/worlds/xingyu、/worlds/munika/series/fushen-domain、/worlds/fuguang/series/jingsuo-incident、/worlds/jitu/series/corpse-tide、/worlds/chenhuan/series/maid-dilemma、/worlds/zhoufu/series/dreamland、/worlds/xingyu/series/stargate-port、/characters、/characters/liluo、/gallery、/evidence、/production、/roadmap、/devlog、/collab、/game
- 站点蓝图、已发布样张清单、R2 manifest、截图来源、首页与各子页结构
- `/game` 仍被保留为正式旗舰入口，官网不替代游戏

## 当前可复用基础

- 公开站点已经有首页、六界、角色、图鉴、证据、生产、路线图、开发日志和协作页路由骨架。
- 已有可复用视觉样张 60 项，其中 R2 可直接复用 0 项。
- 现有真实截图来源 7 项，足以支撑“先证据、后愿景”的首页证明条。

## 主要缺口

- 旧站点数据集中在单体 `siteData.js`，难以承接 1000+ 资产规划、状态追踪和批次恢复。
- 图鉴没有承载完整计划库、批次、prompt 状态与截图任务，容易把“已规划”误写成“已落地”。
- 世界页、分支页、协作页、路线图页和开发日志页缺少独立的视觉节奏与任务转化结构。
- 当前 `/game` 入口需要继续作为独立回归对象，不能被海报站结构掩盖。

## 本轮策略

1. 建立 1,248 项视觉资产 registry 与 96 项截图任务书。
2. 把首页升级为 15 章节滚动海报逻辑，并明确真实证据边界。
3. 让世界、角色、图鉴、证据、生产、路线图、开发日志和协作页都改为数据驱动。
4. 只把真实已发布样张接入站点；其余条目保留为 prompt-ready 计划项。
