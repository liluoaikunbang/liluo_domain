# liluo-browser-game-regression

## 项目索引协作

复杂回归可用 game/code 索引定位入口，运行时行为仍以源码和真实测试为准；相关源变化后检查索引新鲜度。

## 用途与边界

验证 Vue3+Phaser 的真实浏览器操作流程。只要求单元测试时不触发。

## 路径与输入输出

- Skill：`.agents/skills/liluo-project/liluo-browser-game-regression/`
- reference：`regression-scenarios.md`
- 输入：目标版本、场景、窗口尺寸与可用浏览器工具
- 输出：自动/人工/未执行场景的真实分栏报告

## 流程、限制与验证

当前仓库没有 Playwright，使用构建、Node 测试和人工清单，不伪造 E2E。不得自动安装依赖、打开浏览器或污染真实存档；临时服务必须关闭。未来接入浏览器框架时同步更新本 Skill 与本文。

入口不清时可委派 `liluo_game_architecture_explorer`，执行既有检查可委派 `liluo_validation_runner`；回归期间均不修改应用代码。
