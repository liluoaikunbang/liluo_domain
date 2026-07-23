# 璃落项目知识索引

本目录是导航、缓存与关系检索层，不是正式权威来源。索引版本 1，当前状态：partial。

| 领域 | 记录数 | 入口 |
|---|---:|---|
| story | 160 | `story/SUMMARY.md` |
| gameplay | 108 | `gameplay/SUMMARY.md` |
| game | 45 | `game/SUMMARY.md` |
| code | 148 | `code/SUMMARY.md` |
| assets | 691 | `assets/SUMMARY.md` |
| docs | 266 | `docs/SUMMARY.md` |
| graph | 160 | `graph/SUMMARY.md` |

## 最小读取建议

- 故事节点与父子关系：story；玩法：gameplay；地图/事件/对话：game；代码入口：code；素材路径：assets；系统文档：docs；反向引用：graph。
- 重要事实和任何正式修改前，必须打开记录指向的原始文件核验。
- 查询：`npm run project:index:query -- --domain story --query "关键词"`。
- 新鲜度：`npm run project:index:check`；更新：`npm run project:index:changed`；验证：`npm run project:index:validate`。
