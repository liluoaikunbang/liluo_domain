# liluo-project-context-pack

## 用途与触发

当用户要把璃落城堡的描述性材料打包给其他 AI 分析时使用。不用于可玩离线包或 Release。

## 路径与资源

- Skill：`.agents/skills/liluo-project/liluo-project-context-pack/`
- 清单：`scripts/project-context-pack/catalog.json`
- 关联：`.local/project-context-pack/LINK-STATE.json`
- 输出：`.local/project-context-pack/liluo-project-context-latest.zip`

## 输入输出与流程

运行 `npm run project:context-pack`。Agent 只读命令输出 JSON，不打开 LINK-STATE / staging / 文件清单。脚本处理删除/去重/可能新增与增量同步。可用 `--dry-run` 或 `--keep-previous`。

## 限制

不打包运行时实现与素材；不全仓扫描；不整盘重拷；不自动上传；不提交临时目录。

## 相邻边界

离线发行用 `liluo-offline-release-pipeline`；索引维护用 `liluo-project-index-maintenance`。

## 验证

`npm run project:context-pack:test`
