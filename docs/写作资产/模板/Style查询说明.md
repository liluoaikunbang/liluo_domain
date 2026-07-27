# Style 查询说明

Style Query 只描述**表达需求**，不含剧情事实。用于 V1 元数据检索与文风包组装。

## 必填

- `queryId`：以 `sq-` 开头
- `mode`：`explicit`（仅显式 ID）| `metadata`（自动检索）| `hybrid-explicit`（两者）
- `primarySceneFunction`：受控枚举，见 `project-navigation/style-taxonomy.json`
- `themeDomain`：领域匹配维度，不是质量分
  - `restraint-themed` / `general-prose` / `mixed` / `unknown`

## 禁止填写

角色名、地名、组织、物品、能力、情节节拍、世界规则原文、对话引文、API Key、绝对路径。

校验：`npm run writing:style:validate -- --query <path>`

## 常用流程

1. 复制 `Style查询模板.json`，改 `queryId` 与表达维度
2. `writing:style:search` 看候选；`writing:style:explain` 看理由
3. `writing:style:pack` 生成文风包
4. 在正式正文合同 `expression.styleQueryPath` 指向该查询

## 与 V0 显式样本

`explicitReferenceIds` 或合同上的 `styleReferenceIds` 可列 0–3 个已批准资产 ID。`hybrid-explicit` 会强制包含这些 ID 并叠加 metadata 检索。

## 空包

无已批准资产匹配时， pack 状态为 `awaiting-assets` 或 `partial`——正常结果，不得用未审外部全文凑数。

权威 Schema：`schemas/workflows/style-query.schema.json`  
Skill：`.agents/skills/liluo-project/liluo-style-rag/SKILL.md`
