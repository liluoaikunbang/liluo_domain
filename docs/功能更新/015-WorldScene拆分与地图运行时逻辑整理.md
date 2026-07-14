# WorldScene拆分与地图运行时逻辑整理

## 本次实现思路

这次调整的重点不是新增玩法，而是继续把 `WorldScene` 里已经开始变重的地图运行时处理逻辑往外拆。

当前项目已经进入“地图、事件、动画、对象会持续增加”的阶段，如果仍然把运行时地图归一化、chunk 展平、tileset 查找、透明 tile 判定、裁边、对象查询这些逻辑都堆在场景里，后面继续扩地图时，`WorldScene` 会越来越难维护。

所以这次先做第一批拆分，目标是：

- 保持地图进入结果不变；
- 保持出生点、对象位置、动画占位位置不变；
- 把“地图数据运行时整理”从场景生命周期逻辑里独立出去；
- 为后面继续拆 `WorldScene` 留出更清晰的边界。

本次采用的做法是新增一个专门的地图系统文件，只负责运行时地图数据处理，不接管场景流程本身。

---

## 相关代码路径

- `src/game/systems/map/runtimeMapNormalizer.ts`
  - 新增运行时地图归一化模块。
  - 负责 chunk 展平、tileset 纹理 key 解析、透明 tile 判定、运行时裁边，以及地图 layer / object 查询。
  - 对外固定导出：
    - `normalizeRuntimeMapData(...)`
    - `getTileLayer(...)`
    - `getMapObject(...)`
    - `getTilesetForTileGid(...)`
    - `isKnownTransparentTileGid(...)`

- `src/game/scenes/WorldScene.ts`
  - `create()` 中不再自己执行地图归一化。
  - 改为直接调用 `normalizeRuntimeMapData(...)`。
  - 原先散落在场景内部的查询与归一化辅助方法，改为使用新模块导出的函数。
  - 点击寻路时不再自己执行路径搜索，改为调用 `findTilePath(...)`。

- `src/game/systems/map/pathfinding.ts`
  - 新增 tile 级寻路模块。
  - 只负责 tile 路径搜索、路径回溯、event tile 规避权重。
  - 对外固定导出：
    - `findTilePath(...)`
    - `getTileKey(...)`

- `src/game/systems/map/renderers/tileLayerRenderer.ts`
  - 新增 tile 图层渲染模块。
  - 负责筛选可渲染 tile layer，并按 layer 顺序把 tile image 渲染到场景中。
  - 统一从 `runtimeMapNormalizer.ts` 引入：
    - `getTilesetForTileGid(...)`
    - `isKnownTransparentTileGid(...)`
  - 对外固定导出：
    - `renderTileLayers(scene, mapData, options)`

- `src/game/systems/map/renderers/worldAnimationRenderer.ts`
  - 新增世界动画渲染模块。
  - 负责读取当前地图动画定义、计算动画对象世界坐标、判断是否隐藏 source layer，以及把注册动画真正渲染到地图中。
  - 对外固定导出：
    - `renderWorldAnimations(scene, mapData, mapId)`
    - `shouldHideAnimatedSourceLayer(...)`

- `src/game/systems/character/playerPathPreviewRenderer.ts`
  - 新增玩家自动寻路预览渲染模块。
  - 只负责自动寻路虚线路径的绘制与清除，不参与寻路计算和自动移动状态管理。
  - 对外固定导出：
    - `renderPlayerPathPreview(...)`
    - `clearPlayerPathPreview(...)`

- `src/game/systems/character/playerController.ts`
  - 新增玩家控制器模块。
  - 负责玩家手动移动、鼠标点击寻路入口、自动移动执行、移动方向维护、行走/待机动画切换，以及自动路径状态维护。
  - 统一依赖：
    - `collision.ts` 提供碰撞与 tile/world 查询；
    - `pathfinding.ts` 提供点击寻路；
    - `playerPathPreviewRenderer.ts` 提供路径预览绘制与清除。
  - 对外固定导出：
    - `createPlayerController(...)`

