# Production Media Runtime

Phase 9.0 introduces a supervised Production Media Runtime that connects existing UBOS media runtime foundations without adding a new media implementation layer. It coordinates metadata and lifecycle state for recording, streaming, encoder, FFmpeg, WebRTC, browser renderer, GPU, output, routing, and compositor subsystems.

## Relationship to Prior Phases

The runtime builds on the Production Graph, Media Execution Engine, Orchestrator, Timing Contract, Failure Model, Backpressure Model, Replay Model, Output Engine, Recording Runtime, Streaming Runtime, Encoder Layer, FFmpeg Runtime, WebRTC Runtime, Browser Renderer Runtime, and GPU Runtime. It does not replace them and does not mutate the Production Graph.

## Runtime Supervisor Model

`RuntimeSupervisor` owns a `ProductionRuntime` metadata object and a registry of `RuntimeSubsystem` snapshots. Subsystems report lifecycle state, health, degraded modes, frame id, graph revision, and redacted diagnostics. Runtime handles, streams, frames, packets, DOM nodes, GPU handles, and FFmpeg process objects are never stored in runtime manifests or graph state.

## Subsystem Lifecycle

Runtime states are `idle`, `preparing`, `ready`, `running`, `degraded`, `recovering`, `stopping`, `stopped`, `failed`, and `unavailable`. Subsystem process states include matching lifecycle states plus `paused` and `unregistered`. Required unavailable or failed subsystems move the runtime to unavailable or failed; optional subsystem failures degrade the runtime.

## Failure Handling

`mapRuntimeFailure()` converts runtime failures to UBOS Failure Model records. The supervisor reports failures through execution results and diagnostics only. It does not retry graph commands and does not directly mutate graph state.

## Backpressure Handling

Backpressure is represented as degraded subsystem health and degraded modes such as diagnostics-only or output-disabled behavior. Runtime supervision can isolate or restart a subsystem, but it does not buffer media payloads or store media data.

## Replay Behavior

Runtime manifests are compact, deterministic metadata summaries suitable for replay comparison. Replay can assert runtime state, subsystem availability, frame id, graph revision, failure category, and degraded mode without requiring runtime handles or media payloads.

## Diagnostics

The Media Execution Inspector surfaces runtime state, active subsystems, subsystem health, recording, streaming, encoder, FFmpeg, WebRTC, browser renderer, GPU status, degraded modes, latest failure, latest frame id, and latest graph revision.

## Limitations

This phase does not introduce real encoding, streaming, recording, GPU composition, WebRTC transport, or browser rendering behavior. It only supervises existing runtime foundations through metadata contracts.

## Future Production Execution Phases

Future phases can connect concrete process managers, device discovery, health heartbeats, restart policies, operator controls, and production-safe execution workers while preserving the Production Graph boundary and runtime-handle redaction rules.
