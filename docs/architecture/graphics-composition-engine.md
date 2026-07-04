# Graphics & Composition Engine

Phase 9 introduces a **metadata-first** graphics and composition foundation for UBOS. This layer prepares professional broadcast graphics workflows without injecting runtime handles into the Production Graph.

## Purpose

UBOS graphics should feel like a live operator stack (Photoshop layers, Vizrt/Ross control, vMix overlays) while remaining:

- Layer-based and previewable before live
- Assignable per scene
- Safe for replay and future persistence
- Honest when rendering is unavailable

## Metadata-First Architecture

All graphics state in Phase 9 is stored as serializable metadata:

- `GraphicsAsset` — template/catalog entries (lower thirds, tickers, logos, etc.)
- `GraphicsLayer` — scene-bound layer stack entries with order, opacity, visibility, lock, program/preview state
- `BrandKit` — colors, font metadata, logo references
- `LowerThirdTemplate` — editable lower-third metadata
- `CompositionManifest` — replay-safe snapshot with `containsRuntimeHandles: false`

**Never stored in graph or UI state:** DOM nodes, canvas objects, `MediaStream`, WebGL handles, `ImageBitmap`, raw files.

## Program vs Preview Graphics Model

Each `GraphicsLayer` tracks:

| Field | Meaning |
|-------|---------|
| `programState` | `live` · `preview` · `hidden` · `unavailable` |
| `previewState` | Staged graphics not yet on program |

Operator workflow (metadata only in Phase 9):

1. **Send to Preview** — marks layer `previewState: preview`
2. **Take Live** — promotes to `programState: live`, clears preview staging
3. **Remove from Program** / **Clear Preview** / **Clear Program** — metadata state updates only

Monitors show subtle metadata overlays (`GraphicsMetadataOverlay`) with honest labels: *Graphics metadata staged · Renderer unavailable*.

## Layer Stack Model

Layers are ordered numerically per scene (higher = closer to top). Validation enforces:

- Unique layer IDs per scene
- Unique order values per scene
- Opacity in `[0, 1]`
- Valid asset references (warnings for missing/unavailable assets)
- Locked layers cannot be toggled or opacity-adjusted from UI actions

## Brand Kit Model

`BrandKit` stores color tokens, font metadata, and asset ID references for logos/watermarks. No font files or image blobs are embedded.

## Validation Rules

Implemented in `packages/shared/src/graphics/validation.ts`:

- Reject runtime handle keys in metadata (`stream`, `canvas`, `mediaStream`, etc.)
- Sanitize HTML overlay URLs (http/https only)
- Validate opacity, layer order uniqueness, asset references
- Lower-third template requires title

## Replay / Persistence Safety

`CompositionManifest` is designed for future persistence:

```typescript
{
  sceneId: string;
  layers: GraphicsLayer[];
  graphicsAssets: GraphicsAsset[];
  brandKit?: BrandKit;
  containsRuntimeHandles: false;
}
```

UI composition state logs intended graph commands via `createGraphicsCommandIntent()` without mutating the Production Graph reducer in Phase 9.

## Production Graph Integration (Future)

Command stubs are defined for future reducer wiring:

- `ADD_GRAPHICS_LAYER`, `PREVIEW_GRAPHICS_LAYER`, `TAKE_GRAPHICS_TO_PROGRAM`, etc.

The graph already defines `OverlayNode` and `graph.overlays`; Phase 9 UI prepares metadata that will map to overlay nodes when reducer cases are added.

## Renderer Limitations (Phase 9)

Phase 9 does **not** implement:

- GPU compositor or animation renderer
- Live RTMP graphics injection
- Browser compositor pixels

UI displays honest empty states: *Graphic not rendered yet*, *Graphics renderer unavailable*, *Asset reference missing*.

## Future GPU / Browser Compositor Integration

1. Hydrate `graph.overlays` from `CompositionManifest` via graph commands
2. Map `GraphicsLayer` → `OverlayNode` + `SceneNode.overlayIds`
3. Extend `createSceneCompositionFromGraph` / browser renderer `draw_overlays` stage
4. Drive `GraphicsMetadataOverlay` from actual composition output when renderer is available

## Control Room Integration

| Surface | Component |
|---------|-----------|
| Graphics Operator workspace | `GraphicsWorkspace` |
| Left nav | `GraphicsBrowser` |
| Bottom dock Graphics tab | `GraphicsLayerStack` + `GraphicsPreviewControls` |
| Monitors | `GraphicsMetadataOverlay` on Program/Preview |
| Workspace selector | `graphics-operator` profile |

## Adding a New Graphics Asset Type

1. Extend `GraphicsAssetType` in `packages/shared/src/graphics/types.ts`
2. Add browser category in `graphics-utils.ts`
3. Add empty-state copy in `GraphicsBrowser.tsx`
4. Document validation rules if type-specific metadata is required
