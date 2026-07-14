# src/game 结构体检与组件内聚

本次整理的目标，是统一检查 `src/game` 的目录边界和扩展性隐患，重点确认两件事：

- 是否还有大量职责挤在单个文件里、路径硬编码反复出现、或不利于后续地图/事件扩展的结构；
- `src/game` 的 Vue 侧 UI 是否还从外部 `src/components` 引用组件。

检查后确认，当前 `src/game` 的核心分层已经比较稳定：地图数据集中在 `data/maps/<mapId>/`，运行逻辑主要在 `systems/`，Phaser 场景保持在 `scenes/`，Vue 视图则集中在 `views/`。这次没有为了拆而拆地图数据，也没有改动各地图的 `map.json`。

## 实现思路

### 1. 收拢 game 自用基础 UI 组件

检查发现 `src/game/views` 里仍有少量组件从外部 `src/components/base` 引入：

- `DialogBox.vue`
- `DialogChoiceList.vue`
- `GameMenuOverlay.vue`
- `GameNotificationBar.vue`
- `GameScrollArea.vue`
- `LiButton.vue`

这些组件已经实际服务游戏视图，如果继续放在外部基础组件目录，后续修改 game UI 时容易影响旧页面，也会让 `src/game` 不能自成体系。

因此本次把它们复制到：

- `src/game/views/components/base/`

并把 `src/game/views` 内的引用全部改为 game 内部路径。

### 2. 清理庄园地图中无效资源登记

构建时发现 `src/game/data/maps/liluo_estate/assets.ts` 里有两个资源路径指向不存在的文件：

- `src/assets/game/tilesets/overworld/tileset_overworld_farm_terrain.png`
- `src/assets/game/tilesets/village/tileset_fence_wood.png`

继续检查后确认：

- 对应文件当前不存在；
- `farm_terrain` 和 `fence_wood` 没有被地图数据或渲染配置引用；
- 这两项只会带来 Vite 构建警告和潜在运行时 404。

因此移除了这两项无效 manifest，以及只服务 `fence_wood` 的未使用纹理切片准备逻辑。庄园地图当前实际使用的 legacy farm tileset、cozytown 图集和传送门准备逻辑保持不变。

### 3. 同步 AGENTS 目录约定

在用户确认当前结构合理后，同步更新了 `AGENTS.md` 的 `src/game 目录约定`：

- 补充 `systems/environment/` 的职责；
- 补充 `views/components/base/` 的职责；
- 明确 `src/game` 内的 UI 不再从外部 `src/components` 引用；
- 微调 `core/`、`views/`、`data/maps/<mapId>/` 的描述，使其贴合当前实际结构。

## 相关代码路径

- `src/game/views/components/base/DialogBox.vue`
- `src/game/views/components/base/DialogChoiceList.vue`
- `src/game/views/components/base/GameMenuOverlay.vue`
- `src/game/views/components/base/GameNotificationBar.vue`
- `src/game/views/components/base/GameScrollArea.vue`
- `src/game/views/components/base/LiButton.vue`
- `src/game/views/GameView.vue`
- `src/game/views/modes/map/MapMode.vue`
- `src/game/views/modes/map/GameInfoPanel.vue`
- `src/game/views/modes/interactive-fiction/GameInteractiveFictionView.vue`
- `src/game/views/modes/interactive-fiction/GameInteractiveFictionPanel.vue`
- `src/game/data/maps/liluo_estate/assets.ts`
- `AGENTS.md`

## 遇到的问题与解决方法

### 问题 1：game 视图仍依赖外部基础组件

`src/game/views` 里还有从 `src/components/base` 引入的 UI 组件。这样会让游戏 UI 和旧页面共享同一批基础组件，长期看不利于 game 独立演进。

解决方法：

- 复制相关组件到 `src/game/views/components/base/`；
- 修改 game 内引用路径；
- 重新扫描确认 `src/game` 中不再引用外部 `src/components`。

### 问题 2：庄园地图资源登记里存在失效路径

构建时 Vite 提示两个 `new URL(...)` 路径在构建期不存在。检查后确认对应资源没有实际文件，也没有被地图使用。

解决方法：

- 移除 `farm_terrain` 与 `fence_wood` 的资源登记；
- 移除只依赖 `fence_wood` 的纹理切片准备函数；
- 重新构建确认警告消失。

### 问题 3：目录约定需要跟随实际结构更新

实际目录已经新增 `systems/environment/` 和 `views/components/base/`，但 `AGENTS.md` 仍停留在旧描述。

解决方法：

- 保持原有简练风格，只补必要边界说明；
- 避免把 AGENTS 写成详细开发文档，保证后续模型读取时负担较小。

## 验证结果

已执行：

```text
npm run build:web
```

结果通过，且原先两个资源路径警告已消失。

另外已做静态检查：

- `src/game` 中未发现继续引用外部 `src/components` 的路径；
- `src/game/core`、`src/game/systems`、`src/game/views` 中未发现具体地图 ID 硬编码或 TODO/FIXME/HACK；
- 大文件主要来自地图 `map.json`，属于地图数据本体，本次未拆分。

用户已确认本次调整没有问题，因此本轮 `src/game` 结构体检、组件内聚和目录约定同步可以视为完成。

## 素材清单

本次没有新增 `src/assets/game` 下的新素材文件，因此无需更新 `docs/游戏素材图片清单.md`。
