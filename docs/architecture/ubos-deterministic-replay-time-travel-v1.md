# UBOS Deterministic Replay & Time-Travel Architecture v1

Phase 7.5 defines the deterministic replay foundation for audit, timeline reconstruction, graph time-travel, dry-run diagnostics, and plan comparison. It does **not** implement recording, streaming, media frame capture, or pixel rendering.

## Purpose

Replay lets UBOS rebuild explainable production history from deterministic metadata. Operators and developers can inspect what happened, why a command was accepted or rejected, which graph revision existed at a time, and whether planning metadata diverged from an expected shape.

## Replayable State and Sources

Replay may use only serializable, deterministic metadata:

- Production Graph snapshots and references.
- Production commands and command sequence metadata.
- Production events and graph revision metadata.
- MediaFramePlans and deterministic frame-plan shape metadata.
- Orchestration plans.
- Timing tick metadata.
- Failure records and recovery decisions.
- Queue pressure summaries.
- Execution result metadata from dry-run planning.

## Non-Replayable Runtime Data

Replay state must never store or retain:

- `MediaStream` or `MediaStreamTrack` objects.
- Raw video frames, `VideoFrame`, raw audio samples, or `AudioData`.
- Encoded video/audio packets.
- DOM elements, canvas contexts, WebGL contexts, or canvas refs.
- Adapter instances, renderer instances, browser device handles, `RTCPeerConnection`, or browser output handles.

## Graph Reconstruction Model

Graph reconstruction starts from an immutable replay checkpoint, clones or otherwise isolates its graph snapshot, then applies deterministic commands or validates deterministic events until a target revision is reached. Replay must never mutate the live Production Graph, session dispatcher, media engine, or adapter-owned runtime state. Invalid replay returns structured validation or reconstruction errors rather than throwing.

## Command Replay

Command replay re-applies accepted Production commands to an isolated graph clone. Commands are ordered by their recorded sequence/timestamp and must preserve revision expectations. Rejected commands are retained for audit but do not advance graph state.

## Event Replay

Event replay validates revision continuity and reconstructs a timeline of facts. Events are authoritative audit records, but event replay in this phase is lightweight and does not synthesize live runtime side effects.

## Frame Plan Replay

Frame plan replay compares deterministic frame metadata only: frame identity, frame timestamp, graph revision, planner revision, and stable ordered plan shape. It does not render pixels or read media frames.

## Execution Replay

Dry-run execution replay may re-run or compare planning metadata, but it must not call adapters, browser renderers, outputs, network transports, recording, streaming, or live MediaStreams. Execution replay is read-only and diagnostic.

## Checkpoint Strategy

Checkpoints are sparse anchors in the replay timeline. A checkpoint may contain a graph snapshot reference, graph revision, frameId, command sequence number, event sequence number, timestamp, and metadata. Checkpoints must not contain raw media or runtime handles. Replay selects the nearest checkpoint at or before the requested revision/cursor.

## Snapshot Strategy

Snapshots are immutable graph-state captures or references. Snapshots may be persisted by the Persistence Model, but they contain only replayable graph metadata and serializable application state. Runtime media remains outside snapshots.

## Audit Requirements

Replay audit trails must summarize:

- Who issued a command.
- When the command was issued.
- Accepted or rejected status.
- Graph revision before and after.
- FrameId where applicable.
- Authority decision where applicable.
- Failure and recovery records where applicable.

## Safety Rules

Replay is read-only. Replay never mutates live state, calls adapters, sends network messages, starts or stops outputs, records, streams, accesses live MediaStreams, captures browser devices, stores raw media, or renders pixels.

## Diagnostics

Developer-only replay diagnostics may show compact metadata: replayable command count, replayable event count, checkpoint count, latest graph revision, latest frameId, detected replay gaps, and non-replayable payload warnings. This phase does not redesign Control Room or add large UI surfaces.

## Relationship to Other UBOS Models

- **Execution Contract:** replay consumes deterministic execution metadata and inherits the ban on runtime media in graph/plan state.
- **Timing Contract:** replay uses timing tick metadata and frame timestamps to order frame-level diagnostics.
- **Failure Model:** replay includes failure records and recovery decisions as audit facts, not runtime re-execution.
- **Backpressure Model:** replay includes queue pressure summaries to explain dropped, delayed, or degraded work.
- **Persistence Model:** replay checkpoints and snapshots are persistence-friendly serializable records; runtime media is excluded.
