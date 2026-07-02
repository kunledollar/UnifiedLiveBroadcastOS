# UBOS Execution Contract v1

**Contract name:** UBOS Execution Contract v1  
**Scope:** Production state, command/event governance, orchestration planning, media execution, rendering, outputs, synchronization, and diagnostics.  
**Status:** Official architecture contract for Phase 7.1 and later phases until superseded by a newer versioned contract.

This contract formalizes how UBOS moves from authoritative production state to real-time media output without allowing runtime media objects, adapters, renderers, or diagnostics to become hidden sources of truth.

## Official Execution Flow

All production behavior follows this one-way flow:

```text
Production Graph
→ Commands
→ Events
→ Orchestration Planner
→ Media Frame Plan
→ Execution Engine
→ Subsystems
→ Renderer / Outputs
```

No layer may bypass this flow to create durable production state. Runtime layers may observe, execute, and report diagnostics, but the Production Graph remains the only authoritative state.

## 1. Source of Truth

- **Production Graph is the only authoritative state.** It stores durable production configuration, session state, scene state, routing intent, operator-visible state, revisions, and metadata.
- **Commands request change.** A command is an intent to mutate authoritative state. Commands are not proof that a change occurred.
- **Events describe completed change.** Events record accepted, completed graph transitions and carry revision ordering.
- **Plans are derived.** Orchestration plans and media frame plans are deterministic derivations from the graph, command/event history, intent sets, subsystem snapshots, and clock ticks.
- **Execution results are runtime observations only.** Execution success, late frames, adapter failures, renderer status, and output telemetry may be logged or surfaced as diagnostics, but they are not authoritative graph state unless converted into an accepted command and resulting event.

## 2. Layer Ownership

| Layer | Owns | May read | May mutate | Must never do |
| --- | --- | --- | --- | --- |
| Production Graph | Durable production state, graph metadata, revision number, scene/source/route/output intent state | Validated commands, accepted events, schema migrations | Its own immutable next revision through sanctioned reducers only | Store runtime media objects, bypass command/event rules, call adapters/renderers, perform I/O |
| Command Bus | Command intake, ordering before authority checks, command acknowledgements/rejections | Current graph revision, authority rules, sync metadata, operator/session context | Command log/status, transient command queue | Mutate graph directly, emit completed-change events before reducers accept a command, execute media |
| Event Log | Ordered record of accepted graph changes and resulting revisions | Accepted transitions, graph metadata, command ids | Append-only event records | Rewrite history, store runtime media payloads, act as a renderer/executor |
| Sync Layer | Client revision observation, catch-up, resync envelopes, transport-level delivery state | Event log, current graph revision, client acknowledgements | Sync session metadata and per-client observed revision | Invent graph state, resolve conflicts without authority, make media timing decisions |
| Authority Layer | Permission checks, lock checks, revision validation, conflict decisions | Command, current graph revision, operator role, locks, session authority | Authority decisions, conflict records | Execute commands, mutate graph outside reducers, silently accept stale revisions |
| Orchestration Planner | Pure intent ordering, dependency resolution, frame-plan derivation, planning diagnostics | Graph-derived intents, event-derived revisions, subsystem snapshots, MediaClock tick | In-memory planner queue/diagnostics only | Import adapters, call renderer/audio/video/output runtime methods, perform side effects, mutate Production Graph |
| Media Execution Engine | Dispatch of media frame plans to runtime subsystems and adapters | Media frame plans, runtime capability snapshots, adapter status | Runtime execution state, execution observations, retry/backpressure state | Plan graph intent ordering, mutate Production Graph directly, become a clock owner |
| Scene Compositor | Composition instructions and render-target preparation for scenes | Frame plan render batch, graph-derived scene/source descriptors, renderer capabilities | Runtime composition buffers and compositor diagnostics | Persist DOM/canvas/runtime refs in graph, choose authoritative scene state, own broadcast clock |
| Video Router | Runtime video route activation and source switching | Frame plan video batch, graph-derived route intent, media source registry | Runtime video routing handles and route health | Store video frames or `MediaStream` in graph, mutate route intent directly, own broadcast clock |
| Audio Router | Runtime audio route activation, mix execution, metering | Frame plan audio batch, graph-derived audio intent, media source registry | Runtime audio nodes/meters and route health | Store audio samples/nodes in graph, mutate authoritative mix state directly, own broadcast clock |
| Output Engine | Runtime streaming/recording/destination execution | Frame plan output batch, graph-derived destination intent, encoded runtime availability | Output adapter state, destination telemetry, retry state | Store encoded packets in graph, mark durable output intent changed without command/event flow, own broadcast clock |
| Browser Renderer | Browser-visible rendering, preview/program surfaces, DOM/canvas/WebGL execution | Frame plan render batch, graph-derived view models, runtime media handles | DOM, canvas, WebGL, preview/program runtime state | Persist DOM elements or canvas refs in graph, mutate authoritative production state, own broadcast clock |
| Diagnostics | Read-only inspection, logs, metrics, traces, boundary events | Graph snapshots, command/event metadata, planner diagnostics, execution observations, sync state | Diagnostic buffers, logs, metrics, traces | Mutate Production Graph, accept commands implicitly, hide side effects behind inspectors |

