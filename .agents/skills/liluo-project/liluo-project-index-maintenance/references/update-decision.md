# 更新决策

- story JSON/Markdown：重建 story 与 graph。
- gameplay catalog：重建 gameplay 与 graph。
- maps、events、dialogues、interactive fiction、registry：重建 game 与 graph。
- `src/game` JS/TS/Vue：重建 code；素材：assets；Markdown 文档：docs。
- 第一版是领域级增量；新增、修改、删除和重命名由当前源快照与内容哈希识别。
- schema、生成器、跨领域关系或大范围移动变化时运行全量构建。
