# UBOS Workflow State

version: 1
status: RELEASED
platform: v5.11
current_phase: v5.11.0
next_phase: v5.12.0
last_completed_platform: v5.11
last_completed_phase: v5.11.0
release_status: v5.11 RELEASED

---

## Active Platform

v5.12

---

## Active Phase

v5.12.0

---

## Current Status

CERTIFIED

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

v5.11

---

## Last Completed Phase

v5.11.0 — Production-Safe Developer Experience, Documentation Platform, Simulation Labs, Certification Academy, and Partner Program

---

## Next Ready Phase

v5.12.0 — next platform phase pending authoritative task specification

---

## Latest Control Room Milestone

- **Milestone title:** Workspace Intelligence Engine 2.0 (Step 105)
- **Release name:** UBOS WIE 2.0
- **Status:** PASS (see `.codex/COMPLETION-REPORT.md`, 2026-07-26 entry)
- **Prior milestone:** Operator HUD 2.0 (Step 104), branch `cursor/operator-hud-2-0-4284` (PR #410, not yet merged to `main`); Steps 91–103 merged at d44db76; Intelligence Graph Foundation (Steps 81–90) merge head d0953f6
- **Branch note:** Step 105 (branch `cursor/wie-2-0-4284`) was built on top of the unmerged Step 104 branch, since "HUD 2.0 intelligence routing" is one of WIE 2.0's explicit responsibilities. Merge Step 104 before Step 105, in that order.
- **Next Control Room step:** Step 106 — pending authoritative task specification

---

## Platform Progress

| Platform | Status |
|---|---|
| v5.9 | RELEASED |
| v5.10 | RELEASED |
| v5.11 | RELEASED |
| v5.12 | READY |
| v6.0 | PENDING |

---

## Current Platform Progress

| Phase | Status |
|---|---|
| v5.11.1 | VALIDATED |
| v5.11.2 | VALIDATED |
| v5.11.3 | VALIDATED |
| v5.11.4 | VALIDATED |
| v5.11.5 | VALIDATED |
| v5.11.6 | VALIDATED |
| v5.11.7 | VALIDATED |
| v5.11.8 | VALIDATED |
| v5.11.9 | VALIDATED |
| v5.11.0 | CERTIFIED |

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