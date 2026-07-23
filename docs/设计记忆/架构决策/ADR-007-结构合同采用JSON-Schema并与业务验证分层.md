---
id: ADR-007
status: accepted
title: 结构合同采用 JSON Schema 并与业务验证分层
date: 2026-07-23
scope: [data, schema, validation, saves, maps, events]
relatedRules: [json-schema-structural-contract]
relatedSystems: [json-schema-data-contract-system]
supersedes: []
---

# ADR-007：结构合同采用 JSON Schema 并与业务验证分层

## 当前结论

长期稳定数据统一采用 JSON Schema Draft 2020-12 描述单记录结构，并由 `schemas/registry.json` 绑定现有权威源。Schema 负责字段、类型、格式、枚举、版本和封闭结构；现有内容、存档、素材、路线与索引验证器继续负责跨文件引用、唯一性、可达性和业务规则。

地图只约束项目维护的元数据与事件桥接视图，不强耦合 Tiled `map.json`。没有仓库内静态实例的 v1 存档格式作为模板合同用 fixture 验证，不读取真实用户存档。历史数据可以通过注册表获得合同版本，不批量补写字段。

## 理由与代价

统一 Schema 能让代码、编辑器和自动化脚本共享同一份结构定义，并在字段误删、类型漂移或未来版本误读时尽早失败。把跨文件图关系留给既有 validator，避免两套规则产生不同结论。

代价是 TypeScript 地图元数据和 Markdown 素材清单需要确定性的只读派生视图；派生逻辑本身必须保持小而透明。第一版也不会覆盖所有运行时配置，新增合同仍需核对真实源并补正反 fixture。
