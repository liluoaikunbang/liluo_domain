# 共享原文证据层

本目录是普通 RAG 与 Style-RAG **共用**的来源证据基础设施，不是第二套知识库。

## 三层职责

```text
原始来源（catalog/sources.json + Style-RAG article-registry）
  ↓ 切分 / 定位
原文证据片段（evidence/excerpts.json）
  ↓ 支撑具体知识陈述
RAG 知识卡（cards/**）claims[].evidenceRefs
```

## 存储原则

- 证据 ID 稳定：基于 `sourceId + 行号范围 + 内容哈希`。
- **公开仓库不保存受版权保护的大段原文**。默认 `excerptStorage: source-resolved`，只存定位与短 `excerptPreview`；核验时从本地源文件按行展开。
- `rightsScope.publicExport: false` 的证据在图谱公开导出中只保留元数据与引用标识。
- 同一片段只存一次，由多张卡 / Claim / Style-RAG 复用。
- AI 提出的证据默认 `reviewStatus: pending`，不得自动确认。

## 命令

```powershell
npm run external:knowledge:evidence:migrate -- --dry-run
npm run external:knowledge:evidence:migrate -- --commit
npm run external:knowledge:evidence:propose -- --all --dry-run
npm run external:knowledge:evidence:validate
```

可选本机缓存（Git 忽略）：`external-knowledge/private-evidence/`。
