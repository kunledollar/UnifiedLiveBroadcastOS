# UBOS v4.6 Session Runtime Architecture

The Session Runtime introduces a deterministic, metadata-only production session object for entire broadcast shows. `SessionRuntimeController` is a `RuntimeSubsystem` registered with the Broadcast Runtime and coordinates session creation, loading, lifecycle, snapshots, recovery, health, metrics, and event publication through `RuntimeEventBus`.

## Components

- `SessionRuntimeController` owns the public API and current session pointer.
- `SessionRegistry` stores unique session metadata records and rejects duplicates.
- `SessionLifecycleManager` enforces legal state transitions.
- `SessionHealthManager` summarizes runtime health, device counts, active inputs/outputs, uptime, operator, warnings, and errors.
- `SessionSnapshotManager` creates metadata-only snapshots.
- `SessionRecoveryManager` restores metadata from snapshots without media buffers.
- `SessionMetricsCollector` exposes deterministic counts and uptime.
- `SessionEventAdapter` publishes session events to `RuntimeEventBus`.

## Safety

Sessions contain IDs, operator, production type, workspace preset, rundown, device/input/output sets, recording/streaming targets, creation time, health, and version. They explicitly mark `containsMediaHandles: false` and `containsMediaPayloads: false`.
