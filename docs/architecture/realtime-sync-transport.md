# Phase 5.3 Real-Time Sync Transport Layer

UBOS synchronization remains transport-agnostic. The Production Graph and `SyncCoordinator` continue to exchange `SyncEnvelope` messages through the `SyncTransport` interface, so LocalSyncTransport remains the default and WebSocket sync is opt-in.

## Transport architecture

- `LocalSyncTransport` is the in-process simulation transport used by default for local mock scenarios and tests.
- `WebSocketSyncTransport` wraps `WebSocketSyncClient` and implements the same `connect`, `disconnect`, `send`, `subscribe`, and `getState` shape.
- UI components should consume diagnostics or higher-level sync adapters instead of calling browser WebSocket APIs directly.

## SyncEnvelope serialization

Shared helpers serialize and validate messages before they cross process boundaries:

- `serializeSyncEnvelope(message)` converts a validated envelope to JSON.
- `deserializeSyncEnvelope(data)` parses JSON/string or binary payloads and rejects invalid envelopes.
- `validateSyncEnvelope(value)` verifies required routing fields, message type, timestamp, revision, and payload presence.
- Invalid messages are handled by emitting or returning `SYNC_ERROR` envelopes where a transport has enough routing context.

## Server sync hub

The API server exposes a lightweight in-memory WebSocket hub at:

```text
ws://localhost:4000/realtime/sync?sessionId=<sync-session>&clientId=<client>&operatorId=<operator>
```

The hub:

- accepts WebSocket upgrades,
- registers clients by session/client/operator,
- receives `SyncEnvelope` JSON frames,
- broadcasts valid envelopes to peers in the same sync session,
- updates `lastSeenAt` for heartbeat traffic,
- sends heartbeat acknowledgement envelopes back to the sender,
- removes disconnected clients.

There is no database persistence, authentication enforcement, clustering, or catch-up persistence in this phase.

## Client adapter

`WebSocketSyncClient` opens a WebSocket connection, publishes incoming envelopes to subscribers, tracks connection status, supports heartbeat sending through `startHeartbeat`, and retries reconnects with bounded exponential backoff. `WebSocketSyncTransport` adapts that client to `SyncTransport` so `SyncCoordinator` can use it with minimal changes.

## Feature flags

Realtime sync is disabled unless both flags are configured:

```bash
NEXT_PUBLIC_UBOS_REALTIME_SYNC=true
NEXT_PUBLIC_UBOS_SYNC_URL=ws://localhost:4000/realtime/sync
```

When absent, UBOS continues using the local sync simulation.

## Local development

1. Start the API server with the normal dev command, typically `pnpm dev` or `pnpm --filter @ubos/api dev`.
2. Configure the web app environment with the feature flags above.
3. Include `sessionId`, `clientId`, and `operatorId` as URL parameters when constructing the sync WebSocket URL.
4. Keep `NEXT_PUBLIC_ENABLE_SYNC_DIAGNOSTICS=true` to show developer-facing transport diagnostics in the Control Room.

## Diagnostics

The Sync Diagnostics panel shows the active transport (`local` or `websocket`), configured URL, connection-state placeholder, client count, last sent/received message, heartbeat timestamp, and reconnect attempts. The panel remains non-intrusive and developer-facing.

## Limitations and future work

- Authentication is a future server hook; current routing parameters are trusted dev scaffolding.
- Persistence is future work; connection and session state are in memory only.
- Production deployment needs a managed WebSocket gateway or sticky sessions plus cluster-aware fanout.
- Full collaboration, revision catch-up after reconnect, and durable command/event replay are intentionally deferred.
