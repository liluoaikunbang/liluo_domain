# mumu房间地图接入、离开事件与客厅入口确认

## 本次实现思路

这次围绕 `mumu_room` 一共核对并收口了两类内容：

1. 地图本身是否已经完整接入，包括资源、注册表、默认出生点和人物缩放；
2. 房间内是否存在可用的“离开沐沐的房间”事件，并且离开后能正确回到客厅 `mumu_room_event` 对应位置。

排查后确认，`mumu_room` 的资源注册、地图接入、`role` 出生点以及 `0.8` 人物缩放，其实原本就已经接好；真正需要补的是离开房间事件的触发区坐标。原先 `mumu_room_leave` 的 `zones` 还停留在旧坐标体系里，所以虽然事件结构和返回客厅的 `spawnId: "mumu_room_event"` 都已存在，游戏里却不会在 `role` 附近正确触发。

因此这次整体处理思路分为两步：

- 先确认 `mumu_room` 的地图接入链路本身没有缺项；
- 再把 `mumu_room_leave` 的触发区修正到当前运行时使用的标准 tile 坐标，让 `role` 以及周围地块都能正常触发离开事件。

这样整理后，客厅 -> 沐沐房间 -> 客厅门口 这一整条往返链路就都闭合了。

---

## 相关代码路径

- `src/game/data/mumu_room/map.json`
  - 提供 `mumu_room` 地图本体。
  - 内含 `role`、`input_event_1`、`input_event_2`、`output_event_1`、`output_event_2` 等标记图层。
  - tileset 实际引用了 `dungeon_tileset`、`house_indoor_3`、`Prison`、`Prison_1`、`Prison_2`、`Prison_3`、`house_indoor_europe`、`outhers_1` 这 8 组图片资源。

- `src/game/data/mumu_room/assets.ts`
  - 已注册 `mumu_room/map.json` 对应的 8 组图集资源。
  - 每组资源都按当前项目约定声明为 `spritesheet`，并统一使用 `16x16` 帧尺寸。

- `src/game/data/mumu_room/meta.ts`
  - 已声明地图 ID 为 `mumu_room`。
  - `defaultSpawnId` 已设为 `role`。
  - `playerScale` 已设为 `0.8`。
  - `worldRender.tilesets` 已补齐与地图 tileset 对应的运行时纹理映射。

- `src/game/data/mumu_room/events.json`
  - 维护 `mumu_room_leave` 事件。
  - `mapTransition.mapId` 指向 `liluo_house_living_room`。
  - `mapTransition.spawnId` 指向 `mumu_room_event`。
  - 本次把 `zones` 从旧的负坐标修正为当前可用的 `1~3 / 19~21` 区域，覆盖 `role` 及其周围地块。

- `src/game/data/registry.ts`
  - 已将 `mumu_room` 的 `map.json`、`assets.ts`、`meta.ts` 接入地图注册表。
  - 这样 `MapLoadingScene -> WorldScene` 主流程就能按现有结构加载这张地图。

- `src/game/data/liluo_house_living_room/map.json`
  - 已存在 `mumu_room_event` 图层标记。
  - 该标记继续作为从沐沐房间退出后回到客厅的出生点。

- `src/game/data/liluo_house_living_room/events.json`
  - `living_room_mumu_room_entry` 已绑定 `tileMarker.layerName = "mumu_room_event"`。
  - 该事件当前通过 `mapTransition` 跳转到 `mapId: "mumu_room"`，并指定 `spawnId: "role"`。

---

## 开发过程中遇到的问题

### 问题 1：需求看起来像“未完成接入”，但实际地图链路已经存在

一开始按需求描述判断，像是还需要手动把 `mumu_room` 的图片、出生点和客厅入口事件补进去。

但逐项排查后发现：

- `mumu_room/assets.ts` 已经注册了地图引用的全部图片；
- `mumu_room/meta.ts` 已经配置了 `defaultSpawnId: 'role'` 和 `playerScale: 0.8`；
- `registry.ts` 已经把 `mumu_room` 接入地图注册表；
- `liluo_house_living_room/events.json` 的 `living_room_mumu_room_entry` 也已经跳转到 `mumu_room`。

