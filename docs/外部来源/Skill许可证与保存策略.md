# Skill 许可证与保存策略

许可证按具体仓库、具体路径和固定 commit 核验，不能因为组织官方、仓库根许可证或相邻 Skill 的许可证相同就推断全部文件可再分发。

- 许可明确且需差异跟踪：`selected-files` 或谨慎的 `full-snapshot`。
- 聚合目录只作发现：`catalog-only`。
- 许可证、维护质量或工具兼容性未确认：`metadata-only` 或候选清单，不复制正文。
- 许可证变化：diff 立即 `blocked`，建议 `license-review`；不会自动接受。
- 保存原始文件时同时保留对应 LICENSE、上游路径、commit、抓取时间和 SHA-256。
- 来源删除或改名不会自动删除本地正式 Skill；上游更新也不会自动覆盖项目解释。
- 用户提供的多来源研究包采用 `user-pack`：保存压缩包 SHA-256、manifest 与研究摘要，许可证统一保持混合/未逐项核验状态；解压确认后可按用户要求删除原始压缩包，但不得删除哈希、原始文件名和 manifest 记录。不因“用户提供”推定拥有第三方内容的再分发权。
- `user-pack` 不参与 GitHub fetch、定时更新或自动替换。包内提示、角色卡、同人设定、数据集入口和现实术语只能作 `reference-only` 线索。

本次 OpenAI 来源只核验并保存 `skills/.system/skill-creator/` 自带的 Apache-2.0 许可证与选取文件，不能把此结论扩展到仓库其他 Skill。
