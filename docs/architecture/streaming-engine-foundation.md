# Streaming Engine Foundation

Phase 8.1 adds a transport-neutral Streaming Engine foundation. It models live broadcast destinations, plans, lifecycle state, health, diagnostics, and orchestration metadata only.

## Architecture

The engine creates `StreamingPlan` records from the Broadcast Output Plan identity, Video Route Plan, Audio Route Plan, Output Engine identity, optional Recording Engine identity, MediaClock metadata, Frame ID, and Graph Revision. Plans contain no encoded frames, runtime packets, sockets, or media payloads.

`StreamingStore` is an in-memory diagnostic store for setting, getting, listing, filtering active, and clearing stream plans. It is intentionally separate from the Production Graph so replay remains metadata-only and deterministic.

## Transport abstraction and protocol model

Each `StreamingTarget` owns a `StreamingTransport` with a supported protocol: RTMP, RTMPS, SRT, WHIP, WebRTC Egress, HLS, DASH, or Custom. Current transports are mock/planned descriptors. They simulate lifecycle and diagnostics but never publish, connect sockets, invoke FFmpeg, or encode media.

## Lifecycle

Supported statuses are idle, planned, connecting, connected, streaming, reconnecting, paused, stopping, stopped, failed, and unavailable. Helpers prepare, connect, start, pause, resume, stop, and fail streaming sessions.

## Failure handling, backpressure, and replay

Failures are represented by `StreamingFailure` metadata. Retryable failures move sessions toward reconnecting/degraded; terminal destination failures move sessions toward failed/critical. Backpressure and network degradation are modeled as health and warning changes only. Replay can safely rebuild manifests and inspect plans because manifests explicitly declare `containsMediaPayloads: false`.

## Future integrations

Future FFmpeg, RTMP, SRT, WHIP, HLS, DASH, CDN, and encoder implementations should attach behind the transport abstraction. They must consume `StreamingPlan` metadata and report `StreamingExecutionResult` diagnostics without writing runtime media payloads to the Production Graph.
