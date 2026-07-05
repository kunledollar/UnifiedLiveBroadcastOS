# GPU Compositor & Rendering Engine Foundation

Phase 19 introduces the UBOS compositor architecture as metadata-only contracts. It does **not** render frames and intentionally contains no FFmpeg, OBS code, Chromium capture, browser canvas rendering, WebGL, WebGPU, GPU textures, shader source, video decoding, Skia, or display output.

## Architecture

Every future frame is modeled as flowing through:

`Program → Graphics → Layers → Effects → Transitions → Output → Encoder`

The shared package in `packages/shared/src/compositor/` defines versioned, serializable, validated contracts for the compositor, render graph, render nodes, render targets, render passes, compositions, layer groups, render contexts, surfaces, frames, statistics, health, shader definitions, effect definitions, transition definitions, output surfaces, and the compositor manifest.

## Layer Model

Composition layers describe professional broadcast layer metadata: background, video, image, browser, text, graphics, replay, clock, ticker, logo, scoreboard, camera, remote guest, scene, overlay, lower third, picture-in-picture, audio visualization, and custom layers.

Each layer includes ID, name, visibility, opacity, blend mode, position, scale, rotation, crop, anchor, z-order, locked, muted, selected, program-visible, preview-visible, and metadata-only state.

Reusable groups include graphics, replay, media, guests, branding, lower thirds, sponsors, sports, news, and virtual sets.

## Render Graph

The default graph is reusable and declarative only:

`Scene → Layer Stack → Effects → Transition → Output → Encoder`

Render passes exist as contracts for background, scene, media, graphics, effects, transition, output, preview, confidence, and aux passes. Execution is disabled by design.

## Frame Lifecycle

`RenderFrame` records frame number, timestamp, resolution, frame rate, color space, pixel format, render duration metadata, dropped state, and presented state. These are future lifecycle markers only; no runtime frames or buffers are created.

## Transitions and Effects

Transition definitions include cut, fade, dissolve, wipe, slide, push, zoom, stinger, dip, and custom transitions. Effect definitions include opacity, blur, shadow, glow, mask, chroma key, luma key, crop, color correction, transform, perspective, gaussian blur, sharpen, brightness, contrast, and saturation. All are metadata only.

## Shader Metadata

Shader definitions describe vertex, fragment, and compute shader contracts with parameters, uniforms, textures, inputs, and outputs. There is no shader language implementation or source code in this phase.

## Future Renderer Paths

Future renderer implementations may map these contracts to WebGPU, Vulkan, DirectX, or Metal backends. Those implementations must remain separate from the Phase 19 metadata package and explicitly wire real GPU resources, scheduling, memory, and encoder handoff when the product is ready.

## Honest UI

The control-room compositor workspace and operations console must report unavailable runtime state honestly: **Unavailable**, **Renderer inactive**, **GPU not connected**, and **Metadata only**. They must not simulate FPS, GPU availability, textures, shaders, buffers, display output, or rendered frames.
