# Phase 2.18 – Broadcast Transport Layer

Phase 2.18 adds a backend-independent `TransportManager` and immutable `TransportSession` model for professional broadcast transport protocols. The layer is metadata-only: it does not open sockets, encode packets, perform ICE signaling, implement TURN/STUN, or access hardware I/O.

## Protocol models

The transport layer models WebRTC, RTMP, RTMPS, SRT, RIST, NDI, and SMPTE ST 2110. Each protocol descriptor records its transport family, direction, encryption and latency capabilities, signaling requirements, and the current Phase 2.18 implementation constraint that real protocol execution is not yet implemented.

## Session lifecycle

Sessions move through `idle`, `negotiating`, `connecting`, `connected`, `reconnecting`, `stopped`, and `failed`. Every state transition emits a runtime event with protocol, session, lifecycle, and backend metadata.

## Metrics and health

`TransportSessionMetadata` tracks bitrate, latency, jitter, packet loss, reconnect count, transport health, observed video/audio frame counts, and media-clock drift. Health is derived from packet loss and jitter unless explicitly supplied by the caller.

## Runtime integration

Transport sessions bind by stable metadata identifiers to the existing runtime subsystems:

- `StreamingPipeline` and optional streaming session id.
- `RemoteProductionManager`-compatible metadata snapshots.
- `MediaClock` and `FrameScheduler` ticks.
- `AudioMixer` output identity.
- `SceneCompositor` scene identity.
- Program output identity.

These bindings preserve backend independence by excluding runtime handles, media payloads, and encoded packets from snapshots and events.

## Demo workflow

`createDemoTransportWorkflow()` creates an SRT contribution session, models negotiation and connection, updates metrics from a scheduler tick, simulates a reconnect, returns to connected, and stops the session.
