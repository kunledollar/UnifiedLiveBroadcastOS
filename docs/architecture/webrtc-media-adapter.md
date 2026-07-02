# WebRTC Media Adapter Foundation

Phase 6.2 introduces `WebRTCMediaExecutionAdapter` as the first real browser-media adapter for the UBOS Media Execution Plane. It is intentionally local-first: the adapter can register and reason about browser `MediaStream` objects, but it does not perform SFU routing, RTMP/SRT/NDI output, FFmpeg work, or production compositor rendering.

## Purpose

The adapter proves that real browser media can enter the execution layer while preserving existing abstractions. It implements the same `MediaExecutionAdapter` contract as the mock adapter and only handles safe initial intents: preview/program scene changes, multiview rendering, audio mix updates, and layout application.

## Graph State vs Runtime Stream State

The Production Graph remains serializable and collaborative. It stores stable IDs, scene state, routing state, and revisions. Runtime `MediaStream` references are never written to the graph because they are browser-local objects, cannot be serialized reliably, may contain permission-scoped device handles, and would break persistence/replay semantics.

Runtime stream references live in `BrowserMediaSourceManager`. Its public metadata (`WebRTCRuntimeSource`) exposes safe fields only: source IDs, kind, stream ID, audio/video availability, status, update time, and optional error text.

## Browser Capture Helpers

The WebRTC package exposes safe wrappers for local capture:

- `requestLocalCamera()`
- `requestLocalMicrophone()`
- `requestScreenShare()`
- `stopLocalStream()`
- `stopAllTracks()`

These helpers never auto-start capture on page load. They normalize browser errors such as permission denial, unavailable devices, unavailable APIs, cancellation, and ended tracks into structured WebRTC media errors.

## Runtime Modes

The adapter registry includes WebRTC metadata only as a live adapter. Existing runtime modes remain authoritative:

- `disabled`: no adapter execution.
- `dry_run`: intents are recorded without WebRTC calls.
- `mock_live`: mock adapter remains active; WebRTC is not selected.
- `live_ready`: WebRTC can be selected when available and enabled.

## Local-Only Limitations

This foundation does not encode, stream externally, or composite final video. Execution results describe local routing decisions and registered source status. The Media Execution Inspector exposes developer diagnostics for requesting camera, microphone, screen share, stopping streams, and registering test stream-like objects.

## Future Plan

Future phases can build on this boundary by adding production guest signaling, SFU routing, guest media authorization, compositor integration, and external delivery adapters. Those additions should continue to keep browser stream references outside persisted graph state and route all execution through the Media Execution Plane.

## Known Limitations

- No cloud/SFU media routing.
- No external streaming or recording output.
- No heavy compositor work.
- No automatic device startup.
- Browser permission prompts are only triggered by explicit developer controls or direct helper calls.