- `src/game/data/registry.ts`
  - 本次没有改结构。
  - 继续作为 tileset 渲染配置来源，被 `runtimeMapNormalizer.ts` 在运行时读取。

---

## 具体实现说明

### 1. 把地图运行时归一化从场景内抽出去

本次从 `WorldScene.ts` 中迁出的内容包括：

- `getChunkedMapBounds`
- `flattenTileLayerData`
- `getConfiguredTilesetEntry`
- `resolveTilesetTextureKey`
- `getTilesetForTileGid`
- `isKnownTransparentTileGid`
- `getRuntimeTileContentBounds`
- `cropTileLayerData`
- `trimRuntimeMapData`
- `normalizeMapData`
- `getTileLayer`
- `getMapObject`

这些逻辑有一个共同点：

- 都是在“场景真正开始渲染和交互之前”先把地图数据整理成运行时可直接消费的形态；
- 它们本身并不属于 `WorldScene` 的生命周期控制；
- 后面别的地图场景或别的地图系统，也有可能复用这套能力。

因此这次把它们集中到 `runtimeMapNormalizer.ts`，让职责边界更清晰：

- `WorldScene` 负责进入地图、渲染、相机、碰撞、角色和交互；
- `runtimeMapNormalizer` 负责把地图数据整理好，交给场景使用。

---

### 2. 保持原来的归一化行为不变

虽然是拆分，但本次不是重写逻辑，而是尽量保持行为一致。

运行时仍然按原有顺序处理：

1. 先计算 chunk 地图边界；
2. 把 chunk tile layer 展平成连续数组；
3. 根据地图 registry 配置补齐 tileset 的 `textureKey`；
4. 根据已知透明 tile local id 判定实际内容边界；
5. 对运行时地图做裁边；
6. 同步修正对象坐标，避免裁边后对象漂移。

这样做的目的是让这次提交尽量只改变“代码位置”和“职责归属”，不改地图最终表现。

---

### 3. 让场景入口只保留调用关系

`WorldScene.create()` 之前会自己调用内部的 `normalizeMapData(...)`。

这次改成：

- 在场景启动时先拿到 `currentMapId`；
- 然后直接执行 `normalizeRuntimeMapData(this.currentMapId, worldSceneInitData.mapData)`；
- 后续碰撞层读取、出生点对象读取、动画图层定位等都继续使用归一化后的地图数据。

这样一来，`create()` 的阅读路径会更直接：

- 先拿地图数据；
- 再初始化场景状态；
- 再渲染和放角色。

比起把一大段地图整理细节塞在场景类中，后续继续拆的时候也更容易推进。

---

### 4. 新增 `cameraLayout.ts`，把地图内容边界与相机布局计算继续外移

在这一轮继续拆分时，又从 `WorldScene.ts` 中迁出了这一批和镜头布局直接相关的方法与逻辑：

- `getFullMapWorldBounds`
- `getPreferredDisplayBounds`
- `getMapContentBounds`
- `updateMainCameraLayout()` 里的布局计算部分

新文件：`src/game/systems/map/cameraLayout.ts`

对外固定导出：

- `computeMapContentBounds(...)`
- `computeCameraLayout(...)`

这一层现在只做两件事：

- 计算地图实际内容边界；
- 根据 viewport、地图尺寸、内容边界和配置，计算 camera 的 `viewport / zoom / bounds`。

对应地，`WorldScene.updateMainCameraLayout()` 现在只保留“调用 + 应用结果”这一步：

1. 调 `computeCameraLayout(...)`；
2. 把结果应用到 `this.cameras.main`；
3. 如已有玩家对象，再按原逻辑 `centerOn(player)`。

这样做之后，镜头缩放规则本身不再散落在场景类里，后续如果要继续调整“小地图放大”和“大地图保持 1 倍”的策略，可以优先改 `cameraLayout.ts`，不必在场景生命周期代码里反复翻找。

---

### 5. 新增 `collision.ts`，把碰撞运行时构建和查询能力收口

这次还继续把碰撞相关逻辑从 `WorldScene.ts` 中拆出，迁出的内容包括：

