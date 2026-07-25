# 璃落的城堡 / 璃落宇宙

一个长期生长的像素风冒险 RPG 项目。核心体验是地图移动、探索、事件、剧情推进、角色与场景氛围；功能页面、资料、收集和家具只用于支持世界体验。

## 快速入口

- [项目文档总入口](docs/README.md)
- [项目概览](docs/项目概览.md)
- [用户命令目录](docs/用户命令目录.md)：向 Codex 下达的常用自然语言任务与对应命令
- [当前系统说明](docs/系统说明/README.md)
- [项目规范治理与设计记忆](docs/系统说明/项目规范治理与设计记忆系统.md)
- [设计记忆](docs/设计记忆/README.md)
- [项目 Skills 说明](docs/技能说明/)
- [项目子智能体说明](docs/智能体说明/项目子智能体体系.md)
- [创作组雕龙文号体系](docs/设计记忆/项目组灵魂/文号体系/README.md)：成员采用“姓名｜雕龙文号｜职司”，文号统一取自刘勰《文心雕龙》篇名
- [功能更新目录](docs/功能更新目录.md)
- [游戏素材图片清单](docs/游戏素材图片清单.md)
- [项目知识索引](project-index/INDEX.md)
- [JSON Schema 数据契约系统](docs/系统说明/JSON-Schema数据契约系统.md)
- [Skill / Agent 能力回归评测系统](docs/系统说明/Skill与Agent能力回归评测系统.md)
- [Codex Hooks 与自动质量门禁系统](docs/系统说明/Codex-Hooks与自动质量门禁系统.md)
- [效用导向灵感与细节构思系统](docs/系统说明/效用导向灵感与细节构思系统.md)
- [外部虚构题材知识库](external-knowledge/INDEX.md)

## 技术栈与目录

- Vue 3 + Vite：页面、游戏 UI 和构建。
- Phaser：2D 地图、移动、碰撞、镜头与场内组织。
- Pinia：运行时状态。
- `src/game/`：当前游戏主流程；`docs/`：权威说明与历史记录；`project-index/`：项目知识导航；`external-knowledge/`：非正式外部创作参考。

详细架构与目录职责见 [项目概览](docs/项目概览.md) 和 [系统说明](docs/系统说明/README.md)。

## 常用开发命令

```powershell
npm install
npm run dev
npm run build:web
npm run build:offline
npm run package:offline
npm run docs:check-encoding
npm run docs:governance:audit
npm run data:contracts:check
npm run data:contracts:test
npm run evals:check
npm run evals:smoke
npm run project:gate:changed
npm run project:gate:prepush
npm run project:hooks:install
npm run project:index:check
npm run project:index:changed
npm run project:index:validate
npm run external:knowledge:update
npm run external:knowledge:validate
```

完整命令、适用时机和自然语言示例统一维护在 [用户命令目录](docs/用户命令目录.md)，不再要求从聊天记录中回忆。

## 协作约定

- 先保证可玩主流程，再补边角功能。
- 正式事实以权威故事、地图、事件、代码、schema 和系统说明为准；索引用于定位，不替代原文件。
- 外部知识只提供抽象灵感，永远不是璃落宇宙正式设定。
- 不把密钥、本机绝对路径配置、临时构建产物或真实存档提交到 Git。
- 项目持久规则见 [AGENTS.md](AGENTS.md)。
