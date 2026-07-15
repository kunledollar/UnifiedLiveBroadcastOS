# UBOS Workflow State

version: 1
status: ACTIVE
platform: v5.11
current_phase: v5.11.5
next_phase: v5.11.5
last_completed_platform: v5.10
last_completed_phase: v5.11.4
release_status: v5.10 RELEASED

---

## Active Platform

v5.11

---

## Active Phase

v5.11.5

---

## Current Status

VALIDATED

Allowed values:

- READY
- IN_PROGRESS
- VALIDATED
- CERTIFIED
- RELEASE_READY
- BLOCKED
- FAILED

---

## Current Branch

work

---

## Current Commit

AUTO

---

## Last Completed Platform

v5.10

---

## Last Completed Phase

v5.11.4 — Production-Safe Operational Analytics, Reporting, SLA Compliance, and Executive Dashboards

---

## Next Ready Phase

v5.11.5 — Production-Safe Change Management, Release Governance, Feature Flags, and Deployment Control

---

## Platform Progress

| Platform | Status |
|---|---|
| v5.9 | RELEASED |
| v5.10 | RELEASED |
| v5.11 | ACTIVE |
| v5.12 | PENDING |
| v6.0 | PENDING |

---

## Current Platform Progress

| Phase | Status |
|---|---|
| v5.11.1 | VALIDATED |
| v5.11.2 | VALIDATED |
| v5.11.3 | VALIDATED |
| v5.11.4 | VALIDATED |
| v5.11.5 | READY |
| v5.11.6 | BLOCKED |
| v5.11.7 | BLOCKED |
| v5.11.0 | BLOCKED |

---

## Rules

Codex must:

1. Read `MASTER-PLAN.md`.
2. Read `ROADMAP.md`.
3. Read `.codex/ENGINEERING-STANDARDS.md`.
4. Read `.codex/RELEASES.md`.
5. Read `.codex/COMPLETION-REPORT.md`.
6. Read this file.
7. Treat this file as the authoritative execution state.
8. Execute only the phase named by `next_phase`.
9. Load only the matching specification from `.codex/tasks/v5.11/`.
10. Verify all prerequisites before implementation.
11. Mark the current phase `IN_PROGRESS` before modifying code.
12. Implement and validate only the current phase.
13. Mark the completed phase `VALIDATED` or `CERTIFIED`, as appropriate.
14. Mark the next phase `READY`.
15. Update `current_phase` and `next_phase`.
16. Append `.codex/COMPLETION-REPORT.md`.
17. Update `.codex/RELEASES.md` only when a platform release is completed.
18. Create one focused commit.
19. Stop after one phase.

Codex must never:

- execute two phases in one run
- skip a phase
- reorder phases
- infer another phase when `next_phase` is present
- process legacy UBOS 3.x tasks
- weaken existing validation
- overwrite completion history
- modify completed release records without justification
- merge pull requests automatically
- push directly to `main`
- create or move release tags without explicit authorization