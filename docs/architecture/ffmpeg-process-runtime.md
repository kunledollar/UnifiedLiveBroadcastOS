# FFmpeg Process Runtime

## Purpose
Phase 9.1 introduces a feature-flagged runtime that can launch FFmpeg as a real Node `child_process.spawn()` process while keeping the Production Graph metadata-only. The runtime owns process execution and exposes only sanitized metadata, diagnostics, health, statistics, manifests, and lifecycle events.

## Security
The runtime never uses shell execution or command interpolation. Commands are built as executable plus argument arrays. Validation rejects null executables, path traversal, shell metacharacters, unsafe environment entries, unsafe arguments, and non-whitelisted output targets. Diagnostics and manifests declare that they contain no process handles, pipes, media payloads, packets, frames, stdout, or stderr.

## Process lifecycle
Supported lifecycle states are `planned`, `preparing`, `starting`, `running`, `paused`, `stopping`, `stopped`, `recovering`, and `failed`. Runtime helpers create, spawn, stop, restart, kill, and clean up FFmpeg processes. Disabled feature flags use the mock fallback and do not launch a process.

## Supervisor integration
The runtime exports metadata suitable for the Production Runtime Supervisor. Supervisor-visible diagnostics include process state, PID, executable, version when probed, health, CPU estimate, memory estimate, start time, restart count, failure count, and feature flag state. Runtime objects and handles are not passed to supervisor metadata.

## Failure handling
Failures map to the UBOS failure model and cover spawn failure, missing executable, permission denied, unexpected exit, crash, invalid command, timeout, and startup failure. Failures are retryable unless the error is a non-recoverable validation or security problem.

## Replay
Replay stores commands, redacted command previews, metadata, and process lifecycle events. Replay never stores PID, stdout, stderr, pipes, process handles, buffers, packets, or media frames.

## Backpressure
Health and statistics report queue depth, process utilization, restart storms, slow startup, and resource pressure so orchestration can degrade safely without mutating the Production Graph.

## Feature flags
Real execution requires both `UBOS_ENABLE_REAL_FFMPEG=true` and `NEXT_PUBLIC_UBOS_REAL_FFMPEG=true`. If either flag is disabled, the runtime uses the existing mock-safe behavior.

## Future recording
Recording runtime integration can provide validated file or segment outputs to the command builder while retaining graph metadata-only manifests.

## Future streaming
Streaming runtime integration can provide RTMP, RTMPS, or SRT outputs to the command builder while keeping destination credentials redacted from diagnostics and replay.