- `applyBlockingObjectCollisions`
- `isTileInBounds`
- `getTileCenterWorldPosition`
- `getPlayerCollisionBounds`
- `checkCollision`
- `isTileWalkable`

新文件：`src/game/systems/map/collision.ts`

对外固定导出：

- `createCollisionRuntime(...)`

返回固定能力：

- `collisionMap`
- `blockingRects`
- `isTileInBounds(...)`
- `getTileCenterWorldPosition(...)`
- `checkCollision(...)`
- `isTileWalkable(...)`

现在的职责边界变成：

- `collision.ts` 负责根据地图数据构建 collision runtime；
- runtime 内部统一处理碰撞层、blocking object、越界判定、玩家碰撞盒和 world/tile 查询；
- `WorldScene` 只在 `create()` 时初始化 runtime，并在手动移动、自动移动、点击寻路时调用 runtime 提供的查询方法。

这样后面如果还要继续拆寻路或角色移动，碰撞查询这一层已经先独立出来，不会再把 `WorldScene` 和底层碰撞细节绑得太死。

---

### 6. 新增 `pathfinding.ts`，把点击寻路逻辑继续从场景中拆出

在这一轮整理中，又从 `WorldScene.ts` 里迁出了点击寻路直接依赖的一组方法：

- `findPath`
- `rebuildPath`
- `isEventTile`
- `getTileKey`

新文件：`src/game/systems/map/pathfinding.ts`

对外固定导出：

- `findTilePath(...)`
- `getTileKey(...)`

这一层现在只负责三件事：

- tile 级路径搜索；
- 路径回溯；
- event tile 的规避权重处理。

拆分后的职责边界变成：

- `WorldScene` 只负责响应点击、拿到玩家当前 tile 和目标 tile，然后把参数交给 `findTilePath(...)`；
- `pathfinding.ts` 负责基于 `collisionRuntime` 的 `isTileInBounds(...)` / `isTileWalkable(...)` 执行搜索；
- event tile 规避逻辑继续通过 `manualEventTileKeys` 参与寻路成本排序，但不再散落在场景类内部。

这样做的好处是：

- `WorldScene` 不再同时承担“场景流程 + 寻路算法”两种职责；
- 后面如果还要继续扩自动移动、NPC 寻路、特殊地形权重，优先在 `pathfinding.ts` 里扩展，不必再回到场景类里翻旧逻辑；
- 本次保持的是“逻辑位置变化”，不是“寻路规则重写”，因此验收重点可以直接落在行为是否保持一致。

---

### 7. 新增 `tileLayerRenderer.ts`，把 tile 图层筛选与渲染继续从场景中拆出

这一轮又继续从 `WorldScene.ts` 中迁出了地图静态 tile 图层真正落到屏幕上的一段逻辑，迁出的内容包括：

- `getRenderableTileLayers`
- `renderTileLayers`

新文件：`src/game/systems/map/renderers/tileLayerRenderer.ts`

对外固定导出：

- `renderTileLayers(scene, mapData, options)`

这一层现在只负责两件事：

- 筛选可渲染的 tile layer；
- 按 layer 顺序逐张渲染 tile image。

同时按这次约定，把底层依赖统一收口到 `runtimeMapNormalizer.ts`：

- `getTilesetForTileGid(...)`
- `isKnownTransparentTileGid(...)`

对应地，`WorldScene.create()` 现在不再自己循环整张地图绘制 tile，而是只保留一层调用：

- 传入当前 `scene`；
- 传入归一化后的 `mapData`；
- 继续通过 `shouldHideAnimatedSourceLayer(...)` 跳过被世界动画替代掉的源图层。

---

### 8. 新增 `worldAnimationRenderer.ts`，把世界动画定义读取、占位解析与渲染继续从场景中拆出

这一轮又继续从 `WorldScene.ts` 中迁出了地图动画对象直接渲染相关的一组方法，迁出的内容包括：

- `getCurrentMapAnimationDefinitions`
- `getAnimationPlacementFromLayer`
- `getAnimationWorldPlacement`
- `shouldHideAnimatedSourceLayer`
- `renderRegisteredWorldAnimations`

