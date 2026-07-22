# 144-多文件离线发行与 GitHub Release 上传

- 创建日期：2026-07-22
- 更新日期：2026-07-22（改为一键 Windows 本机启动器，并经目标浏览器实际游玩验证）
- 当前状态：已验证可用

## 本次实现

将超大单 HTML 改为带一键 Windows 本机启动器的多文件离线包，通过仅监听 127.0.0.1 的临时服务规避 file:// 的 Phaser/WebGL 跨源限制，并以 Skill 自动编排校验、ZIP 与 Release 上传。

后续补充 `liluo-offline-release-pipeline`：用户提出离线打包或 Release 发布需求时，Codex 自动完成验证、必要文档同步、构建、压缩、浏览器复核、上传和索引更新，同时保留本地打包与真实上传的权限边界。

## 主要路径

- `vite.config.mjs`
- `scripts/release/offline-release.mjs`
- `scripts/release/launcher/启动游戏.bat`
- `scripts/release/launcher/start-game.ps1`
- `scripts/tests/offline-release.test.mjs`
- `scripts/tests/offline-launcher.test.mjs`
- `.agents/skills/liluo-project/liluo-offline-release-pipeline/SKILL.md`
- `docs/技能说明/liluo-offline-release-pipeline.md`
- `docs/系统说明/离线发行与GitHub-Release流程.md`

## 问题与处理

原 `vite-plugin-singlefile` 会尝试将大量素材合并进一个字符串，实测在 1752 个模块转换后触发 `Invalid string length`。新方案关闭资源内联，将动态代码合并为可由 `file://` 加载的经典脚本，同时保留独立素材文件。

Windows 下 Node 直接启动 `npm.cmd` 会返回 `spawn EINVAL`，发行脚本因此改用系统命令解释器运行固定的构建命令，并增加平台命令选择回归测试。

首次人工双击验证发现 Phaser 默认通过 XHR/WebAudio 读取本地图片和 MP3 时被 Chromium 的 `file://` 安全策略拦截。切换到 DOM 图片后虽然能读取文件，WebGL `texImage2D` 仍禁止上传跨源图片，角色分层 Canvas 的像素读取也无法可靠工作。因此不再承诺直接打开 `index.html`，改为双击 `启动游戏.bat` 后通过本机回环 HTTP 运行。

第二次人工验证发现全局外观 `full_body_bondage` 引用了仓库中并不存在的 `liluo_full_body_bondage.png`，Vite 动态资源映射因此退化为 `assets/undefined` 并阻塞 BootScene。现在该外观复用现有上下身拘束分层素材生成完整方向帧，不再依赖缺失文件。

## 验证记录

- 离线发行与启动器契约测试：10 项通过。
- 启动器真实回环 HTTP 集成测试：通过，入口与 JS 资源返回正确，缺失路径返回 404，测试后进程关闭。
- 角色分层资源回归：14 项通过，确认 `full_body_bondage` 只使用有效图片资源。
- `npm run build:offline`：通过，生成 483 个文件。
- `npm run package:offline`：通过，生成约 389.43 MB ZIP。
- ZIP 根目录：必须包含 `启动游戏.bat`、`index.html`、`launcher/` 与 `assets/`。
- 目标浏览器启动器游玩回归：2026-07-22 用户双击 `启动游戏.bat` 实际验证通过，确认不再出现加载异常，游戏可正常进入。
