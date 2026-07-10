# Audio Capture & Audio Decode Foundation

Phase 2.8 introduces audio as a first-class media stream while preserving backend independence and metadata-only runtime state.

## Capture

`AudioCaptureSource` owns microphone discovery, input selection, lifecycle transitions, status events, and metadata frame generation. `FFmpegAudioCaptureBackend` models platform-neutral microphone discovery without exposing runtime handles.

Lifecycle states are `idle`, `opening`, `capturing`, `paused`, `stopped`, and `failed`.

## Decode

`AudioDecoder` defines `open`, `decodeNext`, `pause`, `resume`, `close`, `getSnapshot`, `getBuffer`, and `onStatus`. `FFmpegAudioDecoder` supports MP4, MOV, MKV, WebM, WAV, and MP3 containers via ffprobe metadata when real FFmpeg is enabled, with deterministic dry-run metadata for tests.

## AudioFrame metadata

Audio frames include sample rate, channels, sample format, timestamp, duration, frame index, MediaClock frame identity, FrameScheduler timing, payload references, and flags proving that audio samples are not serialized.

## Buffering and timing

`RingAudioBuffer` is a bounded metadata queue for decoded audio frames. Capture and decode frame timestamps are derived from `MediaClock` and aligned to `FrameScheduler` ticks. There is no DSP, mixer, EQ, compressor, limiter, VST, echo cancellation, or noise suppression in this phase.
