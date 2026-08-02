# 177-Grok图像生成脚本与提示词润色Skill

- 创建日期：2026-08-01
- 更新时间：2026-08-02

## 更新时间记录

- 2026-08-01：首次建立本地 Grok 图像生成脚本、launcher、prompt polish Skill 与说明文档。
- 2026-08-02：收窄 `liluo-grok-image-generation` 的默认触发边界，明确官网海报、角色基线、README/Pages 视觉批次等既有 `Image 2` 资产优先走内置 `Image 2`；Grok 仅在用户明确要求 Grok 或检查 Grok 链路时使用。

## 本次目标

把“在 Codex 里基于 Grok 生图”落成一套可复用能力，而不是一次性的聊天技巧：

1. 有本地脚本可检查配置、dry-run、live 调用。
2. 有项目 Skill 负责把粗糙需求润成适合 Grok 的提示词。
3. 有最小文档入口，让后续继续用时不必重新翻聊天记录。

2026-08-02 补充边界：这套能力是项目外部图像生成补充链路，不得覆盖已经固定为 `Image 2` 的海报、角色基线与官网视觉批次默认入口。

## 这次具体做了什么

### 1. 新增 Grok 图像脚本

在 `.agents/skills/liluo-project/liluo-grok-image-generation/scripts/` 下新增本地脚本与辅助模块：

- `grok-image.mjs`
- `lib/config.mjs`
- `lib/client.mjs`
- `lib/env.mjs`
- `lib/paths.mjs`

能力包括：

- `status`：只检查本地配置，不联网
- `probe`：用 `v1/models` 探测当前 xAI 连通性，不消耗图像额度
- `generate --dry-run`：返回标准化请求和计划输出
- `generate --live`：真正调用 Grok 图像接口，写回图片与 manifest
- 各命令默认沿用 `.env.grok-image.local` 与脚本内默认值，但现在也支持通过 CLI 临时覆盖常用参数

### 2. 把 live 输出做成安全默认

运行时输出默认写到系统临时目录下的 `liluo-grok-images`，不是直接写进正式 docs 或素材目录。这样草稿图默认留在本地工作区，不会误被当成已确认资产。

### 3. 新增提示词润色 Skill

新增 `liluo-grok-image-generation`：

- 规定什么时候触发
- 规定如何从简短需求抽取视觉锚点
- 规定如何把排除项折叠进同一条生产提示词
- 规定何时先 dry-run、何时再 live

### 4. 补齐命令与文档入口

- `package.json` 新增：
  - `npm run grok:image:status`
  - `npm run grok:image:probe`
  - `npm run grok:image:generate`
- 新增技能说明与系统说明文档
- 在用户命令目录中登记该 Skill 入口
- 把 CLI 可覆盖参数写回文档，明确哪些项可临时改、哪些边界仍受安全限制

### 5. 收口 live 的联网执行约定

针对当前 Codex managed sandbox 与本机代理共存的已知行为，补充并同步了一个长期规则：

- `status` 继续只做本地检查，不联网
- `probe` 用 `v1/models` 验证 xAI 可达性，但不消耗图像额度
- `dry-run` 继续优先走普通本地执行
- 如果用户在本机提供了 loopback 代理，就优先由 launcher 把 Node 重启到带代理与 DNS 设置的进程里
- 只有没有本机代理时，才回到直连链路的网络权限排查
- `--base-url` 虽支持覆盖，但 CLI 只允许 `api.x.ai` 或本机 loopback，避免把现有 key 与提示词重定向到任意远端

## 验证

运行：

```powershell
node --test --test-isolation=none scripts/tests/grok-image-generation.test.mjs
npm run grok:image:status
npm run grok:image:generate -- --prompt "cinematic portrait of Liluo in rain" --dry-run --model grok-imagine-image-quality
```

结果：

- 12 条专门测试全部通过
- `status` 能返回本地代理与 DNS 设置
- `dry-run` 能返回标准化请求、覆盖后的 `baseUrl/model` 与计划输出路径
- 覆盖参数的回归测试已经补到 `status`、`probe`、`dry-run`、`live retry` 和 `base-url` 安全限制

## 当前保留的边界

- 当前仓库没有额外引入 `tsx` / `ts-node`，所以脚本先按现有 Node ESM 体系落地，而不是直接上 `.ts` 运行链。
- 这次不自动把 Grok 生成图接进正式素材注册、README 资产板或游戏运行时资源。
- live 依赖用户自行提供本地 `API_KEY`。
- 当前工作流只接受 loopback 代理入口，不支持把 key 和提示词直接送去任意远端代理。