新文件：`src/game/systems/map/renderers/worldAnimationRenderer.ts`

对外固定导出：

- `renderWorldAnimations(scene, mapData, mapId)`
- `shouldHideAnimatedSourceLayer(...)`

这一层现在只负责四件事：

- 读取当前地图在 registry 中登记的动画定义；
- 根据 object 或 source layer 计算动画对象的世界坐标；
- 判断某个 source layer 是否应该在静态渲染阶段被隐藏；
- 把已经注册过的地图动画真正渲染到场景里。

对应地，`WorldScene.create()` 现在只保留调用关系：

- 先把 `shouldHideAnimatedSourceLayer(...)` 作为 `renderTileLayers(...)` 的跳过条件传入；
- 再调用 `renderWorldAnimations(this, mapData, this.currentMapId)` 完成门、传送门与其他注册动画对象的落地渲染。

这样处理后，静态 tile 图层与动画替换层的职责边界更清楚：

- `tileLayerRenderer.ts` 负责静态层；
- `worldAnimationRenderer.ts` 负责动态动画层；
- `WorldScene` 只负责组织调用顺序，不再自己持有动画占位解析细节。

这次拆分仍然保持“行为不变”优先：

- 图层深度仍按可渲染 layer 顺序设置；
- 透明 tile 仍按原规则直接跳过；
- tileset 仍按 gid 反查；
- frame 仍使用 `tileGid - tileset.firstgid`；
- 缺 tileset / 缺纹理时仍保持原来的错误输出口径。

这样后面如果还要继续整理地图渲染部分，`WorldScene` 就不必再同时承担“场景生命周期”和“tile 图层逐格渲染”两类职责。

---

### 9. 新增 `playerPathPreviewRenderer.ts`，把自动寻路预览虚线路径从场景中拆出

这次又继续从 `WorldScene.ts` 中迁出了自动寻路预览的绘制逻辑，迁出的内容主要包括：

- `refreshAutoPathGraphics`
- `drawDashedPath`

新文件：`src/game/systems/character/playerPathPreviewRenderer.ts`

对外固定导出：

- `renderPlayerPathPreview(...)`
- `clearPlayerPathPreview(...)`

这一步最终没有合并进已有的 `pathfinding.ts`，原因是两者职责不同：

- `pathfinding.ts` 负责“路径怎么找出来”；
- `playerPathPreviewRenderer.ts` 负责“路径怎么画出来”。

如果把 Phaser 图形绘制继续塞进 `pathfinding.ts`，会把寻路算法层和表现层耦合在一起，后面无论是改寻路规则还是改预览样式，都会互相影响。

因此这次采用的边界是：

- `WorldScene` 继续持有 `autoPath`、`autoMoveTarget` 和触发时机；
- `playerPathPreviewRenderer.ts` 只消费玩家当前位置、自动路径和 tile 中心点换算方法，专心负责预览虚线的渲染与清除。

对应地，`WorldScene` 现在只保留两层很轻的调用：

- 当自动路径刷新时，调用 `renderPlayerPathPreview(...)`；
- 当路径清空时，通过同一个渲染入口或 `clearPlayerPathPreview(...)` 同步清除画面。

本次还顺手对虚线表现做了一次微调，避免预览线看起来像碎实线：

- 先把连续同方向的路径点合并，避免每格都重新切一段；
- 再按合并后的长线段绘制虚线；
- 同时把虚线块长度和间隔调大，让预览更像稳定的寻路引导，而不是零碎短划线。

这次拆分后保持不变的点包括：

- 自动寻路预览仍然跟随当前 `autoPath` 实时更新；
- 路径被清空时，预览线会同步消失；
- 预览图形仍然使用原先的 depth，不改变地图、预览线和玩家之间的层级关系。

---

### 10. 新增 `playerController.ts`，把玩家移动、朝向与点击寻路执行层从 `WorldScene.ts` 中拆出

在这一轮整理完成后，`WorldScene.ts` 里和“玩家怎么移动、怎么切方向、怎么接收点击寻路、怎么消费自动路径”直接相关的逻辑还是偏重，因此继续做了这一层拆分。

