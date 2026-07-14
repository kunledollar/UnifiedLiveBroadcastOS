# UBOS v5.9.1 Graphics and Text Rendering Foundation

UBOS v5.9.1 introduces a deterministic metadata-only graphics foundation. It models graphics definitions, layers, text elements, image references, shapes, groups, instances, visibility, lifecycle, health, telemetry, watchdog incidents, and Source Graph exposure without performing browser rendering, GPU work, font rasterization, image decoding, SVG, CSS, or output encoding.

## Architecture

The foundation is implemented by `GraphicsFoundationEngine` and `GraphicsFoundationProcessor`. The engine owns immutable definition and instance snapshots. The processor runs once per `FrameTick`, validates metadata state, and publishes the current metadata snapshot for downstream Layer Compositor and Source Graph consumers.

## Graphics model

`GraphicsDefinition` is immutable and generation protected. It includes identity, version, generation, display name, type, ordered metadata layers, element metadata, normalized dimensions, aspect ratio metadata, safe metadata, and deterministic timestamps.

## Layers and placement

Supported layer roles are `BACKGROUND`, `BASE`, `CONTENT`, `OVERLAY`, `FOREGROUND`, and `CUSTOM`. Layers contain ordered element references only. `GraphicsPlacement` uses normalized coordinates and has no pixel or viewport dependency.

## Text model

`TextElement` stores text, font reference, style reference, alignment, anchor, opacity, color metadata, transform metadata, visibility, generation, and safe metadata. It never loads fonts, measures glyphs, or renders text.

## Image metadata model

`ImageElement` and icon elements store asset references, opacity, placement, transforms, visibility, and safe metadata only. The foundation does not load, decode, or retain image bytes.

## Lifecycle

Instances use `CREATED`, `READY`, `ACTIVE`, `HIDDEN`, and `DESTROYED` lifecycle states. Update, show, hide, and delete operations reject stale generations and publish deterministic events.

## Commands and events

The command surface is `GRAPHICS_CREATE`, `GRAPHICS_UPDATE`, `GRAPHICS_DELETE`, `GRAPHICS_SHOW`, `GRAPHICS_HIDE`, and `GRAPHICS_RESET`. Emitted events are `GraphicsCreated`, `GraphicsUpdated`, `GraphicsDeleted`, `GraphicsShown`, and `GraphicsHidden`.

## Health, telemetry, and watchdog

Health tracks graphics count, active/hidden/destroyed counts, duplicate IDs, generation mismatches, queue depth, and incidents. Telemetry tracks ticks processed, commands processed, events emitted, last frame, and published snapshots. Watchdog incidents include duplicate IDs, invalid layers, invalid generations, stale updates, and queue overflow.

## Source Graph

The Source Graph snapshot exposes graphics IDs, layers, visibility, lifecycle, ownership, generation, `metadataOnly=true`, and `realRendering=false`.

## Invariants

- No pixels, GPU handles, browser documents, font bytes, image bytes, or encoded outputs are modeled.
- Snapshots are cloned and deeply frozen before publication.
- Element and layer references are validated before acceptance.
- Stale generations are rejected.
- Processor output remains metadata-only.

## Tests and long-run validation

Validation covers create, update, hide, destroy, duplicate rejection, stale-generation rejection, immutable snapshots, deterministic replay, processor execution, watchdog incidents, shutdown cleanup, and a 100,000-FrameTick simulation.

## Limitations and v5.9.2 relationship

This phase intentionally provides no rendering or data binding. v5.9.2 can build template and dynamic data binding behavior on top of these immutable graphics metadata primitives.
