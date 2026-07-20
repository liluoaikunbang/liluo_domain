# 故事大纲随机访谈 Skill 与技能文档规范

创建时间：2026-07-20

## 更新时间记录

- 2026-07-20：首次新增跨世界随机故事条目访谈模板与项目内 Skill，固定上下文汇总、待补项过滤和具体提问规则；同步新增技能说明文档，并在 `AGENTS.md` 建立每个新 Skill 必须单独建档的维护规则。
- 2026-07-20：根据访谈结果校正“阈限空间”的元数据分类，从通用标签中移除属于玩法循环的“可重复探索”，玩法说明保持不变。
- 2026-07-20：增加用户回答写回后的二次缺口审计规则，禁止因旧问题全部解决而直接清空待补项；据此为“阈限空间”补回首次跨域、主线回收、首批层级、长期记录、拘束差异和异能者关系六项具体缺口。

## 实现思路

将“随机选条目—补齐上下文—根据缺口追问”拆成两层：系统说明保存完整提问模板，项目 Skill 负责触发时机与执行流程。

随机候选池默认覆盖所有世界中含 `missingItems` 的普通节点，也允许用户限定某个世界。提问前需同时读取来源 JSON、Markdown、父子节点和真实玩法引用，避免询问项目中已经有答案的事情。

提问优先聚焦故事关系、进入状态、角色动机、核心循环、完成与失败、分支结局和长期扩展规则等可文字回答的元数据；默认跳过地图工程、音频、精灵表和其他不便当场准备的制作项。

## 相关路径

- `docs/系统说明/故事大纲随机提问模板.md`
- `.agents/skills/random-story-outline-interview/SKILL.md`
- `.agents/skills/random-story-outline-interview/agents/openai.yaml`
- `docs/技能说明/random-story-outline-interview.md`
- `AGENTS.md`

## 开发过程中遇到的问题

第一次生成 Skill 界面元数据时，中文短描述未达到生成器的长度要求；后续生成器又因系统 Python 默认使用 GBK 读取 UTF-8 `SKILL.md` 而失败。

另一个设计问题是，直接将 `missingItems` 逐条改写成问句，仍会产生“请补充地图”“请补充玩法”这类缺乏上下文的空泛提问。

## 对应问题的解决方法

补充符合 25–64 字符要求的界面描述，并在运行生成与校验脚本时显式开启 Python UTF-8 模式。

模板要求每个问题同时包含具体对象、待决定事项和灵感支架，并在随机后强制重建父子节点与真实资料上下文。

用户回答写回后还需基于新上下文再次审计：旧问题可以删除，但回答暴露出的下一层未决事项必须转成更具体的新待补项。只有当前成熟度已无可执行缺口时，才允许清空 `missingItems`。

## 验证

- `python C:\Users\lenovo\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agents\skills\random-story-outline-interview`
- Skill 校验结果：`Skill is valid!`
- `git diff --check`
