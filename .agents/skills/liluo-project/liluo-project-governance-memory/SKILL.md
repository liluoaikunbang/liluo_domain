---
name: liluo-project-governance-memory
description: Govern persistent 璃落 project rules and design memory with a single authoritative source, impact tracing, ADR/CDR decisions, user-command synchronization, and low-token light/deep audits. Use when a user establishes a long-term requirement, adds or changes a reusable workflow, asks why a design was chosen, requests documentation-impact or duplication review, or changes a project Skill, Agent, system contract, or documentation responsibility; not for one-off fixes or unresolved discussion.
---

# Project Governance and Design Memory

Read `AGENTS.md`, then read [governance-contract.md](references/governance-contract.md). Use the project index to locate authoritative sources; never treat the index as authority.

## Classify first

Classify the request as transient, persistent, architectural, creative, user-facing, unresolved, or historical. A request may have more than one class.

- Use **light** by default: inspect the registry, the affected authority, and at most three direct consumers.
- Use **deep** only for broad rule restructuring, migration, duplication review, or an explicit full governance audit.
- Ask once only when persistence would materially affect future work and cannot be inferred safely.

Read [persistence-and-decisions.md](references/persistence-and-decisions.md) when classification or ADR/CDR status is relevant. Read [completion-gate.md](references/completion-gate.md) before completing a persistent or user-facing change.

## Apply the smallest safe change

1. Identify one complete authoritative source for each rule.
2. Use `docs/规范治理/document-registry.json`, `rule-registry.json`, and `impact-map.json` to locate consumers.
3. Update the authority; keep consumers to a local contract, concise summary, and link.
4. Record architecture or creative rationale only when accepted or already demonstrably adopted. Put unresolved choices in `docs/设计记忆/待确认决策.md`.
5. Use `liluo-project-documentation-sync` for mechanical feature-record synchronization.
6. Run the smallest applicable governance commands, then refresh and validate the project index.

Do not copy the governance contract into every Skill or Agent. Do not save chat transcripts, hidden reasoning, temporary audit reports, or speculative philosophy. Do not auto-delete similar text or mass-renumber history.

## Delegate selectively

Use `liluo_project_memory_curator` only for cross-document authority tracing, ambiguous persistence, design-intent extraction, or deep duplication/conflict review. The curator is read-only; the main Codex owns all edits and final decisions.

## Output

Report classification, authority, affected consumers, decisions recorded, commands run, unresolved items, and the minimal synchronization completed. Keep ordinary light-mode reports brief.
