# 故事栏 Markdown 正文详情弹层

## 本次实现思路

本次是在 `099-故事大纲 Markdown 元信息覆盖数据源` 的基础上，继续让旅途菜单“故事”栏真正使用 Markdown 正文。

原本故事栏已经可以从 Markdown YAML front matter 覆盖节点元信息，但正文仍然只存在于文件里，玩家在故事栏中只能看到节点标题、概要、标签和右上角元信息。现在调整为：

- 如果某个故事节点能匹配到对应 Markdown 文件，并且 Markdown 去掉 YAML 后仍有正文，就在节点右上角显示“详情”按钮。
- 点击“详情”后，在旅途菜单内弹出占满菜单区域的详情框。
- 详情框顶部居中显示节点标题，正文按段落展示，不包含 YAML front matter。
- 正文段落使用两端对齐和首行缩进两格，阅读上更接近正式剧情文本。

这样故事栏仍然优先承担“故事树结构浏览”的职责，而 Markdown 正文作为按需展开的详情层，不会把每个节点卡片挤成资料页。

## 相关代码路径

- `src/game/data/story_outline/storyOutlineFrontmatter.js`
  - 新增 `parseMarkdownBody(markdown)`。
  - 在收集 Markdown 时同时保存 `detailMarkdown` 与 `detailSourcePath`。
  - 节点匹配成功后，把去掉 YAML 的正文写入合成后的故事节点。

- `src/game/views/components/base/StoryMenuPanel.vue`
  - 节点右上角在存在 `detailMarkdown` 时显示“详情”按钮。
  - 表格视图中也为有正文的节点补充“详情”入口。
  - 新增 `activeDetailNode`、`openDetail()`、`closeDetail()` 和详情弹层渲染。
  - 新增 `splitDetailParagraphs()`，把正文按连续换行拆成段落。
  - 详情弹层支持点击背景关闭、关闭按钮关闭和 `Esc` 关闭。

- `src/game/views/components/base/gameMenuOverlay.css`
  - 为右上角 `元信息 / 详情` 入口组补充布局。
  - 让“详情”按钮视觉上与“元信息”入口保持一致，但保留按钮的手型鼠标样式。
  - 补充全屏详情弹层、居中标题、滚动正文、两端对齐、首行缩进等样式。
  - “元信息”仍是悬浮提示入口，不使用按钮手型鼠标样式。

## 开发过程中遇到的问题

### 1. Markdown 正文不能把 YAML 一起显示出来

**现象：**

`import.meta.glob(..., { query: '?raw' })` 读取的是完整 Markdown 原文。如果直接展示，会把开头的 `---` 和 YAML 字段一起显示到详情框里。

**解决方法：**

在 `storyOutlineFrontmatter.js` 中新增 `parseMarkdownBody()`：

- 没有 YAML 时直接返回全文正文。
- 有 `---` 包裹的 YAML 时，从第二个 `---` 后开始截取。
- 最终对正文做 `trim()`，避免详情开头多出空白。

### 2. 详情入口只应该出现在有正文的真实节点上

**现象：**

故事栏有分类、主线任务、折叠占位节点等结构性节点。它们有时也有元信息或状态，但不一定对应可读正文。如果无差别显示“详情”，会让玩家点到空弹层。

**解决方法：**

只在节点存在 `detailMarkdown` 时渲染“详情”按钮。折叠占位节点在布局数据里不带 `detailMarkdown`，因此不会出现详情入口。

### 3. 正文不能继续用整块 `pre`

**现象：**

初版详情用 `pre` 保留原始换行，能保证 Markdown 原文不丢失，但无法稳定做到中文正文的首行缩进与两端对齐。故事正文通常是一行一段，整块 `pre` 也不适合长期阅读。

**解决方法：**

在 `StoryMenuPanel.vue` 中把正文拆成段落数组，再用 `<p>` 渲染：

- `splitDetailParagraphs()` 按连续换行拆段。
- `.story-detail-paragraph` 使用 `text-indent: 2em`。
- `.story-detail-paragraph` 使用 `text-align: justify` 和 `text-justify: inter-ideograph`。

### 4. “元信息”和“详情”虽然并排，但交互语义不同

**现象：**

“详情”是点击打开弹层的按钮；“元信息”只是悬浮提示入口。两者外观需要统一，但鼠标样式不能完全一样，否则会暗示“元信息”也可点击。

**解决方法：**

两者共享相近的边框、渐变底、文字颜色和阴影。最终保留：

- “详情”：`cursor: pointer`。
- “元信息”：`cursor: default`，鼠标悬停时只显示元信息浮层，不额外改变按钮本体样式。

## 验证结果

已执行：

```bash
npm run build:web
```

结果：构建通过。

构建过程中仍出现既有提示：

```text
new URL("../../../../../assets/game/sucai/Modern/school/NPCs/student1.png", import.meta.url) doesn't exist at build time
```

该提示不是本次故事栏 Markdown 正文详情弹层引入的问题。

已单独验证 `src/game/data/story_outline/1-modern/2-紧缚社团.md` 的正文读取结果：

- 文件能被 `1-modern` 目录和 `2-紧缚社团.md` 标题匹配到故事节点。
- `parseMarkdownBody()` 返回结果不再包含 YAML front matter。
- 正文开头为实际剧情文本。

用户已在界面中继续反馈并确认样式细节，因此本篇作为该功能完成后的文档记录。

本次没有新增或修改 `src/assets/game` 下的素材图片。
