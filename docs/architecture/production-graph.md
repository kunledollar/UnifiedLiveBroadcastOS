# Production Graph Foundation

UBOS evolves as a broadcast operating system. Operators, AI agents, automation macros, plugins, control surfaces, and future media executors must interact through Broadcast Sessions, the Production Graph, typed Commands, append-only Events, selectors, permission checks, and execution adapters.

The Production Graph is the canonical state model for broadcast state. It stores stable IDs, metadata, scene/source/guest/destination/audio/recording/health/workspace/plugin state, and version fields (`graphVersion`, `schemaVersion`, `createdAt`, `updatedAt`). It does **not** store video frames, audio samples, encoded packets, WebRTC objects, RTMP handles, OBS objects, NDI/SRT objects, or platform SDK objects.

## BroadcastSession

The local `ProductionBroadcastSession` root contains `id`, `name`, lifecycle status (`idle`, `rehearsal`, `live`, `ended`), timestamps, runtime, the active operator, the current graph, a command log, an event log, and metadata. It is in-memory for Phase 4.5 and is the future collaboration root for Phase 5.

## Command Flow

UI intent is represented as immutable `ProductionCommand` objects: `CREATE_SCENE`, `SET_PREVIEW_SCENE`, `CUT_TO_PROGRAM`, `TAKE_PREVIEW`, `SET_TRANSITION`, `SET_TRANSITION_DURATION`, source, guest, audio, destination, recording, broadcast, health, workspace, and agent suggestion commands. Commands include ID, type, broadcast session ID, actor ID, actor role, timestamp, payload, optional correlation ID, and metadata.

The local dispatcher validates command shape and permissions, calls the pure reducer, updates the local session graph, appends accepted commands, appends events, and hands accepted transitions to the production engine. There is no networking, persistence, collaboration sync, or media execution.

## Event Flow

`ProductionEvent` records what happened after a command: graph/session initialization, scene/source/guest/audio/destination/recording/broadcast/health/workspace/agent suggestion changes, transition completion, and `COMMAND_REJECTED`. Events are append-only and are not updated or deleted. The in-memory event log can append, list, filter by session, and clear session events until Postgres or an event store replaces it.

## Reducer Rules

`applyProductionCommand(graph, command)` is deterministic, side-effect free, immutable, and only transforms graph state. It has no DOM, browser API, database, network, WebRTC, media processing, or platform API access. It returns previous graph, next graph, accepted flag, events, errors, and the command.

## Permission Model

Roles are `OWNER`, `ADMIN`, `DIRECTOR`, `PRODUCER`, `TECHNICAL_DIRECTOR`, `AUDIO_ENGINEER`, `GRAPHICS_OPERATOR`, `GUEST_MANAGER`, `MODERATOR`, `VIEWER`, and `AI_AGENT`. Viewers cannot mutate the graph. Moderators cannot cut, take, or stop broadcast. Audio engineers can change audio only. Guest managers can add/update/remove/mute/unmute/pin guests. Technical directors can switch scenes and transitions. Directors can cut, take, start/stop broadcast, and manage recording. AI agents can create suggestions but cannot directly start/stop broadcast. Unauthorized commands emit `COMMAND_REJECTED`.

## Selectors

Selectors hide graph internals from UI: broadcast status, program/preview scene, scenes and sources, scene sources, guests and on-air guests, destinations and enabled destinations, audio channels, recording, health, agent suggestions, operators, canvases, workspace, tally, and command executability.

## Boundaries

The Production Engine interprets accepted graph transitions and forwards them to adapters. The mock media execution adapter records debug render state for program/vertical preview, destinations, and audio mix; it does not process media or touch WebRTC, RTMP, OBS, NDI, SRT, or MediaMTX. The mock agent adapter observes transitions and returns suggestion commands without mutating the graph directly.

## Plugin Contracts

Contracts exist for destination, media source, automation, AI, analytics, and control surface plugins. Each declares ID, name, version, capabilities, emitted commands, consumed events, and optional lifecycle hooks. There is no plugin runtime in this phase.

## Inspector

The Control Room includes a developer-only **Production Graph Inspector** gated by `NEXT_PUBLIC_UBOS_GRAPH_INSPECTOR=true`. It shows broadcast status, graph and schema version, program/preview IDs, counts for scenes/sources/guests/destinations/audio, recording status, health summary, command/event counts, and latest commands/events.

## Example

A scene click dispatches `SET_PREVIEW_SCENE`; the reducer writes `preview.sceneId` and emits `PREVIEW_SCENE_CHANGED`. CUT dispatches `CUT_TO_PROGRAM`; TAKE dispatches `TAKE_PREVIEW`. Transition controls dispatch `SET_TRANSITION` and `SET_TRANSITION_DURATION`.

## Future Plan

Phase 5 can add collaboration and durable event storage behind the dispatcher. Phase 6 can connect real media adapters while preserving the reducer boundary. Phase 7 can add plugin runtime, automation scheduling, and agent orchestration that emit commands instead of mutating state directly.
