# liluo-project-index-maintenance

## 用途与触发

用于建立、检查、查询、增量更新、全量重建、验证、修复或升级项目知识索引。普通单文件编辑、故事扩写、单图修改或纯讨论不触发。

## 路径与资源

Skill 位于 `.agents/skills/liluo-project/liluo-project-index-maintenance/`，引用索引契约、更新决策和查询指南；确定性实现统一复用 `scripts/project-index/`，不在 Skill 内复制脚本。

## 输入输出与流程

输入为查询条件、变更范围、领域或维护目标；输出为紧凑查询结果、新鲜度、受影响领域、验证状态和核验过的权威路径。查询先 check，再 query，最后打开必要原文。源文件修改后运行 changed 与 validate；schema、生成器、批量移动、关键 ID 或关系格式变化运行 build。

索引 stale 时不得把摘要当事实，只能定位候选；无法更新时直接读取原文并报告。禁止手改生成 JSON、编造实体、安装向量/RAG 服务、调用外部模型批量摘要、启动服务或自动提交 Git。

`docs/设计记忆/` 和 `docs/规范治理/` 通过现有 docs 领域参与索引；accepted ADR/CDR 与治理注册表可用于导航，但临时审计报告不作为权威知识，也不另建平行治理索引。

## 相邻 Skill 与 Agent

本 Skill 只维护通用索引机制；故事、地图、素材、连续性、存档等判断仍由对应项目 Skill 完成。只读项目 Agent 优先用索引缩小证据集，最终结论核验原文；主 Codex 统一实施修改。

## 验证

运行索引单元测试、build、validate、check、代表性查询与两次构建确定性检查；Skill 本身用项目 Skill 验证器及 skill-creator 的 quick validator 检查。
