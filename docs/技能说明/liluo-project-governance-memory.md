# liluo-project-governance-memory

## 用途与入口

用于把明确的长期要求、用户可调用工作流和重要架构/创作理由沉淀到唯一权威位置，并检查受影响的系统说明、Skills、Agents、用户命令、功能记录和项目索引。

- Skill：`.agents/skills/liluo-project/liluo-project-governance-memory/`
- 系统说明：`docs/系统说明/项目规范治理与设计记忆系统.md`
- 注册表：`docs/规范治理/`
- 设计记忆：`docs/设计记忆/`

## 触发边界

适用于“以后都这样”“固定为规范”“新增自然语言工作流”“记录为什么采用此设计”“检查文档影响/重复/漏同步”和项目 Skill、Agent 或系统合同变化。不用于一次性修复、临时测试、单次润色或尚无结论的讨论。

默认 light：三份注册表、一份权威文档、最多三份直接消费者。只有广泛迁移、规则重构或明确深度审计才使用 deep。持久性无法安全判断且影响未来时只询问一次。

## 流程与分工

分类持久性 → 定位权威源 → 查影响映射 → 主 Codex 修改权威源和必要消费者 → 按需记录 ADR/CDR → `liluo-project-documentation-sync` 做必要的机械同步 → 汇总各 Skill 的检查候选并去重 → 默认只运行一项目标验证 → 被索引源变化时末尾增量更新一次。只有一项无法覆盖另一处实质风险且会影响完成结论时，才增加一项综合验证。

创作组文号的新增、替换、退役与来源变化属于长期创作身份治理；权威源为 `docs/设计记忆/项目组灵魂/文号体系/`，完成前必须检查篇名池、roster、灵魂卡、真实 Agent 配置与说明、系统摘要、用户命令、CDR、功能记录和索引。

只读 `liluo_project_memory_curator` 仅在跨文档追踪、歧义或深度审查时使用。Skill 不复制系统说明全文，Agent 不负责写入，文档同步 Skill 不决定持久性和权威位置。

## 命令与验证

- `npm run docs:impact -- --type <类型>`：影响映射。
- `npm run docs:governance:validate`：注册表路径、ID、状态与权威边界。
- `npm run docs:memory:validate`：ADR/CDR 格式、状态与关联规则。
- `npm run docs:commands:validate`：项目 Skill 和用户命令入口。
- `npm run docs:governance:audit`：组合审计。
- `npm run docs:compact:report`：只读完全重复报告。

不同 Skill 的检查要求不能机械相加。目标验证被综合 profile 覆盖时不重复执行，相关文件未再次变化时不重跑；未修改领域不验证，纯正文不联动结构与治理审计，局部治理不联动历史功能文档全量审计。不自动删除、压缩、重编号、保存聊天记录或把未确认决定标为 accepted。当前分类器是确定性提示器，复杂语境由主 Codex 判断。