这次从 `WorldScene.ts` 中迁出的内容包括：

- `updateCharacterAnimation`
- `updateManualMovement`
- `updateAutoMovement`
- `isManualMovementInputActive`
- `handlePointerDown`
- `clearAutoPath`
- `moveTowards`
- `getPlayerTilePosition`

新文件：`src/game/systems/character/playerController.ts`

对外固定导出：

- `createPlayerController(...)`

返回固定能力：

- `update()`
- `handlePointerDown(pointer)`
- `clearAutoPath()`
- `getPlayerTilePosition()`
- `getCurrentDirection()`

这一步拆分后，职责边界进一步明确成：

- `WorldScene` 负责场景创建、地图进入、玩家对象初始化、交互事件与 UI 阻塞状态；
- `playerController.ts` 负责玩家手动移动、自动移动、朝向切换、动画切换、点击寻路入口和自动路径状态；
- `collision.ts` 继续负责移动过程中真正的碰撞判断；
- `pathfinding.ts` 继续负责点击后的 tile 路径搜索；
- `playerPathPreviewRenderer.ts` 继续只负责把当前自动路径画出来。

对应地，`WorldScene` 现在只保留很薄的一层控制关系：

1. 在 `create()` 中创建 `playerController`；
2. 把 `scene / player / cursors / collisionRuntime / manualEventTileKeys / autoPathGraphics / isUiOverlayOpen` 等运行时依赖传进去；
3. 在场景 `update()` 中调用 `playerController.update()`；
4. 在 pointer 事件中转发到 `playerController.handlePointerDown(pointer)`；
5. 在需要读取玩家所在 tile 时，改为调用 `playerController.getPlayerTilePosition()`。

这样处理后，`WorldScene` 不再同时承担“地图场景流程”和“玩家移动执行器”两套职责。后面如果要继续扩展冲刺、跟随、脚步事件、角色状态切换，优先可以在 `playerController.ts` 内推进，不必再把移动细节塞回场景类。

同时这次仍然坚持“行为不变优先”：

- 键盘移动口径保持不变；
- 鼠标点击寻路入口保持不变；
- 手动输入仍然可以打断自动寻路；
- 行走 / 待机动画切换规则保持不变；
- 朝向仍然由最后一次有效移动方向决定，不额外引入新状态机。

---

## 开发过程中遇到的问题

### 问题 1：拆出去之后，`WorldScene` 里还残留旧方法引用

**现象：**

- 第一轮拆出后，`WorldScene` 里仍然保留了旧的 `getTilesetForTileGid` / `isKnownTransparentTileGid` 相关残留实现；
- 同时 `getTilesetTextureKey()` 还在调用已经迁走的 `resolveTilesetTextureKey()`；
- 导致 TypeScript 直接报“方法不存在”。

**解决方法：**

- 继续把场景内残留的旧实现清理掉；
- 场景统一改用 `runtimeMapNormalizer.ts` 导出的查询函数；
- `WorldScene` 自身只保留一个非常轻的 `getTilesetTextureKey()`，直接从已归一化过的 tileset 上读取 `textureKey`。

这样可以避免出现“逻辑已经拆出去，但场景里还有半套旧实现没删干净”的状态。

---

### 问题 2：一开始执行了错误的构建命令

**现象：**

- 按常规习惯先执行了 `npm run build`；
- 但这个项目实际没有定义这个脚本，因此命令直接失败。

**解决方法：**

- 回看 `package.json` 后，确认当前项目实际使用的是 `npm run build:web`；
- 改用项目现有脚本完成构建校验；
- 构建成功后再作为本次拆分的代码级验证结果。

---

### 问题 3：相机布局拆出后，仍要保证“小地图放大”和“无黑边”行为不变

**现象：**

- 相机相关计算拆到独立模块后，如果只是机械迁移，很容易把“内容边界优先”和“不要额外补边距”这两个关键条件丢掉；
- 一旦边界回退逻辑或 zoom/bounds 计算顺序变了，小地图放大后就可能重新出现地图边缘黑边，或者大地图被错误缩小。

**解决方法：**

