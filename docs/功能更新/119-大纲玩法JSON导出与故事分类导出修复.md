# 大纲玩法 JSON 导出与故事分类导出修复

本次为旅途菜单“大纲”栏中的玩法总表增加完整 JSON 导出，并修复故事分类节点点击“导出JSON”时报错、无法下载的问题，方便后续把故事与玩法资料交给其他 AI 查看和补充。

## 实现思路

1. 在玩法总表工具栏增加“导出JSON”按钮，导出完整玩法目录，而不是只导出当前搜索或筛选结果。
2. 玩法导出数据增加类型、导出版本、导出时间、分类数量和玩法数量等自描述元数据，并在 `catalog` 中保留分类、玩法条目、细分玩法、适配方式和设计参考。
3. 把故事与玩法共用的浏览器 JSON 下载逻辑整理到基础组件目录，统一生成 UTF-8 JSON Blob 和下载链接。
4. 下载触发后延迟清理临时链接与 Blob URL，避免浏览器尚未接管下载时资源就被同步撤销。
5. 故事分类导出继续按节点 key 从完整故事树查找真实节点，保证都市等分类会连同后代节点完整导出。

## 相关代码路径

- `src/game/data/gameplay_outline/gameplayOutline.js`
  - 生成带元数据和完整玩法目录的导出对象。
- `src/game/views/components/base/GameplayMenuPanel.vue`
  - 提供玩法总表“导出JSON”入口。
- `src/game/views/components/base/StoryMenuPanel.vue`
  - 处理故事全量与分类 JSON 导出，并补齐分类节点查找函数的导入。
- `src/game/views/components/base/jsonDownload.js`
  - 提供故事与玩法共用的 UTF-8 JSON 下载能力，并延迟清理 Blob URL。
- `scripts/tests/gameplay-outline.test.mjs`
  - 验证玩法导出结构、数量和数据副本。
- `scripts/tests/json-download.test.mjs`
  - 验证下载资源清理顺序，以及故事分类导出调用的节点查找函数已正确导入。

## 开发过程中遇到的问题

### 1. 都市分支点击导出后抛出 ReferenceError

问题：`StoryMenuPanel.vue` 的 `exportCategoryJson` 调用了 `findOutlineNodeByKey`，但组件没有从 `storyOutlineExport.js` 导入该函数。点击“浮光掠影（都市）”节点的导出按钮时，浏览器因此报出 `Uncaught ReferenceError: findOutlineNodeByKey is not defined`，导出流程在查找分类节点前就被中断。

解决：在故事面板的导入列表中补回 `findOutlineNodeByKey`，并增加源码回归测试，同时检查函数调用与导入是否存在，防止以后整理 import 时再次遗漏。

### 2. 都市分支数据曾被误判为下载阶段问题

问题：排查时确认都市分支能够正常生成 58 个节点、约 72 KB 的合法 JSON，说明数据本身没有循环引用或非法值。初步只发现旧下载逻辑会在 `link.click()` 后立即撤销 Blob URL，但用户提供的控制台堆栈进一步证明，本次点击完全失效的直接原因是缺失导入。

解决：以实际控制台堆栈为准修复缺失导入；同时保留延迟撤销 Blob URL 的兼容性调整，解决不同浏览器接管下载时机不一致的潜在问题。文档明确区分直接根因与兼容性改进，不把两者混为一谈。

### 3. 故事与玩法分别维护下载代码容易再次出现差异

问题：玩法导出最初复制了故事面板中的 Blob 下载代码。两处独立实现会让文件编码、清理时机和后续错误处理逐渐不一致。

解决：提取 `jsonDownload.js`，故事与玩法面板只负责生成各自的导出内容和文件名，下载生命周期由同一函数维护。

## 验证结果

- 玩法导出对象包含完整玩法目录和自描述元数据；
- “浮光掠影（都市）”分类可查找到 58 个故事节点并成功序列化；
- `findOutlineNodeByKey` 已由故事面板显式导入；
- JSON 下载链接会在浏览器接管后再清理；
- `scripts/tests/gameplay-outline.test.mjs` 与 `scripts/tests/json-download.test.mjs` 相关测试通过；
- `npm run build:web` 生产构建通过；
- 构建仍会提示项目已有的 `student1.png` 运行时路径警告，本次改动未引入新的构建错误。
