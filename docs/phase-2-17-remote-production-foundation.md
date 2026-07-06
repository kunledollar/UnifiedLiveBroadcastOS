# UBOS 2.0 Phase 2.17 – Remote Production Foundation

Phase 2.17 adds a backend-independent remote production subsystem for browser-based guests without implementing real WebRTC transport, browser signaling, screen sharing, chat, or guest recording.

## Core abstractions

- `RemoteProductionManager` coordinates guest lifecycle, green-room approval, producer messages, tally, IFB metadata, and production workflow integration.
- `GuestSession` records lifecycle state (`invited`, `connecting`, `connected`, `waiting`, `live`, `disconnected`) and metadata for camera, microphone, network quality, and connection duration.
- `GreenRoom` exposes waiting, approved, and live guest sets plus producer approval requirements.
- `ProducerMessage` is a metadata-only producer-to-guest cue model; it is not chat.
- `TallyState` exposes off/preview/program state for guest confidence indicators.
- `IFBState` defines future interruptible foldback/mix-minus routing metadata without media transport.

## Production integration

`integrateGuest()` creates metadata-only bindings into existing systems:

- `SceneCompositor`: adds a video placeholder layer with remote guest metadata.
- `AudioMixer`: adds a silent metadata-only guest audio channel.
- `PreviewOutput` and `ProgramOutput`: identities are captured in snapshots for routing decisions.
- `ProductionSwitcher`: preview/program scene IDs are reflected in tally metadata.

All snapshots set `containsRuntimeHandles: false` and `containsMediaPayloads: false`.

## Explicit non-goals

The backend manifest documents disabled capabilities:

- `webrtcTransport: false`
- `signaling: false`
- `screenSharing: false`
- `guestRecording: false`
- `chat: false`

This keeps Phase 2.17 ready for future adapters while preserving deterministic metadata-only runtime behavior.
