# Browser Media Renderer Foundation

Phase 6.7 introduces the first runtime-only browser media renderer for UBOS. It renders `SceneComposition` models onto a browser Canvas2D surface without changing the Production Graph or replacing the Media Execution Plane.

## Purpose

The browser renderer is a preview/program/debug foundation for real-time visual diagnostics. It is intentionally renderer-neutral so future implementations can add Canvas2D, WebGL, server compositing, recording, and multiview renderers behind the same concepts.

## Relationship to SceneComposition

`SceneComposition` remains the immutable render model generated from the Production Graph. The renderer accepts a composition, sorts visible layers by `zIndex`, and applies layer bounds, opacity, feasible crop/clipping, and debug guides. Missing or empty compositions produce placeholders rather than exceptions.

## Runtime Source Binding

Runtime media comes from the existing WebRTC browser source manager. Helpers resolve layer `sourceId` values to runtime streams and create/bind/release `HTMLVideoElement` instances only at runtime.

MediaStreams stay outside the Production Graph because the graph must remain serializable, replayable, collaborative, and safe to persist. Stream handles are browser-only runtime resources and are tracked by the media source manager instead.

## Canvas2D Scope

The current renderer supports:

- Canvas background color fills.
- Video drawing from runtime `HTMLVideoElement` objects.
- Missing-source and empty-composition placeholders.
- Debug labels and layer bounding boxes.
- Safe-area guides in developer/debug mode.

It does not implement GPU/WebGL rendering, server rendering, recording, FFmpeg, RTMP, SRT, or NDI.

## Render Loop

`RenderScheduler` provides `start()`, `stop()`, `renderFrame()`, `setTargetFps()`, and `getStats()`. It tracks frame count, dropped frames, target FPS, estimated FPS, average render time, last render duration, and running state.

## Render Targets

Logical targets include `program`, `preview`, `vertical`, `multiview`, `recording`, `output`, and a debug composition preview. Phase 6.7 focuses on browser preview/program/debug surfaces while preserving existing monitor behavior when the feature flag is disabled.

## Media Execution Integration

The Media Execution intent vocabulary now includes browser render intents:

- `RENDER_BROWSER_COMPOSITION`
- `START_BROWSER_RENDERER`
- `STOP_BROWSER_RENDERER`
- `UPDATE_BROWSER_RENDER_TARGET`
- `RENDER_FRAME`

`BrowserRendererAdapter` plugs into the adapter system and returns structured `MediaExecutionAdapterResponse` objects. Runtime modes are respected: disabled skips rendering, dry-run logs intent behavior, mock-live remains safe, and live-ready may render when enabled and available.

## Diagnostics and Feature Flag

The Control Room Media Execution Inspector exposes browser renderer diagnostics and safe developer controls when:

```bash
NEXT_PUBLIC_UBOS_BROWSER_RENDERER=true
```

When the flag is off, existing Control Room monitor and placeholder behavior is unchanged.

Diagnostics include renderer enabled state, targets, composition id, layer count, runtime source count, frame count, target FPS, estimated FPS, last render duration, missing source warnings, and latest structured renderer error.

## Future Plans

- WebGL renderer for GPU composition and richer transforms.
- Recording renderer that consumes compositions without embedding MediaStreams in the graph.
- Server compositor for backend render workflows.
- Dedicated multiview renderer with configurable debug tiles.
- Richer crop, fit-mode, border-radius, shadow, and blend-mode support.

## Known Limitations

- Canvas2D only; no WebGL acceleration yet.
- Crop/transform support is intentionally conservative.
- Tests use mock stream-like objects and do not request real camera permissions.
- Browser runtime rendering requires a DOM canvas and is therefore unavailable in Node-only validation except for structured placeholder/error paths.
