---
name: liluo-rag-source-interview
description: 逐段展示外部小说原文，并由用户确认其 RAG 关键词、双分支归属或不入库处置；不自动确认来源关系。
---

# RAG 来源逐段访谈

用户说“提问 RAG 来源”“随机抽一段外部小说让我标注”或“继续 RAG 来源访谈”时使用。

1. 先运行 `npm run external:knowledge:check`；状态非 current 时停止。
2. 运行 `npm run rag:source-interview -- [--current-source <sourceId>] [--seed <n>]`。指定当前来源时，随机抽取为当前来源 40%、其他来源 60%。
3. 在 Codex 对话中展示命令返回的完整当前分段；用户要求时展示相邻分段。不得把原文复制进永久日志或公开导出。
4. 只把候选当建议，向用户提供：关联已有卡、多选、新建 RAG、无价值、需要上下文、重切、排除、暂缓。
5. 用户确认后运行 `npm run rag:decide-segment -- --segment <id> --action relate|none|context|resplit|exclude|defer [--card <id>] [--purpose knowledge-evidence|expression-evidence|both]`。
6. 新建 RAG 的同轮确认必须同时记录名称、适用/排除边界、父卡、分支和当前片段关系；运行 `npm run rag:create-from-segment -- --segment <id> --title <title> [--parent <card-id>] [--purpose knowledge-evidence|expression-evidence|both]` 后立即可检索，但只返回已确认字段，禁止补造定义。
7. 当一篇来源所有 active 分段有终态后，才开始该来源的元信息访谈。

旧自动关联只能先用 `npm run rag:reset-human-baseline` 生成审包；不得提交退役，除非用户再次明确批准该审包。
