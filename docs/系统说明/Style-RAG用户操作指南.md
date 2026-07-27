# Style-RAG 用户操作指南

面向用户的 Style-RAG V0/V1 操作步骤。技术契约见 [Style-RAG元数据检索与文风包系统](./Style-RAG元数据检索与文风包系统.md)。

## 你能做什么

- 扫描本地外部文章，列出标题与作者
- 批量评权外部文章与作者 prior
- 按场景表达需求检索已批准文风样本
- 生成有字数上限的文风包，查看选择理由
- 维护用户批准的璃落写作表
- 在对照写作后记录选了哪条参考（feedback）

## 你不能指望系统做什么

- 自动从外部全文「学剧情」或写进正史
- 向量/语义相似度搜全文（未实现）
- 替你看完文章并打分（分数只能你来导入）
- 通用外部小说灵感检索（请用外部虚构知识库 Skill）

## 快速路径：只为一段正式正文找文风

1. 复制 `docs/写作资产/模板/Style查询模板.json` 到 `docs/写作资产/工作区/`，改 `queryId`（`sq-` 开头）和表达字段。**不要写角色名、地名、情节。**
2. 校验与检索：
   ```bash
   npm run writing:style:validate -- --query docs/写作资产/工作区/<your-query>.json
   npm run writing:style:explain -- --query docs/写作资产/工作区/<your-query>.json
   npm run writing:style:pack -- --query docs/写作资产/工作区/<your-query>.json
   ```
3. 在正式正文合同填 `expression.styleQueryPath` 指向同一文件。
4. 照常 `writing:prose:draft` 或 `writing:prose:compare`（配合 `liluo-formal-prose-pipeline`）。

若无任何已批准资产匹配，pack 可能为空——仍可按 V0 显式填最多 3 个样本 ID。

## 外部文章：从扫描到可用

1. 确认文章已在来源目录（绑缚域 / 知乎域，见 [外部文章清单与用户评权系统](./外部文章清单与用户评权系统.md)）。
2. ```bash
   npm run writing:external:inventory
   npm run writing:external:authors
   ```
3. ```bash
   npm run writing:external:review:export
   ```
   离线填写分数与 `themeDomain` 纠正。
4. ```bash
   npm run writing:external:review:import -- --input docs/写作资产/工作区/external-review/<file>.json
   npm run writing:external:validate
   ```

清单数量以 inventory 命令打印为准。

## 璃落写作表

1. 先有黄金正文或校准对等证据（外部文章 alone 不够）。
2. ```bash
   npm run writing:style:sheet:draft
   ```
3. 审阅 `docs/写作资产/璃落写作表/drafts/draft-latest.json`。
4. ```bash
   npm run writing:style:sheet:approve -- --user-approved
   ```

## 对照写完后：feedback

```bash
npm run writing:style:feedback -- --run <工作区 runs 里的 run-id> --choice <asset-id>
```

多次记录后才会影响「模型效果」检索权重；不会自动改黄金或 Skill。

## themeDomain 怎么选

- `restraint-themed`：绑缚/约束表达为主的参考域
- `general-prose`：一般叙事域（如知乎小说目录）
- `mixed`：你明确标记跨域
- `unknown`：不参与领域匹配

这是**匹配标签**，不是「哪个域更好」。

## 显式样本（V0）

在正式正文合同 `expression.styleReferenceIds` 直接填 0–3 个已批准 ID，无需 Style Query。可与 V1 并用（`hybrid-explicit` 模式）。

## 测试

```bash
npm run writing:style:test
```

## 需要帮助时怎么说

- 「扫描外部文章并列出作者」
- 「导出评权表」
- 「按 daily-interaction + general-prose 组文风包并解释理由」
- 「批准写作表」

主智能体应加载 `liluo-style-rag` Skill 执行。撰写或改写抽象风格说明、评权旁白、抽查协商与改稿说明时，还须先走 `liluo-natural-expression` light（ID/路径/命令不润色）。
