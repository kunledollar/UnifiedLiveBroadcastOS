# UBOS v5.10.5 — Automation Macro Composition and Operator Override Coordination

This phase adds a production-safe, metadata-only automation macro layer for composing deterministic multi-step show-control workflows while preserving operator authority.

## Scope

- Macro registration with generation checks and deterministic step ordering.
- Macro run queuing with exact-once step dispatch accounting.
- Operator override modes for hold, bypass, cancel, and manual-only coordination.
- Immutable snapshots for macro definitions, active runs, overrides, health, telemetry, and Source Graph metadata.
- TickProcessor publication for runtime integration without real device or network control.
- Command handlers for registration, queueing, override management, advancement, step acknowledgement, step failure, and reset.

## Safety boundaries

The implementation is metadata-only. It does not open device handles, emit native commands, send network control, or retain sensitive payload fields. Snapshot metadata and run payloads redact keys that look like secrets, credentials, endpoints, raw buffers, native handles, paths, or command lines.

## Validation

Focused validation covers deterministic macro execution, stale generation rejection, exact-once step dispatch, metadata redaction, hold release, bypass, cancel, processor publication, replay determinism, and long-run metadata-only telemetry.
