# UBOS v4.4 Media Pipeline & Ingest Runtime Completion Report

## Executive Summary

UBOS v4.4 adds the Broadcast Ingest Runtime as a metadata-only orchestration layer. It coordinates ingest pipeline registration, lifecycle, health, format negotiation, recovery, metrics, RuntimeEventBus events, and ProductionGraph metadata without modifying existing capture or media implementations.

## Architecture

The new runtime lives in `packages/media-plane/src/ingest-runtime.ts` and is exported by the media-plane package. `IngestRuntimeController` implements the runtime subsystem contract so `RuntimeController` remains lifecycle owner.

## Pipeline Registry

`PipelineRegistry` is authoritative and rejects duplicate registrations. Registered pipelines include source, device, adapter, health provider, format, graph node, and priority metadata.

## State Machine

The deterministic state machine supports Created, Initializing, Ready, Waiting, Running, Paused, Recovering, Stopping, Stopped, Failed, and Disposed. Illegal transitions are rejected.

## Health

Health metadata includes latency, buffer utilization, frame and audio availability, frame drops, packet loss, decoder state, recovery attempts, and runtime health status.

## Recovery

Strategies include restart, reinitialize, fallback, manual, and exponential backoff. Recovery emits metadata events only and does not perform automatic Program switching.

## Metrics

Metrics include startup time, shutdown time, latency, buffer depth, uptime, restarts, failures, and recoveries.

## Runtime Integration

`IngestRuntimeController` registers as a Runtime subsystem after the v4.3 Device Manager is present and declares the ProductionGraph runtime dependency that is represented in the registered subsystem dependency graph.

## ProductionGraph Integration

`attachPipelineMetadataToGraph` and `mapPipelineToProductionGraphSource` expose pipeline metadata on graph source nodes with `containsMediaHandles: false`.

## Tests

Media-plane validation covers registration, duplicate rejection, factory selection, state transitions, health propagation, Runtime integration, ProductionGraph integration, EventBus propagation, recovery calculations, and metrics.

## Known Limitations

This phase intentionally does not add UI, direct media access, capture rewrites, or transport/control-plane changes.

## Recommendation

Proceed to the next phase with UI surfacing and operational controls only after preserving the v4.4 metadata-only contract.
