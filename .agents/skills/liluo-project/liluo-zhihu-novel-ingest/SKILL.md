---
name: liluo-zhihu-novel-ingest
description: Download Zhihu articles, answers, or columns that the user names as external fiction inspiration, using external-knowledge/tools/zhihu-download, then import the resulting Markdown into the 璃落 external-fiction RAG library. Use when the user gives a 知乎 link and asks to 下载、保存、导入RAG、作为灵感来源、收进外部小说素材 or similar; not for canonical story writing, direct copying, non-Zhihu sources, or automatic tool upgrades.
---

# 知乎小说灵感下载与入库

## Core contract

- Treat every downloaded Zhihu text as `knowledgeScope: external-fiction-reference`, `canonical: false`.
- Store imported Markdown under `external-knowledge/sources/zhihu-novels/` through the bundled import script.
- Use the author name as the source subdirectory (or `未署名` when it cannot be extracted); never put an import date in a directory name. Record the archive date in the Markdown metadata instead.
- Never write downloaded prose, close paraphrases, source-specific names, or complete event order into formal 璃落 story/data. Query it later only through `$liluo-external-fiction-knowledge`, abstract mechanisms, then recombine originally.
- Persist the Zhihu Cookie only in the Git-ignored local file `external-knowledge/zhihu-cookie.local`. The download wrapper reads it automatically when `--cookies` and `ZHIHU_COOKIE` are absent. Never write cookies to the repository, Skill, RAG sources, build artifacts, or logs.
- Do not auto-update `external-knowledge/tools/zhihu-download`. It follows the external-source tracking rule: when its 30-day tracking is due, the next user command performs a read-only check and writes a temporary update analysis only if it changed; apply updates only after explicit user approval.

## Paths

- Tool clone: `external-knowledge/tools/zhihu-download/`
- Download staging: `external-knowledge/staging/zhihu-downloads/`
- RAG source root: `external-knowledge/sources/zhihu-novels/`
- Local Cookie: `external-knowledge/zhihu-cookie.local` (Git-ignored; raw cookie string only)
- Download wrapper: `scripts/download_zhihu_once.py`
- Import wrapper: `scripts/import-zhihu-markdown.mjs`

## Workflow

1. Confirm the request is a Zhihu article/answer/column intended as inspiration/reference, not formal canon.
2. Check the external knowledge index health:
   ```powershell
   npm run external:knowledge:check
   ```
   If stale or error, report it and rebuild/update before relying on old retrieval.
3. Run the downloader from the repository root. When Zhihu requires login, save the user-provided raw Cookie in the local Cookie file; the wrapper reads it automatically. `--cookies` and `ZHIHU_COOKIE` remain one-run overrides.
   ```powershell
   python .agents/skills/liluo-project/liluo-zhihu-novel-ingest/scripts/download_zhihu_once.py --url "<zhihu-url>"
   ```
4. Inspect the JSON output and locate the generated Markdown under `external-knowledge/staging/zhihu-downloads/`. If the tool produces partial/error files, report that clearly instead of importing broken content as fiction.
5. Import Markdown into the external-fiction source root and rebuild the RAG index:
   ```powershell
   node .agents/skills/liluo-project/liluo-zhihu-novel-ingest/scripts/import-zhihu-markdown.mjs --input "external-knowledge/staging/zhihu-downloads" --url "<zhihu-url>" --label "<short-source-label>" --build-index
   ```
6. Run a small query to prove it is retrievable:
   ```powershell
   npm run external:knowledge:query -- --source "zhihu-novels" --query "<title-or-keyword>" --limit 3 --format markdown
   ```
7. Report imported source paths, index status, and any access/download limitations. Do not quote long source text.

## Failure handling

- If dependencies are missing, install them only after user approval. The upstream tool lists `requests`, `bs4`, `markdownify`, `tqdm`, and `flask` in `requirements.txt`.
- If Zhihu blocks unauthenticated access, ask for a Cookie to save in the local Cookie file or suggest using the upstream TamperMonkey/Flask workflow manually, then import the produced md/zip with the import script.
- If the Markdown contains large verbatim external text, that is allowed inside the external RAG source but must remain non-canonical and behind retrieval/originality gates.
- If the user asks to use the imported material in official 璃落 content, switch to `$liluo-external-fiction-knowledge` and run copy-risk checks before final writing.
