# liluo-save-data-migration

## 用途与边界

审计和演进存档 schema、版本、导入校验与旧档迁移。维护 Skill 时不改真实存档。

## 路径与输入输出

- Skill：`.agents/skills/liluo-project/liluo-save-data-migration/`
- reference：`save-migration-contract.md`
- 输入：当前 `version: 1` schema、旧 fixture、字段/ID 变化
- 输出：逐版本迁移设计、隔离 fixture 和兼容测试结果

## 流程、限制与验证

备份原数据，逐版本迁移并逐步验证，明确默认值，保留不确定字段，失败不覆盖。不得批改 localStorage、吞错或删除未知数据。用 save-data/save-storage 测试覆盖当前、旧版、损坏与未来版本。运行时代码只在用户明确要求时修改。
