# FFmpeg Recording Runtime

Phase 8.5 introduces a real local-recording runtime boundary for UBOS. The runtime plans and optionally starts FFmpeg for safe local file recording while keeping the Production Graph metadata-only.

## Purpose

The FFmpeg Recording Runtime turns Recording Engine intent plus an `EncoderPlan` into a sanitized FFmpeg command plan. By default it runs in dry-run mode. Real process execution is feature-flagged with `UBOS_ENABLE_REAL_RECORDING=true`.

## Relationship to Recording Engine

The Recording Engine remains the authority for recording lifecycle. The FFmpeg runtime is an adapter used by recording lifecycle operations and returns sessions, health, warnings, failures, and manifests as metadata. It does not place raw media, encoded packets, browser objects, DOM nodes, or process handles into graph state.

## Relationship to Encoder Layer

Recording plans require an `EncoderPlan` and preserve encoder profile, backend, health, and failure mapping. The runtime reuses encoder abstractions rather than inventing recording-only codec policy.

## Relationship to FFmpeg Adapter

The runtime reuses FFmpeg adapter safety utilities for argument validation, secret redaction, version parsing, and availability detection. Spawn calls use an args array with `shell:false`; command strings are only redacted previews.

## Supported Output Formats

- `mkv`: prioritized real local recording format.
- `segment_sequence`: prioritized metadata-level segment output via FFmpeg segment muxer.
- `null`: safe validation output.
- `mp4`, `mov`, `fragmented_mp4`: planned/limited until finalization and crash-safety guarantees are stronger.

## Safe File Path Rules

- Recordings write only under a configured recordings directory.
- Default directory is `UBOS_RECORDINGS_DIR` or `./recordings`.
- Filenames are sanitized to a conservative character set.
- Path traversal and output outside the recordings directory are rejected.
- Directories are auto-created when safe.
- Overwrite is rejected unless explicitly allowed.
- Generated names include a timestamp.

## Lifecycle

1. `createFFmpegRecordingPlan()` resolves safe paths and feature-flag/dry-run mode.
2. `prepareRecordingRuntime()` validates the plan and detects FFmpeg when real recording is enabled.
3. `startRecordingRuntime()` starts dry-run metadata or spawns FFmpeg only when enabled.
4. `pauseRecordingRuntime()` and `resumeRecordingRuntime()` are placeholders because pausing FFmpeg safely is format-dependent.
5. `stopRecordingRuntime()` requests graceful FFmpeg shutdown and prevents orphan processes.
6. `failRecordingRuntime()` records failures and terminates any runtime process.
7. `cleanupRecordingRuntime()` releases runtime-only handles.

## Manifest Model

The manifest includes recording/session IDs, start/stop times, output file metadata, segment metadata, format, placeholder duration, frame and graph revision bounds, encoder backend, FFmpeg version, health, and failure summaries. It explicitly records that it contains no media payloads, encoded packets, or process handles.

## Segment Model

Segment recording uses a deterministic `%03d` pattern and metadata-level expected segment tracking. Phase 8.5 does not reconcile the filesystem after completion.

## Failure Handling

FFmpeg process, validation, file, and disk failures are mapped to retryable/non-retryable metadata failures and can be converted to encoder failures. Logs are redacted before exposure.

## Backpressure Handling

Backpressure remains metadata-only in this phase. Plans carry encoder backpressure policy and the runtime can emit health/warning metadata for future degradation decisions.

## Replay Behavior

Replay never restarts FFmpeg. Manifests and output files are audit artifacts; replay uses metadata only.

## Limitations

- No RTMP/SRT live streaming is implemented.
- Browser/program capture inputs are placeholders.
- MP4/MOV are limited because finalization must be crash-safe.
- Segment reconciliation is not implemented.

## Future Browser Capture Input Plan

A future input adapter will bridge browser/program output into FFmpeg through a controlled pipe without storing MediaStreams, DOM nodes, or pipe handles in graph state.

## Future Program Output Recording Plan

Program output recording will consume the existing Media Execution Plane program output, route through EncoderPlan policy, and hand only runtime-local pipes to FFmpeg.
