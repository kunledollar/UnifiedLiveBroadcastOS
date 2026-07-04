# Media & Replay Engine

Phase 10 introduces a **metadata-first** media playback, clip management, playlist, and replay foundation for UBOS. This layer prepares professional broadcast media workflows (vMix media list, TriCaster DDR, EVS replay, OBS media sources) without injecting runtime handles into the Production Graph.

## Purpose

UBOS media/replay should feel like a live operator stack while remaining:

- Metadata-only in the presentation layer
- Previewable before live (Program/Preview staging)
- Assignable per scene
- Safe for future persistence and replay export
- Honest when playback runtime is unavailable

## Metadata-First Architecture

All media state in Phase 10 is stored as serializable metadata:

| Type | Role |
|------|------|
| `MediaAsset` | Catalog/bin entries (video, image, audio, browser, etc.) |
| `MediaClip` | Trimmed sub-range with in/out points, markers, speed, loop |
| `Playlist` | Ordered item list with mode (manual, sequential, loop, shuffle) |
| `ReplayClip` | Buffer-sourced clip with angle, speed, markers |
| `ReplayBufferMetadata` | Buffer active/source/duration status (metadata only) |
| `SceneMediaComposition` | Per-scene assets, clips, playlists, replay clips, program/preview IDs |
| `MediaManifest` | Replay-safe snapshot with `containsRuntimeHandles: false` |

**Never stored in graph or UI state:** DOM nodes, `<video>` elements, canvas objects, `MediaStream`, `Blob`, `File`, WebGL handles, raw encoded media.

## Media Bin Architecture

The Media Bin maps `ProductionAsset` entries (video/image/audio) into `MediaAsset` metadata:

- Thumbnail placeholder (type label only — no fake frames)
- Duration, resolution, fps shown as **unavailable** when not in metadata
- Status: `ready` · `missing` · `unavailable` · `processing` · `offline`
- Assigned scene reference
- Actions: preview (select), assign to scene, send to Preview, take live (metadata), remove

Honest empty states: *No media assets loaded*, *Asset reference missing*, *Playback runtime unavailable*.

## Clip Browser Model

`MediaClip` tracks:

- Parent `assetId`, in/out trim points, computed duration
- Markers, loop, autoplay, volume, playback speed
- Transition in/out metadata (milliseconds)
- `programState` / `previewState`: `idle` · `preview` · `program` · `unavailable`

Validation rejects negative duration, invalid trim ranges, and missing asset references.

## Playlist Model

`Playlist` stores item references (`assetId` or `clipId`), `currentIndex`, `mode`, and `status`. Phase 10 does **not** simulate playback — only metadata sequencing and honest labels (*No fake playback*).

## Replay Metadata Model

`ReplayBufferMetadata` reports buffer status without claiming an active ring buffer unless configured. `ReplayClip` stores source ID, time range, speed, angle, and markers.

Honest states:

- Replay buffer not active
- No replay source configured
- No replay clips available
- Replay runtime unavailable

## Program / Preview Media Workflow

Operator workflow (metadata only in Phase 10):

1. **Send to Preview** — marks asset/clip/replay `previewState: preview`
2. **Take Live** — promotes to `programState: program`, clears preview staging
3. **Clear Preview** / **Clear Program** — resets metadata state

Monitors show `MediaMetadataOverlay` with honest labels: *Media metadata staged · Playback runtime unavailable*.

## Validation Rules

Implemented in `packages/shared/src/media-replay/validation.ts`:

- Reject runtime handle keys in metadata
- Sanitize source URIs (http/https or relative paths; reject `blob:` / `file:`)
- Validate trim points and non-negative duration
- Unique asset IDs; playlist items must reference valid assets/clips

## Runtime Limitations (Phase 10)

Phase 10 is **UI-first and metadata-first**:

- No actual media decode, playhead, waveform, or thumbnail generation
- No replay ring buffer or EVS-style instant replay execution
- No Production Graph reducer changes
- Command intents logged via `createMediaCommandIntent()` stubs only

## Future Playback / Recording Integration

Planned follow-on phases:

- Wire `MEDIA_COMMAND_STUBS` to a media execution adapter (parallel to graphics renderer)
- Hydrate `MediaAsset` duration/resolution/fps from probe metadata
- Persist `MediaManifest` / `SceneMediaComposition` to workspace storage
- Connect replay buffer to program feed recording handles (outside Production Graph)
- Scene source assignment for media assets in the routing layer

## UI Surfaces

| Surface | Components |
|---------|------------|
| Media Operator workspace | `MediaWorkspace` |
| Bottom dock Media tab | `MediaBin`, `MediaPreviewControls` |
| Bottom dock Replay tab | `ReplayWorkspace` |
| Left nav Media / Replay | `MediaBrowserPanel`, `ReplayBrowserPanel` |
| Replay workspace profile | `ClipBrowser`, `PlaylistManager`, `ReplayWorkspace` panels |
| Inspector | `MediaInspector` |
| Monitors | `MediaMetadataOverlay` on Program/Preview |

## File Layout

```
packages/shared/src/media-replay/   # types, validation, manifest, commands
apps/web/app/control-room/media/    # UI components and composition reducer
docs/architecture/media-replay-engine.md
```
