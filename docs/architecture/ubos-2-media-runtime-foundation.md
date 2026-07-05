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
