# UBOS Recording, Archive & TimeShift Runtime

Phase 25 adds a deterministic, metadata-only recording runtime. The package lives in `packages/shared/src/runtime-recording` and intentionally contains no encoder implementation, no FFmpeg integration, no hardware recorder integration, no disk I/O, and no runtime file writing.

## Recording lifecycle

Operators dispatch serializable commands into `RecordingRuntimeQueue`. `RecordingRuntimeExecutor` validates the command, updates `RecordingRuntimeState`, records a `RecordingRuntimeSnapshot`, updates `RecordingRuntimeMetrics`, and keeps `RecordingRuntimeHistory` deterministic. Program and ISO sessions use the same `RecordingSession` state machine: `idle`, `recording`, `paused`, `stopped`, `verifying`, `metadata_exported`, or `failed`.

## ISO recording model

ISO recording is represented as one `RecordingSession` per source. `START_ISO_RECORDING` adds a source-bound session and `STOP_ISO_RECORDING` stops it by session ID. The runtime stores source IDs, profiles, destinations, manifests, notes, and duration estimates only.

## Archive architecture

`ArchiveCatalog` owns archive folders, archive jobs, and clip references. `START_ARCHIVE_JOB` creates an `ArchiveSession` and optional `ArchiveFolder`; `STOP_ARCHIVE_JOB` closes the job. Archive destinations are validated as metadata-only or available destinations, without touching storage.

## TimeShift architecture

`TimeShiftBuffer` tracks source ID, duration metadata, lifecycle state, and `metadataOnly: true`. Buffers are created with `CREATE_TIMESHIFT_BUFFER` and cleared with `CLEAR_TIMESHIFT_BUFFER`; no media ring buffer is allocated.

## Replay bookmarks

`ReplayBookmark` extends `ClipBookmark` with replay and program-scene metadata. Bookmarks are deterministic timeline markers and can be created or deleted independently of media encoding.

## Clip extraction workflow

`MARK_CLIP` records an intended range. `CREATE_CLIP` promotes a range into a `ClipSession`. Validation rejects negative ranges and out-points before in-points. Clip extraction is metadata-only and stores no rendered media.

## Storage model

`RecordingProfile.estimatedMbps` and session durations produce an estimated megabyte count. `RecordingDestination` indicates whether storage is available or metadata-only. The null adapter reports storage unavailable.

## Retention policies

Runtime state includes a default retention policy plus archive folder retention days. These policies are orchestration metadata for future storage workers; this phase does not delete files.

## Adapter boundary

`RecordingAdapter` is the only runtime boundary. `NullRecordingAdapter` always reports recording unavailable, encoder unavailable, storage unavailable, and metadata-only execution. `FutureFFmpegAdapter` and `FutureHardwareRecorderAdapter` are placeholders that inherit null behavior until a later phase supplies real implementations.

## Future encoder integration

Future adapters can consume validated commands and state snapshots to perform encoding externally. They must not leak browser `File` handles, Node streams, encoder references, or opaque runtime handles into serialized runtime state.
