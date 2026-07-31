# 璃落宇宙

一个 AI 原生叙事游戏生产体系。`璃落的城堡` 是它当前最重要的旗舰实例：同一宇宙里的故事、状态、角色和氛围，会被持续生产成像素风冒险 RPG、互动小说、副本桥段、CG 简报和未来更多正式输出形态。

![璃落宇宙主视觉](docs/assets/readme/hero-liluo-universe.png)

## 这是什么

这里不是单纯的“做一个游戏页面”，也不是只为写文服务的文本仓库。它要解决的是另一件事：如何让同一份正式叙事，能够被稳定拆分、编排、验证，并在不同成本和不同媒介里持续长出来。

当前的旗舰体验仍然是 Phaser 驱动的像素风冒险 RPG。地图移动、探索、事件、剧情推进、角色与场景氛围，是最核心的世界体验。互动小说与其他轻量形态则作为正式输出加入体系，而不是低优先级替代品。

## 核心分层

![故事世界如何长成体验](docs/assets/readme/storyworld-growth.png)

1. 宇宙与正史层：保存世界、角色、关系、状态和正式事实。
2. 叙事生产层：把批准过的故事节点整理成可持续复用的叙事生产包。
3. 体验编排层：把同一叙事拆到 RPG、互动小说、桥段、副本等形态里。
4. 素材编排层：为同一叙事准备角色立绘、CG、音频、界面与地图资源槽位。
5. 输出与运行层：把产物接入 Phaser、文本副本、资料界面与未来运行容器。

## 同一故事，多种形态

![同一段叙事的多形态输出](docs/assets/readme/one-story-many-forms.png)

这套体系强调一份事实、多种输出：

- 一段故事可以先以互动小说灰盒验证节奏。
- 成熟后再进入地图、事件、对话和状态流转。
- 需要时生成 CG 简报、资料卡、桥段稿和玩法合同。
- 后续扩展不能反过来污染正史，也不能绕开审批链直接写 canon。

## 快速入口

- [项目愿景](docs/项目愿景.md)
- [项目概览](docs/项目概览.md)
- [文档总入口](docs/README.md)
- [系统说明](docs/系统说明/README.md)
- [设计记忆](docs/设计记忆/README.md)
- [用户命令目录](docs/用户命令目录.md)
- [项目规范治理与设计记忆系统](docs/系统说明/项目规范治理与设计记忆系统.md)
- [项目知识索引](project-index/INDEX.md)

## 常用命令

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
npm run project:gate:changed
npm run project:index:check
npm run project:index:changed
npm run project:index:validate
```

完整命令、适用时机和自然语言入口统一维护在 [docs/用户命令目录.md](docs/用户命令目录.md)。

## 当前技术骨架

- Vue 3 + Vite：游戏 UI、工具界面和构建。
- Phaser：2D 地图、移动、碰撞、镜头和 RPG 场内组织。
- Pinia：运行时状态。
- `src/game/`：当前旗舰体验的运行时与内容接入。
- `docs/`：权威说明、决策、治理和历史记录。
- `schemas/`：跨叙事生产与运行数据的结构合同。

## 协作底线

- 一切系统都应服务正式叙事与可玩体验，不为空转造概念。
- 正式事实以权威故事、地图、事件、Schema 和系统说明为准；索引只负责定位。
- 外部知识只提供抽象灵感，永远不是璃落宇宙正式设定。
- 不把密钥、本机配置、临时构建产物或真实存档提交到 Git。
- 项目长期边界以 [AGENTS.md](AGENTS.md) 为准。
