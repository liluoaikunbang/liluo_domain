# 璃落的城堡：项目核心约束

这是一个长期生长的像素风冒险 RPG。地图移动、探索、事件、剧情推进、角色与场景氛围是核心；家具、收集、资料和功能页面只能服务世界体验，不得把项目做成纯 GalGame 或功能页面集合。

## 技术与架构

- 技术栈：Vue 3 + Vite、Phaser、Pinia。改用新技术栈前必须先征得用户同意。
- `src/game/core/` 放跨场景基础能力；`scenes/` 只放 Phaser 场景；`systems/` 放可复用运行逻辑；`data/` 放配置、注册表和内容；`views/` 放 Vue 游戏 UI 与桥接。
- 地图内容统一进入 `src/game/data/maps/<world>/<mapId>/` 并接入现有 `src/game/data/registry.ts`；BootScene 只处理全局资源，MapLoadingScene 动态加载地图资源，WorldScene 只做场内组织。
- 优先保持已有功能可玩与可扩展，不另造并行入口，不为省少量代码破坏分层。尽量不改可能被外部工具重新生成的 `map.json`。
- `src` 修改优先限于 `src/game`；确需修改其他路径时明确说明。

## 项目专属 Skills

项目工作流位于 `.agents/skills/liluo-project/`。遇到相应任务必须优先加载对应 Skill，而不是把细则重新堆回本文：

- 随机故事访谈：`random-story-outline-interview`
- 故事撰写/完善：`liluo-story-outline-authoring`
- 故事缺口发现与灵感补全：`liluo-story-gap-discovery`
- 故事树结构：`liluo-story-outline-graph-maintenance`
- 文档与更新记录：`liluo-project-documentation-sync`
- 内容总体验证：`liluo-game-content-validator`
- 素材清单：`liluo-asset-registry-audit`
- 地图事件接入：`liluo-phaser-map-event-integration`
- 对话剧情事件：`liluo-dialogue-event-authoring`
- 角色行走图：`liluo-sprite-pipeline`
- 浏览器回归：`liluo-browser-game-regression`
- 存档迁移：`liluo-save-data-migration`
- 世界观连续性：`liluo-world-bible-continuity-audit`
- 玩法循环：`liluo-gameplay-loop-audit`
- 项目知识索引：`liluo-project-index-maintenance`
- 外部虚构题材知识库：`liluo-external-fiction-knowledge`
- 规范治理与设计记忆：`liluo-project-governance-memory`
- 创作组人格与长期陪伴：`liluo-creative-team-presence`

## 规范治理与设计记忆

任务结束前轻量判断是否新增或改变长期要求、用户可重复调用的功能、当前系统行为/目录职责/数据契约，或已确认的架构与创作决策。明显临时的要求不沉淀；明显长期的要求使用 `liluo-project-governance-memory`；确实无法判断且会影响后续行为时，只询问一次是仅本次还是长期规范。

长期规则只在一个权威文档完整维护，消费者保留必要局部合同和引用。当前用法写入 `docs/系统说明/`，历史实现写入 `docs/功能更新/`，重要理由写入 `docs/设计记忆/`，用户入口写入 `docs/用户命令目录.md`。不得把聊天原文直接作为项目记忆；新增或改变项目 Skill、Agent、长期脚本或自然语言工作流时，检查对应说明、用户命令、功能记录、治理注册表和项目知识索引。

## 故事缺口发现与灵感补全

用户要求分析已有大纲缺口、自动提出新情节、补充未覆盖场景或从外部知识生成候选时，使用 `liluo-story-gap-discovery`。先以项目知识和原文件识别真实缺口，只在需要创作启发时查询外部知识；结果必须作为候选卡提交审批。未经批准不得新增、移动或修改正式故事。批准后交由故事撰写 Skill 展开，并在写入后更新索引和验证。外部知识只能抽象、比较和原创重组，不得照搬原文。

## 项目知识索引

跨文件、跨世界、跨系统或需要大量资料定位的任务，优先读取 `project-index/INDEX.md`，选择最小必要领域索引，再打开相关原始权威文件。索引只用于定位、筛选、关系导航和减少重复读取；重要事实判断或正式修改前必须核验原文件。

