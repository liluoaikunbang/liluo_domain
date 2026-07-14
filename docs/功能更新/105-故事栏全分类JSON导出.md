# 故事栏全分类 JSON 导出

## 本次实现思路

本次更新继续完善旅途菜单“故事”栏的导出能力。

此前故事栏已经支持在画布中的单个分类节点上点击 `导出JSON`，导出该分类下的故事树。本次在故事栏顶部控制区新增两个全分类导出入口：

- `导出简练JSON`
  - 导出所有故事分类。
  - 保留分类、节点路径、父子关系、元信息和去掉 `children` 后的节点 JSON 快照。
  - 递归移除 `detailMarkdown`，文件更轻，适合做大纲核对、元信息整理或交给外部工具分析。
- `导出完整JSON`
  - 同样导出所有故事分类。
  - 保留 `detailMarkdown` 正文内容，适合做完整备份或把当前运行时合成后的故事大纲整体带走。

两个导出都基于运行时的 `storyOutline` 数据。当前 `storyOutline` 由 `sources/` 下的故事大纲源、`storyOutlineTreeBuilder.js` 生成的树结构，以及 Markdown frontmatter、正文共同合成。这样导出的内容和故事栏实际展示保持一致，而不是只导出某一个底稿文件。

---

## 相关代码路径

- `src/game/views/components/base/StoryMenuPanel.vue`
  - 在故事栏顶部控制区增加 `导出简练JSON`、`导出完整JSON` 两个按钮。
  - 新增 `exportAllStoryJson()` 作为全分类导出入口。
  - 新增 `createAllStoryExportPayload()` 生成全量导出结构。
  - 复用分类导出的节点扁平化逻辑，并新增 `flattenExportOutlineNodes()` 支持多个顶层分类。
  - 将下载逻辑抽成 `downloadJsonPayload()`，供分类导出和全量导出共用。
  - 通过 `stripExportMarkdown()` 控制简练版是否递归移除 `detailMarkdown`。

- `src/game/views/components/base/gameMenuOverlay.css`
  - 增加故事栏顶部全量导出按钮组样式。
  - 补充窄屏下按钮组换行后的对齐规则。

---

## 具体实现说明

### 1. 全量导出结构

全量导出的 payload 包含：

- `exportType`
  - 简练版为 `story-outline-summary`
  - 完整版为 `story-outline-full`
- `exportedAt`
  - 导出时间。
- `includeMarkdown`
  - 标记本次导出是否包含 Markdown 正文。
- `categories`
  - 所有顶层分类的导出条目。
- `tree`
  - 所有顶层分类组成的树形结构。
- `nodes`
  - 所有分类下节点的扁平列表，保留 `depth`、`parentKey`、`parentTitle`、`path`、`childKeys`、`meta` 和节点 JSON 快照。

文件名分别为：

- `liluo-story-outline-summary.json`
- `liluo-story-outline-full.json`

### 2. 简练版只移除正文，不破坏结构

简练版导出不是重新构造一套弱化数据，而是在原有可序列化节点基础上递归移除 `detailMarkdown`。

这样可以保留：

- 节点 key、标题、状态、简介、标签等元信息。
- `detailSourcePath`，方便知道正文来自哪个 Markdown 文件。
- `children` 结构和扁平节点中的父子关系。

同时避免把大量 Markdown 正文塞进简练导出文件里。

### 3. 分类导出复用下载逻辑

原本分类导出函数自己创建 `Blob`、`objectUrl` 和临时 `<a>` 标签。

本次把这段逻辑抽为 `downloadJsonPayload()`，分类导出和全量导出都调用同一个函数，减少后续维护时出现两个下载实现不一致的可能。

---

## 开发过程中遇到的问题

### 问题 1：全分类导出不能只取当前视图节点

**现象：**

故事栏画布和表格都存在折叠、占位节点、布局节点等运行时展示状态。如果直接导出当前布局节点，会把“已收回块数”之类的 UI 临时信息混进故事数据。

**解决方法：**

全量导出直接读取 `props.outline`，也就是故事栏收到的真实故事大纲数据。布局节点仍只用于展示，不参与导出数据源。

### 问题 2：简练版需要保留元信息，但不能带 Markdown 正文

**现象：**

运行时节点中 `detailMarkdown` 和元信息字段混在同一个节点对象里。如果直接克隆节点，简练版会把正文也导出去；如果手写字段白名单，又容易漏掉后续新增的元信息字段。

**解决方法：**

采用“完整克隆后递归删除 `detailMarkdown`”的方式。这样新增字段默认会被保留，只有正文被明确裁掉。

### 问题 3：导出按钮需要和已有故事栏控制区共存

**现象：**

故事栏顶部已经有布局模式按钮和画布缩放按钮，新增两个导出按钮后，如果没有单独样式，窄屏下容易挤压或错位。

**解决方法：**

为全量导出单独增加 `story-export-controls` 和 `story-export-control-button` 样式。桌面端靠右显示，窄屏时跟随头部纵向排列并左对齐。

---

## 验证结果

- 本地构建验证通过：`npm run build:web`
- 用户已实际测试两个导出按钮，确认无报错。
- 本次没有新增或修改 `src/assets/game` 下的素材图片。

构建过程中仍出现既有的 `student1.png` 运行时资源提示，该提示不是本次故事栏全分类 JSON 导出功能引入的问题。
