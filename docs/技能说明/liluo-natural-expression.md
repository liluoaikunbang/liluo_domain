# liluo-natural-expression

- 正式路径：`.agents/skills/writing/liluo-natural-expression/`
- 用途：为非技术、面向读者的璃落文本改善节奏、声音、潜台词和自然度，同时保护事实锚点，并优先检查动作、物体反馈与空间关系是否可信。
- 默认触发：故事大纲叙事段落、小说、游戏对话、项目组对话、手记、玩家文案和公开开发叙事，默认 `light`。
- 操作：`compose`、`revise`、`diagnose`；强度：`off`、`light`、`deep`。
- 排除：代码、数据合同、schema、路径、测试日志、权限规则、逐字引用与原样保存内容。
- 输入：已确认文本/材料、文本类型、用途、事实与状态锚点；deep 模式可追加风格档案。
- 输出：通过动作可信度门禁的自然表达稿、局部修订稿或带证据的诊断，不新增故事事实，也不为追求含蓄临时制造缺乏依据的操作技巧。
- 资源：快速合同、8 类文本配置、6 份风格档案、来源谱系、路由/锚点脚本和评测 fixture。
- 相邻边界：故事事实由 `liluo-story-outline-authoring` 等决定；连续性由 `liluo-world-bible-continuity-audit` 检查；外部题材检索由 `liluo-external-fiction-knowledge` 负责。
- 验证：`node --test --test-isolation=none scripts/tests/natural-expression.test.mjs`，以及系统总体验证。

详细当前合同见 [璃落自然表达与文气塑形系统](../系统说明/璃落自然表达与文气塑形系统.md)。
