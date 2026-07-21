# 验证规则

检查 `story_outline/sources/*.json` 的解析、key 唯一、parentKey 与循环；检查 Markdown 文件名、标题、frontmatter key；检查注册表所引用地图文件和事件/对话 JSON；调用已有故事、事件、对话、存档及 updateRecords 测试。

`changed` 依赖 Git 路径，`world --world <目录>` 限定故事世界，`all` 扫描全部静态数据。候选或制作源素材不作为正式运行时资源。
