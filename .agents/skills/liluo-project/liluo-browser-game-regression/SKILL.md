---
name: liluo-browser-game-regression
description: Plan and execute real browser regression for the 璃落 Vue3+Phaser game, covering navigation, maps, movement, dialogue, menus and save re-entry. Use for 浏览器回归、真实操作流程、控制台错误或窗口尺寸验证；not when only unit tests are requested.
---

# Browser Game Regression

Read `package.json` and [regression-scenarios.md](references/regression-scenarios.md). The repository currently has no Playwright dependency or browser E2E harness: do not install one or claim automated E2E coverage. Use existing build/Node tests plus an explicit manual checklist unless the repository later gains approved browser tooling.

Use current game/code indexes only for complex test localization; verify runtime sources and run index checks when the tested change touched indexed files.

Never auto-open a browser. If an approved temporary server is used, isolate test saves and stop it afterward. Prefer DOM/state/console assertions; screenshots are supporting evidence, not fragile full-canvas pixel equality. Report exactly which scenarios were automated, manually checked, or not run.

If architecture is unclear, use `liluo_game_architecture_explorer`; execution of existing checks may use `liluo_validation_runner`. Neither modifies application code during regression.
