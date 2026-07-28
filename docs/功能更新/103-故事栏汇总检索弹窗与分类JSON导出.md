# 故事栏汇总检索弹窗与分类JSON导出

## 2026-07-27 更新

故事栏的汇总卡、汇总匹配弹窗和表格列已统一到当前结构化引用：

- 情节引用：`plotRefs`
- RAG 引用：`ragRefs`
- 玩法引用：`gameplayRefs`

界面不再展示“紧缚标签”“情节标签”以及 `tags`、`plotTags`、`bondageTags`、`specialGameplay` 等退役字段。下文保留的是 2026-05-23 初版实现过程，仅用于历史追溯，不代表当前字段契约。

## 本次实现思路

这次更新集中在旅途菜单的故事栏功能体验上，不记录剧情内容本身的增删移动。

主要目标有两类：

1. 在纵向和横向故事视图中，让每个分类节点都能导出该分类下所有节点的结构化 JSON 信息。
2. 在汇总视图中，让用户点击某个汇总值后，可以弹出匹配条目表格，并在表格中直观看到命中的关键词。

实现上继续沿用 `StoryMenuPanel` 作为故事栏视图的统一入口，没有新建额外数据源。故事树仍然来自 `storyOutline`，也就是 `storyOutlinePlaceholder.json` 加 Markdown frontmatter 动态覆盖后的运行时结果。

---

## 相关代码路径

- `src/game/views/components/base/StoryMenuPanel.vue`
  - 给纵向和横向分类节点增加 `导出JSON` 按钮
  - 增加分类导出 payload 生成逻辑
  - 增加汇总项点击后的匹配弹窗
  - 增加匹配表格的文件名、状态、tags、specialGameplay、简介展示
  - 增加当前关键词的片段高亮渲染

- `src/game/views/components/base/gameMenuOverlay.css`
  - 增加分类导出按钮样式
  - 增加汇总弹窗、表格、按钮 hover/focus 样式
  - 修复弹窗表头 sticky 时顶部空隙露出滚动内容的问题
  - 增加关键词片段高亮样式

- `src/game/data/story_outline/storyOutline.js`
  - 确认故事栏实际读取的是 Markdown frontmatter 覆盖后的 `storyOutline`

- `src/game/data/story_outline/storyOutlineFrontmatter.js`
  - 确认 Markdown frontmatter 会覆盖 JSON 底稿中的同名字段

---

## 具体实现说明

### 1. 分类节点支持导出 JSON

纵向和横向故事视图中的分类节点右上角增加了 `导出JSON` 按钮。

点击后会导出当前分类节点对应的完整数据，包含：

- 分类节点自身信息
- 子节点树结构
- 扁平化节点列表
- key、title、层级、父节点、路径
- meta 元信息
- childKeys 等结构信息

表格视图不显示该按钮，避免在密集表格中增加额外操作负担。

---

### 2. 汇总视图的统计项可以点击

汇总视图中，原本只是静态显示 `值（数量）`。

现在每个统计项都是可点击按钮。点击后会打开一个弹窗，展示当前分类中所有匹配该字段值的条目。

弹窗表格目前展示：

- 文件名
- 状态
- tags
- specialGameplay
- 简介

标题列和路径列已经移除，让表格更聚焦于检索与元信息核对。

---

### 3. 弹窗居中与表头滚动修复

弹窗改为在遮罩层中居中显示，并限制最大宽高。

表格内容较多时，滚动发生在弹窗内部。表头使用 sticky 固定在滚动区域顶部。

开发中发现，通用 `.story-detail-content` 的 `padding: 16px` 会让 sticky 表头和内容区顶部之间出现空隙，滚动时表格内容会从空隙中露出。

最终通过更高权重的专用规则修复：

```css
.story-detail-content.story-summary-match-content {
  padding: 0 16px 16px;
}
```

这样匹配弹窗的表格可以贴住滚动区域顶部，同时保留左右和底部留白。

---

### 4. 关键词片段高亮

