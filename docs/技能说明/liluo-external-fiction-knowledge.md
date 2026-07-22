# 外部虚构题材知识库 Skill

`liluo-external-fiction-knowledge` 负责查询、同步、构建、增量更新、验证外部虚构题材语料，并把文学表达、画面结构、场景、虚构状态和题材模式抽象成可追溯的原创参考。本机权威源由 `external-knowledge/source-sync.local.json` 指向，仓库索引入口固定为其受控镜像 `external-knowledge/sources/fiction-bondage/`。

## 触发边界

在查询外部小说素材、从参考小说找灵感、查文学表达/类似场景/画面结构/题材模式、建立知识卡、更新或重建外部知识库、检查过期或照搬风险时触发。单纯查询璃落正式设定、普通代码修改、项目内部索引维护、无外部灵感需求的小改动、图片润色和普通构建不触发。

## 查询与创作流程

先运行新鲜度检查，再查询卡片或分段；默认只读取短预览、来源路径和行号，必要时少量核验原文。提取抽象机制后必须回到 `project-index/INDEX.md` 和权威项目文件，按当前世界、角色、地图、玩法与事件原创重组。外部结果始终为 `canonical: false`，不能作为璃落事实。正式写入故事、事件、场景、CG 提示词或状态描述前运行直接照搬检查。

## 维护与五类卡片

用户只维护本机权威源。`external:knowledge:update` 先用路径与 SHA-256 增量同步镜像，再执行来源级增量索引；普通删除无需询问并只删除受控镜像文件，一次删除超过清单 20% 时自动中止。同步绝不反向删除或改写权威源。schema、分段规则、索引格式、批量移动、损坏或用户明确要求时全量重建。五类卡为 `expression`、`visual-structure`、`scene-pattern`、`fictional-state`、`trope`；确定性生成内容只标 `candidate`，明确人工/Codex 审核后才可标 `reviewed`。

## 命令

```powershell
npm run external:knowledge:check
npm run external:knowledge:sync
npm run external:knowledge:update
npm run external:knowledge:build
npm run external:knowledge:validate
npm run external:knowledge:query -- --query "古堡 逃脱" --mode and --limit 8
npm run external:knowledge:copy-check -- --input "待检查文件.md"
```

相似性检查比较连续相同字符与 n-gram 重叠，输出 `low` / `medium` / `high`、来源位置和改写建议；它只是保守的写作风险提醒，不是法律结论。禁止复制/拼接原文、仅替换人名、沿用标志性台词或完整事件顺序，也禁止把虚构状态卡写成现实操作教程。

故障时先看 `sync-status.json`、`sync-manifest.json`、`status.json`、`manifest.json` 和 `reports/`：同步被阻止时先确认权威目录可用及删除比例，`stale` 运行增量更新，解析失败修生成器，索引损坏安全全量重建。不得手改派生索引掩盖错误，不得修改权威语料来通过测试。
