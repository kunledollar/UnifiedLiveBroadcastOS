# Phase 2.5 GPU Rendering Foundation

The rendering foundation introduces metadata-first renderer contracts that consume decoded `VideoFrameMetadata` from the media runtime and prepare a single video layer for Preview or Program output.

## Contracts

- `Renderer` is graphics-API independent and owns lifecycle, status events, frame creation, and presentation.
- `RenderSurface` describes a canvas/offscreen/metadata target without storing DOM, GPU, or native handles.
- `RenderFrame` links one decoded video frame to one fitted viewport rectangle and never stores raw media payloads.
- `RenderPipeline` is the backend interface implemented by WebGPU and fallback renderers.

## Backends

`WebGPURenderer` is selected only when `navigator.gpu` is available. Unsupported systems use `FallbackRenderer`, which preserves the same scheduling, lifecycle, event, and metadata behavior for tests and non-GPU environments.

## Scheduling

Decoded frames retain their `scheduledPresentationMs` from `MediaClock`. The renderer copies that timestamp into `RenderFrame.presentationTimeMs` and records the current clock timestamp when the frame is presented.

## Current limits

Phase 2.5 intentionally renders one decoded video stream only. There is no compositor, multiple layers, transitions, graphics, text, or alpha blending yet.
