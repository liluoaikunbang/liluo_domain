# 外部虚构题材知识库 Skill

## 故事缺口候选接入

为 `liluo-story-gap-discovery` 提供非 canon 抽象卡，默认轻量检索，不直接生成或写入正式项目内容；外部启发的正式长文本完成前运行照搬风险检查。

`liluo-external-fiction-knowledge` 负责查询、同步、构建、增量更新、验证外部虚构题材语料，并把文学表达、画面结构、场景、虚构状态和题材模式抽象成可追溯的原创参考。本机权威源由 `external-knowledge/source-sync.local.json` 指向，仓库索引入口固定为其受控镜像 `external-knowledge/sources/fiction-bondage/`。

## 触发边界

在查询外部小说素材、从参考小说找灵感、查文学表达/类似场景/画面结构/题材模式、建立知识卡、更新或重建外部知识库、检查过期或照搬风险时触发。单纯查询璃落正式设定、普通代码修改、项目内部索引维护、无外部灵感需求的小改动、图片润色和普通构建不触发。

## 查询与创作流程

先运行新鲜度检查，再查询卡片或分段；默认只读取短预览、来源路径和行号，必要时少量核验原文。提取抽象机制后必须回到 `project-index/INDEX.md` 和权威项目文件，按当前世界、角色、地图、玩法与事件原创重组。外部结果始终为 `canonical: false`，不能作为璃落事实。正式写入故事、事件、场景、CG 提示词或状态描述前运行直接照搬检查。撰写或改写知识卡正文、抽查协商与改稿说明前，先应用 `liluo-natural-expression` light。

## 维护与七类卡片

用户只维护本机权威源。`external:knowledge:update` 先用路径与 SHA-256 增量同步镜像，再执行来源级增量索引；普通删除无需询问并只删除受控镜像文件，一次删除超过清单 20% 时自动中止。同步绝不反向删除或改写权威源。schema、分段规则、索引格式、批量移动、损坏或用户明确要求时全量重建。七类卡为 `expression`、`visual-structure`、`scene-pattern`、`fictional-state`、`trope`、`term`、`plot-pattern`。术语卡记录定义、别称和易混边界；情节模式卡记录前提、推进、控制/状态变化、反转和后果。两者由 `card-rules.json` 的证据组与最小来源数确定性生成；证据不足时跳过。规则可声明 `linkedConceptIds`，挂到概念种子的「上位类别 / 具体概念」；`concepts[]` 只写名称/别名，不写推进句。自动内容只标 `candidate`，明确人工/Codex 审核后才可标 `reviewed`。概念层次权威在 `conceptRegistry.js`，不并入本知识库。

## 命令

```powershell
npm run external:knowledge:check
npm run external:knowledge:sync
npm run external:knowledge:update
npm run external:knowledge:build
npm run external:knowledge:validate
npm run external:knowledge:query -- --query "古堡 逃脱" --mode and --limit 8
npm run external:knowledge:query -- --card-type term --query "送绑玩脱"
npm run external:knowledge:query -- --card-type plot-pattern --query "保障失效 控制权转移" --mode and
npm run external:knowledge:copy-check -- --input "待检查文件.md"
```

相似性检查比较连续相同字符与 n-gram 重叠，输出 `low` / `medium` / `high`、来源位置和改写建议；它只是保守的写作风险提醒，不是法律结论。禁止复制/拼接原文、仅替换人名、沿用标志性台词或完整事件顺序，也禁止把虚构状态卡写成现实操作教程。

故障时先看 `sync-status.json`、`sync-manifest.json`、`status.json`、`manifest.json` 和 `reports/`：同步被阻止时先确认权威目录可用及删除比例，`stale` 运行增量更新，解析失败修生成器，索引损坏安全全量重建。不得手改派生索引掩盖错误，不得修改权威语料来通过测试。
