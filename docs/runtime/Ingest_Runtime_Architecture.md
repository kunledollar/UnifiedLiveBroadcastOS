# UBOS v4.4 Ingest Runtime Architecture

The Ingest Runtime is a metadata-only orchestration layer between the v4.3 Device Platform and the Media Plane. `IngestRuntimeController` is registered as a `RuntimeController` subsystem and does not own capture handles, decoders, GPU resources, transports, or Program switching.

## Flow

Device Platform → Ingest Runtime → Media Plane → ProductionGraph → Broadcast Runtime

## Components

- `IngestRuntimeController`: runtime-owned subsystem and API façade.
- `PipelineRegistry`: authoritative pipeline catalog.
- `PipelineFactory`: deterministic adapter selection by source type.
- `PipelineLifecycleManager`: state transition enforcement.
- `PipelineHealthMonitor`: health metadata updates.
- `PipelineMetricsCollector`: counters and timing metadata.
- `PipelineRecoveryManager`: recovery strategy metadata and backoff calculations.
- `PipelineCapabilityResolver`: format metadata negotiation.
- `PipelineStateStore`: immutable in-memory state snapshots.
- `PipelineEventAdapter`: RuntimeEventBus publishing.

## Safety Boundary

Pipelines are metadata objects. They include `containsMediaHandles: false` and never expose media streams, sockets, canvases, device handles, or native process references.
