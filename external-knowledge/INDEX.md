# 外部虚构题材表达知识库

本库为文学表达、画面结构、场景、虚构状态与题材模式提供非正式创作参考。它独立于 `project-index/`，所有记录均为 `knowledgeScope: external-fiction-reference`、`canonical: false`，不得自动视为璃落宇宙设定。

- 本机权威语料：由被 Git 忽略的 `source-sync.local.json` 指向，绝对路径不写入可移植索引
- 仓库镜像：`external-knowledge/sources/fiction-bondage/`（同步自本机权威语料，不反向修改权威源）
- 知乎灵感源：`external-knowledge/sources/zhihu-novels/`（由 `liluo-zhihu-novel-ingest` 导入，索引为外部参考）
- 支持文本：Markdown、TXT、Markdown Text；其他文件只编目，不读取二进制正文
- 来源根目录由 `external-knowledge/config.json` 的 `sourceRoots` 控制；来源目录：`catalog/sources.json`；分段：`index/segments/`；关键词与标签：`index/keywords/`、`index/tags/`
- 七类历史类型名仍可由 Schema/`card-rules` 使用；当前在库卡以 `cards/restraint/` 两级结构为主，不再自动播种空泛表达/场景占位卡
- 候选规则：`card-rules.json`，按证据组和最小独立来源数生成术语卡与情节模式卡；规则可带 `linkedConceptIds` 指向概念种子（上位类别/具体概念）
- 知识卡 `concepts[]` 只放可读概念名/别名，不放情节推进句；`linkedConceptIds` 为稳定挂接（优先于名称匹配）
- 来源定位：`index/references/source-locations.json`；质量与重复报告：`reports/`
- 当前统计与状态：`status.json`；构建清单：`manifest.json`

常用命令：

```powershell
npm run external:knowledge:check
npm run external:knowledge:sync
npm run external:knowledge:update
npm run external:knowledge:build
npm run external:knowledge:validate
npm run external:knowledge:query -- --query "古堡 逃脱" --mode and --limit 8 --format markdown
npm run external:knowledge:query -- --query "挠痒"
npm run external:knowledge:query -- --query "手铐" --mode and
npm run external:knowledge:copy-check -- --input "docs/待检查文本.md"
```

`external:knowledge:update` 会先按路径和 SHA-256 从本机权威源同步镜像，再执行来源级增量索引与验证准备。普通镜像删除自动执行；一次删除超过同步清单 20% 时自动中止，避免盘符或目录异常造成误删。同步永远不删除权威源内容。

查询默认只返回短预览、标签、来源路径、行号与 ID。需要核验时按 `sourcePath:startLine-endLine` 少量读取原始来源，不得批量展示原文。使用检索结果创作时，应先抽象机制，再读取正式项目知识进行原创重组；正式写入故事、事件、场景或提示词前运行直接照搬风险检查。该检查仅是保守的写作相似性提醒，不是法律判断。
