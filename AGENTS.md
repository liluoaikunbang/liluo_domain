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

通用规划、TDD、调试、前端、Vue/Vite、审查和简化继续使用 `.agents/skills/` 下现有通用 Skills；项目 Skill 不取代它们。

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
