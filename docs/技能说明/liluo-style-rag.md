# Style-RAG 文风检索（liluo-style-rag）

按表达维度从已批准文风资产中检索、组包，并管理外部文章评权与璃落写作表。服务正式正文双模型管线，不替代正史或通用外部灵感库。

## 你可以说

- 「扫描外部文章并列出标题和作者」
- 「导出/导入外部文章评权表」
- 「按这个场景组文风包并解释为什么选这些样本」
- 「查 restraint 域和 general 域怎么匹配」
- 「起草/批准璃落写作表」
- 「记录这次对照我选了哪条文风参考」
- 「抽查 Style-RAG 准不准 / 记一条索引错误」

## 会做

- V0：合同上 0–3 个显式样本 ID
- V1：Style Query → search / pack / explain（元数据打分）
- 用户评权后的外部文章进入 bounded 文风包
- 空包时安全返回，不凑未审全文
- 人工抽查归档与受影响重建（单次错误不升级 Skill）
- 撰写/改写抽象风格说明、评权旁白、抽查协商文案前走 `liluo-natural-expression` light

## 不会做

- 向量 / embedding / 语义全文检索（V2 暂缓）
- 通用外部小说灵感 RAG（用 liluo-external-fiction-knowledge）
- 伪造评分或把未审文章当生产参考
- 把候选或 pack 直接写入正史
- 用 themeDomain 当「质量高低」
- 因抽查风险停用现有索引，或单次错误膨胀 Skill

## 常用命令

```bash
npm run writing:external:inventory
npm run writing:external:review:export
npm run writing:external:review:import -- --input <path>
npm run writing:style:pack -- --query <path>
npm run writing:style:explain -- --query <path>
npm run style-rag:audit:sample -- --mode low-confidence --batch-size 8
npm run knowledge:audit:sample -- --mode low-confidence --batch-size 8
npm run style-rag:audit:record -- --asset ea-... --issue "..." --correct "..." --category author-info-error
npm run style-rag:audit:status
npm run style-rag:rebuild:affected
```

清单数量以 `writing:external:inventory` 为准。

操作指南：[Style-RAG用户操作指南](../系统说明/Style-RAG用户操作指南.md)  
系统说明：[Style-RAG元数据检索与文风包系统](../系统说明/Style-RAG元数据检索与文风包系统.md)  
抽查校准：[知识检索抽查校准系统](../系统说明/知识检索抽查校准系统.md)
