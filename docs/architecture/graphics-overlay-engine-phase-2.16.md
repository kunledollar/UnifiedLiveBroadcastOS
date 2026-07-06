# Graphics & Overlay Engine (Phase 2.16)

Phase 2.16 introduces a backend-independent graphics subsystem for broadcast overlays rendered through the existing SceneCompositor and GPU renderer contracts.

## Scope

The GraphicsEngine is metadata-only and does not store DOM, browser, GPU texture, or media payload handles. It supports static graphics only:

- Text
- Image
- Rectangle
- Circle
- SVG

Overlay packages can model lower thirds, name straps, logos, watermarks, QR codes, and countdown timers. Animated graphics, HTML/browser rendering, scoreboard templates, election graphics, and live data bindings are intentionally out of scope.

## Runtime model

A `GraphicsObject` contains content metadata plus transform controls:

- position
- size
- opacity
- rotation
- visibility
- z-order

An `Overlay` groups object IDs. Calling `renderOverlay()` converts those objects into SceneCompositor `RenderLayer` entries with a `graphics` source type. This preserves renderer portability while allowing preview and program compositors to receive identical overlay layers.

## Integration points

- **SceneCompositor**: receives graphics render layers via `renderOverlay()`.
- **GPU Renderer**: referenced only by serializable backend diagnostics.
- **PreviewOutput / ProgramOutput**: referenced by output IDs in snapshots, preserving no runtime handles.
- **Runtime events**: object and overlay mutations emit bounded event history for automation and monitoring.

## Demo

`createGraphicsOverlayDemo()` builds a sample lower-third package containing a lower third title, logo, QR code, and countdown timer, then renders it to serializable compositor layers.
