# UBOS Timing, Clock & Frame Determinism v1

This specification formalizes the UBOS broadcast timing model for recording, streaming, multiview, replay, AI automation, distributed runtime, and edge execution. It is documentation plus lightweight enforcement; it does not introduce new recording or streaming features.

## Single Timing Authority

`MediaClock` is the only broadcast timing authority. Renderers, adapters, output engines, route engines, browser loops, and diagnostics may schedule work or measure elapsed wall time, but they do not own independent broadcast clocks.

- `requestAnimationFrame` is browser scheduling support only. It may help a renderer wake up, but the frame it renders must be identified by a `MediaClock` frame tick.
- `Date.now()` and `performance.now()` may be used for latency measurement, jitter measurement, logs, and diagnostics. They must not become independent broadcast truth outside `MediaClock`-controlled APIs.
- Future device clocks, PTP, NDI timecode, genlock, or cloud clocks resynchronize or discipline `MediaClock`; they do not bypass it.
- When `NEXT_PUBLIC_UBOS_MEDIA_SYNC=true`, subsystems should align execution to scheduler ticks from `MediaClock`. When disabled, existing runtime behavior continues while timing metadata is exposed where available.

## Frame Identity Model

Every deterministic frame is described by:

| Field | Rule |
| --- | --- |
| `frameId` | Monotonic integer from `MediaClock` frame state. |
| `frameTimestamp` | Frame timestamp derived from `MediaClock.getFrameTimestamp(frameId)`. |
| `broadcastTime` | Current broadcast elapsed time from `MediaClock`. |
| `graphRevision` | Production Graph revision used to derive the frame plan. |
| `plannerRevision` | Optional planner algorithm/config revision. |
| `executionBatchId` | Optional execution-plane batch correlation id. |

Rules:

1. `frameId` must be monotonic.
2. `frameTimestamp` must derive from `MediaClock`.
3. One `MediaFramePlan` belongs to one frame tick.
4. Execution results should carry or be traceable to `frameId` wherever frame execution applies.
5. Frame plans must not contain metadata that declares an independent subsystem broadcast clock.

## Frame Lifecycle

Official successful lifecycle:

1. `CLOCK_TICK_CREATED`
2. `PENDING_INTENTS_COLLECTED`
3. `FRAME_PLAN_CREATED`
4. `FRAME_PLAN_VALIDATED`
5. `FRAME_PLAN_EXECUTED`
6. `SUBSYSTEM_RESULTS_COLLECTED`
7. `FRAME_DIAGNOSTICS_RECORDED`
8. `FRAME_COMPLETE`

Failure or exceptional paths:

- `FRAME_SKIPPED` — no eligible work or intentionally skipped to preserve cadence.
- `FRAME_DROPPED` — missed budget and cannot execute without violating timing.
- `FRAME_DEGRADED` — executed with reduced fidelity, stale source, fallback route, or partial output.
- `FRAME_RETRIED` — retried idempotent work; retry must retain frame identity and diagnostics.
- `FRAME_ABORTED` — frame execution stopped because graph, adapter, or safety constraints invalidated the plan.

## Deterministic Per-Frame Ordering

The target ordering is:

1. sync updates
2. command/event intake
3. planner intent resolution
4. video route planning
5. audio route planning
6. scene composition update
7. output planning
8. renderer execution
9. diagnostics emission

Current implementation notes: orchestration is already a pure planning layer and execution adapters still perform lightweight mock/dry-run dispatch. Some runtime paths translate graph transitions directly to execution intents before full frame lifecycle accounting. TODO: migrate all frame execution diagnostics to the lifecycle states above without rewriting adapter behavior.

## Late Intent Rules

- Intents received before the frame cutoff may execute on the current frame.
- Intents received after the cutoff move to the next executable frame.
- Stale intents may be rejected or rescheduled based on deadline and graph revision rules.
- Rescheduled intents must preserve the original timestamp and include `scheduledFrameId` in scheduling metadata.
- The helper contract is `assignIntentToFrame(intent, clockState, options)`, `isIntentLateForFrame(intent, frameTick, cutoffMs)`, and `getNextExecutableFrame(clockState)`.

## Drift Model

Drift categories:

- render drift
- audio drift
- video route drift
- output drift
- sync drift
- planner drift

Default thresholds:

| Severity | Threshold |
| --- | --- |
| warning | `>= 20ms` |
| degraded | `>= 50ms` |
| critical | `>= 100ms` |

`classifyDrift()`, `summarizeFrameDrift()`, and `createDriftWarning()` provide deterministic diagnostics labels. Drift is diagnostic by default; future live output policies may degrade, drop, or resync frames based on these categories.

## Relationship to Production Graph Revisions

Production Graph revisions describe desired broadcast state. A frame plan records the `graphRevision` used during planning so outputs, render results, logs, and replay can prove which graph state governed a frame. Graph mutation remains separate from frame execution.

## Relationship to MediaFramePlan

`MediaFramePlan` is the one-frame planning contract. It owns `frameId`, `frameTimestamp`, `broadcastTime`, `graphRevision`, ordered execution steps, subsystem batches, and conflicts. It must be deterministic for identical graph, intent, clock tick, and subsystem snapshot inputs.

## Relationship to Browser Renderer

The Browser Renderer may use browser APIs for scheduling and measurement, but `renderFrame(frameTick)` is the authoritative frame entry point. `requestAnimationFrame` must not decide UBOS frame identity.

## Relationship to Output Engine

The Output Engine consumes frame-aligned plans and results. Streaming, recording, and program outputs should attach output lag and dropped/degraded-frame diagnostics to `frameId`.

## Timing Diagnostics

Timing diagnostics should eventually expose:

- current frame
- frame rate
- frame budget
- late intents
- skipped frames
- dropped frames
- drift by subsystem
- average frame execution time
- worst frame time
- output lag
- renderer lag

## Future Feature Requirements

- Phase 6.10 Recording Engine: recorded samples and manifests must be traceable to `frameId`/`frameTimestamp`.
- Phase 6.11 Streaming Engine: encoder pacing and output lag report against `MediaClock` frames.
- Phase 6.12 Multiview & Confidence Monitoring: preview/program confidence views use the same frame identity as program execution.
- Replay: deterministic replay reuses graph revisions, frame ids, and frame timestamps.
- AI automation: AI intents are scheduled by cutoff rules and cannot inject unclocked broadcast time.
- Distributed runtime: remote executors receive frame identity and report drift relative to `MediaClock`.
- Edge execution: edge clocks discipline local scheduling to the authoritative UBOS timing stream.
