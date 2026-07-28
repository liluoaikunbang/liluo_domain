# Style-RAG 元数据检索与文风包系统

## 定位

Style-RAG V1 为正式正文写作提供**确定性元数据检索**：在用户已批准的黄金正文、个人旧作、修改对照、已评外部文章与写作表之间，按表达维度打分、组装有字数上限的文风包，并给出可解释的选择理由。

**不是**向量语义搜索，**不是**通用外部小说灵感 RAG（后者见 `liluo-external-fiction-knowledge`）。

## 实现阶段

| 阶段 | 状态 | 能力 |
| --- | --- | --- |
| V0 | 已启用 | 合同上 0–3 个显式 `styleReferenceIds` |
| V1 | 已启用 | Style Query → search/pack/explain/feedback |
| V2–V4 | 暂缓 | embedding / reranker / training |

策略文件：`project-navigation/style-rag-policy.json`（`implementationStage: metadata-rag`）。

## 权威文件

| 用途 | 路径 |
| --- | --- |
| Skill | `.agents/skills/liluo-project/liluo-style-rag/SKILL.md` |
| 正式正文集成 | `.agents/skills/liluo-project/liluo-formal-prose-pipeline/SKILL.md` |
| Style Query Schema | `schemas/workflows/style-query.schema.json` |
| Style Pack Schema | `schemas/workflows/style-pack.schema.json` |
| 表达 taxonomy | `project-navigation/style-taxonomy.json` |
| 资产注册表 | `docs/写作资产/registry.json` |
| CLI | `scripts/writing-model/writing-model.mjs` |
| ADR | [ADR-014](../设计记忆/架构决策/ADR-014-Style-RAG元数据检索与Canon风格隔离.md) |
| 用户操作 | [Style-RAG用户操作指南](./Style-RAG用户操作指南.md) |

## Canon / Style 隔离

Style Query 禁止剧情事实字段；校验失败则拒绝 search/pack。文风包只影响表达方式，不替代 `immutableFacts`。

## 阅读向文案与自然表达

撰写或改写 Style Pack 抽象说明、写作表旁白、评权说明、检索解释文案、抽查协商与改稿说明前，先应用 `liluo-natural-expression` **light**：说清用途与邻居差别，避免口号空话。字段名、ID、路径、CLI 与 JSON 结构不润色。权威路由见 [璃落自然表达与文气塑形系统](./璃落自然表达与文气塑形系统.md)；抽查闭环见 [知识检索抽查校准系统](./知识检索抽查校准系统.md)。

## 检索流程

```
Style Query (无 canon)
    → validate (schema + leakage + weights)
    → search (dimension scores over registries)
    → explain (reasons)
    → pack (bounded sections + renderedMarkdown)
    → attach to prose draft/compare
    → feedback (optional, updates model-effectiveness over time)
```

## 打分维度（摘要）

场景功能、视角、叙事距离、张力与各密度、信息释放、句 rhythm、世界类型、`themeDomain`（领域匹配，非质量）、用户评权、模型效果反馈、资产 tier。

权重总和必须为 1；调整见策略文件 `scoring` 段。

## 生产门禁

- `approvedAssetsOnly: true`
- 未评外部文章不得进入 pack
- 单 pack 同源/同作者上限
- 空 pack 合法

## 命令

```bash
npm run writing:style:validate -- --query <path>
npm run writing:style:query -- --query <path>
npm run writing:style:search -- --query <path>
npm run writing:style:pack -- --query <path>
npm run writing:style:explain -- --query <path>
npm run writing:style:feedback -- --run <run-id> --choice <asset-id>
npm run writing:style:test
```

## 与正式正文管线关系

`liluo-formal-prose-pipeline` 闸门 4：允许 V0 显式 + V1 metadata；仍禁止 embedding/向量库。候选正文仍只进工作区，用户批准后由故事 Skill 写 canon。

## 与大纲关联图谱

Style-RAG 文章以 `style_rag:` 节点进入大纲关联图谱投影，可与故事、情节和普通 RAG 建立多对多关系；不强制每张 Style 卡对应唯一情节。详见 [大纲关联图谱系统](./大纲关联图谱系统.md)。

## 暂缓能力

Embedding、向量库、学习式 rerank、语料训练均不在本系统实现。解锁条件见 Skill `references/deferred-roadmap.md`。
