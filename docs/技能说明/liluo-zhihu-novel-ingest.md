# liluo-zhihu-novel-ingest

用于在用户提供知乎文章、回答或专栏链接，并明确表示“下载”“存入 RAG”“作为灵感来源”时，调用 `external-knowledge/tools/zhihu-download` 生成 Markdown，再导入 `external-knowledge/sources/zhihu-novels/`。

## 使用边界

- 导入内容一律是外部虚构参考：`canonical: false`。
- 不得把原文、近似改写、专有名称或完整事件顺序直接写入正式剧情。
- Cookie 默认保存在 Git 忽略的 `external-knowledge/zhihu-cookie.local`，供本机下载器自动读取；不写入仓库、Skill、RAG、构建产物或日志。`--cookies` 与 `ZHIHU_COOKIE` 可作为单次覆盖。
- zhihu-download 按统一外部来源规则处理：每 30 天到期后由下一次用户命令触发只读跟踪；发现更新才写入临时分析报告，正式更新必须等用户批准。
- 来源按作者名归档到 `zhihu-novels/<作者>/`；不以日期建目录。归档日期写入 Markdown 的 `archivedOn` 元数据，无法识别作者时归入 `未署名/`。

## 常用入口

```powershell
python .agents/skills/liluo-project/liluo-zhihu-novel-ingest/scripts/download_zhihu_once.py --url "<zhihu-url>"
node .agents/skills/liluo-project/liluo-zhihu-novel-ingest/scripts/import-zhihu-markdown.mjs --input "external-knowledge/staging/zhihu-downloads" --url "<zhihu-url>" --label "<short-label>" --build-index
npm run external:knowledge:query -- --source "zhihu-novels" --query "<keyword>" --limit 3 --format markdown
```
