---
name: liluo-command-approval-governance
description: Safely classify, persist, audit, supersede, retire, and validate 璃落 project command authorization decisions. Use when the user says a command should以后长期允许、每次询问、禁止、撤销长期允许，asks to inspect TUI “始终允许” changes, migrate a global rule back to the project, inspect overbroad rules, or maintain `.codex/rules` and the approval registry; not for one-time/session approvals or bypassing platform sandbox and admin policy.
---

# Command Approval Governance

Read root `AGENTS.md`, `docs/系统说明/Codex命令授权治理系统.md`, and [authorization-contract.md](references/authorization-contract.md). Use `liluo-project-governance-memory` when the overall authorization model or project/global boundary changes.

## Classify before writing

1. Identify decision: `allow`, `prompt`, or `forbidden`.
2. Identify scope: once, session, project, global, or ambiguous.
3. Do not persist once/session. Ask only when scope is genuinely ambiguous and not safely inferable from a project-specific npm script.
4. Never let this Skill modify or delete user-level rules. A global request produces a reviewed recommendation until the user explicitly authorizes that external write.

Use `npm run commands:approval:classify -- --text "..." --command "npm run ..."` for deterministic support; the main Codex owns the contextual decision. Use JSON `--pattern` only when an argument itself contains spaces.

Prefer the smallest governed `npm run project:routine -- docs|workflow|team-presence|natural-expression|check|test|build|index|all` profile and `npm run project:skill:init -- ...` for new `liluo-*` Skill scaffolds. Use `check`/`test`/`build`/`index`/`all` only when the actual change spans those surfaces. Do not split fixed profiles back into interpreter-level approvals, and never run a known child-process command in the sandbox merely to collect an expected `EPERM`.

## Persist a project decision

Inspect existing `.codex/rules/*.rules` and `.codex/approval-decisions.json`. Reject secrets, complex shell, wide interpreter/wrapper prefixes, and any `allow` that is not a precise project command. Keep network, Git writes, dependencies, deletion, releases, project-external paths and unknown binaries as `prompt` or `forbidden`.

For an explicit safe project decision, run `commands:approval:record` with exact pattern, decision, reason, class and date. It updates only the managed project rule file, registry and generated documentation summary. Do not hand-edit `project-decisions.rules`.

After writing, run `commands:approval:test`, `commands:approval:validate`, and explicit positive/negative `codex execpolicy check` cases. A Starlark prefix matches additional arguments; add a stricter rule for known dangerous suffixes and do not claim exact-end matching the engine does not provide.

## Audit TUI rules

Use `commands:approval:audit -- --input <user-default.rules>` only after the user asks for an audit or an “always allow” normalization. It reads the source without executing it, saves a sanitized ignored snapshot, and never edits the source. On first run create a baseline unless `--report-existing=true` was explicitly requested.

Classify additions as project-specific, safe-global, overbroad, dangerous, or unknown. Offer a precise project rule for project-specific items. For overbroad/dangerous items, explain the risk and recommend narrowing; do not copy them as allow. Removing the original user rule requires separate explicit authorization.

## Revoke or supersede

Record the same project pattern with the new `prompt` or `forbidden` decision. Keep the old registry entry as `superseded`; do not erase history. Use `retired` only when no replacement execution rule should remain.

## Completion

Report the scope, decision, exact pattern, affected rule file, registry action, execpolicy positive/negative results, and whether any user-level cleanup remains only a recommendation. Never imply that repository rules override sandbox, managed requirements, or platform approval behavior.
