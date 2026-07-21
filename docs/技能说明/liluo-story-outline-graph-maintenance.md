# liluo-story-outline-graph-maintenance

## 项目索引协作

复杂链路先查询 story/graph 索引，结构修改前核验原始父子字段；完成后增量刷新并验证关系索引。

## 用途与边界

按稳定 key 插入、移动、拆分、合并、重命名或修复故事树。纯正文完善不触发。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-story-outline-graph-maintenance/`
- reference：`graph-operation-rules.md`
- script：`scripts/outline-graph-ops.mjs`（默认只读；`--root`、`--key`、`--check`）
- 输入：目标 key、操作意图、是否包含子树、来源 JSON/Markdown
- 输出：修改前摘要、dry-run 差异、修改后完整性结果

## 流程、限制与验证

先统计 key 与邻接关系，再预览，确认后按 key 修改，最后检查重复 key、孤儿、循环、丢失节点和 Markdown。默认只移动指定节点，多子链不明确时必须询问；不擅自删除或增加 side。验证脚本帮助、全图检查、已知 key 与未知 key 错误路径。正文内容交给 `liluo-story-outline-authoring`。

复杂移动前可委派 `liluo_context_explorer` 重建局部树，操作后可委派 `liluo_content_auditor` 审查结构与引用。正式操作仍由主智能体或确定性脚本执行。
