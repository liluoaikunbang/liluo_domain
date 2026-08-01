# Grok 图像生成 API 配置与提示词润色工作流

本文说明如何在当前仓库里用本地脚本调用 Grok 图像生成接口，并把简短想法整理成更稳定的生产提示词。

## 当前实现边界

- 仓库当前落地的是 Node ESM 脚本（`.mjs`），不是额外安装 `tsx` 的 TypeScript 运行链。
- 脚本支持 `status`、`probe`、dry-run 和 live。
- `npm run grok:image:*` 现在先经过一个 launcher；它会在真正启动 Grok CLI 前，把本地 loopback 代理和 DNS 结果顺序设置装进 Node 进程。
- 默认输出写到系统临时目录下的 `liluo-grok-images`，减少草稿资产误入正式仓库的风险。
- live 请求会写一个 manifest，但不会写入 API Key。
- 各项参数保留现有默认值，同时支持本次命令按需覆盖。

## 本地配置

不要把 Token 贴进聊天。请在项目根目录自行创建 `.env.grok-image.local`：

```powershell
copy .env.grok-image.example .env.grok-image.local
```

最小可用配置是填入 API Key：

```env
LILUO_GROK_IMAGE_BASE_URL=https://api.x.ai/v1
LILUO_GROK_IMAGE_API_KEY=
LILUO_GROK_IMAGE_MODEL=grok-imagine-image-quality
LILUO_GROK_IMAGE_LOCAL_PROXY_URL=
LILUO_GROK_IMAGE_DNS_RESULT_ORDER=
```

其中：

- `BASE_URL` 默认就是 `https://api.x.ai/v1`
- `MODEL` 默认就是 `grok-imagine-image-quality`
- 真正必填的是 `API_KEY`
- `LOCAL_PROXY_URL` 是可选的本机代理入口，只接受 `127.0.0.1`、`localhost` 或 `::1`
- `DNS_RESULT_ORDER` 可选，当前更推荐 `ipv4first`

如果你的智能模式代理在本机开放了 HTTP 端口，可以直接写成：

```env
LILUO_GROK_IMAGE_LOCAL_PROXY_URL=http://127.0.0.1:7890
LILUO_GROK_IMAGE_DNS_RESULT_ORDER=ipv4first
```

## 检查配置

```powershell
npm run grok:image:status
```

这个命令只检查本地配置，不会发起网络请求。

## 探测 xAI 可达性

```powershell
npm run grok:image:probe
```

这个命令会访问 `https://api.x.ai/v1/models`，用来确认当前 launcher + 本机代理 + DNS 设置能不能真正打到 xAI，但不会消耗图像额度。

常见临时覆盖示例：

```powershell
npm run grok:image:status -- --model grok-imagine-image-quality
npm run grok:image:probe -- --timeout-ms 15000 --dns-result-order ipv4first
```

## 提示词润色流程

把需求整理成一条提示词时，默认按这个顺序收束：

1. 主体是谁
2. 主体在做什么
3. 场景和天气
4. 镜头与构图
5. 光线与主色
6. 材质和质感
7. 关键排除项

排除项会并入同一条提示词的 `Avoid:` 尾句，而不是拆成另一套字段。

## 先做 dry-run

```powershell
npm run grok:image:generate -- --prompt "cinematic portrait of Liluo in rain" --dry-run
```

dry-run 会返回：

- 标准化后的模型参数
- 计划输出目录
- 计划文件名前缀
- 本次命令生效后的 `baseUrl` 与 `model`

适合先确认提示词和比例有没有跑偏。

## 正式 live 生成

```powershell
npm run grok:image:generate -- --live --prompt "cinematic portrait of Liluo in rain" --aspect-ratio 16:9 --slug liluo-rain-poster
```

如果本地已经配置 `LILUO_GROK_IMAGE_LOCAL_PROXY_URL`，launcher 会优先用本机代理出网；只有本机代理没配好时，才需要回到直连链路的网络权限排查。

常用参数：

- `--base-url`：覆盖 API 根地址；CLI 只允许 `https://api.x.ai/v1` 同类 xAI 地址，或 `127.0.0.1` / `localhost` / `::1` 这类 loopback 本地转发地址
- `--model`：覆盖模型名
- `--prompt`：直接传提示词
- `--prompt-file`：从文件读取提示词
- `--aspect-ratio`：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
- `--resolution`：例如 `1024x1024`，不填就是 `auto`
- `--count`：1 到 4
- `--slug`：自定义文件名前缀
- `--out-dir`：如需改输出目录，限制在仓库内路径或系统临时目录
- `--timeout-ms`：覆盖本次探测或生成请求超时
- `--max-attempts`：覆盖 live 请求最大尝试次数
- `--backoff-ms`：覆盖 live 重试退避，格式如 `500,1500`
- `--local-proxy`：只对本次命令覆盖 loopback 代理
- `--dns-result-order`：只对本次命令覆盖 DNS 结果顺序

## 输出内容

live 成功后会得到：

1. 一到多张图片文件
2. 一个同名前缀的 `.manifest.json`
3. 如果服务端返回了修订提示词，也会记录在 manifest 里

## 安全与使用建议

- 优先把 live 当成“有成本的草稿生成”，不是自动入库流程。
- 别把未确认的设定为了画面丰满就写死进提示词。
- 如果用户只是还在摸方向，先 dry-run 再 live。
- 如果后续要把结果纳入正式素材、说明文档或项目流程，那是下一步独立任务，不在这次脚本自动完成范围内。
