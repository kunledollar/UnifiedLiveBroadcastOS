# Broadcast Orchestrator Runtime

The Broadcast Orchestrator is the single execution authority for coordinating Recording, Streaming, WebRTC, Audio, Browser Renderer, GPU, Encoder Runtime, and the Runtime Supervisor. The Production Graph remains metadata-only; runtime handles are never serialized.

## Architecture

`BroadcastOrchestrator` owns dedicated coordinators for execution, runtime, output, media, health, lifecycle, transitions, resources, and production dashboard metadata. Subsystems register through sanitized `RuntimeSubsystem` metadata and cannot bypass orchestrator ownership checks.

Feature flags `UBOS_ENABLE_ORCHESTRATOR=true` and `NEXT_PUBLIC_UBOS_ORCHESTRATOR=true` enable the orchestrator. When either flag is disabled, lifecycle calls fall back to existing supervisor behavior.

## Execution model

`ExecutionCoordinator` builds deterministic plans for start, stop, pause, resume, restart, and scene activation. Startup orders GPU and browser rendering before audio, encoder, recording, streaming, WebRTC, and other outputs. Shutdown reverses that order. Plans include dependency metadata and execution barriers.

## Coordinator model

- `RuntimeCoordinator` delegates safe lifecycle changes to the Production Runtime Supervisor.
- `OutputCoordinator` coordinates recording, streaming, and WebRTC outputs.
- `MediaCoordinator` synchronizes audio, video, browser, GPU, recording, streaming, WebRTC, and timing.
- `HealthCoordinator` reports global health, subsystem health, diagnostics, resource usage, frame timing, and execution latency.
- `LifecycleCoordinator` maps production actions to orchestrator states.
- `TransitionCoordinator` records scene activation.
- `ResourceCoordinator` schedules CPU, GPU, memory, encoder, network, and thread budgets.
- `ProductionCoordinator` exposes Control Room dashboard metadata.

## Scheduling

Scheduling uses priority-ordered resource requests. Required subsystems default to higher priority. Requests exceeding CPU, GPU, memory, encoder, network, or thread budgets are denied to protect runtime stability.

## Synchronization

Every orchestration plan records media synchronization events for audio, video, WebRTC, streaming, recording, GPU, browser, and timing. Barriers preserve safe startup, frame, shutdown, and recovery boundaries.

## Recovery

Recovery includes subsystem restart, graceful degradation, partial recovery, full production restart, emergency shutdown, and operator notification through replayable events.

## Replay

Replay contains production lifecycle events, coordinator events, subsystem events, scheduling decisions, and health summaries. Replay records declare `containsRuntimeHandles: false` and only store metadata.

## Backpressure

Backpressure is represented through cross-runtime resource budgets, priority queues, CPU/GPU/network protection, and adaptive scheduling. Over-budget subsystems are not granted resources.

## Security

Plan validation rejects duplicate runtime ownership, invalid execution order, missing dependencies, runtime-handle-like metadata, and plans that do not explicitly preserve metadata-only replay boundaries.
