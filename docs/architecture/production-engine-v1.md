# UBOS Production Broadcast Engine v1.0

Phase 9.9 introduces the Production Broadcast Engine as the single deterministic execution authority above the runtime supervisor, broadcast orchestrator, high availability runtime, hardware runtime, GPU runtime, browser renderer, recording runtime, streaming runtime, WebRTC runtime, audio runtime, encoder runtime, and FFmpeg runtime.

## Architecture

The engine lives in `packages/media-plane/src/production-engine/` and is metadata-only by design. It coordinates runtime subsystems through `RuntimeSupervisor` and `BroadcastOrchestrator`; runtime handles such as processes, sockets, DOM nodes, media streams, textures, and canvases are never stored in manifests, checkpoints, snapshots, diagnostics, dashboards, or replay history.

Core components:

- `ProductionEngine` owns lifecycle and dashboard assembly.
- `ProductionSession` records the current session metadata.
- `ExecutionCoordinator` creates deterministic execution manifests.
- `PipelineScheduler` orders runtime dependencies.
- `FrameScheduler` creates frame-accurate scheduling records.
- `MediaClock` provides deterministic clock samples and drift correction inputs.
- `SynchronizationManager` tracks audio/video and output sync.
- `ResourceAllocator` budgets CPU, GPU, memory, encoder, network, and thread use.
- `ExecutionValidator` rejects unsafe plans, clock conflicts, dependency cycles, unsafe order, and runtime-handle metadata.
- `ExecutionDiagnostics`, `ExecutionHistory`, `ExecutionSnapshot`, and `ExecutionCheckpoint` provide replay-safe inspection.
- `ProductionHealth`, `ProductionRecovery`, and `ProductionMetrics` summarize health, recovery, and performance.

## Scheduling

Scheduling is deterministic and priority-aware. The default pipeline order is hardware, GPU, browser renderer, audio, encoder, FFmpeg, recording, streaming, WebRTC, output, high availability, replay, timing, and backpressure. Each scheduled step includes metadata-only resource budgets and dependency declarations.

Frame scheduling emits immutable records with frame id, presentation timestamp, duration, deadline, priority, audio PTS, video PTS, and participating subsystems. Buffer and backpressure state is represented as metrics rather than runtime queues.

## Synchronization

The engine uses one `MediaClock` authority for frame timing. The synchronization manager compares audio and video PTS values, reports frame-accurate status, identifies drift, and records whether correction was applied. Clock conflicts above validation thresholds are rejected before they can become replay state.

## Replay

Replay artifacts are metadata-only:

- Execution snapshots capture manifest, health, statistics, synchronization, and history.
- Checkpoints reference snapshot ids and graph revisions only.
- Scheduling history records frame metadata.
- Recovery history records recovery decisions and reasons.

This preserves the Production Graph boundary: graph state remains declarative and never receives runtime handles.

## Recovery

Recovery is coordinated through metadata events that can be replayed safely. The engine can pause, resume, stop, restart, checkpoint, recover, shut down, and regenerate snapshots. High availability and failure model integrations are represented through deterministic events and health summaries.

## Performance

Production metrics include frame latency, pipeline latency, dropped frames, resource utilization, and backpressure level. These values are exposed through the Control Room Production Engine Dashboard for timeline, frame scheduler, synchronization, resource, performance, recovery, and session inspection views.

## Security

Security constraints:

- Reject serialized runtime handles.
- Reject unsafe execution order.
- Reject dependency cycles.
- Reject clock conflicts.
- Preserve metadata-only snapshots, checkpoints, manifests, diagnostics, dashboards, and histories.
- Keep runtime handles inside their owning runtime implementations only.

## Feature Flags

Server/runtime flag: `UBOS_ENABLE_PRODUCTION_ENGINE`

Public Control Room flag: `NEXT_PUBLIC_UBOS_PRODUCTION_ENGINE`

Both must be `true` for the engine to report enabled production mode.

## Future Roadmap

- Distributed multi-node engine election.
- Adaptive frame pacing from measured output latency.
- Richer per-runtime resource estimators.
- Persisted checkpoint stores.
- Operator-facing recovery playbooks.
- Formal replay diff tooling for production incidents.
