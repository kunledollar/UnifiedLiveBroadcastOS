# WebRTC Runtime Foundation

Phase 8.7 adds a safe, feature-flagged WebRTC runtime foundation for low-latency interactive media transport. It defines session, peer, signal, ICE/STUN/TURN, health, manifest, failure, and track-reference metadata while keeping live browser objects out of durable state.

## Purpose

The runtime gives UBOS a shared vocabulary for host, guest, producer, operator, and observer peer lifecycles before SFU mixing or production TURN deployment exists. Browser runtime activation is gated by `NEXT_PUBLIC_UBOS_WEBRTC_RUNTIME=true` or `UBOS_ENABLE_WEBRTC_RUNTIME=true`; when disabled, helpers return mock or metadata-only results.

## Relationship to Guest Manager

Guest records remain authoritative production metadata. WebRTC peer metadata can reference `guestId`, `sourceId`, and muted/enabled state so Guest Manager can display connection health without storing `MediaStream`, `MediaStreamTrack`, `RTCPeerConnection`, device handles, DOM nodes, ICE candidates, canvas references, or encoded packets.

## Relationship to Media Execution Plane

WebRTC operations enter through Media Execution intents: build transport plan, prepare/start/stop session, add/remove/update peer, attach/detach track, handle signal, report health, and fail session. The mock media execution adapter handles these intents as metadata-only work, preserving the execution boundary and replay contract.

## Relationship to Audio/Video Routing

`WebRTCMediaTrackRef` is a routing-safe descriptor with `peerId`, `trackId`, `kind`, optional `sourceId`, optional `guestId`, muted/enabled state, connection state, optional frame identity, optional graph revision, and pressure metadata. Audio and video routing consume those identifiers rather than runtime tracks.

## Relationship to Sync/WebSocket Signaling

The foundation defines metadata-level signal messages for `offer`, `answer`, `ice_candidate`, `peer_joined`, `peer_left`, `reconnect_requested`, and `connection_failed`. Existing sync/WebSocket transport can carry these messages later. This phase does not introduce a new signaling server.

## Peer Lifecycle

Peers move through `idle`, `planned`, `signaling`, `connecting`, `connected`, `reconnecting`, `disconnected`, `failed`, `closed`, and `unavailable`. Missing browser APIs return `unavailable` or structured errors instead of throwing during Node, build, or test execution.

## Track Reference Model

Tracks are represented only as metadata references. Local and remote browser track objects are runtime-only and must be cleaned up with peer connection lifecycle helpers.

## ICE/STUN/TURN Model

The default ICE config uses a safe STUN placeholder. TURN servers support username and credential placeholders, but diagnostics redact credential fields. Missing TURN credentials warn but do not crash planning or execution.

## Browser Runtime-Only Object Rules

`createPeerConnection`, track attach/detach, offer/answer, remote description, ICE candidate collection, and cleanup helpers guard browser APIs. Production Graph, replay manifests, execution logs, and diagnostics store only redacted metadata.

## Failure Handling

WebRTC ICE, signaling, peer disconnect, media track, and browser-unavailable errors map to UBOS failure records with retryability and classification metadata.

## Backpressure Handling

Peer and track refs expose pressure metadata. Degraded modes include audio-only, reduced diagnostics, and disabled preview, allowing future load managers to reduce interactive media cost without changing graph state.

## Replay Behavior

WebRTC manifests and signal events are replay metadata. Replay must never reconnect peers, recreate tracks, or re-emit live ICE candidates.

## Limitations

No SFU, server-side mixing, TURN billing API, credential platform, or invitation flow is implemented. The Control Room UI is not redesigned.

## Future Plans

Future phases can add SFU routing, production TURN deployment and billing controls, and a guest invitation flow on top of the metadata and execution contracts defined here.
