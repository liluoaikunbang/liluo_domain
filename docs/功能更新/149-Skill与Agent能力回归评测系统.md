# 149-Skill 与 Agent 能力回归评测系统

- 更新日期：2026-07-23
- 当前摘要：建立 33 项项目能力注册、51 个首批路由案例、四项结构合同、静态门禁、Codex 只读实跑、结构化评分、显式 baseline 与长期纠正模板。

## 已实现

新增 `evals/` 合同、注册表、案例、baseline 与报告边界；新增静态发现和完整性检查、changed/smoke/full 选择、串行 Codex CLI 实跑、字段级评分、token 汇总和回归模板生成器。日常 `project:routine -- check` 接入无模型的 `evals:check`，live smoke 保持手动。

首版登记 26 个项目 Skill 与 7 个 Agent。11 个核心 Skill 和全部 Agent具备正负案例，其余 Skill 具备基础正向案例。

## 安全边界

评测不比较完整自然语言，不保存推理链，不读取聊天，不自动更新 baseline，不要求 CI 保存个人认证，不自动提交或推送，也不因失败修改正式内容。

## 主要路径

- `evals/`
- `scripts/evals/`
- `.agents/skills/testing/liluo-capability-regression/`
- `docs/系统说明/Skill与Agent能力回归评测系统.md`
