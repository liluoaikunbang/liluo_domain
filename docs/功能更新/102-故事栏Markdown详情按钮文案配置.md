# 故事栏 Markdown 详情按钮文案配置

## 本次实现思路

本次更新的是旅途菜单“故事”栏中 Markdown 正文入口的按钮文案。

原本有 Markdown 正文的故事节点统一显示“大纲”按钮。现在改为由对应 Markdown 文件的 YAML front matter 决定按钮文案：

- 未配置时默认显示“大纲”。
- 配置 `detailLabel` 后，故事画布节点和表格节点都会显示该字段指定的文案。

这样不同类型的故事资料可以在不修改 Vue 组件的情况下，按单个 Markdown 文件调整入口名称。

## 相关代码路径

- `src/game/data/story_outline/storyOutlineFrontmatter.js`
  - 在 Markdown front matter 可覆盖字段中加入 `detailLabel`。
  - 合成故事大纲时，把 `detailLabel` 写入对应故事节点。

- `src/game/views/components/base/StoryMenuPanel.vue`
  - 详情按钮显示 `node.detailLabel`。
  - 未配置 `detailLabel` 时通过 `getDetailLabel()` 回落为“大纲”。
  - 画布模式和表格模式共用同一套文案来源。

- `scripts/tests/story-outline-frontmatter.test.mjs`
  - 补充 `detailLabel` 从 Markdown YAML 覆盖到故事节点的断言。

## 开发过程中遇到的问题

### 1. 按钮文案不应继续写死在组件里

**现象：**

故事栏正文入口此前由组件固定显示“大纲”，所有节点只能使用同一个按钮文案。

**解决方法：**

把按钮文案抽成 `detailLabel` 字段，由 Markdown YAML 提供；组件只负责读取并展示，缺省时再回落到“大纲”。

### 2. 两种展示模式需要保持一致

**现象：**

故事栏同时有画布模式和表格模式，如果只改其中一处，会出现同一个节点在不同模式下按钮文案不一致。

**解决方法：**

在 `StoryMenuPanel.vue` 的节点布局数据和表格行数据中都保留 `detailLabel`，两个按钮都使用同一字段渲染。

## 验证结果

已运行：

```powershell
node .\scripts\tests\story-outline-frontmatter.test.mjs
```

结果通过，确认 `detailLabel` 可以从 Markdown YAML 正确覆盖到故事节点。

本次没有新增或修改 `src/assets/game` 下的素材图片。
