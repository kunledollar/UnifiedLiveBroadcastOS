# Phase 24: WebRTC and Remote Guest Runtime Foundation

Phase 24 introduces a deterministic metadata-only runtime for remote guest orchestration. It models guest sessions, readiness, preview/program routing, return feeds, tally, talkback/IFB, queueing, history, snapshots, metrics, and health without introducing media transport.

## Lifecycle

A guest session starts with `CREATE_GUEST_SESSION`, can be invited with `INVITE_GUEST`, moves into the waiting room with `JOIN_GUEST`, becomes metadata-ready with `MARK_GUEST_READY`, and is explicitly removed from live routing with `MARK_GUEST_DISCONNECTED`. The runtime never fabricates connected guests; connected state appears only after a command records it.

## Guest Session Model

Each `GuestRuntimeSession` stores connection state, camera/mic/screen readiness, assigned scene and slot, preview/program routing metadata, pin/mute state, return feed state, tally state, and talkback/IFB metadata. These are production-safe descriptors only.

## Adapter Boundary

`WebRTCAdapter` is the boundary for future transport implementations. The runtime currently ships with `NullWebRTCAdapter`, which accepts commands safely and honestly reports unavailable transport. `BrowserWebRTCAdapter` is a placeholder name only and is not wired to `RTCPeerConnection`.

## Null WebRTC Adapter

The null adapter always returns unavailable results:

- WebRTC runtime unavailable
- Guest transport not connected
- Media stream unavailable
- Metadata only

This keeps orchestration deterministic while preventing sockets, ICE, SDP, peer connections, MediaStreams, and packet processing from entering the production graph.

## Future Browser Adapter

A future browser adapter may attach real WebRTC transport behind the adapter boundary. It must not leak browser handles, media streams, ICE candidates, SDP offers/answers, or peer connection objects into runtime state or production graph snapshots.

## Return Feed Model

Return feeds are metadata objects with `enabled`, `sourceId`, `label`, and `metadataOnly`. `SET_RETURN_FEED` validates that a source exists; `CLEAR_RETURN_FEED` removes the assignment.

## Tally Model

Tally tracks whether guest tally is enabled and whether a guest is represented in preview or program. Routing commands update preview/program flags as metadata only.

## Talkback / IFB Model

Talkback and IFB are represented as channel metadata. No audio transport, device routing, DSP, encoding, or capture is implemented in Phase 24.

## Preview/Program Routing

`SEND_GUEST_TO_PREVIEW` and `SEND_GUEST_TO_PROGRAM` update metadata used by safe UI overlays and operations panels. They do not move media packets or create video/audio tracks.

## Safety Rules

- No `RTCPeerConnection` objects in runtime state.
- No `MediaStream` values in runtime state.
- No SDP offers or answers in production graph state.
- No ICE candidates in production graph state.
- No sockets, TURN/STUN negotiation, encoding, decoding, recording, streaming, or hardware control.
- Unsafe runtime handles are rejected by the executor.
