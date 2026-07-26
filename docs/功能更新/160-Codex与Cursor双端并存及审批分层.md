# 160-Codex与Cursor双端并存及审批分层

创建日期：2026-07-26

## 摘要

明确 Codex 与 Cursor 共同使用本项目时的修改边界：`.codex/` 与 `.cursor/` 必须长期并存，改任一侧不得删除或覆盖另一侧专属内容；并区分项目命令 allow 与 Cursor 平台智能审批，要求同任务内合并提交后一次 push，避免重复审批。

## 变更范围

- 权威：`docs/系统说明/AI协同文件与规则分层.md`（双端并存表、审批分层）
- 路由：`AGENTS.md`、`.cursor/rules/00-project-entry.mdc`
- 理由：`docs/设计记忆/架构决策/ADR-010-Cursor与Codex采用共享事实源和专属适配层.md`

## 背景

上传 GitHub 时 Cursor 平台仍多次拦截 Smart Mode 审批，与项目内已登记的 `git push origin main` allow 不是同一层。用户确认无须重复审批，并要求写入「双端并存、不直接删独有内容」的长期规则。

## 验证

- `npm run docs:governance:validate`
