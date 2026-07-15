# UBOS v5.10.0 Automation Platform Release

## Release identity

- Release tag: `v5.10.0` (prepared; tag creation is intentionally deferred until explicitly authorized)
- Release title: UBOS v5.10 Automation, Rundown, and Show-Control Platform
- Release category: production-ready architecture and metadata platform release
- Release date: 2026-07-14
- Certification status: PASS

## Overview

UBOS v5.10.0 finalizes the certified production-safe automation, rundown, and show-control platform. It delivers deterministic metadata-only cue coordination, trigger scheduling, rundown timeline execution, show-control action dispatch, macro/operator override coordination, and recovery/replay/audit coordination.

## Included phases

1. v5.10.1 — Automation, Rundown, and Show-Control Foundation
2. v5.10.2 — Automation Triggering, Scheduling, and Conditional Logic
3. v5.10.3 — Rundown Timeline Execution and Cue Dependency Coordination
4. v5.10.4 — Show-Control Action Dispatch and Target Coordination
5. v5.10.5 — Automation Macro Composition and Operator Override Coordination
6. v5.10.6 — Automation Recovery, Replay, and Audit Coordination
7. v5.10.7 — Automation Platform Certification
8. v5.10.0 — Automation Platform Release finalization

## Architecture summary

The release preserves one authoritative FrameTick, one Master Presentation Timeline, and one metadata-only automation coordination layer. Automation subsystems publish immutable snapshots and Source Graph metadata without controlling real devices, opening network sockets, mutating Program directly, or introducing duplicate timing loops.

Processor ordering remains deterministic across automation foundation processing, trigger scheduling, rundown timeline execution, action dispatch, macro/operator override handling, and recovery/replay/audit coordination before downstream orchestration consumers.

## Capabilities

### Automation and show-control foundation

Rundown definitions, cue definitions, cue arming/taking/completion/hold/skip lifecycle, exact-once take accounting, immutable cue state, telemetry, health, watchdog, and Source Graph metadata are represented safely.

### Trigger scheduling and conditional logic

Clock, delay, event, rundown-state, health, and composite triggers are evaluated against deterministic frame ticks and sanitized metadata. Trigger results are deterministic and bounded.

### Rundown timeline execution

Timeline cue readiness, dependency blocking, exact-once execution planning, completion/failure transitions, and immutable execution snapshots are coordinated without native device control.

### Show-control action dispatch

Target registration, action registration, queued requests, priority dispatch, capability blocking, acknowledgements, failures, expiry, and exact-once dispatch accounting are metadata-only.

### Macro and operator override coordination

Macro registration, queued runs, step dispatch accounting, hold/bypass/cancel/manual-only operator override modes, and bounded plans are coordinated deterministically.

### Recovery, replay, and audit coordination

Redacted audit events, recovery points, recovery state hashes, replay requests, replay dispatch accounting, operator acknowledgement/failure handling, and immutable audit snapshots are available for operators and orchestration layers.

## Production-safety guarantees

- Metadata-only orchestration and lifecycle coordination.
- Immutable snapshots for automation, trigger, rundown, dispatch, macro, override, recovery, replay, and audit state.
- Generation-safe updates and stale-generation rejection.
- Redacted operator, audit, payload, event, target, and action metadata.
- Exact-once cue taking, action dispatch, macro step dispatch, and replay dispatch accounting.
- Bounded queues and zero active queues after shutdown in certification.
- No direct Program mutation, real device control, real network control, or hidden automation runtime loop.

## Certification results

The v5.10.7 certification passed. The certification harness covers automation foundation, trigger scheduling, rundown timeline execution, show-control dispatch, macro/operator override coordination, recovery/replay/audit coordination, deterministic replay, 100,000 authoritative FrameTicks, 10,000 synthetic operations per automation area, exact-once handling, stale-generation rejection, redaction, telemetry honesty, bounded queue cleanup, zero active queues after shutdown, and Source Graph agreement.

## Validation summary

Release finalization re-ran media-plane typecheck, media-plane build, focused v5.10.1 through v5.10.7 validations, media-plane tests, root lint, root typecheck, root tests, and diff whitespace validation.

## Security and redaction

Automation release documentation and public API do not expose secrets, device handles, network endpoints, unsafe payloads, raw operator notes, or unredacted audit data. Public release constants expose only version, title, certification status, and readiness metadata.

## Known limitations

UBOS v5.10.0 is a production-safe orchestration, metadata, lifecycle, validation, and delegation platform. It does not include physical device control, GPIO/MIDI/OSC/serial/REST hardware execution, native show-control transport, real scheduler services, external database persistence, remote rundown import/export, external automation integrations, AI planning, direct output encoding, or a UI redesign.

## Upgrade and compatibility notes

The repository preserves its existing package version convention (`1.0.0-rc.1`). The platform release identity is exposed through explicit media-plane automation platform release constants rather than by mass-updating package versions.

## Environmental warnings

The configured `origin` remote is unavailable in this workspace, so origin/main synchronization, remote tag lookup, tag push, and remote peeled-tag verification could not be completed here. No release tag was created because explicit tag authorization was not provided.

## Next milestone

UBOS v5.11.1 — next production-safe platform foundation phase, pending maintainer task authorization.
