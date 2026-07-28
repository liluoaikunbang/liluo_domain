# 情节层级核对

本目录保存情节库 → RAG / 故事边界治理的**候选审计与确认记录**，不是正式主数据。

- `registry.json`：快照与迁移索引  
- `snapshots/`：审计前只读快照  
- `proposals/`：逐条判断卡  
- `review-queue.json`：排序后的核对队列  
- `confirmations/`：用户确认记录  
- `migrations/`：已执行迁移与回滚提示  

正式权威仍是：

- 情节：`src/game/data/plot_outline/catalog.json`
- 故事：`src/game/data/story_outline/sources/*.json` 与对应 Markdown
- 紧缚 RAG：`external-knowledge/cards/restraint/`

用法见 [故事情节RAG边界治理系统](../系统说明/故事情节RAG边界治理系统.md)。
