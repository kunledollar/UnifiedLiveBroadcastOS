# Production Graph Foundation

UBOS evolves as a broadcast operating system. Operators, AI agents, automation macros, plugins, control surfaces, and future media executors interact through Broadcast Sessions, the Production Graph, typed Commands, append-only Events, selectors, permission checks, and execution adapters.

The Production Graph is the canonical state model for broadcast state. It stores stable IDs, metadata, scene/source/guest/destination/audio/recording/health/workspace/plugin state, and compatibility version fields (`graphVersion`, `schemaVersion`, `createdAt`, `updatedAt`). It does **not** store video frames, audio samples, encoded packets, WebRTC objects, RTMP handles, OBS objects, NDI/SRT objects, platform SDK objects, or collaboration transport state.

## BroadcastSession

The local `ProductionBroadcastSession` root contains `id`, `name`, lifecycle status (`idle`, `rehearsal`, `live`, `ended`), timestamps, runtime, the active operator, the current graph, a command log, an event log, and metadata. It is in-memory for this foundation phase and remains the future collaboration root for Phase 5.

## Graph Metadata

Every `ProductionGraph` owns exactly one `metadata` object with `graphId`, `revision`, `createdAt`, and `updatedAt`.

- `graphId` is the stable identity of the graph and matches the graph root `id` for backward compatibility.
- `revision` starts at `0` when a graph is initialized.
- `createdAt` is immutable after graph creation.
- `updatedAt` changes only after a successful state transition.
- `graphVersion` is retained as a compatibility field and mirrors the current metadata revision.

Graph metadata is part of the canonical graph state. Commands and clients may read it, but only the reducer may produce the next revision and updated timestamp.

## Revision Tracking

Revisions provide deterministic ordering for graph transitions. An accepted command advances the graph by exactly one revision: revision `18` plus an accepted command produces revision `19`. A rejected command preserves the current revision: revision `18` plus a rejected command remains revision `18`.

The reducer must use the previous graph revision as the only source of truth. Commands must never directly set the next revision. Revisions never skip, decrement, or accept manual edits. This makes graph history auditable and prepares the graph for future incremental synchronization and replay.

## Command Flow

UI intent is represented as immutable `ProductionCommand` objects: `CREATE_SCENE`, `SET_PREVIEW_SCENE`, `CUT_TO_PROGRAM`, `TAKE_PREVIEW`, `SET_TRANSITION`, `SET_TRANSITION_DURATION`, source, guest, audio, destination, recording, broadcast, health, workspace, and agent suggestion commands. Commands include ID, type, broadcast session ID, actor ID, actor role, timestamp, payload, optional correlation ID, optional `expectedRevision`, and metadata.

The local dispatcher validates command shape and permissions, calls the pure reducer, updates the local session graph, appends accepted commands, appends events, and hands accepted transitions to the production engine. It also assigns a monotonic in-memory command sequence number for local diagnostics. There is no networking, persistence, collaboration sync, or media execution.

## Optimistic Concurrency

`expectedRevision` means “the sender believes the graph currently has this revision.” It is optional for backward compatibility, so existing single-operator commands continue to work unchanged.

When `expectedRevision` is present and matches `graph.metadata.revision`, the reducer can continue normal validation. When it differs, the reducer rejects the command without throwing and returns a deterministic `REVISION_MISMATCH` validation error containing the command ID, expected revision, current revision, and message. Revision mismatch rejection never mutates graph state and never increments the graph revision.

This is optimistic concurrency only. It detects conflicts for future collaborative clients, but it does not implement conflict resolution, networking, WebSockets, CRDTs, or a synchronization protocol.

## Event Flow

`ProductionEvent` records what happened after a command: graph/session initialization, scene/source/guest/audio/destination/recording/broadcast/health/workspace/agent suggestion changes, transition completion, and `COMMAND_REJECTED`. Events are append-only and are not updated or deleted. Every event includes `graphRevision`, `previousRevision`, and `nextRevision` for future reconstruction of graph history.

For accepted commands, event revision metadata records the previous and next graph revisions. `COMMAND_REJECTED` events include the current graph revision as both `previousRevision` and `nextRevision`. The in-memory event log can append, list, filter by session, and clear session events until Postgres or an event store replaces it.

