# Style 文风包说明

文风包（Style Pack）是发给写作模型的**表达参考摘要**，由 CLI 根据 Style Query 与已批准资产自动组装。

## 状态

| 状态 | 含义 |
| --- | --- |
| `ready` | 至少一节有内容且在字数预算内 |
| `partial` | 部分节有内容 |
| `awaiting-assets` | 无匹配已批准资产（可安全为空） |
| `blocked` | 策略违规 |

## 各节含义

- **writingSheet**：用户批准的璃落写作表摘要
- **hardRules**：硬规则（来自查询 + 写作表）
- **positiveExamples**：黄金正文 / 个人旧作片段
- **externalReferences**：用户已评外部文章的代表性摘要（非整篇）
- **calibrationPairs**：修改对照前后表达对照
- **modelFailureModes / strictBoundaries**：模型已知弱点与边界

## 生产门禁

- 仅已批准资产进入 pack
- 外部文章须 `reviewed` 且权重 ≥ 策略下限
- 总引用汉字 ≤ `characterBudget.limit`（默认 1800）

## 命令

```bash
npm run writing:style:pack -- --query docs/写作资产/工作区/style-queries/<your-query>.json
```

输出含 `selectedAssets`（可追溯）与 `renderedMarkdown`（可挂到 draft/compare）。

## 与正史

文风包**不携带**剧情事实。事实仍以正式正文合同的 `immutableFacts` 为准。

权威 Schema：`schemas/workflows/style-pack.schema.json`
