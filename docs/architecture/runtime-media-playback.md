# Phase 21 Runtime Media Playback

The UBOS media playback runtime is a deterministic, metadata-safe orchestration layer for media sessions. It manages command flow, session state, playlist position, clip metadata, preview/program media placement, queue metadata, snapshots, history, health, and metrics without introducing real decoding, FFmpeg, GPU rendering, WebRTC, streaming, recording, device capture, browser `MediaStream` storage, or runtime handles in the Production Graph.

## Lifecycle

1. `LOAD_MEDIA` stores sanitized media asset and clip metadata and resets the playback position.
2. `PREPARE_MEDIA` marks metadata as ready when an asset or clip is available.
3. `PLAY_MEDIA`, `PAUSE_MEDIA`, `STOP_MEDIA`, `SEEK_MEDIA`, `LOOP_MEDIA`, `SET_MEDIA_VOLUME`, and `SET_PLAYBACK_SPEED` deterministically mutate session metadata.
4. `STAGE_MEDIA_PREVIEW` assigns metadata to preview.
5. `TAKE_MEDIA_TO_PROGRAM` promotes preview metadata to program.
6. `CLEAR_MEDIA` returns the session to an idle metadata-only state.

The runtime always records snapshots and history around command execution so replay and inspection can reason about state changes.

## Command flow

`MediaRuntimeDispatcher` accepts a `MediaPlaybackCommand`, `MediaRuntimeQueue` tracks pending commands, and `MediaRuntimeExecutor` applies deterministic state transitions. Validation rejects unsafe runtime handles, invalid seek positions, invalid volume values, and invalid playback speed metadata.

## Null adapter

`NullMediaPlaybackAdapter` is the default adapter. It safely accepts adapter calls but reports honest unavailable behavior:

- Playback runtime unavailable
- Metadata staged
- Media not decoded
- No player connected

This makes the runtime executable for orchestration tests while avoiding false claims of real playback.

## Future browser/video adapter

`BrowserMediaPlaybackAdapter` is a placeholder boundary for a future DOM/video implementation. It is intentionally not wired to real elements and must not store DOM nodes, blobs, files, `MediaStream` objects, or other runtime handles in graph or manifest state.

## Future FFmpeg integration

FFmpeg can integrate later behind an adapter boundary. That integration must remain outside Production Graph serialization and should publish only safe metadata, events, health, and timing information back into this runtime.

## Preview/program media model

Preview and program are metadata placements. Preview can hold a media asset, clip, or replay clip candidate. Taking media to program promotes preview metadata and clears preview. No decoder, stream, or player object is stored in either slot.

## Playlist runtime

`MediaPlaylistRuntime` tracks the loaded playlist, current index, current item, mode, and playback status. `PLAY_NEXT` and `PLAY_PREVIOUS` wrap deterministically across playlist items and update only metadata.

## Replay clip relationship

Replay clips are accepted as clip metadata in the same session boundary as media clips. The runtime preserves replay timing, marker, speed, and identity metadata but does not access replay buffers or decoded media.

## Safety rules

- Production Graph and media runtime state declare `containsRuntimeHandles: false`.
- Commands with runtime handles are rejected.
- Function values, DOM elements, blobs, files, `MediaStream` objects, and adapter/player references must not be serialized into graph state.
- The runtime never claims real playback unless a connected adapter exists.
- Streaming, recording, capture, GPU rendering, WebRTC, FFmpeg, and browser element control are out of scope for Phase 21.
