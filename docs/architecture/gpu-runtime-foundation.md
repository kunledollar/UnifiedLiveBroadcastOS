# GPU Composition Runtime Foundation

## Purpose

The GPU Composition Runtime Foundation introduces a metadata-first GPU abstraction for UBOS composition execution. It describes backends, adapters, devices, surfaces, pipelines, render passes, frames, capabilities, diagnostics, backpressure, failures, and replay-safe metadata without creating real GPU resources.

## Architecture

The runtime consumes composition plans from the Composition Engine, Browser Renderer metadata, Scene Composition, Media Execution Engine, Media Clock, Graph Revision, Frame ID, and Execution Batch. It never edits Production Graph state and never stores GPU objects in the graph.

## GPU abstraction

The abstraction includes `GpuRuntime`, `GpuSession`, `GpuBackend`, `GpuAdapter`, `GpuDevice`, `GpuSurface`, `GpuPipeline`, `GpuRenderPass`, `GpuFrame`, and metadata-only resource references. Resource references are identifiers and descriptors only.

## Backend model

Supported backend types are Mock, WebGPU, OpenGL, DirectX, Metal, Vulkan, Software, and Null. Phase 8.9 only selects and reports metadata backends. When `NEXT_PUBLIC_UBOS_GPU_RUNTIME` and `UBOS_ENABLE_GPU_RUNTIME` are disabled, the runtime operates in mock mode.

## Pipeline lifecycle

Pipelines move through planned, initializing, ready, rendering, paused, recovering, degraded, failed, and shutdown runtime states. Pipeline stages are AcquireSurface, PrepareFrame, UploadResources, ComposeLayers, ApplyEffects, CompositeFrame, PresentFrame, and Cleanup.

## Surface lifecycle

Surfaces are metadata records containing target, dimensions, format, graph revision, and diagnostic metadata. They do not wrap framebuffers, swapchains, canvases, DOM elements, or native handles.

## Frame lifecycle

Frames carry MediaClock timestamp, Frame ID, Graph Revision, Execution Batch ID, optional composition plan ID, and replay-safe resource references. Frames do not contain textures, buffers, shader binaries, or GPU handles.

## Timing integration

GPU execution follows MediaClock, FrameId, GraphRevision, and ExecutionBatchId. There is no independent GPU timing source.

## Composition integration

The runtime consumes composition plans and produces execution diagnostics. It does not rewrite the compositor, alter Browser Renderer behavior, redesign UI, or mutate graph state.

## Failure model

Failures map backend unavailable, device unavailable, surface lost, resource exhausted, pipeline invalid, shader unavailable, driver unavailable, and context lost into UBOS failure records with retry metadata.

## Backpressure

Diagnostics track GPU queue depth, pending frames, resource pressure, frame latency, presentation latency, upload latency, and pipeline backlog. High pressure or queue depth can report degraded mode.

## Replay behavior

Replay stores GPU plans, pipeline metadata, and frame metadata. Replay never stores GPU context, textures, buffers, handles, or shader binaries.

## Runtime-only objects

Runtime helpers such as context creation, texture allocation, buffer allocation, shader compilation, presentation, and cleanup return runtime-only placeholders marked as non-serializable. These helpers must not enter persisted plans or graph state.

## Future implementations

Future phases may implement WebGPU, OpenGL, Metal, Vulkan, DirectX, and Software Renderer backends. Those implementations must preserve the metadata-only Production Graph boundary introduced here.
