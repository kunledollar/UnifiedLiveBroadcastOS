# Encoder Abstraction Layer Foundation

Phase 8.3 introduces a metadata-only encoder abstraction for UBOS. The layer models encoder plans, profiles, targets, backend selection, lifecycle sessions, manifests, health, failures, backpressure, timing, and replay without invoking FFmpeg, WebCodecs, hardware APIs, sockets, file output, raw frames, audio samples, or encoded packets.

## Purpose

The encoder layer is the contract between routed program media and future encoding implementations. It gives the Output, Recording, Streaming, Routing, Timing, Failure, Backpressure, Replay, and Media Execution systems a shared vocabulary before any real encoder is attached.

## Engine relationships

- **Broadcast Output Engine:** `EncoderPlan.outputId` and `EncoderTarget.outputId` bind encoding intent to an output plan.
- **Recording Engine:** optional `recordingId` marks plans that will eventually feed recording containers.
- **Streaming Engine:** optional `streamId` marks plans that will eventually feed transport/publishing sessions.
- **Video/Audio Routing Engines:** plans reference `videoRouteId` and `audioRouteId`; they never embed media payloads.
- **MediaClock and frame identity:** plans carry `graphRevision`, `frameId`, media clock metadata, and optional frame timestamps.

## Backend model

Supported backend identifiers are `mock`, `ffmpeg`, `webcodecs`, `nvenc`, `quicksync`, `videotoolbox`, `amf`, `vaapi`, `software`, and `custom`. Phase 8.3 only executes the mock lifecycle. Non-mock backends are declarations for future adapters.

## Codec and profile model

Video codecs are `h264`, `h265`, `av1`, `vp8`, `vp9`, `prores`, `raw`, and `unknown`. Audio codecs are `aac`, `opus`, `pcm`, `mp3`, and `unknown`. `EncoderProfile` combines codec selections with bitrate, resolution, FPS, scan mode, keyframe interval, low-latency intent, and hardware acceleration requirements.

## Hardware acceleration model

`HardwareAcceleration` can be `none`, `optional`, `required`, `mock`, or `unknown`. Required hardware can influence future backend selection, but Phase 8.3 does not call NVENC, Quick Sync, VideoToolbox, AMF, VAAPI, WebCodecs, or GPU APIs.

## Timing, failure, backpressure, and replay

Encoder plans carry timing metadata, failure policy, backpressure policy, and replay metadata. The current behavior is deterministic and replay-safe because it stores only serializable metadata. Failures are represented as `EncoderFailure` entries, and retryable failures degrade health without creating media side effects.

## Future adapter plans

- **FFmpeg:** map `EncoderPlan` to an adapter-owned process configuration, keeping process handles and packets outside the Production Graph.
- **WebCodecs:** map profiles to browser codec configuration while keeping `VideoFrame`, `AudioData`, streams, and DOM/canvas references out of graph state.
- **Hardware encoders:** select NVENC, Quick Sync, VideoToolbox, AMF, or VAAPI through adapter capabilities and return health/failure metadata only.

## Known limitations

- Mock lifecycle only.
- No publishing, muxing, packet storage, file writing, GPU access, WebCodecs calls, or FFmpeg process management.
- Bitrate, FPS, latency, warnings, and failures are simulated metadata.
- The Control Room inspector exposes compact diagnostics only and does not redesign the UI.
