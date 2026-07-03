# Recording Pipeline Runtime

Phase 9.2 introduces the first end-to-end recording runtime pipeline. The Production Graph remains metadata-only: it may reference recording intent, graph revision, and stable identifiers, but it never serializes MediaStreams, packets, buffers, encoded frames, file handles, child process handles, stdout/stderr pipes, or runtime objects.

## Pipeline

`RecordingPipeline` coordinates `RecordingSessionManager`, `RecordingScheduler`, `RecordingMonitor`, `RecordingRecovery`, and `RecordingValidator`. A `RecordingJob` stores only lifecycle state, output paths, track metadata, health summaries, replay records, and a manifest-safe statistics snapshot. Runtime execution is owned by the Recording Runtime and Real FFmpeg Runtime.

## Lifecycle

The supported lifecycle is create, prepare, start, pause, resume, split, stop, finalize, archive, and delete. Start asks the supervisor to run the recording job and, when `UBOS_ENABLE_REAL_RECORDING=true` and `NEXT_PUBLIC_UBOS_REAL_RECORDING=true`, starts FFmpeg with argument arrays. When disabled, the mock file path is preserved.

## Supervisor

The pipeline registers a `recording-runtime` subsystem with the Production Runtime Supervisor. The supervisor receives state, health, progress, failures, and cleanup state as diagnostics-only metadata.

## Recovery and Failure

Failures are mapped to the UBOS failure model: disk full, permission denied, output unavailable, encoder failure, FFmpeg crash, write timeout, interrupted recording, unexpected shutdown, and security violation. Recovery rehydrates jobs from manifest-safe metadata and returns them to prepared state without restoring handles.

## Health

Health includes duration, current size, bitrate, FPS, dropped frames, disk usage, remaining space, write speed, estimated completion, current file, and output folder.

## Replay

Replay stores commands, lifecycle events, state transitions, and health summaries. Replay never stores media, packets, file handles, encoded frames, process handles, or pipe data.

## Backpressure

`RecordingScheduler` throttles startup, queues concurrent recordings, and limits simultaneous jobs. Health monitoring reports slow write speed and storage pressure as metadata for future load-shedding policies.

## Security

The validator rejects path traversal, invalid filenames, unsafe extensions, hidden device-style filenames, symbolic output directories, shell metacharacters, null bytes, and overwrite attempts unless explicitly enabled. FFmpeg is launched with argument arrays and `shell:false` through the existing FFmpeg runtime.

## Recording flow

1. Validate output directory, filename, extension, and overwrite policy.
2. Create a metadata-only job and replay command record.
3. Prepare the job for supervisor execution.
4. Start real FFmpeg or mock fallback depending on feature flags.
5. Monitor duration, size, bitrate, FPS, dropped frames, disk usage, remaining space, and write speed.
6. Stop FFmpeg and clean supervisor state.
7. Finalize the temporary file into the final output.
8. Emit a manifest that is replay safe and handle free.
