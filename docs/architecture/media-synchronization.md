# Media Synchronization Layer

Phase 6.8 adds a deterministic in-memory timing foundation for UBOS media subsystems. A global `MediaClock` provides monotonic broadcast time and frame IDs without changing the Production Graph or storing frames/streams in graph state.

## Relationship to Production Graph Revisioning

Production Graph revisions remain the authoritative description of show state. Media synchronization consumes a graph revision and aligns execution against frame ticks; it never mutates graph structure or stores media payloads in graph nodes.

## Frame Tick Lifecycle

`FrameScheduler` reads the broadcast clock, emits `FRAME_TICK` through `MediaSyncBus`, and invokes registered tick callbacks. Each tick includes frame ID, deterministic timestamp, broadcast elapsed time, expected next frame time, and jitter estimate.

## Drift Model

`SyncDriftMonitor` compares render, audio, video, and output timing against the frame clock. Drift above the configured threshold emits `DRIFT_DETECTED` and logs a warning rather than crashing broadcast execution.

## Execution Ordering Guarantees

`EXECUTE_FRAME_SYNC` and `executeFrameSync()` align pending intents to a tick and execute them in deterministic subsystem order: video routing, audio routing, compositor update, output planning, and browser rendering.

## Renderer Integration

Browser rendering exposes `renderFrame(frameTick)` so frame metadata is attached to render results. When `NEXT_PUBLIC_UBOS_MEDIA_SYNC=true`, renderer start intents do not create free-running loops; frames are rendered only by scheduler ticks.

## Routing Synchronization

Video and audio route plans accept frame metadata and propagate lightweight `frameId` and `frameTimestamp` metadata to plans and routes. No real audio/video processing is introduced.

## Output Synchronization

Output planning is frame-aware through the synchronized execution order and frame metadata (`lastFrameRendered`, `nextFrameScheduled`, and `frameLagMs`) can be derived from `MediaSyncStore` state by output engines without executing outside ticks.

## Future Hardware Sync Expansion

The clock, scheduler, bus, and drift monitor are intentionally dependency-free so future genlock, PTP, NDI timecode, or device-clock adapters can resynchronize the in-memory clock through `CLOCK_RESYNC` events.
