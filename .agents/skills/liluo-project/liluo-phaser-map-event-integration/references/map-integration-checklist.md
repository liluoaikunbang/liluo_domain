# 地图接入检查

- 数据：`meta.ts`、`map.json`、`events.json`、`dialogues.json`、`assets.ts` 按实际需要齐全。
- 注册：`src/game/data/registry.ts` 中 map/event/dialogue/resource 入口一致。
- 运行：出生点、碰撞、寻路、镜头、传送、NPC、环境与事件触发可重入。
- 分层：BootScene 仅全局资源，MapLoadingScene 动态资源，WorldScene 组织，systems 承担复用逻辑。
- 存档：旧位置、未知地图、传送后保存与重新载入有明确处理。
