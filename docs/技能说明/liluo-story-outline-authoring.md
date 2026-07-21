# liluo-story-outline-authoring

## 用途与边界

撰写、扩写或按模板重构指定故事节点，同步来源 JSON 与 Markdown。用户要求随机访谈、纯图结构移动、只读连续性审查或地图代码接入时不触发。

## 路径与资源

- Skill：`.agents/skills/liluo-project/liluo-story-outline-authoring/`
- references：`maturity-decision.md`、`authoring-checklist.md`
- 输入：用户说明、条目模板、世界选项、来源节点、正文及必要父子/引用资料
- 输出：与真实成熟度相符的 JSON/Markdown、具体 `missingItems` 和验证结果

## 流程、限制与验证

重建上下文，判断最高可诚实支持的成熟度，仅写已确认内容，同步两层来源并检查 key、标题、目录和 parentKey。不得编造 ID、用占位语填充、复制候选库或连带重构亲属节点。运行故事大纲测试、内容验证和 UTF-8 检查。图结构变更交给 `liluo-story-outline-graph-maintenance`，随机提问交给 `random-story-outline-interview`。

## 维护要点

模板、成熟度规则、字段或验证命令变化时同步更新 Skill、references 与本文。