也就是说，这部分真实工作重点不是“补地图接入代码”，而是“确认当前接入状态是否完整正确”。

### 解决方法

这次没有为了满足表面需求而重复改已有代码，而是直接按地图链路逐层核对：

1. 先检查 `map.json` 中 tileset 列表；
2. 再对照 `assets.ts` 和 `meta.ts`；
3. 然后确认 `registry.ts` 是否正式接入；
4. 最后回查客厅地图事件是否已跳转到目标地图。

这样可以避免重复修改已经正确的配置，也能避免因为“再改一次”而引入新的偏差。

### 问题 2：需要确认 `role` 出生点不是空配置

虽然 `meta.ts` 和客厅事件里都已经写了 `role`，但如果 `map.json` 里没有对应的 `role` 标记，这个出生点配置依然会失效。

### 解决方法

这次额外核对了 `mumu_room/map.json` 中 `role` 图层的有效 tile，确认当前存在实际标记，因此 `spawnId: "role"` 并不是悬空引用。

### 问题 3：离开事件配置存在，但游戏里没有出现离开交互

继续检查 `mumu_room/events.json` 时发现，`mumu_room_leave` 事件其实也已经写好了：

- 有 `manual` 触发类型；
- 有返回 `liluo_house_living_room` 的 `mapTransition`；
- 有 `spawnId: "mumu_room_event"`；
- 也有“离开沐沐的房间（Space）”的面板动作。

但实际表现是玩家站在房间角色点附近时，并不会出现这条离开交互。

### 解决方法

继续对照地图运行时坐标后确认，问题不在事件结构，而在 `zones`：

- 原先配置的是一组旧坐标；
- 当前地图运行时实际可用的是标准正向 tile 坐标；
- `role` 以及周围出口区域对应的是 `(1~3, 19~21)`。

所以本次直接把 `mumu_room_leave.zones` 统一改成新的 3x3 区域，保证角色站在 `role` 或相邻格子时，都能命中离开事件。

### 问题 4：需要确认返回客厅时的出生点链路没有断

仅仅让 `mumu_room` 里出现离开交互还不够，如果回到客厅时没有落在正确入口，就会破坏地图切换体验。

### 解决方法

这次额外核对了返回链路：

1. `mumu_room_leave.mapTransition.spawnId` 仍然指向 `mumu_room_event`；
2. `liluo_house_living_room` 地图中仍然存在 `mumu_room_event` 图层标记；
3. 用户实机测试确认，离开后已正常落到客厅门口。

这样说明“客厅进房间 -> 房间内离开事件 -> 客厅出生点”这条链路当前是完整的。

---

## 最终验证结果

基于本次核对与修正，当前已确认：

1. `mumu_room/map.json` 使用的 8 组图片资源都已经在 `src/game/data/mumu_room/assets.ts` 中注册；
2. `src/game/data/mumu_room/meta.ts` 已把人物缩放设为 `0.8`；
3. `src/game/data/mumu_room/meta.ts` 已把默认出生点设为 `role`；
4. `src/game/data/liluo_house_living_room/events.json` 中 `mumu_room_event` 对应入口已跳转到 `mumu_room`；
5. 该入口进入 `mumu_room` 后会落在 `role` 出生点；
6. `src/game/data/mumu_room/events.json` 中 `mumu_room_leave` 的触发区已覆盖 `role` 及周围地块；
7. 玩家站在该区域时，会正常出现“离开沐沐的房间（Space）”；
8. 触发后会返回 `liluo_house_living_room`，并落在 `mumu_room_event` 对应的客厅门口位置；
9. `src/game/data/registry.ts` 已正式注册 `mumu_room` 地图；
10. `npm run build:web` 已通过，且用户已实机确认“正常触发并落到客厅门口”。

本次没有新增素材文件，因此不需要更新素材清单。