## Reducer Rules

`applyProductionCommand(graph, command)` is deterministic, side-effect free, immutable, and only transforms graph state. It has no DOM, browser API, localStorage, database, network, WebRTC, media processing, or platform API access. It returns previous graph, next graph, previous revision, next revision, accepted flag, generated events, validation errors, error strings, and the command.

Rejected commands return the original graph as both `previousGraph` and `nextGraph`. Accepted commands return a new graph with exactly one revision increment and an updated metadata timestamp derived from the command timestamp.

## Command Sequencing

The local dispatcher assigns a monotonic command sequence number (`1`, `2`, `3`, …) at runtime. Command sequences are independent of command IDs and graph revisions. They exist for debugging, ordering diagnostics, and future synchronization instrumentation. They are not persisted and reset when the local runtime restarts.

## Permission Model

Roles are `OWNER`, `ADMIN`, `DIRECTOR`, `PRODUCER`, `TECHNICAL_DIRECTOR`, `AUDIO_ENGINEER`, `GRAPHICS_OPERATOR`, `GUEST_MANAGER`, `MODERATOR`, `VIEWER`, and `AI_AGENT`. Viewers cannot mutate the graph. Moderators cannot cut, take, or stop broadcast. Audio engineers can change audio only. Guest managers can add/update/remove/mute/unmute/pin guests. Technical directors can switch scenes and transitions. Directors can cut, take, start/stop broadcast, and manage recording. AI agents can create suggestions but cannot directly start/stop broadcast. Unauthorized commands emit `COMMAND_REJECTED`.

## Selectors and Utilities

Selectors hide graph internals from UI: broadcast status, program/preview scene, scenes and sources, scene sources, guests and on-air guests, destinations and enabled destinations, audio channels, recording, health, agent suggestions, operators, canvases, workspace, tally, and command executability.

Revision utilities expose pure helpers for architecture code and diagnostics: `getProductionGraphRevision()`, `getProductionGraphMetadata()`, `isGraphRevisionCurrent()`, and `createRevisionMismatchError()`.

## Boundaries

The Production Engine interprets accepted graph transitions and forwards them to adapters. The mock media execution adapter records debug render state for program/vertical preview, destinations, and audio mix; it does not process media or touch WebRTC, RTMP, OBS, NDI, SRT, or MediaMTX. The mock agent adapter observes transitions and returns suggestion commands without mutating the graph directly.

## Plugin Contracts

Contracts exist for destination, media source, automation, AI, analytics, and control surface plugins. Each declares ID, name, version, capabilities, emitted commands, consumed events, and optional lifecycle hooks. There is no plugin runtime in this phase.

## Inspector

The Control Room includes a developer-only **Production Graph Inspector** gated by `NEXT_PUBLIC_UBOS_GRAPH_INSPECTOR=true`. It shows broadcast status, graph ID, current revision, created/updated times, graph/schema version, program/preview IDs, counts for scenes/sources/guests/destinations/audio, recording status, health summary, accepted and rejected command counts, latest local command sequence, latest event revision, command/event counts, and latest commands/events.

## Example

A scene click dispatches `SET_PREVIEW_SCENE`; the reducer writes `preview.sceneId`, increments the revision by one, and emits `PREVIEW_SCENE_CHANGED` with revision metadata. CUT dispatches `CUT_TO_PROGRAM`; TAKE dispatches `TAKE_PREVIEW`. Transition controls dispatch `SET_TRANSITION` and `SET_TRANSITION_DURATION`.

## Future Distributed Synchronization

Graph revisions make future distributed synchronization possible without implementing it in this phase. A collaboration layer can compare the local revision with a remote operator’s `expectedRevision`, request only missing events, build audit history from revision-aware events, replay accepted transitions in deterministic order, and recover a client by applying incremental changes after a known revision.

Future phases may add multi-operator collaboration, durable event storage, snapshots, replay, recovery, and network synchronization behind the dispatcher. Network synchronization is **not implemented yet**.

## Future Plan

Phase 5 can add collaboration and durable event storage behind the dispatcher. Phase 6 can connect real media adapters while preserving the reducer boundary. Phase 7 can add plugin runtime, automation scheduling, and agent orchestration that emit commands instead of mutating state directly.
