# 可执行工作流

把已经成熟、容易漏步骤的复杂任务做成机器可读流程：每次只拿到当前节点任务书，必需 Skill/子智能体必须留下调用与采用证据，缺了就会阻塞。

## 你可以这样说

- “按可执行工作流做一次主线重构演练”
- “给我当前工作流节点的任务书”
- “列出可执行工作流”
- “打开工作流大图”（少用；仅要交互总览时）

## 怎么看流程图（默认）

`project-workflows/generated/<工作流ID>/PROCESS.md`  
例如：[故事主线重构过程规范](../../project-workflows/generated/wf-story-mainline-restructure/PROCESS.md)

文首有 Mermaid 概览。图**不会**在每次小改后自动重写；只有改了流程结构等重大修改后，才运行：

`npm run project:workflow:generate -- --workflow <id>`

## 不会自动做的事

- 不会把一次性小修或开放讨论强行流程化
- 不会因 Skill 小改频繁重生成流程图
- dry-run 不会写入正式故事源

完整合同见 [机器可读工作流与可视化执行规范系统](../系统说明/机器可读工作流与可视化执行规范系统.md)。
