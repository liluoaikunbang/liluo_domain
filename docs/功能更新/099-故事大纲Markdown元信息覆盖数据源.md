# 故事大纲 Markdown 元信息覆盖数据源

## 本次实现思路

本次调整的是旅途菜单“故事”栏的数据维护方式。

原本故事栏直接读取 `storyOutlinePlaceholder.json`。这样结构和展示信息都集中在 JSON 里，后续补充剧情块时，需要同时维护 Markdown 正文和 JSON 元信息，容易出现两边不一致。

现在改为双层数据源：

- `storyOutlinePlaceholder.json` 继续负责故事树结构、节点顺序、父子关系和白板布局相关字段。
- `story_outline` 目录下的 Markdown 文件负责可编辑的节点展示元信息。
- 前端通过 `storyOutline.js` 合成最终故事大纲，先读取 JSON 结构，再用同名 Markdown 的 YAML front matter 覆盖可展示字段。

这样后续日常维护剧情块时，优先改 Markdown 文件即可；JSON 主要在新增、移动、整理节点结构时才需要改。

## 相关代码路径

- `src/game/data/story_outline/storyOutlinePlaceholder.json`
  - 故事大纲结构源。
  - 保留节点顺序、层级、`children`、`branchLayout`、`questType` 等结构或布局信息。

- `src/game/data/story_outline/<worldDir>/<编号>-<标题>.md`
  - 单个剧情块的正文与 YAML 元信息。
  - YAML 字段名统一使用 JSON 同名字段，减少来回核对成本。

- `src/game/data/story_outline/storyOutlineFrontmatter.js`
  - 解析 Markdown front matter。
  - 根据目录和文件标题匹配 JSON 节点。
  - 用 Markdown YAML 中的同名字段覆盖 JSON 节点展示信息。

- `src/game/data/story_outline/storyOutline.js`
  - 使用 `import.meta.glob('./**/*.md', { query: '?raw' })` 收集 Markdown 原文。
  - 导出合成后的 `storyOutline`。

- `src/game/views/components/base/GameMenuOverlay.vue`
  - 故事栏改为使用 `storyOutline`，不再直接把裸 JSON 传给 `StoryMenuPanel`。

- `scripts/tests/story-outline-frontmatter.test.mjs`
  - 校验 Markdown YAML 会覆盖展示字段。
  - 校验结构字段仍保留 JSON 原值。

## 当前字段约定

Markdown YAML 中用于覆盖前端展示的字段，与 JSON 保持同名：

- `world`
- `storyTags`
- `status`
- `summary`
- `foreshadowing`
- `tags`
- `specialGameplay`
- `characters`
- `requiredAbilities`
- `locations`
- `reference`

Markdown 自用字段可以继续保留，例如：

- `doc_type`
- `time_number`
- `domain_type`
- `timeline`
- `foreshadowing_begin`
- `foreshadowing_end`

这些字段目前不会写回故事栏节点，也不会覆盖 JSON。

## 开发过程中遇到的问题

### 1. 旧字段名和 JSON 字段名不一致

**现象：**

早期 Markdown YAML 使用过 `introduction`、`play_tags`、`features`、`role`、`place` 等字段名，前端 JSON 则使用 `summary`、`tags`、`specialGameplay`、`characters`、`locations`。

这会导致维护时需要记一套额外映射关系。

**解决方法：**

统一把 Markdown YAML 字段改成 JSON 同名字段，并把覆盖逻辑简化为“同名覆盖”。这样编辑 Markdown 时看到的字段名，和前端节点数据字段一致。

### 2. JSON 仍需要保留结构职责

**现象：**

如果完全从 Markdown 推导故事树，会丢失节点顺序、父子关系、侧向分支和白板布局等结构信息。

**解决方法：**

JSON 继续作为结构源。Markdown 只覆盖可展示的元信息，不覆盖 `children`、`branchLayout`、`questType` 等结构字段。

### 3. 文件名需要稳定匹配节点

**现象：**

Markdown 文件已经按目录内顺序编号，例如 `2-紧缚社团.md`。编号便于人工查找，但 JSON 节点标题可能是更完整的标题。

**解决方法：**

匹配时会去掉文件名前缀编号，再按标题匹配。对于标题存在轻微差异的情况，保留了“标题互相包含”的兜底匹配。

## 验证结果

已执行：

```bash
node .\scripts\tests\story-outline-frontmatter.test.mjs
```

结果：通过。

已执行：

```bash
npx vite build --outDir dist-story-outline-check --emptyOutDir
```

结果：构建通过，临时输出目录已删除。

默认 `npm run build:web` 曾被当前 `dist` 文件占用阻塞，因此本次使用临时输出目录验证代码构建。构建过程中仍出现既有 `student1.png` 路径 warning，不是本次故事大纲数据源调整引入的问题。

本次没有新增或修改 `src/assets/game` 下的素材图片。
