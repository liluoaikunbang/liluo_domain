---
id: CDR-008
status: accepted
title: 大纲访谈须选项确认普通 Tag 与紧缚 Tag
date: 2026-07-27
scope: [story, plot, tags, interview]
relatedRules: [outline-interview-tag-confirmation]
relatedWorlds: [all]
supersedes: []
sourceStatus: user-confirmed
---

# CDR-008：大纲访谈须选项确认普通 Tag 与紧缚 Tag

## 当前结论

对故事大纲做随机提问、指定节点完善或情节安置批准后的访谈时，必须同时询问普通 Tag（`plotTags`）与紧缚 Tag（`bondageTags`），并给出可多选/可改/可全否的候选选项；只有用户明确确认的标签才写入权威源。不得从情节库、父节点或玩法引用静默继承。普通 Tag 库已于 2026-07-27 清空，之后只靠用户确认逐步补回。

## 背景与理由

既有普通标签质量差且过杂，图谱与检索被噪声淹没。与其在投影层省略，不如删掉权威源中的坏标签，再在每次大纲访谈用选项确认重建干净集合。紧缚标签继续单独字段，同样走确认，避免题材标签与紧缚方式混写。

## 代价与重新评估

短期内普通 Tag 泳道与情节库 `tags` 可能为空；筛选依赖标签时需改用其他字段。若日后需要批量导入外部标签表，须另立审批流程，不得绕过访谈确认门禁。
