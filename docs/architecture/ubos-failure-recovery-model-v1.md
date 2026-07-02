# UBOS Failure & Recovery Model v1

UBOS Failure & Recovery Model v1 defines how the Production Graph, synchronization layer, authority layer, deterministic planner, media execution engine, compositor, routing engines, renderer, output engine, persistence, and future recording/streaming systems detect, classify, recover from, and report failures. It is a specification and lightweight enforcement layer, not a feature implementation or UI redesign.

## Contract Relationships

- **Execution Contract v1:** failures must preserve the planner/runtime boundary. Production Graph commands are not retried if replay could mutate graph state twice. Runtime execution intents may be retried only when the executor declares the operation idempotent.
- **Timing Contract v1:** frame failures are tied to deterministic `frameId`, `frameTimestamp`, and `graphRevision`. A failed frame must not mutate the Production Graph; the next frame may continue when subsystem health permits.
- **Persistence:** failure records are in-memory/shared-contract objects unless an existing repository abstraction can persist them without schema risk.

## Canonical Failure Categories

`COMMAND_FAILURE`, `GRAPH_FAILURE`, `REVISION_CONFLICT`, `SYNC_FAILURE`, `AUTHORITY_FAILURE`, `PLANNER_FAILURE`, `FRAME_PLAN_FAILURE`, `EXECUTION_FAILURE`, `COMPOSITOR_FAILURE`, `VIDEO_ROUTING_FAILURE`, `AUDIO_ROUTING_FAILURE`, `OUTPUT_FAILURE`, `RENDERER_FAILURE`, `MEDIA_SOURCE_FAILURE`, `DATABASE_FAILURE`, `WEBSOCKET_FAILURE`, `RECORDING_FAILURE`, `STREAMING_FAILURE`, `OBSERVABILITY_FAILURE`, and `UNKNOWN_FAILURE` are the only canonical categories for v1.

## Severity Levels

| Severity | Execution rule | Meaning |
| --- | --- | --- |
| `info` | Does not interrupt execution. | Diagnostic condition worth recording. |
| `warning` | Does not interrupt execution. | Recoverable anomaly or rejected stale input. |
| `degraded` | Continues with reduced capability. | Subsystem is impaired but broadcast can continue. |
| `recoverable` | Retry or fallback. | Temporary failure with bounded recovery path. |
| `critical` | Stop affected subsystem; broadcast may continue. | Unsafe or unavailable subsystem requiring isolation or pause. |
| `fatal` | Broadcast/session shutdown or operator intervention may be required. | Continued execution could corrupt state or produce unsafe output. |

## Failure Record Model

Shared types define `UBOSFailure`, `FailureCategory`, `FailureSeverity`, `FailureStatus`, `FailureSource`, `FailureRecoveryPolicy`, `FailureRecoveryAttempt`, and `FailureResolution`.

A failure record contains: `id`, `category`, `severity`, `status`, `sourceLayer`, `subsystem`, `message`, `createdAt`, `updatedAt`, optional `frameId`, optional `graphRevision`, optional `commandId`, optional `intentId`, optional `executionBatchId`, optional `operatorId`, `recoverable`, `retryCount`, recovery policy/attempts, resolution, and structured `metadata`.

## Recovery Policies

| Policy | Use |
| --- | --- |
| `ignore` | No operator-facing impact; telemetry only. |
| `warn_only` | Notify diagnostics/operator but keep execution running. |
| `retry` | Retry with bounded attempts and idempotency requirements. |
| `fallback` | Replace failed plan/render/source with deterministic fallback. |
| `degrade` | Enter a declared degraded mode. |
| `isolate_subsystem` | Stop only the failing subsystem. |
| `pause_execution` | Pause deterministic execution until safe state is restored. |
| `require_operator_action` | Block recovery on an operator decision. |
| `shutdown_session` | End the broadcast/session safely. |

Lightweight helpers: `classifyFailure()`, `createFailureRecord()`, `selectRecoveryPolicy()`, `shouldRetryFailure()`, `shouldEscalateFailure()`, and `summarizeFailureState()`.

## Retry Rules

- Default maximum retries: 3.
- Default retry delay: implementation-defined; recommended initial delay is 250-1000 ms.
- Exponential backoff is recommended for transports, renderers, output, and database reconnects.
- Retryable categories: `SYNC_FAILURE`, `EXECUTION_FAILURE`, `FRAME_PLAN_FAILURE`, `COMPOSITOR_FAILURE`, `RENDERER_FAILURE`, `WEBSOCKET_FAILURE`, and `MEDIA_SOURCE_FAILURE`.
- Non-retryable categories: `GRAPH_FAILURE`, `REVISION_CONFLICT`, `AUTHORITY_FAILURE`, and non-idempotent `COMMAND_FAILURE`.
- Command application must not be retried when it may mutate the graph twice.
- Execution intents may retry only if idempotent.
- Renderer failures may retry after fallback or placeholder render is selected.
- Database failures may enter degraded/read-only mode.
- WebSocket failures trigger reconnect plus resync/catch-up.

