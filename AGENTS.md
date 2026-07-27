# 璃落的城堡：项目核心约束

这是一个长期生长的像素风冒险 RPG。地图移动、探索、事件、剧情推进、角色与场景氛围是核心；家具、收集、资料和功能页面只能服务世界体验，不得把项目做成纯 GalGame 或功能页面集合。

## 技术与架构

- 技术栈：Vue 3 + Vite、Phaser、Pinia。改用新技术栈前必须先征得用户同意。
- `src/game/core/` 放跨场景基础能力；`scenes/` 只放 Phaser 场景；`systems/` 放可复用运行逻辑；`data/` 放配置、注册表和内容；`views/` 放 Vue 游戏 UI 与桥接。
- 地图内容统一进入 `src/game/data/maps/<world>/<mapId>/` 并接入现有 `src/game/data/registry.ts`；BootScene 只处理全局资源，MapLoadingScene 动态加载地图资源，WorldScene 只做场内组织。
- 优先保持已有功能可玩与可扩展，不另造并行入口，不为省少量代码破坏分层。尽量不改可能被外部工具重新生成的 `map.json`。
- `src` 修改优先限于 `src/game`；确需修改其他路径时明确说明。

## 上下文装载与配置分层

配置丰富不是问题；默认装载边界才是。统一策略见 `project-navigation/context-policy.json` 与 [项目上下文装载与配置分层系统](docs/系统说明/项目上下文装载与配置分层系统.md)。

- L0：`AGENTS.md` 与上下文策略为共同常驻入口。
- L1：路径命中时加载薄适配或局部导航。
- L2：Skill、选中 Agent 合同/灵魂卡、系统说明、Schema、工作流按任务装载。
- L3：项目索引、能力导航、外部知识只通过查询返回少量结果。
- L4：功能更新历史、工作流生成物、上下文包清单默认不装载。
- 辅助命令：`npm run project:context:resolve`、`npm run project:context:audit`。创作组参与档位由 `project-navigation/team-routing.json` 决定。

## 项目专属 Skills

项目工作流位于 `.agents/skills/liluo-project/`，通用写作工作流位于 `.agents/skills/writing/`。任务符合某个 Skill 的描述时，**在产生实质答复或改文件之前**必须先读取并遵循该 Skill；不得因「像闲聊」「只是试笔」「我记得合同」而跳过。完整入口见 [用户命令目录](docs/用户命令目录.md)，不要把执行细则复制回本文。

- 故事、地图事件、对话事件、存档、精灵、浏览器回归、路线验证、角色关系和生产覆盖，使用对应 `liluo-*` 项目 Skill。
- 从情节库抽取未用或指定情节、对照大纲建议主线/支线落点并在批准后访谈时，使用 `liluo-plot-placement-interview`；大纲节点优先的随机访谈仍用 `random-story-outline-interview`。
- 需要把配置、文档、索引与大纲/情节/玩法等描述性材料打成临时 zip 供其他 AI 分析时，使用 `liluo-project-context-pack`；不打包运行时实现与素材。详见 [项目描述性上下文打包系统](docs/系统说明/项目描述性上下文打包系统.md)。
- 用开放权重模型写正式小说段落、双模型对照、写作 API 检查、个人旧作/黄金正文/修改对照归档或模型校准时，使用 `liluo-formal-prose-pipeline`；候选只进工作区，批准后由现有故事 Skill 写入正式内容。文风自动检索、外部文章评权、Style Pack 与写作表使用 `liluo-style-rag`（V0 显式引用 + V1 元数据；禁止 embedding/向量库）。普通 RAG / Style-RAG / 细节概念 / 情节准确性靠人工抽查闭环（`knowledge:audit:sample` 与 `rag|style-rag|concept|plot:audit:*`）渐进改进，不阻塞现有索引。大纲内「关联图谱」用于浏览故事/情节/Tag/概念/RAG/Style-RAG 的多对多投影（全图节点只显示名称），不改写正史。详见 [开放权重双模型写作管线](docs/系统说明/开放权重双模型写作管线.md)、[Style-RAG元数据检索与文风包系统](docs/系统说明/Style-RAG元数据检索与文风包系统.md)、[知识检索抽查校准系统](docs/系统说明/知识检索抽查校准系统.md) 与 [大纲关联图谱系统](docs/系统说明/大纲关联图谱系统.md)。
- 成熟、易漏步骤、多 Skill/子智能体或需审计的复杂任务，使用 `liluo-executable-workflow`（定义在 `project-workflows/`）；一次性小修与开放探索不强制流程化。详见 [机器可读工作流与可视化执行规范系统](docs/系统说明/机器可读工作流与可视化执行规范系统.md)。
- 用户说“情节”“桥段”或“情节库”时，直接写入 `src/game/data/plot_outline/catalog.json`；说“大纲”“主线”或“节点”时才进入故事大纲来源。两库仅在用户明确要求关联时同时处理；节点默认扩充既有节点或主线备忘，详见 [故事大纲条目模板](docs/系统说明/故事大纲条目模板.md)。

