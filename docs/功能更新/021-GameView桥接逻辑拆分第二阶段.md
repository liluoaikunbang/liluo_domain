# GameView桥接逻辑拆分第二阶段

## 本次实现思路

这一轮继续处理 `GameView.vue` 的 `<script setup>`，目标不是改玩法，而是把最容易继续膨胀的“桥接逻辑”从页面层抽出去，让 `GameView.vue` 真正回到“页面调度层”的位置。

这次重点拆了三块桥接逻辑，并在用户验收通过后补上了页面骨架整理：

- 通知状态管理；
- 对话桥接；
- Phaser 生命周期与世界场景桥接。
- 游戏内舞台三栏布局骨架。

拆分时遵守了两个边界：

1. **通知层只做通知状态管理**，不碰 Phaser；
2. **Phaser 相关的 `game?.scene.getScene(SceneKeys.WORLD)` 调用统一收口**，不再散落在 `GameView.vue` 里。

这样处理后，页面层只保留：

- 顶层页面状态；
- 菜单开关；
- 进入旅程流程；
- 监听快捷键与两个 watch；
- 把 composable 串起来。

---

## 相关代码路径

- `src/game/views/GameView.vue`
  - 收口为页面调度层。
  - 保留：`hasEnteredGame`、`isMenuOpen`、`activeEventId`、`currentMapId`、地图信息 computed、菜单控制、进入旅程流程、生命周期与 watch。

- `src/game/views/composables/useGameNotifications.ts`
  - 新增通知状态 composable。
  - 接管原来 `notificationIdSeed`、`NOTIFICATION_DURATION`、`mapNotifications`、`notificationTimerMap`、`notificationSequenceTimers`、`clearNotificationTimer`、`removeNotification`、`pushNotification`、`clearAllNotifications`。

- `src/game/views/composables/useGameDialogueBridge.ts`
  - 新增对话桥接 composable。
  - 接管原来 `createEmptyDialogueState`、`showDialog`、`activeDialogue`、`applyDialoguePayload`、`resetDialogueState`、`handleDialogAdvance`、`handleDialogChoice`、关闭与打开对话流程。

- `src/game/views/composables/usePhaserGameBridge.ts`
  - 新增 Phaser 桥接 composable。
  - 接管原来 `game`、`mountGameInstance`、`destroyGameInstance`、`applyTimeOfDayChoice`、`applyWeatherChoice`、`syncOverlayStateToPhaser` 以及交互触发相关逻辑。
  - 通过 `getWorldScene()` / `withWorldScene()` 把 WorldScene 能力调用统一封装。

- `src/game/views/GameStageLayout.vue`
  - 新增游戏内舞台布局组件。
  - 只负责三栏骨架和 overlay 插槽，不承接页面状态、Phaser 生命周期或事件逻辑。

---

## 具体实现说明

### 1. 先把通知逻辑收进 `useGameNotifications`

原来的通知逻辑虽然不长，但它包含：

- 通知数组；
- 定时器 Map；
- 自动移除逻辑；
- 页面销毁时清理逻辑。

这些状态和定时器都属于典型的“局部 UI 状态管理”，继续留在 `GameView.vue` 里只会让页面脚本继续变粗。

这次拆完之后：

- `GameView.vue` 只拿 `notifications` 给 `GameNotificationBar`；
- 清空逻辑统一调用 `clearAllNotifications()`；
- composable 自己在 `onUnmounted` 里再兜底清一次定时器，避免页面销毁时残留 timeout。

`notificationSequenceTimers` 目前仍保留，但只作为清理入口保底，不主动扩展它的职责。这样既保留了后续兼容空间，也没有把它继续耦合进页面层。

---

### 2. 把对话推进与选项分支统一收进 `useGameDialogueBridge`

原来的对话逻辑里有两段明显重复：

- 继续对话时，拿不到下一段就关闭；
- 选项分支时，拿不到下一段也关闭；
- 如果拿到了，就应用 payload。

这次统一为内部辅助方法 `applyNextDialogueOrClose(nextDialogue)`，让“推进”和“选项分支”共用同一套收口。

同时，这个 composable 仍然保持桥接职责，不去接管 `EventRunner` 本体，也不去碰 Phaser 实例。

它只接收：

- `eventRunner`
- `applyTimeOfDayChoice`
- `applyWeatherChoice`

因此昼夜与天气切换仍然沿着原来的事件上下文执行，但页面层不用继续关心选项分支内部细节。

---

### 3. 用 `usePhaserGameBridge` 把 WorldScene 调用统一收口

这一块是本轮最核心的整理。

原来的 `GameView.vue` 里多次出现类似写法：

- `if (!game?.scene) return`
- `const worldScene = game.scene.getScene(SceneKeys.WORLD)`
- `if (worldScene && 'xxx' in worldScene)`

这种写法单看一次没问题，但随着后面 UI 面板、地图 HUD、剧情桥接继续增长，很容易越写越散。

所以这次新增了：

- `getWorldScene()`
- `withWorldScene(handler)`

让下面这些能力都统一从一个地方出去：

- 挂载游戏；
- 销毁游戏；
- 触发当前交互；
- 设置时间；
- 设置天气；
- 同步 UI overlay 开关。

