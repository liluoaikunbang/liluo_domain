# liluo-phaser-map-event-integration

## 用途与边界

将地图、出生点、碰撞、NPC、传送和事件接入现有 Vue3/Phaser/Pinia 分层。纯大纲、纯对话或无关 UI 不触发。

## 路径与输入输出

- Skill：`.agents/skills/liluo-project/liluo-phaser-map-event-integration/`
- reference：`map-integration-checklist.md`
- 输入：真实 mapId、素材、流程、状态与存档需求
- 输出：现有地图目录/registry/systems 内的接入改动和验证结果

## 流程、限制与验证

核对真实资源和同名地图，补齐现有目录并注册；资源交 MapLoadingScene，WorldScene 仅组织，复用逻辑下沉 systems。避免改外部生成的 map.json。验证出生、碰撞、寻路、镜头、传送、事件和存档重入，并运行相关 Node 测试与构建。对话内容交 `liluo-dialogue-event-authoring`。
