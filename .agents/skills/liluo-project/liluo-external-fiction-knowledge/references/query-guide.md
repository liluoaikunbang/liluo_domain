# Query guide

```powershell
npm run external:knowledge:query -- --query "古堡 逃脱" --mode and --limit 8 --format markdown
npm run external:knowledge:query -- --query "仪式 展示" --mode or --exclude "教程" --tags "视觉:展示"
npm run external:knowledge:query -- --card-type visual-structure --query "封闭空间"
npm run external:knowledge:query -- --source-id fb-src-000013 --limit 3
npm run external:knowledge:query -- --segment-id fb-src-000013-seg-00001
```

Supported filters include source/source ID, segment ID, card type/ID, tags, exclusions, AND/OR mode, limit and JSON/Markdown output. Results intentionally expose only a short preview and source location.
