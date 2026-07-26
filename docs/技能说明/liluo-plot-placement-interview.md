# liluo-plot-placement-interview

## 用途与触发条件

`liluo-plot-placement-interview` 从情节库选取一条情节（随机未用/部分使用，或指定条目），按世界偏向对照大纲给出主线/支线落点，经用户批准后再进行聚焦访谈并写回。

以下请求应触发该 Skill：

- 随机抽一个未用情节，看适合加到哪。
- 把 plot-xxx 对照大纲，建议主线还是支线，再问我。
- 按某世界偏向找一个未用情节安置并访谈。
- 从情节库出发丰富大纲，而不是从缺口节点随机访谈。

以下请求不应触发该 Skill：

- “随机抽一个未完善故事问我” → `random-story-outline-interview`
- “列出还没应用过的情节 / 给这个节点找未用候选”且不要落点访谈 → 未应用情节盘点
- “采用这个情节补充到已定节点”且落点已明确 → `liluo-story-outline-authoring`
- 只说“情节/桥段”要登记进情节库、不关联大纲 → 情节条目系统

## 文件路径与引用资源

- Skill 主体：`.agents/skills/liluo-project/liluo-plot-placement-interview/SKILL.md`
- Skill 界面元数据：`.agents/skills/liluo-project/liluo-plot-placement-interview/agents/openai.yaml`
- 必读安置模板：`docs/系统说明/情节安置提问模板.md`
- 提问与写回循环参考：`docs/系统说明/故事大纲随机提问模板.md`
- 情节数据契约：`docs/系统说明/情节条目系统.md`
- 情节库：`src/game/data/plot_outline/catalog.json`
- 写回委托：`liluo-story-outline-authoring`

## 输入与输出

### 输入

- 可选：指定 `plot-xxx`、世界偏向、标签、随机种子、最近已问排除。
- 未指定条目时从 `unused` / `partial` 真实池抽取。

### 输出

1. 选定情节与筛选说明。
2. 1–3 个落点（目标路径、扩充/新建、主线/支线、证据）；停等批准。
3. 批准后：节点上下文、衔接缺口、4–7 个问题、预计回写文件。
4. 用户回答后按大纲写回规则同步来源，并更新情节 `usedBy` / `usageStatus`。

## 执行流程

1. 建立情节候选池并选取条目。
2. 按 `worldBiases` 优先检索大纲，提出落点，停等批准。
3. 批准后读取目标节点上下文，按衔接缺口提问。
4. 每次回答先写回大纲，再视需要继续提问；首次采用时更新情节库引用。

## 限制

- 落点未批准前不得写大纲或更新 `usedBy`。
- 不得把情节摘要写成已确认节点正文，直到用户明确采用。
- 不得编造情节 ID、故事 key 或未读来源中的设定。
- 不替代大纲优先的随机访谈，也不替代纯列表盘点。

## 验证方式

```powershell
node scripts\tests\validate-project-skills.mjs
npm run docs:check-encoding
```

## 相邻 Skill 边界

| Skill | 关系 |
| --- | --- |
| `random-story-outline-interview` | 大纲节点优先；本 Skill 情节优先 |
| `liluo-story-gap-discovery` | 可提供节点侧匹配证据；不代替安置访谈合同 |
| `liluo-story-outline-authoring` | 批准后的正式写回与情节 `usedBy` 同步 |
| `liluo-project-capability-navigation` | 用户入口与工作流注册，不执行安置判断 |
