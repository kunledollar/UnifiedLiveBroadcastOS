# Phase 2.18 – Broadcast Transport Layer

Phase 2.18 introduces a backend-independent transport subsystem for UBOS Version 2.0. It models professional broadcast transport sessions without opening sockets, negotiating ICE, performing hardware I/O, encoding packets, or binding to a specific runtime backend.

## Scope

The transport layer provides metadata-only models for:

- WebRTC
- RTMP
- RTMPS
- SRT
- RIST
- NDI
- SMPTE ST 2110

Each protocol is represented by a `TransportProtocolModel` and managed through `TransportManager` sessions.

## Session lifecycle

`TransportSession.lifecycle` supports:

1. `idle`
2. `negotiating`
3. `connecting`
4. `connected`
5. `reconnecting`
6. `stopped`
7. `failed`

The lifecycle is intentionally generic so protocol-specific backends can be added later without changing control-plane semantics.

## Metrics and health

Every session tracks:

- `bitrateKbps`
- `latencyMs`
- `jitterMs`
- `packetLossRatio`
- `reconnectCount`
- `health`

Health is derived as `healthy`, `degraded`, `critical`, or `unknown` from metadata-only metrics. No packets or native protocol statistics are collected in this phase.

## Runtime integration points

`TransportManager.integrate()` records references to existing runtime subsystems:

- `StreamingPipeline` / streaming sessions
- `RemoteProductionManager` session ids
- `MediaClock`
- `AudioMixer`
- `SceneCompositor`

These are stored as stable identifiers in `TransportIntegrationRefs` to preserve backend independence and replayability.

## Runtime events

The manager emits `TransportRuntimeEvent` records for session creation, negotiation, connection, reconnect, metrics updates, failures, stops, and integration changes. Events are serializable and explicitly mark `containsRuntimeHandles: false`.

## Demo workflow

Run the metadata-only demo with:

```bash
pnpm media:transport-demo
```

The demo creates an SRT egress session, transitions through negotiation and connection, updates metrics, simulates a reconnect, and returns to `connected`.
