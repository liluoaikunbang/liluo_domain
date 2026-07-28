# 紧缚专业 RAG 双分支系统

紧缚专业 RAG 是紧缚概念的正式知识库形态：每个概念只保留一个稳定主 ID，并固定拥有两个分支。

```text
紧缚概念（主节点）
├── 知识分支 —— 这是什么？
└── 表达分支 —— 小说里应该怎样写？
```

普通 RAG 继续负责非紧缚世界观与事实；通用 Style-RAG 降为辅助，负责跨概念的氛围、节奏、视角、对话与空间调度，不定义具体紧缚术语。

## 职责边界

| 系统 | 回答 | 用户维护 |
|---|---|---|
| 普通 RAG | 非紧缚设定是什么 | 按需 |
| 紧缚专业 RAG | 紧缚概念是什么 + 怎么写 | **重点** |
| 通用 Style-RAG | 跨概念写法能力 | 主要由 AI 维护，用户审核 |

## 数据契约

权威卡：`external-knowledge/cards/restraint/*.json`

关键字段：

- `professionalRagVersion`
- `knowledge` / `expression`
- `overallStatus`：`stub | knowledge-only | expression-only | usable | confirmed | conflicted`
- `retrievalPolicy.knowledgeRetrievable` / `expressionRetrievable`
- `evidenceBindings[]`：`knowledge-evidence | expression-evidence | both`

未显式迁移的旧卡可在读取时惰性合成分支；正式写入仍走 `restraint-rag:migrate-pilot` / 后续批量迁移。

规则：

- 骨架卡不得诱导 AI 补定义或补写法
- 未确认分支不得进入高权重写作检索
- 故事 / 情节 / 玩法只引用主概念 ID（`ragRefs`），不分别连知识/表达节点

## 图谱展示

兼容现有泳道架构：**方案 B（详情页签）**。

1. 画布只显示紧缚概念**原名词**主节点（上位/具体两层仍用 `broader`/`narrower`）
2. 右侧详情页签：概览｜知识｜表达｜原文证据｜关联 —— 页签互斥，内容不互相复制
3. **不再**投影「知识｜概念名」「表达｜概念名」子节点（已撤，避免与详情页签重复）

入口：大纲 → 关联图谱。不另开独立维护页。

## 用户维护

不另开维护页/向导。日常用抽查闭环：

```bash
npm run rag:audit:sample -- --mode low-confidence --batch-size 8
npm run rag:audit:record -- --asset <id> --category confirmed-ok
```

规则：

- 每张紧缚概念卡只列一次（同时含知识+表达），不拆两条
- 抽查过 → 中降权；`confirmed-ok` → 再降权
- 降权只影响抽中概率，不移出池；高权抽完后仍会轮到低权项
- 新名词先入候选箱（`restraint-rag:scan-new-terms` / `candidates`），不自动正式纳入

## 写作联合检索

`npm run restraint-rag:writing-context -- --card <id>`

权重建议：已确认知识 > 已确认表达 > 黄金正文 > 已确认 Style-RAG > AI 维护 Style-RAG > 外部候选 > 模型常识（不得覆盖已确认内容）。

缺知识：提醒且不编造；缺表达：可回退通用 Style-RAG 并标记缺口。

## 命令

```bash
npm run restraint-rag:status
npm run restraint-rag:scan-new-terms -- --text "…" --dry-run
npm run restraint-rag:candidates
npm run restraint-rag:create-stub -- --title "…" --dry-run
npm run restraint-rag:research -- --card <id>
npm run restraint-rag:build-review-pack -- --card <id>
npm run restraint-rag:review -- --card <id> --branch knowledge|expression|both --action confirm|defer|reject
npm run restraint-rag:migrate-pilot -- --dry-run
npm run restraint-rag:migrate-all -- --commit
npm run restraint-rag:writing-context -- --card <id>
npm run restraint-rag:audit
npm run restraint-rag:export -- --public-safe
npm run restraint-rag:test
```

抽查：

```bash
npm run rag:audit:sample
npm run rag:audit:record -- --asset <id> --category confirmed-ok
```

## 与既有系统关系

- 不恢复已退休 Tag
- 证据库、抽查校准、Style-RAG 管线继续复用
- 私有证据与公开导出隔离不变
