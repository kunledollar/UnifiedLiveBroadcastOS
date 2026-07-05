# Runtime Rendering Architecture

Phase 23 adds the deterministic UBOS runtime-render package. It builds executable frame descriptions from compositor metadata, but it does not render pixels, run shaders, upload textures, encode, display, or call GPU APIs.

## Render lifecycle

The lifecycle is `Scene → Composition → Layers → Effects → Transitions → Frame → Output Manifest`. `RenderRuntime` owns a `RenderSession`, which builds frames with `FrameBuilder`, queues them with `FrameScheduler` and `FrameQueue`, records them in `FrameHistory`, and exposes health through `FrameHealth`.

## Frame builder

`FrameBuilder` produces an executable frame description with frame id, timestamp, program scene, preview scene, output target, active and visible layers, layer order, transition sequence, effect chain, crop, scale, opacity, transform, masks, output resolution, frame number, and frame state.

## Frame queue

`FrameQueue` tracks pending frames, current frame, next frame, dropped frames, replay queue, recovery queue, and priority queue. Scheduling is deterministic: priority and recovery frames are promoted before normal pending frames.

## Composition graph and resolver pipeline

`CompositionResolver` coordinates `SceneResolver`, `LayerResolver`, `EffectResolver`, `TransitionResolver`, and `OutputResolver`. Layers support show, hide, move/reorder by z-order, opacity, crop, scale, rotation, anchor, lock, solo, groups, and nested group metadata. Effects and transitions remain metadata-only contracts.

## Cache

`FrameCache` provides named caches for compositions, layers, scenes, outputs, frames, and transitions. The cache records hits and misses so render health can report a cache hit ratio without simulating renderer performance.

## Recovery

Recovery supports restore frame, rollback frame, rebuild composition, and clear queue. Recovery operations move known frame descriptions back into the recovery queue or rebuild metadata from compositor input; they do not recover GPU state.

## Future GPU execution

Renderer adapter contracts exist for future WebGPU, OpenGL, Vulkan, Metal, and DirectX implementations. Today the `NullRendererAdapter` is the default. Health must honestly report `Renderer unavailable`, `GPU unavailable`, `Frame builder active`, and `Metadata only` until a real renderer is introduced.
