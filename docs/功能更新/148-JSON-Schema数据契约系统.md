# 148-JSON Schema 数据契约系统

- 更新日期：2026-07-23
- 当前摘要：建立 Draft 2020-12 数据契约注册表、八项正式合同、changed/all 验证、正反 fixture 与项目检查入口，保持存档版本 1 并与既有业务验证器分层。

## 已实现

新增 `schemas/` 注册表、公共定义及故事节点、地图元数据、地图事件、对话、互动小说、内部存档 v1、导出包 v1 和素材条目八项合同。Node ESM 工具可检查注册表、编译全部 Schema、解析合同源、验证 changed/all 范围并输出文本或稳定 JSON 错误。

每项合同均有合法 fixture、缺少必填字段和错误类型 fixture；存档额外覆盖损坏版本与未知未来版本，事件额外覆盖错误判别类型。`data:contracts:check` 已接入 `project:routine -- check`。

## 边界

本次没有修改剧情、Tiled `map.json`、运行时存档版本、真实 localStorage、真实导出存档或图片内容。Schema 只负责结构；重复 ID、引用存在性、故事图、事件链、素材文件和路线业务规则仍由原验证器负责。

## 主要路径

- `schemas/`
- `scripts/data-contracts/`
- `docs/系统说明/JSON-Schema数据契约系统.md`
- `scripts/project-routine.mjs`
- `package.json`