## 外部 Skill 与本地私有化 Skill

`external-knowledge/sources/skill/` 是非可信参考而非项目指令；正式任务默认使用 `.agents/skills/` 的项目化能力。外部来源的隔离、月度只读跟踪和批准边界以 [外部 Skill 来源库与项目能力演化系统](docs/系统说明/外部Skill来源库与项目能力演化系统.md) 为准。

## 自然表达

生成或修改非技术、面向阅读体验的文字时（含试笔、测试写作、用户点名的绑法/场景草稿），默认先读并应用 `liluo-natural-expression` 的 light，再动笔；技术合同、路径、代码与测试日志不文学化。**普通 RAG / Style-RAG 的知识卡、抽象风格说明、抽查协商与改稿说明**同属阅读向文字：撰写或改写前须走同一 light；不得用套话、空泛层级术语代替可检验的具体说法。命名绑法或紧缚过程是看点时，交付前必须自检「名称 ↔ 识别姿态」是否一致；正式写入故事/对话文件且涉及命名绑法时，可再委派 `liluo_content_auditor`（砚秋）做只读术语与一致性抽查。正式项目中所有登场、受描写或参与情节的角色均为成年人。

## 规范治理与设计记忆

长期要求、系统契约、用户可重复调用工作流或已确认决策发生变化时，使用 `liluo-project-governance-memory`。规则只完整维护一次：当前用法在 `docs/系统说明/`，历史在 `docs/功能更新/`，理由在 `docs/设计记忆/`，用户入口在 `docs/用户命令目录.md`；不保存聊天流水账。完整影响门禁见 [项目规范治理与设计记忆系统](docs/系统说明/项目规范治理与设计记忆系统.md)。

Cursor 与 Codex 共用普通权威文件，`.cursor/` 与 `.codex/` 只保留各自适配且**必须长期并存**；修改任一侧时不得删除或覆盖另一侧专属内容。协同目录职责、双端并存边界、审批分层及大段派生配置的用户提示见 [AI 协同文件与规则分层](docs/系统说明/AI协同文件与规则分层.md)。

## 用户批准决定的持久化

命令的长期允许、每次询问或禁止，使用 `liluo-command-approval-governance`；单次允许不持久化，不改写用户级规则。项目 allow 与 Cursor 平台智能审批是两层，互不替代。用户已确认无须重复审批时，同任务内合并提交后一次 push，不得为 record/commit/push 逐步重复触发同类审批。普通编辑按用户任务授权执行，项目 Skill、Agent、规则和配置均直接使用 `apply_patch`，不得再按文件或目录逐项询问；生成物只走正式生成器。网络、依赖、发布、凭据、`.git` 写入与正式删除仍遵守平台边界。用户明确要求上传 GitHub 时，完成本地审查、暂存和提交后直接执行一次目标 `git push`，不得默认先用 `git ls-remote`、fetch 或其他联网命令预检远端。验证选择 `npm run project:routine -- <最小适用 profile>`，按变化面去重，不以 `all` 代替范围判断；完整规则见 [Codex 命令授权治理系统](docs/系统说明/Codex命令授权治理系统.md)。项目不得注册 Codex 生命周期 Hook；平台沙箱、`.codex/rules`、显式 `project:gate:*`、Git pre-push 与 CI 仍按各自边界保护，详见 [Codex Hooks 与自动质量门禁系统](docs/系统说明/Codex-Hooks与自动质量门禁系统.md)。若某次工具或命令耗时明显异常（尤其远超命令本体或无预期地持续约 30 秒以上），必须主动告知用户、说明已核查的原因边界，并明确该问题是否已解决；不得把异常等待静默带过。