汇总弹窗中的高亮规则最终统一为：

只要展示文本中包含当前点开的关键词，就只高亮关键词本身，前后其它文字保持正常颜色。

该规则适用于弹窗表格中的所有展示列：

- 文件名
- 状态
- tags
- specialGameplay
- 简介

这避免了整格高亮过重的问题，也能处理 `社死-教室被绑` 这类复合标签场景：点击 `社死` 时，只高亮文本中的 `社死`；点击 `教室被绑` 时，只高亮 `教室被绑`。

---

### 5. 明确 JSON 底稿与 Markdown 覆盖关系

排查时确认，故事栏不是直接只读 `storyOutlinePlaceholder.json`。

当前实际链路是：

1. `storyOutlinePlaceholder.json` 提供故事树结构和底稿字段。
2. `storyOutline.js` 通过 `import.meta.glob('./**/*.md')` 读取所有 Markdown。
3. `applyStoryOutlineFrontmatter` 按世界目录和标题匹配 Markdown。
4. 匹配成功后，Markdown frontmatter 会覆盖 JSON 中的同名元信息字段。

因此 JSON 中可能仍残留旧的默认值，但运行时故事栏应以 Markdown frontmatter 覆盖后的数据为准。

---

## 开发过程中遇到的问题

### 问题 1：汇总弹窗一开始只能看到匹配条目，缺少来源文件信息

**现象：**

点击汇总项后，用户只能看到条目标题和部分元信息，不方便回到 Markdown 文件继续编辑。

**解决方法：**

从节点的 `detailSourcePath` 中提取 Markdown 文件名，作为弹窗第一列显示。后续根据使用体验移除了路径列，只保留文件名。

---

### 问题 2：表头固定后仍有顶部空隙

**现象：**

表头是固定的，但表头与弹窗内容区顶部之间有空隙。滚动时，下方内容会从空隙露出来。

**原因：**

匹配弹窗复用了通用详情弹窗内容区，而通用内容区有 `padding: 16px`。

第一次添加的专用 padding 规则写在通用规则前面，被后面的 `.story-detail-content` 覆盖。

**解决方法：**

把专用规则放到通用规则之后，并提高选择器权重：

```css
.story-detail-content.story-summary-match-content {
  padding: 0 16px 16px;
}
```

---

### 问题 3：高亮规则需要从“整格高亮”改成“关键词片段高亮”

**现象：**

最初高亮的是当前点击字段对应的整列，随后又改成完全匹配的整格高亮。

但复合字段例如 `社死-教室被绑` 中，用户需要看的是关键词本身在哪里命中，而不是整项是否完全相等。

**解决方法：**

新增文本分段逻辑，把展示文本按当前关键词切分为普通片段和命中片段。

渲染时只给命中片段加 `.story-summary-match-keyword` 样式，所有展示列统一使用该规则。

---

### 问题 4：JSON 中的旧值容易造成误判

**现象：**

`storyOutlinePlaceholder.json` 中部分 `specialGameplay` 仍是旧短标签，例如 `教室被绑`；但对应 Markdown 中已经是 `社死-教室被绑`。

**原因：**

JSON 是故事树底稿，Markdown frontmatter 才是当前可编辑元信息来源之一。运行时会覆盖，但直接看 JSON 会看到旧值。

**解决方法：**

确认 `storyOutline.js` 的运行时数据确实经过 `applyStoryOutlineFrontmatter` 覆盖，并用脚本验证 `柔韧性练习` 运行时读取到的是 `社死-教室被绑`。

后续如果需要彻底减少误判，可以另开任务把 JSON 底稿和 Markdown frontmatter 做一次同步整理。

---

## 最终验证结果

- 本地构建验证通过：`npm run build:web`
- 用户已在界面中持续反馈并确认弹窗、表头、列展示和高亮规则的实际表现问题
- 当前功能记录只覆盖故事栏功能更新，不包含本轮剧情内容节点和 Markdown 内容本身的增删改
