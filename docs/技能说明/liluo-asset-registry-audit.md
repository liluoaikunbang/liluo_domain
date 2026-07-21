# liluo-asset-registry-audit

## 用途与边界

审计 `src/assets/game` 的数量、大小、格式、精确重复、大小写冲突、引用与素材清单。不删除、压缩、转换、移动或升级候选素材。

## 路径、输入与输出

- Skill：`.agents/skills/liluo-project/liluo-asset-registry-audit/`
- reference：`asset-classification.md`
- script：`scripts/audit-game-assets.mjs`（默认只读；`--check`、`--exact-hash`、`--root`；`--write-manifest` 当前安全拒绝）
- 输出：统计、重复哈希、路径冲突和清单差异建议

## 流程、限制与验证

先依据路径、引用和文档分类，再审计。不得安装感知哈希依赖或修改图片。分别运行帮助、check、exact-hash 和 write-manifest 拒绝路径。角色帧质量由 `liluo-sprite-pipeline` 负责。
