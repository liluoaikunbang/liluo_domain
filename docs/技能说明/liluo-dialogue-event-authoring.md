# liluo-dialogue-event-authoring

## 用途与边界

编写普通/条件/分支对话和剧情事件，包括状态、道具、CG、立绘、玩法入口、结束与重入。纯小说对白或地图注册不触发。

## 路径与输入输出

- Skill：`.agents/skills/liluo-project/liluo-dialogue-event-authoring/`
- reference：`event-authoring-checklist.md`
- 输入：事件目标、真实 schema、代表性事件、玩家/存档状态和资源 key
- 输出：可执行事件/对话数据及测试结果

## 流程、限制与验证

明确进入、操作、分支、状态、成功失败退出和重入；复用真实 ID，不覆盖已有状态，不把游戏写成纯对话框。验证 JSON、注册引用、event-runner/dialogue 测试及构建。地图运行接入交 `liluo-phaser-map-event-integration`。
