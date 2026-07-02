# Media Orchestration Engine

Phase 7.0.1 defines the Media Orchestration Engine as UBOS's deterministic planning layer between media intents and the Media Execution Plane. It is a pure decision system, not a renderer, transport, decoder, persistence layer, adapter, or executor.

## Orchestration Model

The orchestration model centers on a read-only `MediaIntentGraph`, a `MediaClock` tick, and a read-only subsystem state snapshot. Each `MediaIntent` normalizes requests into one of five subsystem classes:

- `video` for video route planning and activation.
- `audio` for audio route and mix operations.
- `render` for scene composition, browser rendering, and frame render operations.
- `output` for stream, recording, and destination operations.
- `sync` for clock/frame synchronization operations.

Each intent carries an id, source graph revision, dependencies, deterministic priority, target subsystem, immutable payload, and timing constraint. The graph stores read-only dependency edges from prerequisite intent ids to dependent intent ids.

## Frame Planning System

`MediaFramePlan` is the only frame-level contract produced by orchestration. It contains the aligned frame timestamp, ordered execution steps, and subsystem batches for video, audio, render, output, and sync work. Planning is stable: identical intent graphs, graph revisions, dependencies, priorities, frame ticks, and subsystem snapshots produce the same frame plan.

The deterministic ordering rules are:

1. Higher priority first.
2. Lower source graph revision first.
3. Target subsystem lexical order as a stable tie breaker.
4. Intent id lexical order as the final tie breaker.

## Dependency Resolution

The engine builds a dependency graph for the current queue, topologically sorts intents, detects circular dependencies, and records conflicts without mutating the intent graph. Priority and timestamp conflicts are diagnostic only. Cycles are never silent; they emit orchestration conflict events and remain visible in diagnostics.

## Planning and Execution Boundary

Orchestration never imports `MediaExecutionEngine`, renderer adapters, audio adapters, video adapters, output adapters, or subsystem implementations. It exposes planning contracts only and may depend on a narrow `MediaExecutionPort` type for boundary documentation:

- `submitVideoOps(plan)`
- `submitAudioOps(plan)`
- `submitRenderOps(plan)`
- `submitOutputOps(plan)`
- `getSubsystemState()`

The execution engine implements that port and is responsible for dispatching a `MediaFramePlan` to adapters. Orchestration remains planner-only; execution remains executor-only.

## MediaClock Integration

The orchestration engine plans work only against MediaClock frame timestamps. Late intents are moved to the next available frame by planning against the current clock frame timestamp. Early intents remain queued until their `earliestFrameTimestamp` or requested frame timestamp is eligible. Frame execution is performed elsewhere by the execution plane.

## Execution Lifecycle

1. The Media Execution Plane translates graph transitions into execution intents.
2. Execution intents are normalized into media intents and submitted to the orchestration queue.
3. The engine resolves dependencies and diagnostics.
4. The engine creates a `MediaFramePlan` for a frame timestamp.
5. The execution plane dispatches the plan's ordered steps and subsystem batches.
6. Execution results stay in the execution layer; orchestration diagnostics remain planning-only.

## Diagnostics

The Control Room inspector exposes active intents, active frame plans, dependency edge counts, conflicts, subsystem state snapshots, frame alignment status, and queued intent counts. These diagnostics are read-only and backed by in-memory orchestration state.

## Future Real-Time Scaling Plan

Future phases can add real subsystem-specific schedulers inside the execution plane, add bounded per-subsystem execution budgets, introduce backpressure policies for overloaded outputs, and distribute frame plans across workers. The deterministic intent graph and frame plan should remain the stable coordination boundary.
