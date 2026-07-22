# liluo-offline-release-pipeline

## 用途

将璃落的多文件离线构建、产物校验、ZIP 压缩、真实浏览器复核、GitHub Release 上传以及必要的文档和项目索引同步组织成一条可重复调用的自动流程。

## 触发方式

适用于“生成可以双击启动的离线包”“打包当前版本”“把离线版发布到 v0.1.0 Release”“这个版本适合发布，直接部署出来”等需求。普通 Web 构建、开发预览、源码提交和公网服务器部署不使用本 Skill。

## 权威路径

- 当前规则：`docs/系统说明/离线发行与GitHub-Release流程.md`
- 自动脚本：`scripts/release/offline-release.mjs`
- Skill：`.agents/skills/liluo-project/liluo-offline-release-pipeline/SKILL.md`
- 启动器：`scripts/release/launcher/启动游戏.bat`、`scripts/release/launcher/start-game.ps1`
- 测试：`scripts/tests/offline-release.test.mjs`、`scripts/tests/offline-launcher.test.mjs`、`scripts/tests/offline-release-skill.test.mjs`

## 自动流程

1. 检查工作区、版本上下文、现有测试和文档状态。
2. 若发行承接本次功能开发，先调用 `liluo-project-documentation-sync` 补齐必要文档；普通重复发行不新增功能编号。
3. 本地交付执行 `npm run package:offline`。
4. Release 预演执行 `npm run release:offline -- --tag <tag> --dry-run`。
5. 用户明确要求上传且标签无歧义时，执行 `npm run release:offline -- --tag <tag>`。
6. 使用 `liluo-browser-game-regression` 尝试从 `启动游戏.bat` 打开的 `127.0.0.1` 页面做真实回归；测试后关闭启动器。
7. 若修改了发行脚本、契约、Skill 或文档，运行相关测试、治理检查和项目索引增量更新。

任一步骤失败都会停止后续上传，保留本地 ZIP 并报告失败阶段。

## 权限边界

- “生成/打包”只产生本地 ZIP，不访问 GitHub。
- 只有明确的“发布/上传 Release”需求才允许访问 GitHub。
- Release 标签必须明确；不得从 `0.0.0` 猜测正式标签，不自动创建或推送 Git 标签。
- 不自动提交或推送源码，除非用户同时提出 Git 同步要求。
- 不再把直接双击 `index.html` 视为受支持入口；用户入口固定为 `启动游戏.bat`。

## 相邻 Skill 边界

- 本 Skill 负责编排发行流程，离线构建与上传细节仍以 `scripts/release/offline-release.mjs` 为准。
- 功能记录与系统说明交给 `liluo-project-documentation-sync` 同步，不在发行 Skill 中复制文档规则。
- 真实浏览器中的启动器可玩性验证交给 `liluo-browser-game-regression`；未实际打开时不得宣称通过。
- 项目索引仅在发行代码、Skill 或文档发生变化时增量更新，重复打包不制造无意义改动。

## 输出

汇报 ZIP 路径与大小、目标标签、是否访问 GitHub、Release 结果、构建与测试、浏览器覆盖、文档与索引同步，以及未解决阻塞。
