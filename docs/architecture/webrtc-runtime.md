# WebRTC Runtime Architecture

Phase 9.4 introduces a real WebRTC transport runtime for browser media sessions while keeping the Production Graph metadata-only. Runtime-only browser objects such as `RTCPeerConnection`, `MediaStream`, `MediaStreamTrack`, `RTCDataChannel`, ICE candidates, SDP blobs, sockets, and handles are owned by the runtime managers and are never serialized into graph, replay, or manifest structures.

## Architecture

`packages/media-plane/src/webrtc-runtime/` contains the runtime boundary:

- `RealWebRTCRuntime` coordinates session, peer connection, signaling, ICE, tracks, statistics, recovery, health, and validation services.
- `WebRTCSessionManager` owns session lifecycle metadata.
- `PeerConnectionManager` owns runtime-only peer connection handles in private maps.
- `MediaTrackManager` records track references and lifecycle metadata only.
- `ICEManager` emits ICE metadata and queues restarts.
- `SignalingManager` emits metadata-only signaling messages.
- `ConnectionHealth` and `WebRTCStatistics` summarize quality, bitrate, packet loss, latency, and reconnect metadata.
- `WebRTCRecovery` maps failures to ICE restarts or reconnect plans.
- `WebRTCValidator` protects signaling and ownership boundaries.

## Lifecycle and Negotiation

Supported lifecycle operations are create session, offer, answer, ICE negotiation, connect, reconnect, track add/remove, mute, unmute, replace track, disconnect, and cleanup. Offer, answer, and ICE objects are represented as redacted metadata records. Browser descriptions and candidate bodies remain inside runtime-owned browser APIs.

## Supervisor

The Production Runtime Supervisor treats WebRTC as a supervised subsystem. Supervisor-visible diagnostics include session health, ICE state, DTLS state, connection quality, bitrate, packet loss, latency, reconnects, and media track references. Diagnostics are plain metadata and can feed the control room guest panel.

## Recovery

Recovery plans classify ICE failures as ICE restart actions and peer failures as automatic reconnect actions. Plans include exponential backoff, timeout, failure mapping into UBOS failure records, and a supervisor notification flag. ICE restarts are queued through the ICE manager so reconnect storms can be throttled.

## Replay

Replay records lifecycle, negotiation, track changes, mute state, health, and failures. Replay events explicitly set `containsRuntimeHandles: false`; browser handles are never replayed. A replay reconstructs historical metadata and does not recreate live peer connections or media tracks.

## Backpressure

The runtime calculates backpressure for concurrent negotiations, queued negotiations, queued ICE restarts, reconnect storms, browser-thread protection, and signaling-server protection. The default negotiation concurrency is two active negotiations; reconnect storms are throttled after repeated attempts in the current window.

## Security

Signaling validation rejects invalid peer IDs, verifies session ownership when owners are provided, rejects raw SDP or ICE candidate injection into the metadata plane, and redacts SDP, ICE credentials, TURN credentials, passwords, and candidate bodies from diagnostics.

## Feature Flags

Real browser transport is enabled by either `UBOS_ENABLE_REAL_WEBRTC=true` or `NEXT_PUBLIC_UBOS_REAL_WEBRTC=true`. Legacy `UBOS_ENABLE_WEBRTC_RUNTIME=true` and `NEXT_PUBLIC_UBOS_WEBRTC_RUNTIME=true` flags remain supported. When flags are disabled, UBOS falls back to the metadata-only mock runtime.
