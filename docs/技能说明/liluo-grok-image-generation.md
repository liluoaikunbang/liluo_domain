# Grok 图像生成（`liluo-grok-image-generation`）

用本地 Grok 脚本把一句视觉需求变成可执行的生图请求：先润色提示词，再做 dry-run 或 live 调用，并把结果和 manifest 落到本地临时目录。

这不是项目海报升级、官网视觉批次或角色身份校准的默认生图入口。凡是已经被项目定义为 `Image 2` 资产的海报、角色基线、世界图、README/Pages 视觉批次，默认优先走内置 `Image 2`；只有当你明确说“用 Grok”或要检查/调试 Grok 链路时，才进入这个 Skill。

## 你可以这样说

- “用 Grok 按这段描述出一张图。”
- “先帮我把这个生图提示词润一下，再用 Grok 生成。”
- “检查一下 Grok 图像 API 配好了没。”
- “同一个场景给我两个镜头版本，但主体别变。”
- “这次把比例改成 9:16，模型名也换掉，其他默认不动。”

## 默认行为

- 先保留用户已确认的主体、场景和气质，再补足必要的视觉细节。
- 默认推荐先走 dry-run，确认提示词和输出计划后再 live。
- `npm run grok:image:*` 会先经过 launcher；如果本地配置了 loopback 代理，它会先把代理和 DNS 设置装进 Node 再访问 xAI。
- live 结果默认写到系统临时目录里的 `liluo-grok-images`，避免草稿资产直接混入正式内容。
- 每次 live 会额外生成一个 manifest，记录实际请求参数和输出文件路径。
- 项目里已经规划为 `Image 2` 的海报、角色基线、首页视觉和官网批次，不会因为“想出一张图”这种笼统说法自动改走 Grok。

## 现在支持你临时改的参数

- 生成请求：`--model`、`--aspect-ratio`、`--resolution`、`--count`
- 输入输出：`--prompt`、`--prompt-file`、`--slug`、`--out-dir`
- 请求控制：`--timeout-ms`、`--max-attempts`、`--backoff-ms`
- 本地网络路径：`--local-proxy`、`--dns-result-order`
- 端点切换：`--base-url` 也能改，但 CLI 只允许 `api.x.ai` 或本机 loopback，避免把现有 key 和提示词重定向到陌生主机

## 不会替你做的事

- 不要求你把 API Key 贴进聊天。
- 不把生成图自动写入正史、素材注册表或功能文档。
- 不模仿在世艺术家。
- 不把探索型图像需求伪装成已经确认的 canon 设定。
- 不抢占项目里已经固定为 `Image 2` 的默认视觉生成通道。

命令入口：

```powershell
npm run grok:image:status
npm run grok:image:probe -- --timeout-ms 15000
npm run grok:image:generate -- --prompt "..." --dry-run
npm run grok:image:generate -- --live --prompt "..." --aspect-ratio 16:9 --slug liluo-poster --model grok-imagine-image-quality
```

配置与工作流说明见 [docs/系统说明/Grok图像生成API配置与提示词润色工作流.md](../系统说明/Grok图像生成API配置与提示词润色工作流.md)。
