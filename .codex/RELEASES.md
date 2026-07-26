# UBOS Releases

## Unified Live Broadcast Operating System

Status: Official Release Registry

---

## Release Registry

| Platform | Status | Git Tag | Certification | Release Date | Release Commit |
|---|---|---|---|---|---|
| v5.1 | RELEASED | v5.1.0 | PASS | — | — |
| v5.2 | RELEASED | v5.2.0 | PASS | — | — |
| v5.3 | RELEASED | v5.3.0 | PASS | — | — |
| v5.4 | RELEASED | v5.4.0 | PASS | — | — |
| v5.5 | RELEASED | v5.5.0 | PASS | — | — |
| v5.6 | RELEASED | v5.6.0 | PASS | — | — |
| v5.7 | RELEASED | v5.7.0 | PASS | — | — |
| v5.8 | RELEASED | v5.8.0 | PASS | — | — |
| v5.9 | RELEASED | v5.9.0 | PASS | 2026-07-14 | — |
| v5.10 | RELEASED | v5.10.0 | PASS | 2026-07-14 | — |
| v5.11 | RELEASED | v5.11.0 | PASS | 2026-07-15 | AUTO |
| v5.12 | READY | — | — | — | — |
| v6.0 | PLANNED | — | — | — | — |

---

## Current Active Release

Platform:

v5.11

Status:

RELEASED

Current Phase:

v5.11.0

Last Completed Platform:

v5.11

Last Completed Phase:

v5.11.0 — Production-Safe Developer Experience, Documentation Platform, Simulation Labs, Certification Academy, and Partner Program

---

## Release Rules

A platform may be marked `RELEASE_READY` only when:

- every implementation phase is complete
- certification passes
- required validation passes
- no release blocker remains
- documentation is complete
- changelog and release notes are complete
- workflow state is current

A platform may be tagged only after:

- release readiness is confirmed
- the working tree is clean
- the intended release commit is verified
- explicit authorization is provided

Never silently move or replace an existing published release tag.

---

## Current Product Stage

Current Platform:

v5.11

Current Stage:

Developer Experience, Documentation, Simulation, Certification, and Partner Ecosystem

Next Planned Platform:

v5.12 — Operator Experience, Deployment, and Product Hardening

---

## Control Room Milestone Registry

Named Control Room delivery milestones (distinct from full platform releases).

| Milestone | Release Name | Label | Steps | Status | Merge Head | Recommended Tag |
|---|---|---|---|---|---|---|
| Intelligence Graph Foundation (Steps 81–90) | UBOS Intelligence Graph Phase 1 | UIG-1 | 81–90 | CERTIFIED | d0953f6 | `uig-1.0` (not created) |

### Intelligence Graph Foundation (Steps 81–90)

- **Milestone title:** Intelligence Graph Foundation (Steps 81–90)
- **Release name:** UBOS Intelligence Graph Phase 1
- **Release label:** UIG-1
- **Shipped:** 2026-07-25
- **Includes:** UIG → UENL → UIE → CSE → TPE → PE → IFE → OGE → WIE → UIIL
- **PRs:** #391, #392, #393, #394, #395
- **Note:** Tag publication deferred; create `uig-1.0` only with explicit authorization.

---

This file is the authoritative registry of official UBOS platform releases.