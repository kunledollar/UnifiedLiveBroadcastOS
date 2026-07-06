# UBOS 2.0 Phase 2.15 — Multiview System

Phase 2.15 adds a backend-independent multiview subsystem for aggregating production outputs and runtime diagnostics into configurable monitoring layouts.

## Core abstractions

- `MultiviewManager` owns the active layout, latest plan, confidence monitor, and emitted runtime events.
- `MultiviewLayout` describes the canvas, custom grid, tile count, safe title/action areas, and optional custom tile bounds.
- `MultiviewTile` models monitoring tiles for preview, program, camera sources, media sources, audio meters, recording, streaming, and runtime diagnostics.
- `RuntimeDiagnostics` snapshots integration state from preview/program outputs, scene compositor, audio mixer, recording pipeline, and streaming pipeline without holding runtime handles or media payloads.

## Supported tile capabilities

Tiles support labels, tally state (`preview`, `program`, `both`, `none`), safe title/action overlays, health warnings, and metadata-only diagnostics. This phase intentionally excludes browser sharing, remote multiview, PTZ controls, and drag-and-drop editing.

## Integration points

`collectRuntimeDiagnostics()` and `MultiviewManager.bind()` accept existing runtime abstractions:

- `PreviewOutput`
- `ProgramOutput`
- `SceneCompositor`
- `AudioMixer`
- `RecordingPipelineV2`
- `StreamingPipeline`

All collected state is serialized as replay-safe metadata with `containsRuntimeHandles: false` and `containsMediaPayloads: false`.

## Demo layout

`createDemoMultiviewLayout()` returns an eight-tile custom grid:

1. Program
2. Preview
3. Camera 1
4. Camera 2
5. Media
6. Audio meters
7. Recording status
8. Streaming status

## Validation

The media-plane validation suite covers custom grid layout creation, tally and safe overlay generation, runtime event emission, metadata-only diagnostics, the demo layout, and rejection of raw media-like metadata.