这样 `GameView.vue` 不再直接碰 `SceneKeys.WORLD` 与 `game.scene.getScene(...)`，Phaser 相关桥接边界更清晰，也更方便后面继续扩展。

---

### 4. `GameView.vue` 继续收口为“页面调度层”

完成这三块拆分后，`GameView.vue` 里留下来的内容就更接近页面该做的事：

- 进入游戏前后切换视图；
- 维护页面级状态；
- 菜单开关；
- 响应 Esc 快捷键；
- 在生命周期里做挂载/销毁与重置；
- 用 watch 把菜单/对话可见性同步到 Phaser overlay。

也就是说，这个文件现在主要负责“调度”，而不是自己承包通知定时器、对话推进细节、Phaser Scene 查询细节。

---

### 5. 补充抽出 `GameStageLayout.vue`，把舞台骨架和内容彻底分离

在桥接逻辑拆分稳定后，又继续补做了一个很轻的布局组件：`GameStageLayout.vue`。

这一步不改玩法，也不改状态来源，只处理原来 `GameView.vue` 模板里这块固定结构：

- 左侧角色立绘面板；
- 中间 Phaser 地图区；
- 右侧地图信息面板；
- 覆盖在舞台上的菜单 overlay。

新的组件通过四个具名插槽承载内容：

- `left`
- `center`
- `right`
- `overlay`

这样调整后：

1. `GameView.vue` 不再自己持有三栏网格骨架；
2. 页面层只负责把已有内容组件拼进去；
3. 后续如果要换 UI 皮肤、调整舞台比例、替换左右栏容器样式，可以优先改布局组件，不必回头碰页面调度逻辑。

这一步和前面的 composable 拆分方向是一致的：

- 桥接细节从页面脚本抽走；
- 布局骨架从页面模板抽走；
- `GameView.vue` 更接近“只决定页面怎么拼”的目标状态。

---

## 开发过程中遇到的问题

### 问题 1：`GameView.vue` 拆完后，容易留下旧变量名残留

通知逻辑抽出去后，模板里原来还是使用 `mapNotifications`，而 composable 实际输出已经变成 `notifications`。

### 解决方法

统一把模板绑定改成 `:notifications="notifications"`，并用搜索确认旧桥接命名已经从 `GameView.vue` 范围里清干净，避免“逻辑已经迁走，但模板还在引用旧名字”的半拆状态。

---

### 问题 2：页面层收瘦后，仍需要保证销毁时清理足够稳

这轮把通知定时器和 Phaser 实例都抽出了页面层，如果清理职责没有同时迁走，就容易出现：

- 页面卸载后仍有通知 timeout；
- Phaser 实例没销毁干净；
- UI overlay 状态还残留在旧实例上。

### 解决方法

这次做了双层收口：

1. `GameView.vue` 在 `onUnmounted` 中仍显式调用 `clearAllNotifications()` 与 `destroyGame()`；
2. `useGameNotifications()` 自己也在 `onUnmounted` 里兜底清理定时器。

这样即使后续页面层再继续收口，通知清理也不会完全依赖父层记忆。

---

### 问题 3：抽布局时要避免把展示容器职责和页面行为重新耦回去

`GameStageLayout.vue` 虽然只是个骨架组件，但如果顺手把菜单按钮、通知条定位逻辑甚至地图容器 id 一起封进组件里，就会把“布局组件”和“页面行为”重新绑回去，后面反而更难继续拆。

### 解决方法

这次只把最稳定的舞台骨架提取出去：

- 布局组件只保留三栏结构和 overlay 插槽；
- `#phaser-game-container` 仍由 `GameView.vue` 提供，避免影响 `usePhaserGameBridge()` 的挂载约定；
- 通知条、信息面板、菜单遮罩都继续由页面层决定放进哪个 slot。

这样布局抽出来了，但页面层的行为边界没有被重新打乱。

---

## 最终验证结果

本次已完成的验证：

- `npm run build:web` 通过；
- `GameView.vue` 中旧的通知/对话/Phaser 直连桥接实现已移除；
- Phaser 到 Vue 的对话、交互、地图同步入口已经改由 composable 桥接；
- 对话推进与选项分支已统一为“取下一段或关闭”的收口逻辑；
- 页面销毁时仍会调用通知清理与 Phaser 销毁；
- `GameStageLayout.vue` 已接管游戏内三栏舞台骨架，`GameView.vue` 模板改为通过 `left / center / right / overlay` 插槽组装内容。

用户随后已实际进入页面完成验收，并确认“没问题了”。本轮最终确认结果如下：

- 通知条显示正常，未受通知 composable 拆分影响；
- 对话打开、推进、选项分支与关闭行为和拆分前保持一致；
- 昼夜 / 天气选择效果保持不变；
- 菜单与对话开启时，Phaser overlay 状态仍能正常同步；
- 离开页面后未出现残留报错，通知与 Phaser 实例清理正常；
- 新增 `GameStageLayout.vue` 后，页面显示和交互正常，三栏布局与菜单 overlay 行为未受影响。

至此，这一轮 `GameView` 第二阶段桥接逻辑拆分，以及补充的舞台骨架收口，均已完成实现、构建验证与用户实测确认，可以视为正式闭环。