## Degraded Modes

| Mode | Allowed | Forbidden |
| --- | --- | --- |
| `local_only_mode` | Local operator control and local diagnostics. | Remote authority assumptions and remote broadcast guarantees. |
| `mock_media_mode` | Placeholder media and dry-run execution. | Claiming real source capture/output health. |
| `renderer_placeholder_mode` | Placeholder frames, slates, or last-known-good frame. | Mutating graph to hide renderer failure. |
| `output_disabled_mode` | Internal preview, diagnostics, and graph edits. | External program output, streaming, or recording output claims. |
| `sync_readonly_mode` | State observation, catch-up, diagnostics. | New graph mutations from stale clients. |
| `database_readonly_mode` | Reads and in-memory buffering where safe. | Schema changes or writes that cannot be durably confirmed. |
| `diagnostics_only_mode` | Health checks and operator messaging. | Media execution, routing changes, and graph mutation. |

## Subsystem Failure Behavior

| Subsystem | Examples | Default severity | Default policy | Broadcast continues? | Notify operator? |
| --- | --- | --- | --- | --- | --- |
| Production Graph | invalid invariant, corrupt revision | `critical` | `pause_execution` | Maybe, only from last safe graph | Yes |
| Command Bus | malformed command, duplicate command id | `recoverable`/`warning` | `warn_only` | Yes | If repeated |
| Event Log | append failure, replay mismatch | `critical` | `pause_execution` | Maybe | Yes |
| Sync Layer | drift, client behind, transport timeout | `recoverable` | `retry` | Yes | On degraded sync |
| Authority Layer | lock conflict, unresolved ownership | `critical` | `require_operator_action` | Maybe | Yes |
| Orchestration Planner | plan exception, non-deterministic output | `recoverable` | `fallback` | Yes if fallback exists | Yes if repeated |
| Media Execution Engine | adapter rejection, batch timeout | `recoverable` | `retry` | Yes if isolated | On repeated failures |
| Scene Compositor | layer composition error | `recoverable` | `fallback` | Yes with placeholder | Yes |
| Video Routing Engine | missing route/source | `degraded` | `degrade` | Yes | If source visible/program |
| Audio Routing Engine | gain/mute route failure | `degraded` | `degrade` | Yes | If program audio affected |
| Output Engine | output device/transport unavailable | `critical` | `isolate_subsystem` | Internal session may continue | Yes |
| Browser Renderer | canvas/GPU/render exception | `recoverable` | `fallback` | Yes with placeholder | Yes if repeated |
| WebRTC Adapter | ICE failed, track ended | `recoverable` | `retry` | Yes with source degraded | Yes for on-air source |
| Database/Persistence | unavailable, write timeout | `degraded` | `degrade` | Yes if safe read-only/buffered | Yes beyond threshold |
| Diagnostics | telemetry sink unavailable | `warning` | `warn_only` | Yes | No unless blind |

## Frame-Level Failure Handling

Frame failure labels are `FRAME_PLAN_FAILED`, `FRAME_EXECUTION_FAILED`, `FRAME_RENDER_FAILED`, `FRAME_OUTPUT_FAILED`, `FRAME_DROPPED`, and `FRAME_DEGRADED`.

Rules:

- A failed frame must not mutate the Production Graph.
- Failed execution emits structured diagnostics including `frameId`, `graphRevision`, recovery policy, and retry count.
- The next frame may continue if subsystem health and circuit breakers allow it.
- Repeated fatal or threshold-exhausted frame failures escalate to subsystem isolation, operator action, or session shutdown.

## Circuit Breaker Model

Circuit states are `closed`, `open`, and `half_open`.

Use cases: renderer repeatedly failing, output repeatedly failing, WebSocket reconnect loops, DB unavailable, or adapter unavailable. Helpers are `createCircuitBreakerState()`, `recordCircuitBreakerSuccess()`, `recordCircuitBreakerFailure()`, `shouldOpenCircuit()`, and `shouldAttemptHalfOpen()`.

## Operator Intervention Rules

Operator action is required for fatal graph failure, repeated planner failure, repeated output failure, streaming transport failure, recording disk unavailable, database unavailable beyond threshold, or authority conflict that cannot be resolved automatically. Operator-facing messages must include subsystem, severity, current degraded mode, suggested action, last successful recovery attempt, correlation ids, and whether program output is still active.

## Observability Requirements

Every failure event should emit structured telemetry with timestamp, severity, source layer, subsystem, `frameId`, `graphRevision`, recovery policy, retry count, current degraded mode, and resolution. Diagnostics summaries should include active failure count, highest severity, degraded modes, and whether operator action is required.