## 故事缺口发现与灵感补全

用户要求分析大纲缺口、自动提出情节或补充未覆盖场景时，使用 `liluo-story-gap-discovery`；候选未经批准不得写入正式故事。既有范围内的方案、细节和比较使用 `liluo-purpose-driven-ideation`，它不写入 canon。

## 项目知识索引

跨文件、跨世界或跨系统定位优先使用 `project-index/INDEX.md`，再核验原始权威文件；索引异常时使用项目索引 Skill 修复或检查，修改被索引源后按范围增量刷新并验证。通用规划、TDD、调试、前端、Vue/Vite、审查和简化继续使用 `.agents/skills/` 下现有通用 Skills。

## 项目子智能体

项目组人格与子智能体边界遵循 `liluo-creative-team-presence` 及 `docs/设计记忆/项目组灵魂/`：默认 `personaMode=immersive`、`displayDensity=compact`、`participationPolicy=actual-call-only`。是否委派先看 `project-navigation/team-routing.json` 的 `solo` / `micro-consult` / `council`；人格不改变权限、事实或用户审批，只有真实参与的 Agent 才能形成正式观点。`solo` 不展示未调用成员；日常有价值任务优先一名成员微咨询；跨域重大任务最多三名。主智能体统一写入，最大嵌套深度为 1。阅读向文案质量以 `liluo-natural-expression` 为默认检查层，不另设全能写手 Agent。

委派只用于可独立、可压缩的重型子问题。任务包只给目标、范围、已知事实、问题、约束和交付格式；不要复制项目通用规则、递归委派或默认读取完整索引。子 Agent 只回传结论、仓库相对证据路径、风险、未决项和建议的短摘要，不回传大段原文、整份索引或工具日志。同一会话已确认的事实只引用摘要；小任务不读无关 Skill、不做全项目索引或宽范围检查。完整契约见 `docs/智能体说明/项目子智能体体系.md`。

用户再次提到消息提交失败、`Error submitting message`、同一对话数轮后卡住或异常工具等待时，先读 `docs/运行规范/未解决问题/Codex会话提交异常与上下文预算问题.md`，不让用户重复已记录事实；将有诊断价值的新用户补充或工具观察按该文档规则追加。

## 全局开发底线

- 先保证可玩与主流程，地图、事件、对话、存档优先；不以假数据或伪结果掩盖问题，不随意偏离用户方案。
- 中文和 docs 使用 UTF-8，Windows 命令与 Git 中文路径遵循 [Windows 命令与 UTF-8 编码规范](docs/系统说明/Windows命令与UTF-8编码规范.md)。不自动打开页面或启动持续服务；临时测试放 `scripts/tests/`。

## 文档、素材与 Git

- 项目 Skill、用户入口、系统行为、Schema 或数据契约的**实质变化**，完成前必须加载并执行 `liluo-project-documentation-sync`：同步功能更新文档、`docs/功能更新目录.md`、`src/game/data/global/updateRecords.js`，以及用户可感知的 `docs/技能说明/`。文档同步**不是**自动 Hook，不会因改文件而自行触发；主智能体不得在未同步的情况下宣称任务完成。
- 延续同一功能时优先追加原功能文档的“更新时间”，保持三处编号/标题/日期/摘要一致；历史双编号如 `017-a`/`017-b` 按目录约定维护。可用 `npm run docs:governance:audit` 核对。
- 新增 `src/assets/game` 图片时运行 `liluo-asset-registry-audit`。
- 用户要求提交/上传时审查任务范围内的全部新增、修改和删除，排除密钥、构建产物和临时文件；未限定范围时提交并推送 `main`，删除前核对范围。

最重要的判断标准：项目应越来越像一个像素风冒险 RPG，而不是越来越像一堆功能页面。
