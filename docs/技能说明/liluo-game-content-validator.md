# liluo-game-content-validator

## 项目索引协作

广域验证先检查索引新鲜度，区分源数据问题与生成器问题；生成索引只由正式脚本刷新，不手工修复。

## 用途与边界

为故事、地图、事件、对话、引用、素材路径和编码提供统一只读验证入口；不自动修复高风险结构。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-game-content-validator/`
- references：`validation-rules.md`、`severity-levels.md`
- script：`scripts/validate-game-content.mjs`（只读；`--scope changed|world|all`、`--world`、`--check`、`--root`）
- 输出：ERROR/WARNING/INFO 与非零失败码

## 流程、限制与验证

按范围解析 UTF-8/JSON，调用故事图检查，并复用项目已有 Node 测试。无法可靠解析范围时明确失败，不假装覆盖。实际修改由故事、地图、对话、素材或存档 Skill 负责。纯正文 Markdown 若未改变 frontmatter、来源 JSON、key、父子关系与运行时引用，不自动调用本统一验证器。用三种 scope、缺少 world 参数和正常全量扫描验证脚本。

大范围审查可委派 `liluo_content_auditor`，执行构建或测试可委派 `liluo_validation_runner`；确定性脚本仍是最终事实来源。

治理、Skill 或设计记忆与内容改动同时出现时，先纳入任务统一验证候选并去重，不自动追加文档检查。只有明确全量审计、广泛注册表/文档结构迁移或确实跨越历史功能记录时，才运行 `npm run docs:governance:audit`；普通局部变化使用最小定向校验。
