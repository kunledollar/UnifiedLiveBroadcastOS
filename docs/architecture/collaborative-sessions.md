# Collaborative Broadcast Sessions

Phase 5.1 introduces the local-only collaboration foundation for UBOS. It prepares multiple operators to work on the same live production through the Production Graph without adding WebSockets, persistence, authentication changes, or a real multi-user backend.

## Collaboration Session Model

A `CollaborationSession` is scoped to one broadcast session and one Production Graph. It tracks the session ID, broadcast session ID, graph ID, current graph revision, session name, status (`offline`, `rehearsal`, `live`, `ended`), operators, active operator IDs, timestamps, and metadata.

A `CollaborationOperator` represents a human operator in the shared control room. Operators include identity, display name, collaboration role, presence, connection state, current activity, current panel, last seen timestamp, color, initials, observed graph revision, optional cursor, and metadata.

## Presence Model

Presence is intentionally transport-agnostic. Supported states are `online`, `idle`, `away`, `offline`, and `reconnecting`. The in-memory store updates presence locally today; a future realtime service can map socket heartbeats and reconnect attempts into the same states.

## Operator Activity Model

Activity describes what an operator is doing at the application level: `viewing`, `switching`, `editing_scene`, `managing_guests`, `adjusting_audio`, `editing_graphics`, `monitoring_health`, `viewing_multiview`, or `idle`. Activity is separate from permissions and does not imply command authority.

## Collaboration Events

Collaboration events are separate from Production Graph events. They describe team behavior and sync state, including operator joins/leaves, presence updates, activity changes, panel changes, reconnecting/reconnected states, graph revision sync/lag, command broadcasts, revision rejections, and session lock/unlock markers.

## Revision Synchronization Model

The collaboration session mirrors the Production Graph revision in `currentGraphRevision`. Each operator tracks `observedGraphRevision`. Helpers determine whether an operator is behind, calculate revision lag, list behind operators, and mark an operator synced. These helpers use the existing graph revision model rather than inventing another version counter.

## Command Broadcast Flow

`LocalCollaborationCommandBus` is a local abstraction for future broadcast command fan-out:

1. Accept a `ProductionCommand`.
2. Attach `expectedRevision` from the collaboration session when missing.
3. Append a `COMMAND_BROADCAST` collaboration event.
4. Dispatch through the existing `LocalProductionCommandDispatcher`.
5. Update `currentGraphRevision` from the resulting Production Graph.
6. Append `COMMAND_REJECTED_BY_REVISION` if the dispatcher rejects the command with `REVISION_MISMATCH`.

No WebSocket, server, database, or persistence layer is involved in Phase 5.1.

## Relationship to the Production Graph

Collaboration is an orchestration layer around the Production Graph. Production state still changes only through Production Graph commands, reducers, permission checks, events, and revisions. Collaboration roles map directly to existing `OperatorRole` values, and command permission checks call the existing Production Graph permission helpers.

## Future WebSocket / Server Synchronization Plan

A future realtime service can replace the local in-memory store event fan-out with server-mediated rooms keyed by broadcast session ID. The event model is designed so WebSocket messages can carry collaboration events, command broadcast intents, operator heartbeats, panel changes, and revision synchronization notifications without changing Production Graph command semantics.

## Future Persistence Plan

A future persistence layer can store collaboration session metadata, operator snapshots, and selected collaboration events for audit and reconnect recovery. High-volume ephemeral signals such as cursors and heartbeat-derived presence should remain transient or be sampled rather than stored as canonical production history.

## Known Limitations

- Local memory only; page reloads reset collaboration state.
- Mock operators are seeded for demonstration and validation.
- No real authentication or identity binding.
- No WebSocket room membership, heartbeat protocol, or reconnect recovery.
- No durable event store for collaboration events.
- No locking enforcement beyond placeholder event types.
