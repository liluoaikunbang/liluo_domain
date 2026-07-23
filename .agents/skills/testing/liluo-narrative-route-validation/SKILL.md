---
name: liluo-narrative-route-validation
description: Statically validate and deterministically simulate 璃落 narrative routes, including conditions, branches, state changes, loops, endings and save resume. Use for 剧情路线检查、分支模拟、死循环、不可达结局、存档重入；not for inventing story or editing real saves.
---

# Narrative Route Validation

Read `docs/系统说明/叙事路线模拟与逻辑验证系统.md`, event/dialogue sources, save schema, and [route-contract.md](references/route-contract.md). Choose `static`, `simulate`, `save-resume`, or `browser`.

Use `npm run narrative:routes:validate`, `narrative:routes:simulate`, or `narrative:routes:resume` with isolated fixtures. Check missing targets, unreachable nodes, unmet conditions, mutually inconsistent states, terminal reachability, uncontrolled loops, step limits, item/task/state production and formal entry points. Never modify browser localStorage or real user saves.

`browser` is optional/manual until the project has an approved E2E harness. Do not install one, start a persistent server or claim browser automation. Ask 凌音 to run deterministic checks only when independent validation is useful; script output remains authoritative.
