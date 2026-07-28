# 故事—情节—RAG 边界治理系统

## 目标

固定「故事 / 情节 / RAG」三层定义、判断流程与用户最终裁决机制，避免用完成度、标题形态或图谱观感混淆层级。情节库向 RAG 的迁移必须：**AI 审计建议 → 用户逐条确认 → 按确认写入主数据**；禁止批量自动清洗。

权威决策：`docs/设计记忆/创作决策/CDR-010-故事情节RAG三层边界与用户裁决.md`。

## 三层定义

### RAG：可复用创作知识单元

跨故事、跨世界、跨人物仍可调用的概念，例如名词、器具、姿态、材料、状态、效果、行动边界、叙事机制、可复用场景条件与表现方法。可有知识/表达双分支与证据，但通常不绑定唯一角色、地点、时间线或一次完整发生。

核心测试：换人物、世界或地点后，它是否仍是同一概念？是 → 通常属 RAG。

### 情节：一次性叙事发生

由 RAG、人物、地点、动机、冲突与结果组成的具体事件。可以未安置、不完整、从故事抽取，但必须具备某种「发生」：谁（或角色槽位）在什么条件下做了什么/遭遇了什么，并使局面变化。情节本体原则上不可原样复用到多个故事；可复用部分应抽为 RAG。

核心测试：在解释可复用概念，还是在记录一次具体发生？后者 → 通常属情节。

### 故事：正式宇宙结构中的叙事容器

已安置到世界/系列/时间线/故事树，承担正式推进职责的内容单元。可含多个情节，并可直接引用重要 RAG 以便检索，但不替代情节层。

核心测试：是否已决定「发生在璃落宇宙的哪里」并承担正式故事职责？是 → 通常属故事。

## 关系规则

推荐投影：

- 故事 `--contains-->` 情节（`plotRefs`）
- 故事 `--references-->` RAG（`ragRefs`）
- 情节 `--references-->` RAG（情节 `ragRefs`）
- 故事/情节 `--uses-->` 玩法；`--participates-->` 人物；`--located_at-->` 地点

原则：图谱是投影层；确认结果必须回写情节目录、故事 JSON/Markdown、RAG 卡与索引。不得为观感制造无主数据依据的边。不得恢复已退役的普通 Tag / 紧缚 Tag。

## 禁止用完成度区分层级

短≠RAG，长≠情节，写完整≠故事，标题像名词≠RAG。成熟度与层级分开。

情节可选用元数据（不决定层级）：

- `maturity`：`seed` | `fragment` | `scene-ready` | `outline-ready` | `implemented`
- `placementStatus`：`unplaced` | `candidate` | `placed` | `extracted` | `archived`；迁入 RAG 后可用归档语义并保留旧 ID
- `origin`：`user-created` | `assembled-from-rag` | `extracted-from-story` | `ai-proposed` | `imported` | `legacy-migration`

允许拆分：同一旧条目可同时抽出 RAG 并保留情节实例（如「水泥鞋」概念 + 「南堤码头沉湖危机」事件）。

## 审计与确认流程

1. `npm run plot-layer:audit`：只读快照 + 全库建议，不改正式主数据  
2. `plot-layer:review-queue` / `show` / `propose`：查看队列与单条判断卡  
3. 用户逐条裁决；游戏内「大纲 → 层级核对」只读展示队列  
4. `plot-layer:confirm <id> --decision ...`：默认只记确认（dry-run）  
5. 显式 `--apply --confirm-token <id>` 后才写主数据  
6. `rollback` / `rebuild-affected`：回滚提示与受影响重建  

推荐审核顺序：明显 RAG → 建议拆分 → 疑似故事 → 不确定。未确认内容只进候选区。

## 新元素固定建议格式

用户提交新元素时，AI 必须先给出层级建议（可复用性 / 事件性 / 正式安置 / 是否多层），等待用户决定后再写入。禁止直接宣称「已归入某层」并自动落盘。

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run plot-layer:audit` | 只读审计与队列 |
| `npm run plot-layer:review-queue` | 查看待确认队列 |
| `npm run plot-layer:show -- <plotId>` | 完整判断卡 |
| `npm run plot-layer:propose -- <plotId>` | 重新生成建议（不写主数据） |
| `npm run plot-layer:confirm -- <plotId> --decision ...` | 记录确认；加 `--apply --confirm-token` 才写入 |
| `npm run plot-layer:defer -- <plotId>` | 暂缓 |
| `npm run plot-layer:rollback -- <migrationId>` | 回滚情节快照字段 |
| `npm run plot-layer:status` | 状态 |
| `npm run plot-layer:rebuild-affected -- <plotId>` | 受影响重建提示 |
| `npm run plot-layer:test` | 治理测试 |

审计产物：`docs/情节层级核对/`；UI 导出：`src/game/data/plot_outline/layerReviewQueue.json`。

## 相关系统

- [情节条目系统](./情节条目系统.md)
- [Tag体系收缩与RAG情节迁移系统](./Tag体系收缩与RAG情节迁移系统.md)
- [紧缚专业RAG双分支系统](./紧缚专业RAG双分支系统.md)
- [大纲关联图谱系统](./大纲关联图谱系统.md)
