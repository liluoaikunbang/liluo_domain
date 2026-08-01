# README 视觉资产目录

这组文件专门服务于根 `README.md` 的公开展示。它们被强制分层，避免把概念图、真实截图和统计图混写：

- 根目录 `*.png`：本轮保留的旧版宣传图、参考立绘和真实运行截图。
- `generated/`：本轮新生成的世界三联图、角色变体、无字体系底图、README 用 PNG 概念板、协作路线图底图，以及脚本生成的统计图与说明图。
- `composites/`：由程序把 GPT Image 2 原图、真实截图和真实仓库数据拼成的最终公开整板。
- `prompts/`：每批 GPT Image 2 图片的最终提示词记录。
- `screenshots/`：真实截图归档与使用清单。

## 当前使用中的核心文件

- `generated/hero-liluo-universe-v3.png`：本轮 README 首屏主视觉。
- `generated/six-domains-panorama-v2.png`：璃落穿行六域的横向总览海报。
- `generated/world-*-v2.png`：六大叙事域三联图的 18 张原始概念图。
- `composites/world-*-triptych-board.png`：六大叙事域最终单图整板，供根 README 与公开图册直接使用。
- `generated/liluo-*-variant.png`：璃落在六大叙事域中的六张单人变体图。
- `generated/liluo-master-character-portrait-v2.png`：新的角色公开基准立绘。
- `generated/readme-evidence-boundary-base-v2.png`：README 证据边界整板的 GPT Image 2 底图。
- `generated/one-story-many-forms-v2-base.png`：同一故事进入多形态产出的概念板。
- `generated/five-layer-production-system-base.png`：五层生产体系无字底图。
- `generated/universe-state-event-network-base.png`：角色、状态、地图与事件网络底图。
- `generated/story-production-pipeline-base-v2.png`：故事进入多形态流程整板的 GPT Image 2 底图。
- `generated/story-to-playable-case-base.png`：从故事到可玩的案例底图。
- `generated/relationship-graph-display-base.png`：关系图谱公开展示概念底图。
- `generated/relationship-graph-evidence-frame-bg.png`：关系图谱真实证据整板的装裱底图。
- `composites/readme-evidence-boundary-board-v2.png`：根 README 当前使用的证据边界 PNG 整板。
- `composites/story-production-pipeline-board-v2.png`：根 README 当前使用的多形态流程 PNG 整板。
- `composites/relationship-graph-real-evidence-board.png`：用真实图谱截图叠加说明块生成的关系图谱证据整板。
- `composites/story-to-playable-case-asylum-board.png`：以 `十三号病院` 为例的真实链路案例整板。
- `generated/production-maturity-ladder-base.png`：公开成熟度阶梯底图。
- `generated/ai-participation-boundary-base.png`：AI 与人工协作边界底图。
- `generated/collaboration-role-star-map-base.png`：协作角色星图底图。
- `generated/project-roadmap-base.png`：公开路线图底图。
- `generated/closing-invitation-banner.png`：README 协作入口使用的收尾招募横幅。
- `prototype-campus-map.png`：真实地图探索截图。
- `prototype-gallery-ui.png`：真实旅途菜单截图。
- `screenshots/README-SHOT-03-dialogue-and-map-event.png`：真实地图事件对话截图。
- `screenshots/README-SHOT-04-save-load-panel.png`：真实存档与读档界面截图。
- `screenshots/README-SHOT-05-relation-graph-panel.png`：真实关系图谱与大纲图谱面板截图。
- `screenshots/README-SHOT-06-interactive-fiction-mode.png`：真实十三号病院副本模式截图。
- `screenshots/README-SHOT-07-restraint-state-combinations.png`：真实紧缚状态差分组合面板截图。
- `composites/runtime-evidence-board-v1.png`：由 6 张真实核心截图组成的证据板。
- `composites/project-scale-dashboard-v2.png`：叠加真实统计数据后的公开规模看板。
- `generated/project-scale-dashboard.svg`：自动统计看板。

根 `README.md` 当前约有 `33` 个可见视觉单元，已经回到任务书要求的 `28–36` 区间；其中首页的证据边界图、流程图和关系图谱展示都已经切到 PNG 整板，旧 SVG 说明图仅保留在仓库里作为历史生成物与脚本产物。

## 历史资产

以下图片仍保留在仓库中，但本轮 README 不再把它们当作最新主视觉或唯一世界展示：

- `hero-liluo-universe.png`
- `one-story-many-forms.png`
- `storyworld-growth.png`
- `generated/story-production-pipeline.svg`
- `generated/readme-evidence-boundary.svg`

新增批次提示词分别见：

- `prompts/legacy-round-1-assets.md`
- `prompts/2026-07-31-hero-liluo-universe-v2.md`
- `prompts/2026-07-31-world-triptychs-batch-a.md`
- `prompts/2026-07-31-world-triptychs-batch-b.md`
- `prompts/2026-07-31-character-system-batch-a.md`
- `prompts/2026-07-31-liluo-variants-batch-a.md`
- `prompts/2026-07-31-overview-system-batch-b.md`
- `prompts/2026-08-01-readme-png-board-bases.md`

完整登记见 `art-manifest.json`。
