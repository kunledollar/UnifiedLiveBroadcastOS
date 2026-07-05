# UBOS 2.0 Phase 2.13 Recording Pipeline Foundation

Phase 2.13 introduces a backend-independent recording pipeline that models synchronized Program video and AudioMixer audio recording without enabling production encoding or file muxing yet.

## Scope

The foundation supports metadata-only recording sessions for these containers:

- MP4
- MOV
- MKV

The implementation intentionally excludes ISO recording, ProRes, DNxHD, MXF, cloud recording, and editing workflows. Those remain future adapter responsibilities.

## Runtime model

`RecordingPipelineV2` is the public abstraction for Phase 2.13. The default `MetadataRecordingPipeline` implementation stores serializable session state only and records no raw video frames, audio samples, file handles, process handles, or encoder handles.

A recording session binds to:

- `ProgramOutput` for Program video identity, output surface metadata, and synchronized render state.
- `AudioMixer` for audio mix identity and bus metadata.
- `MediaClock` for presentation timestamps and deterministic duration tracking.
- `FrameScheduler` for frame tick metadata, dropped-frame diagnostics, and scheduler statistics.

## Lifecycle

`RecordingSession.state` uses the Phase 2.13 lifecycle:

1. `idle`
2. `preparing`
3. `recording`
4. `paused`
5. `stopped`
6. `failed`

Lifecycle methods emit runtime events so the production runtime, observability panels, and future recorder adapters can subscribe without depending on a specific backend.

## Metadata

Each session tracks:

- `durationMs`
- `frameCount`
- `audioSamples`
- `droppedFrames`
- `estimatedFileSizeBytes`

The file-size estimate is calculated from placeholder video/audio bitrates and is explicitly not a muxer result.

## Backend independence

The default backend descriptor is `metadata_only`. It declares supported containers and explicitly reports that ISO and cloud recording are unsupported. Snapshots and sessions include `containsRuntimeHandles: false` and `containsMediaPayloads: false` to preserve replay safety and keep the recording pipeline independent from FFmpeg, hardware encoders, and filesystem outputs.

## Demo

`createDemoRecordingSession()` creates a metadata-only MKV Program recording session, runs prepare/start/frame/audio/pause/resume/stop, and returns the final pipeline snapshot, session, and emitted events.