- 在 `cameraLayout.ts` 中保留原有的完整计算路径：先算 full map bounds，再算 preferred display bounds，再根据小图 / 大图配置决定 zoom 与 camera bounds；
- `computeMapContentBounds(...)` 继续使用紧边界，不额外添加 padding；
- `WorldScene.updateMainCameraLayout()` 不再自己参与布局细节，只负责应用计算结果，减少后续再次改坏的机会。

---

### 问题 4：碰撞拆出后，必须保证移动手感和寻路判断口径一致

**现象：**

- 如果只把碰撞图构建拆出去，而手动移动、自动移动、点击寻路仍然各自保留一套旧判断，就会出现“能点过去但走不过去”或者“手感变硬/变松”的问题；
- 尤其 blocking object 和越界判定，如果不同入口查询口径不一致，会比编译报错更难发现。

**解决方法：**

- 统一新增 `createCollisionRuntime(...)`，由它一次性返回所有碰撞查询能力；
- 手动移动改用 `collisionRuntime.checkCollision(...)`；
- 自动移动改用 `collisionRuntime.checkCollision(...)` 与 `collisionRuntime.getTileCenterWorldPosition(...)`；
- 点击寻路和路径扩展改用 `collisionRuntime.isTileInBounds(...)`、`collisionRuntime.isTileWalkable(...)`；
- 这样可以确保“玩家实际移动”和“路径是否可走”共用同一套底层判断标准。

---

### 问题 5：寻路拆出后，必须保证 event tile 规避优先级不变

**现象：**

- 这次拆分的不是单纯工具函数，而是带有“事件格规避权重”的路径选择逻辑；
- 如果只把搜索过程搬走，却改了返回口径或者成本排序，点击寻路虽然还能跑，但角色可能会更频繁踩到手动事件 tile；
- 这类问题通常不会直接报错，而是体现在实际点地移动时的路径选择变了。

**解决方法：**

- 保留原有的排序规则：先比较 `eventTiles`，再比较 `steps`；
- `findTilePath(...)` 继续接收 `manualEventTileKeys`，并通过 `getTileKey(...)` 判断 event tile；
- 对外统一返回数组路径，遇到目标不可达、目标不可走、越界或点击自身 tile 时都返回空路径，让 `WorldScene` 用同一个空路径分支清理自动移动状态。

这样可以保证这次拆分后，点击寻路入口变简单了，但 event tile 规避的实际行为没有被偷偷改掉。

---

### 问题 6：tile 图层渲染拆出后，必须保证 depth、透明过滤和 frame 计算完全不漂移

**现象：**

- tile layer 渲染是最容易“看起来只是搬代码，实际却把显示结果搬坏”的一层；
- 只要图层筛选顺序、透明 tile 判定、tileset 选择或 frame 计算有一点偏差，就会出现图层压错、空白块出现、纹理缺失或者 frame 对错不上的问题；
- 另外本项目还有“动画替换静态源图层”的处理，如果拆分时没有保留跳过逻辑，就会造成静态层和动画层重复显示。

**解决方法：**

- 新增 `tileLayerRenderer.ts`，只承接“筛选 + 渲染”这条职责，不把别的地图逻辑混进去；
- 可渲染图层仍按原条件筛选：必须是 `tilelayer`、`visible !== false`、且排除 collision 层；
- 透明 tile 继续统一调用 `isKnownTransparentTileGid(...)`；
- tileset 继续统一调用 `getTilesetForTileGid(...)`；
- frame 继续保持 `tileGid - tileset.firstgid`；
- `WorldScene` 继续通过 `shouldHideAnimatedSourceLayer(...)` 传入跳过条件，保证被动画替代的源图层不重复渲染。

这样可以把这次改动尽量限制在“职责迁移”，而不是“渲染规则重写”。

---

### 问题 7：世界动画拆出后，必须保证动画坐标和 source layer 隐藏口径不漂移

**现象：**

