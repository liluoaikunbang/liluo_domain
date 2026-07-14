# mumu房间传送点改为手动交互

## 本次实现思路

这次调整的目标，是把 `src/game/data/mumu_room/map.json` 中四个传送点：

- `input_event_1`
- `output_event_1`
- `input_event_2`
- `output_event_2`

从“角色踩上去就立刻触发”的自动传送，改成和其他地图入口一致的“角色站上去后，由玩家按交互键/Space 再执行传送”。

最初实现时，这四个传送点使用的是自动事件：

- `input_event_1 -> output_event_1`
- `output_event_1 -> input_event_1`
- `input_event_2 -> output_event_2`
- `output_event_2 -> input_event_2`

虽然数据链路本身能跑通，但因为这些点位是同地图内的双向跳转，角色传送后很容易又落到另一个可立即触发的事件格上，造成两边来回跳动，表现上不符合当前项目里“地图入口需要玩家确认交互”的统一体验。

因此这次没有继续给自动传送打补丁，而是直接回到更稳定、也更符合现有 RPG 交互习惯的方案：

1. 把四个传送事件统一改为 `manual`
2. 保留原本的 `tileMarker` 绑定方式，让事件仍然跟随地图图层标记
3. 为四个传送点补上 `panelActions`，让玩家站上去时能看到明确的交互提示
4. 移除这次为自动触发临时补上的 auto-event 运行链路，避免留下无实际使用价值的额外逻辑

这样处理后，传送点仍然是地图中的世界互动，但不会再出现角色自动反复跳转的问题。

---

## 相关代码路径

- `src/game/data/mumu_room/events.json`
  - 将 `mumu_room_input_event_1`
  - `mumu_room_output_event_1`
  - `mumu_room_input_event_2`
  - `mumu_room_output_event_2`
  - 这四个事件从 `triggerType: "auto"` 改为 `triggerType: "manual"`
  - 保留原有 `mapTransition` 与 `tileMarker`
  - 新增各自的 `panelActions`，用于交互提示文案

- `src/game/scenes/WorldScene.ts`
  - 移除自动事件检测与触发逻辑
  - 场景回到只维护手动交互事件状态，并在玩家按键时触发当前事件

- `src/game/systems/map/worldSceneRuntime.ts`
  - 移除 auto event registry 注入
  - 运行时只保留手动事件注册结果给场景层使用

- `src/game/systems/map/manualEventRegistry.ts`
  - 删除自动事件注册导出
  - 保留手动事件按 `zones` / `tileMarker` 注册的主逻辑

- `src/game/core/EventRunner.ts`
  - 删除 `getAutoEventsForMap`
  - 保留按 `manual` 类型筛选地图事件的逻辑

- `scripts/tests/mumu-room-teleport-events.test.mjs`
  - 更新为校验 `mumu_room` 四个传送点现在属于双向手动传送事件
  - 同时检查地图中的四组传送标记仍然存在且位置关系正常

---

## 开发过程中遇到的问题

### 问题 1：双向同地图自动传送会在落点上再次立即触发

一开始按“踩上去自动触发”的思路接入后，功能表面上是成立的：角色进入一个事件格，确实会跳到另一侧。

但因为目标点本身又是另一个自动传送事件所在位置，所以角色一落地就可能继续被判定命中下一个事件，从而出现来回跳动。

### 解决方法

不再坚持自动触发，而是改成和其他地图门口一致的手动交互触发：

- 玩家走到传送点上
- 看到交互提示
- 按 Space / 交互键后再传送

这样既解决了循环触发问题，也让地图交互体验和项目现有方案保持一致。

---

### 问题 2：为了支持自动事件而临时加上的运行链路，调整后已经变成冗余逻辑

在自动传送方案下，曾补过一条从地图运行时到 `WorldScene` 的 auto-event 检测链路，用于角色移动时自动执行事件。

但在传送点改为手动后，这条链路已经没有实际用途，继续保留只会增加维护成本，还可能让后续排查交互问题时产生额外干扰。

### 解决方法

这次同步移除了：

- `autoEventTriggerState` 相关状态逻辑
- `WorldScene` 中的自动事件轮询触发
- `worldSceneRuntime.ts` 与 `manualEventRegistry.ts` 中对应的 auto registry 透传
- 相关的临时测试文件

让地图事件系统重新收敛到当前真正使用的手动交互主路径上。

---

### 问题 3：测试需要从“自动事件成立”切换到“手动事件成立”

原先的测试名称和断言，还是围绕“自动双向传送”来写的。逻辑调整后，如果不跟着更新，测试虽然可能还能部分通过，但表达的就不再是当前真实需求。

### 解决方法

本次同步更新 `scripts/tests/mumu-room-teleport-events.test.mjs`，重点改为验证：

1. 四个传送事件现在是 `manual`
2. 四个事件仍然正确绑定到对应的地图图层标记
3. 四个事件的传送目标仍保持双向一一对应
4. 地图中的传送点图层仍然存在且上下位置关系正确

这样后续即使再整理事件配置，也更容易发现是否又偏离成错误触发方式。

---

## 最终验证结果

你已经实际反馈确认：

1. 原先自动触发会导致人物在两个事件间不断跳动；
2. 这批传送点应改为和其他地图入口一样，需要玩家点击/按交互键后再传送；
3. 本次已按这个方向完成调整，并进入文档记录阶段。

代码侧本次执行并通过了以下测试：

```bash
node --experimental-strip-types --experimental-specifier-resolution=node --test scripts/tests/event-runner.test.mjs scripts/tests/mumu-room-teleport-events.test.mjs scripts/tests/liluo-room-leave-event.test.mjs scripts/tests/interaction-input-gate.test.mjs
```

结果：12 项全部通过。

本次没有新增 `src/assets/game` 下的新素材文件，因此不需要更新素材清单。