# liluo-gameplay-loop-audit

## 故事缺口候选接入

检查候选是否真正补充玩法覆盖、是否只是既有循环换皮、玩法是否与叙事有因果关系，以及结果是否改变故事或运行时状态。

## 项目索引协作

复杂审查先查询 gameplay/story/code 索引，核验玩法总表与实现源码；被索引来源变化后增量刷新。

## 用途与边界

把玩法灵感审查为适合当前 2D 像素 PVE RPG 的可开发循环。默认不实现代码。

## 路径与输入输出

- Skill：`.agents/skills/liluo-project/liluo-gameplay-loop-audit/`
- reference：`gameplay-loop-rubric.md`
- 输入：玩法总表、故事引用、现有小游戏与技术能力
- 输出：循环拆解、资源/复杂度/MVP 和分级建议

## 流程、限制与验证

检查 10–30 秒操作、地图、输入、压力、成败撤离、状态存档、剧情连接、差异和资源。PVP 来源不直接否定，转化为敌人、环境、竞争者或计时压力。与玩法目录及现有实现逐项交叉验证；实现工作再路由地图/对话/通用开发 Skill。

必要时委派 `liluo_context_explorer` 查询既有玩法和故事需求，或委派 `liluo_game_architecture_explorer` 判断 2D 像素 PVE 架构的落地能力；不得扩大成无边界代码调查。
