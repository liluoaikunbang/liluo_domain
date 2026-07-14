# 默认主角立绘 partial 自动拼装与背面预览

## 本次实现思路

本次把主角默认左侧立绘从固定使用 `LiLuo.png`，调整为优先从 `src/assets/game/standee/partial/` 中自动寻找可拼装的正面 partial 素材。

默认正面立绘需要同时找到以下三类素材：

1. 文件名包含 `素体-上身`，且不包含 `后背`。
2. 文件名包含 `素体-下身`，且不包含 `后背`。
3. 文件名包含 `通用-头部`，且不包含 `后背`。

素材文件名中的 `(x-x)` 用作图层排序信息：前一个数字表示组图层，优先级最高；后一个数字表示组内图层，只在组图层一致时比较。排序结果从低到高渲染，数字越大越靠上。

如果三类正面素材任意一类缺失，默认立绘会回退到 `src/assets/game/standee/LiLuo.png`，避免只显示半套身体或空白立绘。

在正面拼装完整后，系统会根据每个正面图层的关键词继续寻找对应的 `后背` 图层。只有所有正面图层都能找到匹配的后背图层时，才会生成右上角背面预览。背面预览使用后背图层自己的 `(x-x)` 层级重新排序，不沿用正面顺序。

背面预览会显示在主角立绘面板右上角，并同步到旅途菜单人物栏。预览框按当前 partial 素材画布比例 `457 / 1024` 设置，只比图层画布多少量内边距，让背面图居中显示，尽量不遮挡主立绘。

---

## 相关代码路径

- `src/game/data/dialoguePortraitLayerRules.ts`
  - 新增默认立绘 partial 解析规则。
  - 负责关键词筛选、排除后背正面候选、解析 `(x-x)` 图层、选择默认头部候选、生成正面与背面图层集合。
  - 当正面三类关键图层不完整时返回空正面层，让默认立绘回退到 `LiLuo.png`。

- `src/game/data/dialoguePortraits.ts`
  - 使用 `import.meta.glob` 收集默认主角立绘需要的 partial PNG。
  - 默认 `liLuoDefault` 同时保留 `src: LiLuo.png` 和自动生成的 `layers`。
  - 新增 `backLayers` 字段，并把背面图层加入全局立绘资源 bundle。

- `src/game/views/shell/GamePortraitPanel.vue`
  - 左侧主角立绘面板支持 `portraitBackLayers`。
  - 在右上角渲染缩小后的背面预览框。

- `src/game/views/shell/GameShell.vue`
  - 透传主角背面预览图层。

- `src/game/views/modes/map/MapMode.vue`
  - 地图模式继续向游戏外壳传递主角正面图层与背面图层。

- `src/game/views/GameView.vue`
  - 从当前运行时主角立绘中拆出 `playerPortraitLayers` 和 `playerPortraitBackLayers`。
  - 互动小说覆盖立绘时不显示默认主角背面预览，避免不同模式表现混杂。

- `src/game/views/components/base/CharacterMenuPanel.vue`
  - 旅途菜单人物栏同步支持背面预览。

- `src/game/views/components/base/gameMenuOverlay.css`
  - 为人物栏背面预览补充比例框、边框、居中和层叠样式。

- `scripts/tests/default-player-portrait-layers.test.mjs`
  - 覆盖默认正面拼层、缺 partial 回退、背面图层缺失时不显示背面预览等规则。

---

## 开发过程中遇到的问题

### 问题 1：默认头部可能匹配到多个候选

**现象：**

`通用-头部` 当前会匹配到丸子头和高马尾等多个正面头部素材。如果全部叠上去，会出现多个头部同时显示。

**解决方法：**

在默认立绘规则中为 `通用-头部` 设置默认候选优先级，当前优先选择 `通用-头部-高马尾+脖颈`。如果该候选不存在，再回退到同类候选中按层级排序后的第一个。

### 问题 2：正面 partial 不完整时不能显示半套立绘

**现象：**

如果只找到下身和头部，却找不到上身，继续渲染 partial 会出现残缺立绘，比直接回退单张默认图更糟。

**解决方法：**

`resolveDefaultPlayerPortraitLayerSet()` 要求三类正面关键层全部存在，否则返回空 `layers`。由于默认 portrait 仍保留 `src: LiLuo.png`，现有渲染逻辑会自然回退到完整默认图。

### 问题 3：正面关键词与背面文件名不完全一致

**现象：**

正面头部素材名中带有 `脖颈`，背面头部素材名中没有同样的词，直接用完整文件名片段匹配会导致背面头部永远找不到。

**解决方法：**

背面匹配时先把正面文件名拆成关键词，并忽略 `后背` 与 `脖颈` 等不适合用于背面匹配的词。然后要求候选背面文件同时包含剩余关键词和 `后背`。

### 问题 4：背面预览框和图片比例不匹配

**现象：**

最初背面预览框按面板百分比设置，框体较大且宽高比和 partial 素材画布不一致，看起来像空框或遮挡主立绘。

**解决方法：**

检查 partial 素材后确认背面相关图层统一为 `457x1024` 画布。预览框改为 `aspect-ratio: 457 / 1024`，只留少量内边距，并让图层在框内居中叠加。

---

## 验证结果

- `node scripts\tests\default-player-portrait-layers.test.mjs` 通过。
- `npm run build:web` 通过。
- 用户已在实际运行中反馈并调整背面预览大小与框体表现，确认需要写入文档。
- 构建过程中仍出现既有的旧 partial 路径提示和 `student1.png` 路径提示，这些提示不是本次默认主角立绘自动拼装逻辑引入的问题。

