---
id: CDR-009
status: accepted
title: 大纲访谈须选项确认紧缚 RAG
date: 2026-07-28
scope: [story, rag, interview, restraint-rag]
relatedRules: [outline-interview-restraint-rag-confirmation]
relatedWorlds: [all]
supersedes: [CDR-008]
sourceStatus: user-confirmed
---

# CDR-009：大纲访谈须选项确认紧缚 RAG

## 当前结论

对故事大纲做随机提问、指定节点完善或情节安置批准后的访谈时，**每次必须询问**「设置紧缚 RAG 标签」，给出可多选、可改、可全否的候选；只有用户明确确认的项才写入权威源。不得从情节库、父节点或玩法引用静默继承。

用户确认后：

1. 按标题/别名在 `external-knowledge/cards/`（优先 `restraint/`）查找知识卡；
2. 命中则把卡 ID 写入节点 `ragRefs`；
3. 未命中则按骨架卡规则新建空卡（`contentStatus: stub`、`evidenceStatus: missing`、`sourceRefs: []`），再写入 `ragRefs`；
4. 若卡为 stub 或缺少可核验正文/来源，向该节点 `missingItems` 登记：`RAG｜紧缚RAG｜补全「{卡标题}」正文与来源`。

节点上展示的「紧缚 RAG 标签」是一级标题派生，不另存平行权威字段：

- `ragLayer=category` → 用该卡 `title`；
- `ragLayer=concept` → 用父卡 `title`；父级缺失时暂用本卡 `title`，补父级后再升为一级。

`storyTags` 仍只表示世界内故事风格；不得恢复 `plotTags` / `bondageTags`。

## 背景与理由

Tag→RAG 迁移后，旧 CDR-008 的普通 Tag / 紧缚 Tag 须选项已无法执行。紧缚题材需要可检索、可缺口可视化的知识卡引用，并由访谈强制确认，避免图谱与节点标签再次噪声化。

## 代价与重新评估

短期内大量 stub 卡与「补全正文」待办会出现在 `missingItems`；应用骨架卡降权与图谱橙色缺口提示，不得把 stub 当作完备知识。若日后需要批量导入外部概念表，须另立审批，不得绕过访谈确认。