- 这次拆出去的不只是 `sprite.play(...)`，还包括“从 registry 读动画定义”“从 object 或 layer 反推出动画落点”“哪些 source layer 应该被静态渲染跳过”这几块行为；
- 只要其中一层口径改掉，就可能出现门 / 传送门位置偏半格、动画和静态图层重复显示，或者 source layer 被错误保留的问题；
- 这类问题通常编译不会报错，只会在进地图后通过实际显示暴露出来。

**解决方法：**

- 新增 `worldAnimationRenderer.ts`，把世界动画相关逻辑集中到同一个 renderer 中，避免 `WorldScene`、tile 渲染层和动画渲染层各保留半套规则；
- layer 占位解析继续保持原逻辑：仍然按目标 layer 中命中的 tile 范围反推中心点，并沿用原有的 scale / depth / origin 默认值；
- object 占位解析继续优先读取 map object，命中 object 时仍沿用 object 上的坐标和可选显示参数；
- `shouldHideAnimatedSourceLayer(...)` 继续只在“动画已注册存在 + 配置要求隐藏 source layer”时生效，避免静态层被误跳过；
- `renderTileLayers(...)` 与 `renderWorldAnimations(...)` 保持先静态、后动态的调用顺序，避免重复渲染和层级混乱。

---

### 问题 8：自动寻路预览拆出后，虚线一开始看起来像实线，而且每段过短

**现象：**

- 虽然 `drawDashedPath` 已经从 `WorldScene.ts` 迁出，但用户实际测试时发现预览线视觉上仍然偏实；
- 同时因为路径是按 tile 中心点逐格连接的，长直线路段会被切成很多短段，导致虚线块显得过碎。

**解决方法：**

- 保留独立的 `playerPathPreviewRenderer.ts`，继续把这个问题收敛在渲染层里解决，而不是回头把表现逻辑塞回场景或寻路模块；
- 先增加“连续同方向路径点合并”处理，把长直线段合并后再绘制；
- 再把 `dashLength` 和 `gapLength` 调大，让虚线块更完整、留白更明显；
- 最终由用户实际确认：自动寻路预览已经恢复成更清晰的虚线效果，且不再显得零碎。

---

### 问题 9：玩家移动逻辑拆出后，既要把 `WorldScene` 变轻，又不能把移动/寻路/动画切换拆散

**现象：**

- 如果只是把点击寻路入口单独拆走，而把手动移动、自动移动、动画切换、朝向维护继续留在 `WorldScene`，场景类依然会很重；
- 反过来如果拆得过碎，又容易让“输入判断、碰撞查询、自动路径消费、动画切换”散落到多个文件，后面更难维护；
- 这类问题不一定会立即编译报错，但很容易在实际游玩时表现成“自动寻路能走但动画不对”“手动打断了路径但朝向乱掉”这类细碎问题。

**解决方法：**

- 新增 `src/game/systems/character/playerController.ts`，把玩家控制相关逻辑按一层完整职责集中收口；
- 控制器内部统一维护 `currentDirection`、`autoPath`、`autoMoveTarget`；
- 手动移动、自动移动、动画切换、点击寻路与路径预览刷新，都通过同一个控制器执行；
- `WorldScene` 只负责创建控制器、在 `update()` 调用它、在指针事件里转发点击、在交互判定时读取玩家当前 tile。

这样一来，玩家控制逻辑被真正从场景里抽离出来，但又不会为了“拆而拆”把相关行为分裂成好几层互相回调的碎模块。

---

## 最终验证结果

本次已完成并确认：

