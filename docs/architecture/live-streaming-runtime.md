# Live Streaming Runtime

Phase 9.3 adds the first end-to-end RTMP/RTMPS publishing pipeline while preserving a metadata-only Production Graph. Runtime sockets, FFmpeg child processes, stream keys, packet buffers, MediaStreams, and process handles stay inside the media-plane runtime boundary and are never serialized into graph, manifest, replay, or supervisor diagnostics.

## Pipeline

`StreamingPipeline` owns creation, validation, preparation, connection, publishing, reconnect, pause, resume, stop, disconnect, and cleanup. It supports YouTube Live, Facebook Live, Twitch, Kick, and custom RTMP destinations over RTMP or RTMPS. Feature flags `UBOS_ENABLE_REAL_STREAMING=true` and `NEXT_PUBLIC_UBOS_REAL_STREAMING=true` enable real FFmpeg publishing; otherwise the pipeline uses the existing mock-safe fallback.

## Lifecycle

Jobs move through `created`, `validated`, `prepared`, `connected`, `publishing`, `reconnecting`, `paused`, `stopped`, `disconnected`, `cleaned_up`, and `failed`. Each transition appends replay-safe metadata records and updates supervisor diagnostics.

## Reconnect model

Reconnect uses immediate retry for the first attempt, progressive exponential backoff, maximum retry limits, circuit-breaker metadata, and operator-notification metadata. Exhaustion maps to a streaming failure and degrades the supervisor subsystem.

## Supervisor integration

The Production Runtime Supervisor owns the `streaming-runtime` subsystem. It receives only redacted diagnostics: destination name, lifecycle, bitrate, FPS, latency, reconnect count, health, runtime mode, protocol, and backpressure queue depth.

## Failure handling

Failures map into the UBOS `STREAMING_FAILURE` model with `runtimeSupervised=true` and `graphMutationAllowed=false`. Auth, transport, encoder, FFmpeg, reconnect, backpressure, validation, and security failures are represented as serializable metadata.

## Replay

Replay records lifecycle, state, health, and failure metadata only. Replay never stores FFmpeg handles, sockets, stdout/stderr streams, encoded packets, MediaStreams, or stream keys.

## Backpressure

`StreamingScheduler` queues stream startup, limits concurrent publishers, and exposes queue depth/active publisher diagnostics. This protects the encoder, CPU, and network from uncontrolled publisher fan-out.

## Security

Destination URLs are parsed, limited to RTMP/RTMPS, sanitized for shell/path injection, and redacted so stream keys are never exposed in logs, diagnostics, manifests, or replay records. FFmpeg commands are built as argument arrays with shell execution disabled by the underlying runtime.