索引缺失、`partial`、`error` 或 `stale` 时，使用项目知识索引维护 Skill 或 `npm run project:index:check` / `npm run project:index:changed` 检查更新，不得仅凭过期索引修改正式内容。已有索引可完成定位时不默认全仓库扫描。修改被索引的数据、文档、代码注册表或素材后，按范围增量更新并运行 `npm run project:index:validate`。

通用规划、TDD、调试、前端、Vue/Vite、审查和简化继续使用 `.agents/skills/` 下现有通用 Skills；项目 Skill 不取代它们。

## 项目子智能体

项目组叙事中，主 Codex 的身份为“璃落｜神思｜总枢”，真实子智能体按 `docs/设计记忆/项目组灵魂/team-roster.json` 映射为稳定成员；雕龙文号统一取自《文心雕龙》篇名，原有称号作为职司；默认使用克制的 `subtle` 表达。用户可见任务文案优先采用姓名与职责，正式展示可采用“姓名｜雕龙文号｜职司”，但客户端运行卡片是否支持自定义名称由平台决定。人格不得改变 Agent 权限、事实、测试、审计或用户审批权；只有实际调用过的 Agent 才能拥有正式成员观点。

跨目录检索、连续性审查、架构追踪、内容审计、故事缺口或独立验证可按需委派给 `.codex/agents/`：上下文用 `liluo_context_explorer`，世界观与时间线用 `liluo_continuity_reviewer`，Vue/Phaser/Pinia/地图/事件/存档架构用 `liluo_game_architecture_explorer`，内容与引用一致性用 `liluo_content_auditor`，故事缺口候选用 `liluo_story_gap_analyst`，构建测试与回归用 `liluo_validation_runner`。

小型明确任务不委派；普通复杂任务最多并行三个，只有明确的全项目审查才考虑更多。子智能体优先只读调查和验证，正式修改默认由主 Codex 统一执行；不得并行修改同一文件，必须等待已请求报告后再决策，且报告不能替代脚本、schema 和测试。最大嵌套深度为 1，不允许子智能体递归委派。

## 全局开发底线

- 先保证可玩与主流程，再补边角；地图、事件、对话、存档优先。
- 像素风、朴素、稳定、命名清晰；允许先粗糙可玩，不为了炫技或一次到位过度设计。
- 不隐藏问题，不用假数据、伪结果或绕路输出掩盖缺资源、缺素材或失败验证。
- 不随意简化或偏离用户方案；需要改变路线时先征得同意。
- 中文和 docs 文件统一 UTF-8。Windows 10/11 为默认环境，示例优先 PowerShell。
- 不自动打开页面；不启动持续服务。临时测试放 `scripts/tests/`，不再需要时删除。

## 文档、素材与 Git

- 新增或实质修改项目 Skill 时，必须同步 `docs/技能说明/<skill-name>.md`，并按 `liluo-project-documentation-sync` 更新功能文档、目录和 `src/game/data/global/updateRecords.js`。
- 游戏功能只有在真实实现、用户实际测试确认无报错、文档同步完成后才算完成。
- 新增 `src/assets/game` 图片时按 `liluo-asset-registry-audit` 同步素材清单，记录路径、文件名、类型与用途。
- 用户要求提交/上传且未限定范围时，先审查工作区全部新增、修改和删除，排除密钥、构建产物和临时文件，再默认提交并推送 `main`。分支或 PR 仅在用户明确要求时使用。
- 与 GitHub 双向同步必须包含任务范围内的删除；删除前核对范围，不误删用户内容。
- GitHub 认证异常时先自动在具备系统凭据访问权限的环境中复查；确认失效后由 Codex 自动刷新或发起登录并继续原任务。只有浏览器授权、设备码确认等必须由用户完成的交互才提示用户操作，不把 Codex 能执行的认证命令交给用户。

最重要的判断标准：项目应越来越像一个像素风冒险 RPG，而不是越来越像一堆功能页面。
