# 视觉资产图床管理（`liluo-asset-manager`）

把 README、官网和公开展示截图接入 Cloudflare R2 的项目能力：先按 manifest 检查与分流，再生成 `large / medium / thumb` 三档 WebP，最后按需要 dry-run 或 live 上传，并把公开 URL 写回资产清单。

## 你可以这样说

- “上传这批 README 大图到图床。”
- “先检查一下 R2 图床配置好了没有。”
- “把浮光掠影这组官网图先转 WebP，给我看 object key。”
- “正式上传 `readme-hero-v03`，并把 URL 写回 manifest。”

## 默认行为

- 先走 `npm run assets:r2:status` 检查配置。
- 先用 `prepare` 或 dry-run `upload` 预演，不默认直接 live。
- 图片按 `website/...`、`game/...` 这样的用途路径管理，不按随手文件名堆积。
- 不要求在聊天里贴密钥，只认本地 `.env.assets.local`。
- staged WebP 默认放在系统临时目录，不混进正式仓库。

## 明确边界

这条能力只管公开展示资产，不管：

- `src/assets/game/cg/`
- `.psd`
- 地图源
- 参考图
- 离线私有运行素材

这些对象统一走 [公开展示资产与离线私有素材双轨分发系统](../系统说明/公开展示资产与离线私有素材双轨分发系统.md)。

如果用户要处理的是 Nutstore 私有镜像，而不是公开 R2 图床，则使用：

```powershell
npm run assets:runtime:private:status
npm run assets:runtime:private:sync -- --group authoring-cg-standee-sources
npm run assets:runtime:private:audit -- --write-report
```

也就是说，这个 Skill 负责“公开展示资产上图床”，离线私有素材则走私有同步线，不混用。

## 命令入口

```powershell
npm run assets:r2:status
npm run assets:r2:prepare -- --asset readme-hero-v03
npm run assets:r2:upload -- --asset readme-hero-v03
npm run assets:r2:upload -- --asset readme-hero-v03 --live
npm run assets:r2:prune
npm run assets:r2:prune -- --live
```

完整约束和路径约定见 [视觉资产图床与R2管理系统](../系统说明/视觉资产图床与R2管理系统.md)。
