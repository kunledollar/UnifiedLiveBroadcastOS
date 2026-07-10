# UBOS v5.1 Execution Engine Certification

## Scope

This certification covers v5.1.1 Runtime Foundation, v5.1.2 Master Frame Clock, v5.1.3 Deterministic Scheduler, v5.1.4 Command Execution Engine, v5.1.5 Runtime Execution Loop, v5.1.6 Tick Processor Framework, and v5.1.7 Telemetry & Watchdog. It intentionally excludes v5.2 source acquisition.

## Final architecture and ownership

Master Frame Clock → Runtime Execution Loop → Deterministic Scheduler → Command Execution Engine → Tick Processor Framework → Unified Telemetry → Runtime Watchdog.

The master frame clock owns frame timing, frame numbers, deadlines, drift, lateness, missed frames, and discontinuities. The scheduler owns queued commands, dependencies, due ordering, cancellation before execution, expiration, grouping, and scheduler terminal state. The command execution engine owns handler resolution, retries, cancellation during execution, timeout, immutable execution records, and execution history. The runtime loop owns continuous frame orchestration, tick lifecycle, budgets, overload handling, pause/resume/stop coordination, and cleanup. The processor framework owns processor lifecycle, dependency ordering, initialization, per-tick execution, outputs, health, and reverse-order shutdown. The watchdog observes snapshots, evaluates health, manages incidents and recovery budgets, and does not mutate subsystem internals.

## Public contracts

The media-plane package exports the execution-engine public API from its root entry point. Public snapshots serialize bigint values as strings and are returned as frozen metadata objects.

## Determinism and exactly-once guarantees

Frame-clock frame numbers are authoritative across runtime context, scheduler due collection, command execution records, processor records, tick results, telemetry, and watchdog snapshots. Command IDs are execution idempotency keys within the bounded command lifecycle. A scheduled command executes at most once inside the runtime even across repeated due collection, pause/resume, missed-frame recovery, retries, and history eviction.

Exactly-once external side effects are not guaranteed without transactional participation from external systems. Handlers that touch external systems must provide their own transactional or idempotent commit protocol.

## Lifecycle behavior

Initialize, start, pause, resume, stop, shutdown-equivalent stop, fail, repeated stop, invalid transition rejection, stop while waiting for a frame, stop during command execution, stop during processor execution, fail during active tick, and watchdog stop during shutdown are covered by validation. Paused and failed runtimes do not start ticks; stopping runtimes cancel active commands and shut processors down; stopped runtimes have no pending clock wait; watchdog evaluation stops after watchdog stop.

## Timing model

Rational rates use integer nanosecond calculations. Validation covers 30 fps and 30000/1001 long-run simulations without real-time sleeping, missed-frame recovery, discontinuities, and non-regressing pause/resume.

## Processor extension model

Processors register descriptors with phase, order, ID, dependencies, workload class, criticality, timeout, and failure policy. Execution order is topological and then phase/order/ID stable, independent of registration order. Outputs are tick-scoped and cleared at tick end.

## Watchdog and incident model

The watchdog takes current telemetry snapshots, computes nonnegative staleness, deduplicates incidents by deterministic keys, excludes resolved incidents from active counts, bounds histories, redacts sensitive fields, and enforces recovery budget/cooldown accounting.

## Validation and long-run results

The media-plane validation command includes execution-engine validation. Certification tests cover public exports, lifecycle consistency, frame-clock authority, scheduler/executor agreement, processor/loop agreement, watchdog/telemetry agreement, invariant checks, bounded histories, and deterministic long-run simulation.

## Performance summary

Performance measurements are emitted by validation for command execution, runtime loop ticks, watchdog evaluation, and processor traversal. Hot paths are: frame tick creation O(1); scheduler insertion O(log n) conceptually by ordered collection with bounded capacity; due collection O(n log n) over pending commands in the current implementation; command handler resolution O(1); execution history insertion O(1) amortized with bounded eviction; processor traversal O(p + e) for processors and dependencies; tick health append O(w) bounded by configured window; watchdog evaluation O(i + d + r) bounded by history capacities.

## Known environmental blockers

Repository fetch could not update from `origin/main` because no `origin` remote is configured in this checkout. Validation records exact command results in the pull request and final report.

## Known limitations

The runtime exactly-once guarantee is internal to command lifecycle records and cannot guarantee external side effects without external transactional participation. Watchdog recovery records recovery attempts but does not directly mutate subsystem internals.

## Release checklist

- v5.1 architecture integrated.
- Public API exported from media-plane root.
- v5.1 validation included in media-plane test command.
- Bounded histories verified.
- Security redaction verified.
- Documentation present for v5.1.1 through v5.1.7.

## Readiness for v5.2

When validation commands pass, UBOS v5.1 is ready for release tagging and the recommended next task is UBOS v5.2.1 Source Acquisition Foundation.

## Recommended release tag

Recommended tag: `v5.1.0`.
Release title: `UBOS v5.1 Execution Engine`.