## 3. Mutability Rules

### Immutable data

- Accepted events are append-only.
- Published graph revisions are immutable snapshots.
- Media frame plans are immutable once emitted for a frame tick.
- Command records are immutable after final accepted/rejected status is recorded.

### Derived data

- Orchestration intents, dependency graphs, frame plans, view models, and inspector summaries are derived data.
- Derived data may be cached only when it can be invalidated by graph revision, command/event sequence, subsystem snapshot version, or frame tick.
- Derived data must be reproducible from authoritative inputs.

### Runtime-only data

- Runtime media handles, renderer handles, DOM/canvas/WebGL objects, audio nodes, encoded packet buffers, adapter instances, socket instances, and database client instances are runtime-only.
- Runtime-only values may live in execution subsystems, adapters, renderers, registries, or diagnostics buffers.
- Runtime-only values must be referenced from graph-derived descriptors by stable ids, never embedded into the Production Graph.

### Forbidden persisted data

The following values must never be stored inside the Production Graph, graph snapshots, commands, events, persisted sync records, or persisted planner artifacts:

- `MediaStream`
- video frames
- audio samples
- encoded packets
- DOM elements
- canvas refs
- adapter instances

The graph may store stable identifiers, declarative source descriptors, route intent, destination configuration, and operator-visible status derived through command/event flow.

## 4. Determinism Rules

- Same graph + same command + same revision = same event result.
- Same intent set + same clock tick = same frame plan.
- The planner must be pure: it may sort, validate, derive, and report diagnostics, but it must not perform runtime side effects.
- Execution may have side effects: opening media devices, drawing frames, writing to encoders, connecting outputs, and updating runtime registries are execution responsibilities.
- Diagnostics must not mutate production state. Diagnostic events may describe boundary crossings, conflicts, timings, or failures, but they cannot become authoritative changes without command/event conversion.

## 5. Planner / Executor Boundary

- `OrchestrationEngine` only plans.
- `MediaExecutionEngine` only executes.
- The planner cannot import adapters.
- The planner cannot call renderer, audio, video, or output runtime methods.
- Execution cannot mutate the Production Graph directly.
- Execution feedback that should affect production state must be converted into a command, evaluated by authority/revision rules, reduced into a graph transition, and appended as an event.
- Planner diagnostics may include conflicts, skipped intents, dependency cycles, and late intent decisions, but planner diagnostics are not execution results.

## 6. Timing Boundary

- `MediaClock` owns frame timing.
- `FrameScheduler` owns tick dispatch.
- Rendering and output execution should align to frame ticks produced by `MediaClock` and dispatched by `FrameScheduler`.
- Late intents move to the next eligible frame.
- No subsystem owns its own broadcast clock.
- Subsystems may keep local monotonic timers for measurement, timeout, retry, or diagnostics, but those timers do not define broadcast frame time.

