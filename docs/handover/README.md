# UBOS Engineering Handover

## Purpose

This directory contains the authoritative product, architecture, execution,
testing, and engineering handover for the Unified Broadcast Operating System.

All engineers, contractors, Cursor agents, Codex agents, and third-party
development teams must read these documents before changing the platform.

---

## Required Reading Order

Read the documents in this order:

1. `implementation/01-UBOS-OVERVIEW.md`
2. `implementation/02-UBOS-ARCHITECTURE.md`
3. `implementation/03-UBOS-PRODUCT-TRUTH-AND-EXECUTION-CONTRACT.md`
4. `implementation/04-UBOS-EXECUTION-PLAN.md`
5. `implementation/05-UBOS-SUBSYSTEM-MATRIX.md`
6. `implementation/06-UBOS-RUNTIME-TOPOLOGY.md`
7. `implementation/07-UBOS-UI-BASELINE.md`
8. `implementation/08-UBOS-ACCEPTANCE-TESTS.md`
9. `implementation/09-UBOS-CURSOR-RULES.md`
10. `implementation/10-UBOS-CAPABILITY-MATRIX.md`
11. `implementation/11-UBOS-DEVELOPMENT-STANDARDS.md`
12. `implementation/12-UBOS-FUTURE-ROADMAP.md`

---

## Repository Control Documents

After reading the handover, also read:

- `MASTER-PLAN.md`
- `ROADMAP.md`
- `.codex/ENGINEERING-STANDARDS.md`
- `.codex/WORKFLOW-STATE.md`
- `.codex/COMPLETION-REPORT.md`
- `.codex/RELEASES.md`

---

## Current Engineering Priority

The immediate priority is not new feature expansion.

The required execution order is:

1. FFmpeg and FFprobe discovery.
2. Native recording from actual Program output.
3. Graphics and audio in native output.
4. One real RTMP or RTMPS destination.
5. Two simultaneous destinations.
6. First real chat connector.
7. Second real chat connector.
8. Unified two-way chat.
9. Unified moderation.
10. First real social or remote media input.

---

## Source of Truth

Where documents conflict, use this precedence:

1. Product Truth and Execution Contract.
2. Execution Plan.
3. Runtime Topology.
4. UI Baseline.
5. Acceptance Tests.
6. Workflow State.
7. Roadmap.
8. Future Roadmap.

Implementation evidence overrides unsupported historical claims.

---

## Completion Standard

A capability is complete only when:

- an operator activates it;
- the real runtime executes it;
- the external result is verified;
- failure handling works;
- resources are cleaned up;
- acceptance tests pass;
- documentation is updated.

Compilation, metadata, mock output, simulation, or UI appearance alone do not
count as completion.