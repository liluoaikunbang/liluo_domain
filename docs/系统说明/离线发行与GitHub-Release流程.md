# 离线发行与 GitHub Release 流程

## 目标

项目采用带一键 Windows 启动器的多文件离线发行包：根目录提供 `启动游戏.bat` 和 `index.html`，脚本、样式、图片、音频和字体存放在 `assets/`。用户完整解压 ZIP 后双击 `启动游戏.bat`，启动器会在 `127.0.0.1` 的动态空闲端口建立临时静态服务并打开默认浏览器；不需要安装 Node.js、Python 或其他运行环境。

不再把全部素材内联到单个 HTML。项目包含大量图片，单文件方案会造成 HTML 过大、构建内存溢出和浏览器加载压力。

## 命令

```powershell
# 只生成 Web 构建目录 dist-offline/（尚未补入启动器）
npm run build:offline

# 构建、校验并生成 release/liluo_domain-v0.0.0-offline.zip
npm run package:offline

# 构建、校验、压缩，并显示目标但不访问 GitHub
npm run release:offline -- --tag v0.1.0 --dry-run

# 上传到指定 GitHub Release
npm run release:offline -- --tag v0.1.0
```

## 自然语言自动执行

用户提出“生成离线包”“生成可双击启动器版本”“发布当前适合部署的版本”或“上传到某个 Release”时，使用 `liluo-offline-release-pipeline` 自动编排完整流程，不要求用户逐条指定命令。

- 只要求生成或打包时，执行本地构建、校验和 ZIP 压缩，不访问 GitHub。
- 明确要求发布或上传并给出无歧义标签时，先完成必要的功能验证与文档同步，再执行 dry-run 和真实上传。
- 未给出可靠标签、验证失败或文档未完成时停止在对应阶段，不猜测标签、不上传失败产物。
- 源码提交和推送不属于离线发行的隐含权限，必须由用户另行要求。

## 产物契约

- `启动游戏.bat` 是用户入口；`index.html` 是本机服务的网页入口，不再承诺通过 `file://` 直接运行。
- `launcher/start-game.ps1` 使用 Windows 自带 PowerShell 和 TCP Listener，仅绑定 `127.0.0.1` 的动态空闲端口。
- 启动器拒绝越出发行根目录的请求，不访问公网；关闭启动窗口即终止服务。
- 大型素材保持独立文件，不内联进 HTML。
- 全局启动清单不得引用缺失的动态素材；可由现有分层素材合成的角色外观应直接登记分层帧，避免构建后退化为 `assets/undefined`。
- `package:offline` 只归档 `dist-offline/` 内的构建产物，不包含源码、`node_modules`、存档或本机配置。
- `dist-offline/`、`release/` 都是临时产物，不纳入 Git。

## 上传规则

- `release:offline` 必须显式提供安全的 `--tag`，不会猜测版本。
- 上传前重新构建并校验；构建、引用或压缩失败时不访问 GitHub。
- 已有 Release 使用 `gh release upload --clobber` 更新同名 ZIP。
- Release 不存在时使用 `gh release create --verify-tag`；远端标签不存在则失败，不自动创建 Git 标签。
- 命令不会提交或推送源码。GitHub CLI 未安装、未登录或权限不足时明确失败，本地 ZIP 保留。

## 验证

自动校验会拒绝缺失启动器、绝对部署路径、远程入口资源和不存在的入口引用。启动器集成测试会真实启动临时回环服务，验证入口、JS MIME 和 404 后自动关闭。正式交付前仍需把 ZIP 解压到普通目录，双击 `启动游戏.bat`，保持窗口开启，并在浏览器中验证首页、进入游戏、地图、图片、音频与控制台；结束时关闭启动窗口。

不得引导用户直接双击 `index.html`。Chromium 会把 `file://` 独立图片视作不可上传的跨源数据，Phaser WebGL 的 `texImage2D` 与角色分层 Canvas 的 `getImageData()` 都会受到限制。
