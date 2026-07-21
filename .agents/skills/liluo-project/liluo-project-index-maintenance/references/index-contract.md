# 索引契约

- `project-index/` 是生成的导航与缓存层；权威来源始终是记录指向的仓库文件。
- L0 为 `INDEX.md`，L1 为领域 `SUMMARY.md`，L2 为 JSON 实体/关系分片，L3 为原始来源。
- 路径必须仓库相对、使用 `/`；内容哈希为 SHA-256；输出 UTF-8、稳定排序、无空分片。
- `current` 可正常使用；`partial` 先阅读领域限制；`stale`、`error` 不得作为事实依据；`not-enabled` 表示没有可靠提取器。
- 生成器位于 `scripts/project-index/`，配置唯一来源为 `project-index.config.json`。
