# Scene Compositor Foundation

Phase 6.3 introduces a renderer-neutral scene compositor foundation for UBOS. It turns Production Graph scenes, sources, overlays, guests, canvas settings, and layout metadata into deterministic `SceneComposition` objects that future renderers can consume.

## Purpose

The compositor is architecture only. It does not render pixels, access the DOM, create GPU resources, call FFmpeg, or store `MediaStream` objects in the graph. Its output is a declarative composition tree containing IDs, dimensions, transforms, ordering, layout metadata, and render instructions.

Future consumers include browser canvas/SVG debug renderers, WebGL/GPU renderers, server-side compositors, FFmpeg renderers, OBS bridges, recording pipelines, and multiview renderers.

## Graph vs Runtime Media Separation

The Production Graph remains the source of truth for broadcast state: scenes, sources, guests, overlays, destinations, and current program/preview selections. Runtime media remains outside the graph and is referenced only by stable IDs. The compositor may warn about missing runtime source IDs, but it never embeds streams or platform handles.

## Composition Model

`SceneComposition` contains:

- `id`, `sceneId`, `graphRevision`
- `canvas`
- `background`
- ordered `layers`
- `overlays`
- `safeAreas`
- `renderTargets`
- `metadata`

The canonical types live in `packages/media-plane/src/compositor/` and include `CompositionCanvas`, `CompositionLayer`, `CompositionSource`, `CompositionTransform`, `CompositionBounds`, `CompositionCrop`, `CompositionStyle`, `CompositionOverlay`, `CompositionBackground`, `CompositionSafeArea`, and `CompositionRenderTarget`.

## Canvas Model

The default canvas is 1920x1080, 60fps, square pixels, black background, and a 5% title-safe area. The model supports horizontal 16:9, vertical 9:16, square 1:1, and custom dimensions through overrides.

## Layer and Transform Model

Each scene source becomes a deterministic composition layer with source ID/type, label, z-index, visibility, opacity, bounds, crop, transform, style, optional audio inclusion, and metadata. Transforms include x/y, width/height, scale, rotation, anchor, fit mode, and mirroring flags.

Supported source types include camera, guest, screen, browser, media, image, video, audio, overlay, background, and placeholder.

## Layout Presets

The layout preset engine currently supports:

- `fullscreen`
- `side_by_side`
- `picture_in_picture`
- `two_by_two_grid`
- `speaker_focus`
- `vertical_fullscreen`
- `vertical_split`
- `multiview_grid`

Each preset calculates deterministic layer bounds based only on canvas dimensions, layer index, and layer count.

## Graph-to-Composition Flow

`createSceneCompositionFromGraph(graph, sceneId, options)` is pure and side-effect free. It reads graph state, creates a canvas, resolves layout metadata, creates ordered layers, includes overlays/backgrounds/safe areas, and returns a renderer-neutral `SceneComposition`.

## Validation

Validation helpers check canvas dimensions, duplicate layer IDs, zero-size layers, layers outside the canvas, and missing sources. Warnings are returned as data and do not crash the app.

## Diffing

`diffSceneCompositions(previous, next)` reports changed, added, and removed layers plus layout/canvas changes. Convenience helpers expose changed, added, removed, and layout-changed checks for future render optimization.

## Media Execution Integration

The Media Execution Plane now understands composition-related intents such as `BUILD_SCENE_COMPOSITION`, `UPDATE_SCENE_COMPOSITION`, `APPLY_LAYOUT`, `RENDER_PROGRAM_COMPOSITION`, `RENDER_PREVIEW_COMPOSITION`, and `RENDER_MULTIVIEW_COMPOSITION`. Graph transitions emit these intents for scene switches, preview changes, layout changes, and source updates. The mock adapter builds/validates compositions and stores them in an in-memory `CompositionStore` without rendering pixels.

## Inspector

The developer Media Execution Inspector includes compact compositor diagnostics: program and preview canvas size, layout preset, visible layer count, overlay count, warnings, changed layer counts, and latest composition revision.

## Future Renderer Plans

- Browser renderer: consume `SceneComposition` to draw labeled rectangles first, then video elements/canvas frames without changing graph semantics.
- GPU/WebGL renderer: use diff helpers to update only changed layers and transforms.
- FFmpeg/server renderer: translate the same composition tree into filter graphs or server-side render jobs.

## Known Limitations

- No real pixel rendering is implemented.
- No server-side video compositor exists yet.
- Runtime media availability is represented as warnings only.
- Advanced styling, masks, transitions, and animated overlays are placeholders for later phases.