- 已新增 `src/game/systems/map/runtimeMapNormalizer.ts`；
- 已新增 `src/game/systems/map/cameraLayout.ts`；
- 已新增 `src/game/systems/map/collision.ts`；
- 已新增 `src/game/systems/map/pathfinding.ts`；
- 已新增 `src/game/systems/map/renderers/tileLayerRenderer.ts`；
- 已新增 `src/game/systems/map/renderers/worldAnimationRenderer.ts`；
- 已新增 `src/game/systems/character/playerPathPreviewRenderer.ts`；
- 已新增 `src/game/systems/character/playerController.ts`；
- 已将第一批地图运行时归一化相关方法从 `WorldScene.ts` 中拆出；
- 已将地图内容边界与相机布局计算从 `WorldScene.ts` 中拆出；
- 已将碰撞运行时构建与查询逻辑从 `WorldScene.ts` 中拆出；
- 已将点击寻路相关方法从 `WorldScene.ts` 中拆出，并统一改为调用 `findTilePath(...)`；
- 已将 tile 图层筛选与逐层渲染逻辑从 `WorldScene.ts` 中拆出，并统一改为调用 `renderTileLayers(...)`；
- 已将世界动画定义读取、动画占位解析、source layer 隐藏判断与动画对象渲染从 `WorldScene.ts` 中拆出，并统一改为调用 `renderWorldAnimations(...)` / `shouldHideAnimatedSourceLayer(...)`；
- 已将自动寻路预览虚线路径绘制从 `WorldScene.ts` 中拆出，并统一改为调用 `renderPlayerPathPreview(...)` / `clearPlayerPathPreview(...)`；
- 已将玩家手动移动、自动移动、方向与动画切换、鼠标点击寻路入口、自动路径状态维护从 `WorldScene.ts` 中拆出，并统一收口到 `createPlayerController(...)`；
- `WorldScene.create()` 已改为调用 `normalizeRuntimeMapData(...)`；
- `WorldScene.updateMainCameraLayout()` 已改为只负责调用 `computeCameraLayout(...)` 并应用到 Phaser camera；
- `WorldScene.create()` 已改为初始化 `collisionRuntime`，后续移动与寻路都通过 runtime 查询；
- `WorldScene.create()` 已改为只传入 scene / mapData / options，由 `tileLayerRenderer.ts` 负责 tile 图层绘制；
- `WorldScene.create()` 已改为把世界动画渲染调用收口到 `worldAnimationRenderer.ts`；
- `WorldScene` 继续负责自动移动状态和触发时机，路径预览渲染细节已迁到 `playerPathPreviewRenderer.ts`；
- `WorldScene` 已改为通过 `playerController.update()` 驱动玩家移动与动画，并通过控制器转发 pointer 点击寻路；
- `WorldScene.refreshInteractionState()` 已改为优先通过 `playerController.getPlayerTilePosition()` 获取玩家当前 tile；
- 用户已实际确认：地图进入、出生点、裁边后的内容位置、对象与动画占位都没有问题；
- 用户已实际确认：小地图放大逻辑不变、大地图缩放逻辑不变、resize 后镜头正常、地图边缘没有新增黑边；
- 用户已实际确认：墙体碰撞正常、blocking object 碰撞正常、越界不可走、玩家碰撞手感不变；
- 用户已实际确认：点击可达位置能到达、点击障碍位置不移动、不可达点返回空路径、event tile 规避逻辑不变；
- 用户已实际确认：自动寻路虚线正常显示、路径清除时同步消失、渲染层级不变；
- 用户已实际确认：自动寻路预览已恢复为明显虚线，且虚线块长度不再过短；
- 用户已实际确认：键盘移动正常、鼠标点击寻路正常、手动输入可打断自动寻路；
- 用户已实际确认：行走 / 待机动画切换正常、角色朝向稳定没有乱掉；
- 用户已实际确认：tile 图层显示正常、图层深度顺序不变、透明 tile 过滤不变、没有缺纹理或错 frame；
- 用户已实际确认：门 / 传送门 / 注册动画正常显示，动画位置不偏，source layer 隐藏逻辑正常，静态层与动画层没有重复渲染；
- 本地已执行 `npm run build:web`，构建通过。

---

## 后续可继续扩展的方向

后面如果继续拆 `WorldScene`，可以沿着这次的边界继续推进，例如：

- 把地图渲染层逻辑再继续从场景里拆成独立渲染系统；
- 把对象碰撞 / blocking object 处理继续下沉；
- 在 `worldAnimationRenderer.ts` 基础上继续细化地图专属动画配置与复用策略；
- 把自动移动执行层和 pathfinding 结果消费层继续拆开，为后面 NPC 或多单位寻路预留更清晰的边界。

这样后续每次拆分都不是推翻重来，而是在这次已经整理出的职责边界上继续往前走。