## 7. Failure Rules

| Failure | Required behavior |
| --- | --- |
| Command rejected | Return a rejection with reason; do not mutate graph; do not append a completed-change event; emit diagnostic/authority conflict when applicable. |
| Revision mismatch | Reject command against current graph revision; include expected/current revision; client must resync before retrying or issue a new command against the current revision. |
| Planner conflict | Keep graph unchanged; include conflict in planner diagnostics; skip, defer, or deterministically order affected intents according to planner rules. |
| Execution failure | Keep graph unchanged; record runtime observation; retry/defer according to execution policy; convert operator-visible durable changes into commands if needed. |
| Renderer unavailable | Do not mutate graph; mark renderer runtime status unavailable in diagnostics; execution may defer render batch or use a safe fallback output if configured. |
| Missing media source | Do not embed replacement media in graph; mark source unavailable at runtime; execution may skip/defer affected steps; durable source status changes require command/event flow. |
| DB unavailable | Do not invent revisions; reject or queue persistence-dependent commands according to product policy; surface degraded persistence diagnostics; resume from latest valid snapshot/event log when available. |
| WebSocket unavailable | Continue local authoritative graph rules; mark sync transport degraded; clients must reconnect and resync from observed revision; do not use transport state as graph authority. |

## 8. Sync Rules

- Graph revisions are strictly ordered and monotonically increasing for accepted graph transitions.
- Every client tracks an observed revision.
- Accepted command ordering is determined by the command bus and authority/revision checks against the current graph revision.
- Commands with stale expected revisions must be rejected or explicitly transformed by a future conflict-resolution contract; silent merging is forbidden.
- Clients that miss revisions must request catch-up from their last observed revision.
- If catch-up cannot be satisfied from available events, the client must receive or request a fresh graph snapshot and resume from that snapshot revision.
- Sync envelopes may report transport delivery and acknowledgement state, but transport order does not override graph revision order.

## 9. Observability Rules

- Every critical boundary should emit diagnostic events: command intake, authority decision, graph transition, event append, sync publish/ack, planner enqueue, frame plan emit, execution dispatch, subsystem completion/failure, renderer/output availability, and resync.
- Logs, metrics, and traces must not change production state.
- Inspectors are read-only unless explicitly marked developer controls.
- Developer controls that can mutate state must send commands through the normal command bus and authority flow.
- Diagnostic payloads must avoid runtime media payloads and should prefer ids, revisions, timestamps, durations, counts, statuses, and error codes.

## 10. Versioning Rules

The current contract version is **UBOS Execution Contract v1**.

Future phases may define separate versioned contracts for:

- Production Graph schema
- Command schema
- Event schema
- Sync protocol
- Media execution intents
- Output plans

A future contract version must state compatibility, migration expectations, and the exact boundary changes it introduces.

## 11. Enforcement Helpers

Lightweight enforcement helpers should remain narrow and low-risk. They are intended for tests, development assertions, and boundary documentation rather than a new framework:

- `assertPlannerBoundary()` verifies planner modules do not receive runtime executor/adapters/renderers.
- `assertNoRuntimeMediaInGraph()` rejects forbidden runtime media keys and runtime-shaped values in graph-like data.
- `assertFramePlanDeterministicShape()` verifies a frame plan exposes stable ids, revisions, timestamps, and ordered step arrays without runtime handles.
- `assertRuntimeOnlyValue()` documents and validates values that must stay outside persisted graph/command/event data.

These helpers must not replace architectural review. They should fail fast in development and tests when a future phase attempts to cross a contract boundary.

## 12. Contract Summary

UBOS must preserve a clean separation between authoritative state and runtime execution. The graph describes what production should be. Commands request authoritative changes. Events record accepted changes. The planner deterministically derives frame work. The executor performs side effects. Subsystems, renderers, and outputs handle runtime media. Diagnostics observe everything but govern nothing.
