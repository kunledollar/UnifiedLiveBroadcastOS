# Media Orchestration Engine

Phase 7.0 introduces the Media Orchestration Engine as UBOS's deterministic runtime coordinator between the Media Execution Plane and media subsystems. It is a decision and coordination layer, not a renderer, transport, decoder, or persistence layer.

## Orchestration Model

The orchestration model centers on a `MediaIntentGraph`. Each `MediaIntent` normalizes execution-plane requests into one of five subsystem classes:

- `video` for video route planning and activation.
- `audio` for audio route and mix operations.
- `render` for scene composition, browser rendering, and frame render operations.
- `output` for stream, recording, and destination operations.
- `sync` for clock/frame synchronization operations.

Each intent carries an id, source graph revision, dependencies, deterministic priority, target subsystem, immutable payload, and timing constraint. The graph stores read-only dependency edges from prerequisite intent ids to dependent intent ids.

## Frame Planning System

`MediaFramePlan` is the frame-level contract produced by orchestration. It contains the aligned frame timestamp, ordered execution steps, and subsystem batches for video, audio, render, output, and sync work. Planning is stable: identical queued intents, graph revisions, dependencies, priorities, and frame timestamps produce the same step order.

The deterministic ordering rules are:

1. Higher priority first.
2. Lower source graph revision first.
3. Target subsystem lexical order as a stable tie breaker.
4. Intent id lexical order as the final tie breaker.

## Dependency Resolution

The engine builds a dependency graph for the current queue, topologically sorts intents, detects circular dependencies, and records conflicts without mutating the intent graph. Priority and timestamp conflicts are diagnostic only. Cycles are never silent; they emit orchestration conflict events and remain visible in diagnostics.

## Subsystem Coordination

Lightweight subsystem adapters expose the common interface:

- `canExecute(intent)`
- `validate(intent)`
- `execute(intent)`

The current adapters are `VideoExecutionCoordinator`, `AudioExecutionCoordinator`, `RenderExecutionCoordinator`, and `OutputExecutionCoordinator`. They coordinate orchestration decisions only and do not introduce media decoding, rendering, routing, or transport behavior.

## MediaClock Integration

The orchestration engine plans work only against MediaClock frame timestamps. Late intents are moved to the next available frame by planning against the current clock frame timestamp. Early intents remain queued until their `earliestFrameTimestamp` or requested frame timestamp is eligible. Frame execution is therefore explicit and synchronized.

## Execution Lifecycle

1. The Media Execution Plane translates graph transitions into execution intents.
2. Execution intents are normalized into media intents and submitted to the orchestration queue.
3. The engine resolves dependencies and diagnostics.
4. The engine creates a `MediaFramePlan` for a frame timestamp.
5. The execution plane dispatches ordered steps while orchestration coordinators simulate subsystem execution in mock mode.
6. The engine reconciles in-memory subsystem state and emits frame completion diagnostics.

## Mock Orchestration Mode

`MOCK_ORCHESTRATION_MODE` is enabled for deterministic testing. In this mode, subsystem coordinators log simulated execution responses and never touch real renderer, audio, video, or output logic. The existing media adapters remain responsible for their own mock-safe behavior.

## Diagnostics

The Control Room inspector exposes active intents, active frame plans, dependency edge counts, conflicts, subsystem state snapshots, frame alignment status, and queued intent counts. These diagnostics are read-only and backed by in-memory orchestration state.

## Future Real-Time Scaling Plan

Future phases can replace mock coordinator execution with real subsystem-specific schedulers, add bounded per-subsystem execution budgets, introduce backpressure policies for overloaded outputs, and distribute frame plans across workers. The deterministic intent graph and frame plan should remain the stable coordination boundary.
