# Renderer Performance & GPU Pipeline Foundation

Phase 6.9 adds a performance architecture around the existing browser media renderer without replacing Canvas2D or introducing production WebGL/WebGPU rendering.

## Renderer backend abstraction

`RendererBackend` describes a backend by `id`, `name`, `type`, `status`, capabilities, lifecycle methods, `renderFrame(frameContext)`, resizing, destruction, and stats. The concrete `Canvas2DRendererBackend` wraps the existing Canvas2D draw path. `WebGLRendererBackend` and `WebGPURendererBackend` are explicit preview placeholders and report unavailable until future capability work is implemented.

## Render frame context

Backends render from a structured `RenderFrameContext` containing frame identity, timestamp, graph revision, composition ID, canvas, layers, runtime sources, debug mode, render target, and metadata. This keeps rendering inputs explicit and avoids backend reads from global state.

## Dirty layer detection

Dirty-layer helpers compare previous and next compositions by transform, style, source, and visibility. The goal is conservative diagnostics and future GPU texture-cache preparation rather than aggressive redraw skipping.

## Render cache model

The in-memory `RenderCache` models layer, source, and placeholder texture entries. Helpers support create, get, set, invalidation, clearing, and summaries. No real pixels, frames, streams, encoded packets, or GPU textures are persisted in the Production Graph.

## Pipeline stages

The render pipeline has deterministic stages: `prepare_frame`, `resolve_sources`, `compute_dirty_layers`, `update_cache`, `draw_background`, `draw_layers`, `draw_overlays`, `draw_guides`, and `finalize_frame`. Canvas2D uses the model at a low-risk boundary by invoking the existing draw path from the draw stage.

## Frame budget and health

Frame budget helpers calculate target-frame duration and evaluate render duration, budget status, dirty layer counts, and cache hit/miss counts. `RendererHealth` summarizes backend type, FPS, average render duration, dropped/over-budget frames, cache hit rate, active/dirty layers, placeholder memory pressure, and warnings.

## Backend selection

Runtime modes include `canvas2d_default`, `canvas2d_performance`, `webgl_preview`, and `webgpu_preview`. Selection defaults to Canvas2D. GPU preview modes fall back gracefully when placeholders are unavailable. Feature flags are `NEXT_PUBLIC_UBOS_RENDER_BACKEND=canvas2d` and `NEXT_PUBLIC_UBOS_RENDER_PERF_DIAGNOSTICS=true`.

## Inspector and overlay

The developer renderer inspector shows active backend, available capabilities, frame budget, render duration, over-budget counts, dirty layers, cache summary, pipeline stages, health, and fallback status. Developer controls can switch backend, clear cache, and force a full redraw. The optional performance overlay is diagnostics-only and displays FPS, render ms, budget, dirty layers, cache counts, and backend type.

## Future GPU renderer plan

Future phases can replace the placeholder backends with real capability checks, texture upload/cache ownership, shader/compositor passes, and resource-pressure telemetry while preserving the `RenderFrameContext`, cache model, pipeline stages, and Media Execution/Clock integration boundaries.

## Known limitations

- WebGL and WebGPU are placeholders only.
- Cache entries model decisions only; they do not hold GPU textures.
- p95 render time and memory pressure are placeholders.
- Existing Canvas2D behavior remains the default path.
