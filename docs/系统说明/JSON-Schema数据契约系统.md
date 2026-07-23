# JSON Schema 数据契约系统

## 系统目的

本系统为会被运行时代码、编辑器、索引、存档或自动化脚本长期消费的数据提供结构合同，尽早发现字段缺失、改名、错误类型、非法枚举、未知版本和未登记扩展。合同采用 JSON Schema Draft 2020-12，由 `schemas/registry.json` 把 Schema 与现有权威源绑定，不建立第二套故事、地图、事件或素材数据。

## 目录职责

- `schemas/registry.json`：登记合同 ID、Schema 路径、真实源文件 glob、读取方式、领域归属和 changed gate 策略。
- `schemas/common/`：稳定标识符和仓库来源引用等公共定义。
- `schemas/story/`、`maps/`、`events/`、`saves/`、`assets/`：各领域正式结构合同。
- `schemas/tests/valid/`、`schemas/tests/invalid/`：每份合同的正反 fixture。
- `scripts/data-contracts/`：注册表检查、正式数据验证、fixture 测试和错误格式化。

故事节点、地图元数据与素材条目会从现有 JSON、`meta.ts`、目录上下文或素材清单表格生成只读验证视图。派生字段只用于补充来源、系列、地图上下文和合同版本，不会写回权威数据。Tiled 生成的 `map.json` 只登记路径，不约束其完整内部结构。

## 已覆盖合同

| 合同 ID | 权威源 | 读取粒度 |
| --- | --- | --- |
| `story-node` | `src/game/data/story_outline/sources/*.json` | `nodes` 中的单节点 |
| `map-metadata` | `src/game/data/maps/*/*/meta.ts` 及同目录桥接文件 | 单地图派生元数据 |
| `map-event` | 各地图 `events.json` | 对象值中的单事件 |
| `dialogue-event` | 各地图 `dialogues.json` | 单句或分支对话 |
| `interactive-fiction` | `interactive_fictions/*/scenario.json` | 单副本 |
| `save-data-v1` | 运行时内部单档格式 | 模板合同与 fixture |
| `save-export-v1` | 全部存档导出包格式 | 模板合同与 fixture |
| `asset-entry` | `docs/游戏素材图片清单.md` 的单文件表 | 单素材条目 |

## Schema 与业务 validator 的边界

JSON Schema 只判断单份记录的字段、类型、枚举、格式、范围和封闭结构。重复 ID、父子关系、循环、引用存在性、地图出口目标、事件链、素材文件缺失、状态冲突和路线可达性仍由 `liluo-game-content-validator`、存档迁移、素材审计、叙事路线验证和项目索引验证负责。

素材清单尚未记录来源或授权结论时，派生条目会明确使用 `not-recorded`，不会猜测许可状态。合同验证不会读取真实 localStorage、真实导出存档或图片内容。

## 版本规则

- 所有 Schema 使用 Draft 2020-12，并通过唯一 `$id` 解析引用。
- 注册表当前为 `schemaVersion: 1`。
- 内部存档和导出包正式版本均为 `version: 1`；未知未来版本和错误版本类型直接失败，不按 v1 强行读取。
- 旧数据允许通过注册表绑定合同，暂不要求批量内嵌 `schemaVersion`。
- 新建或实质改变重要数据格式时，应先更新 Schema、fixture 和注册表，再修改消费者；存档格式变化必须另走存档迁移流程。
- 封闭结构默认 `additionalProperties: false`；只有状态字典、节点字典等明确扩展容器允许受值类型约束的动态键。

## 新增合同步骤

1. 核对真实权威源和运行时类型，不从索引摘要或历史文档猜字段。
2. 在对应 `schemas/<domain>/` 新建 Draft 2020-12 Schema，定义 `$id`、必填字段、属性、枚举和 `additionalProperties`。
3. 在 `schemas/registry.json` 登记唯一合同 ID、源 glob、读取模式、owner、changed gate 和内嵌版本策略；没有仓库内真实数据文件的运行时格式必须标记为模板合同。
4. 在 valid 目录添加至少一个合法 fixture，在 invalid 目录分别添加缺少必填字段和错误类型 fixture；判别字段或版本合同补充专门反例。
5. 先运行注册表编译与 fixture 测试，再运行指定合同和全量正式数据验证。
6. 跨文件引用、唯一性或可达性规则交给对应业务 validator，不复制到 Schema。

## 常用命令

```powershell
npm run data:contracts:registry
npm run data:contracts:check
npm run data:contracts:all
npm run data:contracts:test
node scripts/data-contracts/validate-data-contracts.mjs --contract map-event --scope all --check
node scripts/data-contracts/validate-data-contracts.mjs --scope all --json
```

`npm run project:routine -- check` 已包含 changed gate；日常检查不会自动运行全量合同。

## 失败信息解释

文本错误依次显示源文件、合同 ID、JSON Pointer、Schema 关键字和原因。常见关键字包括：

- `required`：缺少必填字段。
- `type`：字段类型错误。
- `additionalProperties`：出现合同未登记字段。
- `enum` / `const`：枚举、判别字段或版本不受支持。
- `pattern` / `format`：ID、路径或时间格式不合法。
- `oneOf`：记录没有匹配唯一结构分支，例如事件触发类型或对话形态错误。
- `load`：源文件无法解析或派生上下文不完整。
- `registry`：注册表、Schema 文件、`$id`、glob 或引用编译失败。

`--json` 使用稳定对象字段输出同一组信息，便于自动化消费。所有验证命令均为只读，失败时不会自动改写数据。
