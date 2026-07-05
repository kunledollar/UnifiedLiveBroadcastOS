# Preview & Program Output Pipeline (UBOS 2.0 Phase 2.10)

Phase 2.10 adds backend-independent Preview and Program output pipelines for live production monitoring. Outputs consume existing `SceneCompositor` render metadata, GPU renderer metadata, `AudioMixer` output buses, and the shared `MediaClock` so video and audio presentation are traceable to the same runtime timeline.

## Runtime model

Each output owns metadata-only state:

- `videoSurface`: target, dimensions, format, graph revision, and surface metadata.
- `audioBus`: output bus identity and mixer bus binding.
- `renderState`: latest compositor frame, latest mixed audio frame metadata, renderer backend name, synchronized presentation timestamp, and drift.
- `runtimeState`: lifecycle, clock state, and status events.

The lifecycle is `initializing`, `ready`, `rendering`, `paused`, `stopped`, or `failed`.

## Preview vs Program

Preview and Program are independent outputs with independent scenes and compositors. Phase 2.10 intentionally does not implement switching, transitions, recording, streaming, or multiview. Later phases can connect this foundation to the production switcher without embedding runtime handles or media payloads in persisted state.

## Demo

`createPreviewProgramOutputDemo()` documents the simultaneous render path, while validation tests instantiate Preview and Program outputs side by side and render both through `OutputPipelineManager.renderAll()`.
