# Distributed Synchronization Foundation

Phase 5.2 defines UBOS's transport-agnostic synchronization layer for collaborative broadcast control. It is intentionally local-only: there are no WebSockets, databases, authentication changes, or multi-user backend dependencies in this phase.

## Sync model

A `SyncSession` binds a collaborative broadcast session to a production graph through `broadcastSessionId`, `productionGraphId`, and `currentGraphRevision`. Each `SyncClient`/`SyncPeer` tracks `clientId`, `operatorId`, `observedGraphRevision`, connection state, heartbeat time, revision lag, and recovery state.

## Message envelope

Every `SyncMessage` is carried in a `SyncEnvelope` with an id, message type, sync session id, broadcast session id, client id, operator id, timestamp, graph revision, optional correlation id, payload, and optional metadata. The envelope is transport-neutral so future WebSocket, worker, or server transports can carry the same protocol.

## Message types

The protocol includes joins, leaves, heartbeats, session state requests/responses, graph revision requests/responses, command submission outcomes, event batches, revision acknowledgements, behind/resync notices, presence/activity updates, lock messages, and sync errors.

## Command submit flow

A client submits `COMMAND_SUBMIT` with a `ProductionCommand` and `expectedRevision`. The local `SyncCoordinator` validates the joined client and revision before dispatching to the existing `LocalProductionCommandDispatcher`. Accepted commands emit `COMMAND_ACCEPTED` and `EVENTS_BATCH`. Rejected commands emit `COMMAND_REJECTED` with deterministic error details.

## Revision acknowledgement flow

Clients acknowledge observed graph revisions with `REVISION_ACK`. Helpers create and apply acknowledgements, calculate lag, list clients behind the current graph revision, determine whether a client is synced, and mark a client synced when its observed revision equals the session current revision.

## Catch-up protocol

When a client is behind, the coordinator identifies the missing revision range and attempts to return production events from local history. If event history cannot satisfy the range, the coordinator returns `CLIENT_RESYNC_REQUIRED`. Snapshot fallback is deliberately not implemented yet, but the message shape prepares for that future path.

## Heartbeat and staleness

Heartbeats update each client's `lastHeartbeatAt`, `observedGraphRevision`, connection state, recovery state, and revision lag. Staleness is derived from local time and a configurable timeout. No socket-level ping/pong behavior exists in this phase.

## Conflict handling

The sync layer relies on Production Graph optimistic concurrency. A stale `expectedRevision` is rejected before dispatch when detected locally, emits `COMMAND_REJECTED` with `REVISION_MISMATCH`, and also emits `CLIENT_BEHIND`. Dispatcher-level validation errors are forwarded in the same reject path.

## Local transport

`SyncTransport` defines `connect()`, `disconnect()`, `send()`, `subscribe()`, and `getState()`. `LocalSyncTransport` implements the interface with in-memory subscribers and a sent-message log for diagnostics and tests.

## Diagnostics and mock scenario

The Control Room exposes a compact developer-only Sync Diagnostics panel behind `NEXT_PUBLIC_ENABLE_SYNC_DIAGNOSTICS=true` in the Tools menu. It uses a mock scenario with a synced Director, one-revision-behind Producer, synced Audio client, and reconnecting Graphics client.

## Future WebSocket transport plan

A future server transport should preserve the same envelope and message types, map `clientId` to authenticated connections, relay event batches from authoritative server state, and keep the local coordinator API as a simulation/test harness.

## Future persistence and snapshot plan

Persistence should store command logs, event logs, client acknowledgements, and periodic production graph snapshots. Snapshot recovery should answer `CLIENT_RESYNC_REQUIRED` by returning a graph snapshot plus event tail when event history alone is insufficient.

## Known limitations

- Local memory only; reloads lose sync state.
- No real network transport.
- No authorization or identity changes.
- No automatic conflict resolution.
- No graph snapshots.
- Diagnostics are demo-oriented and gated by an environment flag.
