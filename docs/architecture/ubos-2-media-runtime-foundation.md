# UBOS 2.0 Phase 2.1: Core Media Runtime Foundation

UBOS 2.0 introduces a real-time media runtime foundation without replacing the existing metadata-first broadcast architecture. The production graph remains the authority for scenes, sources, preview/program intent, and operator workflow. The media runtime consumes graph metadata and turns it into runtime pipelines that can be backed by FFmpeg or another backend.

## Runtime contracts

The media runtime module defines serializable TypeScript contracts for:

- `MediaSource` for video files, audio files, cameras, and microphones.
- `MediaSink` for MP4 recording and RTMP outputs.
- `VideoFramePacket` and `AudioPacket` metadata envelopes. These packets carry timing and format metadata, never raw frame or audio payloads.
- `MediaClock` and `FrameScheduler` for deterministic frame cadence and scheduling.
- `MediaRuntimeState` and `RuntimeStatusEvent` for observable runtime status.
- `MediaRuntimeAdapter` so UI and engine code can target a stable abstraction instead of FFmpeg-specific process details.

All state objects explicitly mark `containsRuntimeHandles: false` and `containsMediaPayloads: false` so replay, collaboration, and production graph snapshots remain metadata-only.

## FFmpeg as the first backend

`FFmpegMediaRuntimeAdapter` is the first implementation of `MediaRuntimeAdapter`. It maps media runtime sources and sinks into safe FFmpeg command arrays through the existing FFmpeg process runtime. Phase 2.1 supports:

- Video file input through `-i <file>`.
- Audio file input through `-i <file>`.
- Camera input through platform device formats (`v4l2`, `avfoundation`, or `dshow`).
- Microphone input through platform device formats (`alsa`, `avfoundation`, or `dshow`).
- MP4 recording output using H.264/AAC defaults and `+faststart`.
- RTMP output command modeling as a stubbed abstraction. The command can be inspected without automatically starting a live stream.

The existing FFmpeg runtime feature flags still gate real process execution. Without `UBOS_ENABLE_REAL_FFMPEG=true` and `NEXT_PUBLIC_UBOS_REAL_FFMPEG=true`, commands execute through the mock fallback and remain safe for CI.

## Production graph connection

The bridge function `mapProductionGraphSources` converts production graph scene source metadata into `MediaSource` records. This keeps control room commands and scene/source contracts decoupled from real media process handles:

1. Operators mutate scenes, preview/program state, and source metadata in the production graph.
2. The execution layer translates graph transitions into media intents.
3. UBOS 2.0 maps relevant graph sources into `MediaRuntimePipeline` metadata.
4. A backend adapter such as FFmpeg creates schedules, status events, and output commands.
5. Runtime state flows back as status events and health metadata, not as raw media payloads.

This separation allows future backends such as WebRTC, GPU compositors, or hardware encoders to implement the same contracts while preserving deterministic graph replay.

## Demo commands

Build and validate the media package:

```bash
pnpm --filter @ubos/media-plane typecheck
pnpm --filter @ubos/media-plane test
```

Print a demo FFmpeg file ingest and MP4 recording command:

```bash
pnpm media:demo ./input.mp4 ./recording.mp4
```

Run a real FFmpeg-backed recording through application code only when FFmpeg is available and real execution is intentionally enabled:

```bash
UBOS_ENABLE_REAL_FFMPEG=true NEXT_PUBLIC_UBOS_REAL_FFMPEG=true pnpm media:demo ./input.mp4 ./recording.mp4
```

# UBOS 2.0 Phase 2.2: Real FFmpeg Process Pipeline

Phase 2.2 promotes FFmpeg from command modeling to a controlled process boundary while keeping mock-safe behavior as the default. The process runner is explicit, status-oriented, and isolated from UI code.

## Runtime process layer

- `ProcessRunner` defines `start`, `stop`, `kill`, and `getProcess` without exposing child-process handles.
- `FFmpegProcessRunner` starts FFmpeg with argument arrays and `shell: false` only when both real-execution flags are enabled.
- Lifecycle state is limited to `idle`, `starting`, `running`, `stopping`, `stopped`, and `failed`.
- Dry-run mode is enabled by default unless real FFmpeg execution is explicitly enabled.
- stdout and stderr are captured as bounded diagnostic line arrays on process metadata, but manifests continue to report that replay does not store stdout/stderr streams.
- Missing executables, spawn failures, unexpected exits, timeouts, cancellation, and kills become structured failures instead of crashing validation or CI.

## Status events

FFmpeg process changes emit process events such as `process_starting`, `process_running`, `stdout`, `stderr`, `process_stopping`, `process_stopped`, `process_failed`, `process_timeout`, and `process_killed`. The media runtime adapter maps those changes into runtime status-event metadata so callers can observe lifecycle transitions without receiving process handles or media payloads.

## Safe execution rules

Real execution requires both flags:

```bash
UBOS_ENABLE_REAL_FFMPEG=true NEXT_PUBLIC_UBOS_REAL_FFMPEG=true
```

Without those flags, tests and CI use dry-run/mock fallback and do not require FFmpeg to be installed. Command construction still validates executables, rejects shell metacharacters and traversal patterns, redacts secrets in previews, and never executes shell command strings.

## Demo command

Print the command without executing FFmpeg:

```bash
pnpm media:demo testsrc ./ubos-demo-recording.mp4
```

Run a short two-second synthetic FFmpeg MP4 recording only when FFmpeg is installed and real execution is explicitly enabled:

```bash
UBOS_ENABLE_REAL_FFMPEG=true NEXT_PUBLIC_UBOS_REAL_FFMPEG=true pnpm media:demo --run testsrc ./ubos-demo-recording.mp4
```
