---
name: random-story-outline-interview
description: Randomly select an incomplete 璃落 story-outline node, reconstruct confirmed JSON/Markdown context, and ask a focused interview. Use for 随机抽取、按世界访谈、继续随机提问；do not use for directly drafting or restructuring a specified node.
---

# Random Story Outline Interview

Read `docs/系统说明/故事大纲随机提问模板.md` completely. For write-back, also read the outline template, world option, source node, Markdown, parent, children and referenced gameplay.

1. Build ordinary-node candidates with non-empty `missingItems`; exclude categories, main-quest containers and withdrawn nodes unless requested.
2. Apply world filter, optional random seed and optional recently-asked key exclusion. Report filters and seed.
3. Distinguish an empty concept from existing narrative that lacks production information.
4. Randomly select from the real pool.
5. Output in order: 抽中节点、已确认上下文、当前成熟度、关键缺口、4–7 个具体问题、回写时预计涉及的文件.
6. Prefer goals, entry/exit, relationships, states, branches and gameplay. Do not promote asset-production detail into current-stage requirements.
7. Do not write until asked. Then use `$liluo-story-outline-authoring` and validate.

If no candidate survives, report counts and filters. Never invent a node, stable ID or context.
